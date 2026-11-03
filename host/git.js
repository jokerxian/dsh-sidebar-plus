/**
 * Git Workbench — Host half.
 *
 * The browser half cannot spawn processes, so it talks to this half over one
 * same-origin JSON route. The route is private to this plugin: it requires the
 * `x-dsh-git` header, refuses foreign origins, and resolves every path from the
 * Session's own working directory instead of trusting a caller-supplied path.
 */
import { isAbsolute, relative, resolve } from 'node:path';
import * as git from '../lib/git.js';

const ROUTE = '/sidebar-plus/git/rpc';
const MAX_BODY = 1 << 20;

export const inject = ['webServer'];

export function apply(ctx) {
  ctx.effect(() => {
    const off = ctx.webServer.register({
      kind: 'exact',
      path: ROUTE,
      handler: (req, res) => handle(ctx, req, res).catch((error) => {
        send(res, 500, { ok: false, error: { message: error?.message ?? String(error) } });
      }),
    });
    return () => off();
  });
}

async function handle(ctx, req, res) {
  if (req.method !== 'POST') {
    send(res, 405, { ok: false, error: { message: '只接受 POST' } });
    return;
  }
  if (!req.headers['x-dsh-git']) {
    send(res, 403, { ok: false, error: { message: '缺少插件请求头' } });
    return;
  }
  const origin = req.headers.origin;
  let expected = '';
  try {
    expected = ctx.webServer.getOrigin();
  } catch {
    expected = '';
  }
  if (origin && expected && origin !== expected) {
    send(res, 403, { ok: false, error: { message: '拒绝跨站请求' } });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(await readBody(req));
  } catch {
    send(res, 400, { ok: false, error: { message: '请求体不是合法 JSON' } });
    return;
  }

  const { sessionId, method, args = {} } = payload ?? {};
  const session = sessionId ? ctx.get('sessions')?.get?.(sessionId) : undefined;
  if (!session) {
    send(res, 200, { ok: false, error: { message: '会话未加载，无法定位仓库' } });
    return;
  }

  let dir;
  try {
    dir = resolveDir(ctx, session, args?.dir);
  } catch (error) {
    send(res, 200, { ok: false, error: { message: error.message } });
    return;
  }

  try {
    const value = await dispatch(ctx, session, dir, method, args);
    send(res, 200, { ok: true, value });
  } catch (error) {
    send(res, 200, {
      ok: false,
      error: {
        message: error?.message ?? String(error),
        hint: error?.hint,
        code: error?.code,
      },
    });
  }
}

function dispatch(ctx, session, dir, method, args) {
  switch (method) {
    case 'snapshot':
      return git.snapshot(dir);
    case 'diff':
      return git.fileDiff(dir, {
        path: args.path,
        staged: Boolean(args.staged),
        untracked: Boolean(args.untracked),
        conflict: Boolean(args.conflict),
      });
    case 'stage':
      return git.stage(dir, args.paths ?? []);
    case 'unstage':
      return git.unstage(dir, args.paths ?? []);
    case 'discard':
      return git.discard(dir, args.paths ?? [], { untracked: Boolean(args.untracked) });
    case 'commit':
      return git.commit(dir, { message: args.message, amend: Boolean(args.amend) });
    case 'fetch':
      return git.fetchAll(dir);
    case 'pull':
      return git.pull(dir, { strategy: args.strategy ?? 'ff-only' });
    case 'push':
      return git.push(dir, { force: Boolean(args.force) });
    case 'switch':
      return git.switchBranch(dir, args.name, { stash: Boolean(args.stash) });
    case 'stashPush':
      return git.stashPush(dir, args.message);
    case 'stashApply':
      return git.stashApply(dir, Number(args.index ?? 0), { pop: Boolean(args.pop) });
    case 'stashDrop':
      return git.stashDrop(dir, Number(args.index ?? 0));
    case 'commitDetail':
      return git.commitDetail(dir, args.sha);
    case 'commitDiff':
      return git.commitDiff(dir, args.sha, args.path);
    case 'aiMessage':
      return aiMessage(ctx, session, dir, args);
    default:
      throw new Error(`未知方法：${String(method)}`);
  }
}

/* ------------------------------------------------------------------ session */

function sessionCwd(ctx, session) {
  const recorded = session?.header?.cwd;
  if (recorded) return recorded;
  try {
    return ctx.get('workingDirectory')?.get?.(session) ?? ctx.get('workingDirectory')?.defaultDirectory;
  } catch {
    return undefined;
  }
}

function resolveDir(ctx, session, requested) {
  const base = sessionCwd(ctx, session);
  if (!base) throw new Error('会话没有工作目录');
  if (requested === undefined || requested === null || requested === '') return base;
  if (typeof requested !== 'string') throw new Error('目录参数不合法');
  const target = resolve(base, requested);
  const rel = relative(base, target);
  if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('只能访问会话目录内的仓库');
  return target;
}

function resolveModel(ctx, session) {
  try {
    const header = session?.requestHeader?.();
    const config = header?.config;
    if (config?.provider && config?.model) return { provider: config.provider, model: config.model };
  } catch {
    /* fall through */
  }
  try {
    const selection = ctx.get('agentDefaultModel')?.currentSelection?.();
    if (selection?.provider && selection?.model) {
      return { provider: selection.provider, model: selection.model };
    }
  } catch {
    /* fall through */
  }
  return null;
}

/* ----------------------------------------------------------------------- ai */

const SYSTEM_PROMPT = [
  '你是一名严谨的 Git 提交信息写手。',
  '根据我给出的「改动清单」「代码差异」「最近提交标题」，写一条可以直接使用的提交信息。',
  '要求：',
  '1. 使用简体中文；代码标识符、路径、类型名保持原样。',
  '2. 第一行采用 Conventional Commits 形式：`<type>(<scope>): <简述>`，type 用 feat/fix/refactor/docs/test/chore/perf/build/ci 之一，整行不超过 60 个字符。',
  '3. 空一行后写 2~4 条以 "- " 开头的要点，说明改了什么、为什么。',
  '4. 只写差异里真实存在的内容，不要编造功能，不要写「本次提交」这类空话。',
  '5. 只输出提交信息本身：不要解释、不要 Markdown 代码围栏、不要引号。',
].join('\n');

async function aiMessage(ctx, session, dir, args) {
  const llm = ctx.get('llm');
  if (!llm?.stream) throw new Error('当前配置没有启用模型服务，无法生成提交信息');
  const model = resolveModel(ctx, session);
  if (!model) throw new Error('找不到可用模型，请先在会话里选择模型');

  const material = await git.aiMaterial(dir, {
    stagedOnly: false,
    maxDiffBytes: Number(args.maxDiffBytes) > 0 ? Number(args.maxDiffBytes) : 24_000,
  });
  if (!material.hasChanges) throw new Error('没有可用的改动：暂存区和工作区都是干净的');

  const prompt = [
    `仓库：${material.root}`,
    `暂存区：${material.hasStaged ? '有已暂存改动' : '空（本次将提交全部改动）'}`,
    '',
    '改动清单：',
    material.files.slice(0, 60).join('\n') || '（无）',
    '',
    '最近提交标题（仅用于对齐风格）：',
    material.recent.slice(0, 20).join('\n') || '（无）',
    '',
    '代码差异（已截断到预算内）：',
    '```diff',
    material.diff,
    '```',
  ].join('\n');

  const started = Date.now();
  let text = '';
  let usage;
  const stream = llm.stream({
    provider: model.provider,
    model: model.model,
    temperature: 0.2,
    maxTokens: 600,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
  });
  for await (const chunk of stream) {
    if (chunk?.type === 'text-delta') text += chunk.text;
    else if (chunk?.type === 'usage') usage = chunk.usage;
    else if (chunk?.type === 'finish' && chunk.reason?.kind === 'error') {
      throw new Error(chunk.reason.failure?.message ?? '模型调用失败');
    }
  }

  const message = cleanMessage(text);
  if (!message) throw new Error('模型没有返回可用的提交信息');
  return {
    message,
    provider: model.provider,
    model: model.model,
    elapsedMs: Date.now() - started,
    outputTokens: usage?.outputTokens,
    inputBytes: material.diffBytes,
    fileCount: material.files.length,
    stagedOnly: material.hasStaged,
  };
}

function cleanMessage(raw) {
  let text = String(raw ?? '').trim();
  if (!text) return '';
  text = text.replace(/^```[a-zA-Z]*\s*\n?/, '').replace(/\n?```\s*$/, '');
  text = text.replace(/^["'“”]+|["'“”]+$/g, '').trim();
  const lines = text.split(/\r?\n/);
  while (lines.length > 1 && lines[lines.length - 1].trim() === '') lines.pop();
  return lines.join('\n').trim();
}

/* ---------------------------------------------------------------- transport */

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error('请求体过大'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(body);
}
