/**
 * Folder Dock — Host half.
 *
 * The browser half cannot read the local disk, so this half exposes one private
 * same-origin JSON route plus one byte route. Both require the plugin's own
 * request header and refuse foreign origins; both only accept paths inside a
 * directory the user opened in the panel (or one listed in `config.roots`).
 *
 * Directory listing, bounded folder walks, and byte reads use `node:fs`
 * directly: this panel browses folders the user chose, which may sit outside the
 * Session workspace, so the workspace-scoped Remote faces do not apply.
 */
import { createReadStream, promises as fsp } from 'node:fs';
import { spawn } from 'node:child_process';
import { basename, dirname, extname, isAbsolute, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { listDirectory, mimeFor, resolveLimits, scanTargets } from '../lib/fsops.js';

const RPC_ROUTE = '/sidebar-plus/folder/rpc';
const READ_ROUTE = '/sidebar-plus/folder/read';
const HEADER = 'x-dsh-folder-dock';
const MAX_BODY = 512 * 1024;
const MAX_ROOTS = 64;

export const inject = ['webServer'];

/**
 * Register the plugin's routes.
 * @param {import('@deepseek-ai/cordis').Context} ctx - owning plugin context.
 * @param {Record<string, unknown>} [config] - Loader row config.
 */
export function apply(ctx, config = {}) {
  const limits = resolveLimits(config);
  /** Directories the panel may read; the Session workspace joins on demand. */
  const roots = new Set();
  for (const candidate of Array.isArray(config?.roots) ? config.roots : []) {
    if (typeof candidate !== 'string' || !isAbsolute(candidate)) continue;
    roots.add(resolve(candidate));
  }

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: RPC_ROUTE,
        handler: (req, res) => handleRpc(ctx, req, res, { limits, roots }).catch((error) => {
          sendJson(res, 200, { ok: false, error: { message: messageOf(error) } });
        }),
      }),
    'folder-dock: rpc route',
  );

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: READ_ROUTE,
        handler: (req, res) => handleRead(ctx, req, res, { limits, roots }).catch((error) => {
          sendJson(res, 200, { ok: false, error: { message: messageOf(error) } });
        }),
      }),
    'folder-dock: read route',
  );
}

/* ----------------------------------------------------------------- transport */

function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}

function fail(message) {
  const error = new Error(message);
  error.expose = true;
  return error;
}

/** Run the shared request checks; returns the parsed payload or sends a rejection. */
async function admit(ctx, req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: { message: '只接受 POST 请求' } });
    return undefined;
  }
  if (!req.headers[HEADER]) {
    sendJson(res, 403, { ok: false, error: { message: '缺少插件请求头' } });
    return undefined;
  }
  const origin = req.headers.origin;
  let expected = '';
  try {
    expected = ctx.webServer.getOrigin();
  } catch {
    expected = '';
  }
  if (origin && expected && origin !== expected) {
    sendJson(res, 403, { ok: false, error: { message: '拒绝跨站请求' } });
    return undefined;
  }
  let body;
  try {
    body = await readBody(req);
  } catch (error) {
    sendJson(res, 413, { ok: false, error: { message: messageOf(error) } });
    return undefined;
  }
  try {
    return body.length === 0 ? {} : JSON.parse(body);
  } catch {
    sendJson(res, 400, { ok: false, error: { message: '请求体不是合法 JSON' } });
    return undefined;
  }
}

function readBody(req) {
  return new Promise((resolveBody, reject) => {
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
    req.on('end', () => resolveBody(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(body);
}

/* ------------------------------------------------------------------ path policy */

/** Comparison spelling: `/` separators, no trailing slash, case-folded on case-insensitive filesystems. */
function canonical(path) {
  let value = String(path).replace(/\\/g, '/');
  if (value.length > 1) value = value.replace(/\/+$/, '');
  const fold = process.platform === 'win32' || process.platform === 'darwin';
  return fold ? value.toLowerCase() : value;
}

function isWithin(root, target) {
  const parent = canonical(root);
  const child = canonical(target);
  if (parent === '/') return child.startsWith('/');
  return child === parent || child.startsWith(`${parent}/`);
}

function requireRoot(roots, path) {
  if (typeof path !== 'string' || path.length === 0 || path.includes('\0')) {
    throw fail('路径不合法');
  }
  if (!isAbsolute(path)) throw fail('需要一个绝对路径');
  const absolute = resolve(path);
  for (const root of roots) {
    if (isWithin(root, absolute)) return absolute;
  }
  throw fail('该路径不在已打开的文件夹内');
}

async function grant(roots, path) {
  if (typeof path !== 'string' || path.length === 0 || path.includes('\0')) {
    throw fail('路径不合法');
  }
  if (!isAbsolute(path)) throw fail('需要一个绝对路径');
  const absolute = resolve(path);
  const stats = await fsp.stat(absolute);
  if (!stats.isDirectory()) throw fail('这不是一个文件夹');
  if (roots.size >= MAX_ROOTS && !roots.has(absolute)) throw fail('打开的文件夹太多，请先关闭一些');
  roots.add(absolute);
  return absolute;
}

/* ----------------------------------------------------------------------- routes */

async function handleRpc(ctx, req, res, state) {
  const payload = await admit(ctx, req, res);
  if (payload === undefined) return;
  const { op } = payload;
  try {
    const value = await dispatch(ctx, state, op, payload);
    sendJson(res, 200, { ok: true, value });
  } catch (error) {
    sendJson(res, 200, { ok: false, error: { message: messageOf(error) } });
  }
}

function limitsView(state) {
  return {
    maxFiles: state.limits.maxFiles,
    maxFileBytes: state.limits.maxFileBytes,
    maxBatchBytes: state.limits.maxBatchBytes,
  };
}

async function dispatch(ctx, state, op, payload) {
  const { limits, roots } = state;
  switch (op) {
    case 'hello':
      return {
        limits: limitsView(state),
        roots: [...roots],
        home: homedir(),
        platform: process.platform,
      };
    case 'roots':
      return { roots: [...roots] };
    case 'grant': {
      const path = await grant(roots, payload.path);
      return { path, roots: [...roots] };
    }
    case 'revoke': {
      const absolute = resolve(String(payload.path ?? ''));
      roots.delete(absolute);
      return { roots: [...roots] };
    }
    case 'pick': {
      const controller = ctx.get('directoryPickerController');
      if (typeof controller?.pick !== 'function') {
        throw fail('当前环境没有可用的系统文件夹选择器');
      }
      const picked = await controller.pick(new AbortController().signal);
      if (typeof picked !== 'string' || picked.length === 0) {
        return { path: null, roots: [...roots] };
      }
      const path = await grant(roots, picked);
      return { path, roots: [...roots] };
    }
    case 'session-root': {
      const path = sessionCwd(ctx, payload.sessionId);
      if (!path) throw fail('当前会话没有工作目录');
      const granted = await grant(roots, path);
      return { path: granted, roots: [...roots] };
    }
    case 'list': {
      const path = requireRoot(roots, payload.path);
      const listing = await listDirectory(path, limits);
      return { ...listing, roots: [...roots] };
    }
    case 'scan': {
      const targets = Array.isArray(payload.paths) ? payload.paths : [payload.path];
      const paths = [];
      for (const target of targets) {
        if (typeof target !== 'string') continue;
        paths.push(requireRoot(roots, target));
      }
      if (paths.length === 0) throw fail('没有可添加的项目');
      const result = await scanTargets(paths, limits);
      return { ...result, limits: limitsView(state) };
    }
    case 'mkdir': {
      const parent = requireRoot(roots, payload.path);
      const name = String(payload.name ?? '').trim();
      if (!name || name === '.' || name === '..' || /[\\/:*?"<>|]/.test(name)) {
        throw fail('文件夹名称不合法');
      }
      const created = join(parent, name);
      await fsp.mkdir(created, { recursive: false });
      return { path: created };
    }
    case 'paste': {
      const target = requireRoot(roots, payload.to);
      const stats = await fsp.stat(target);
      if (!stats.isDirectory()) throw fail('粘贴目标不是文件夹');
      const sources = Array.isArray(payload.paths) ? payload.paths.slice(0, 500) : [];
      if (sources.length === 0) throw fail('没有可粘贴的内容');
      return pasteInto(roots, target, sources);
    }
    case 'reveal': {
      const target = requireRoot(roots, payload.path);
      await reveal(target, Boolean(payload.revealInParent));
      return { path: target };
    }
    case 'open': {
      const target = requireRoot(roots, payload.path);
      const stats = await fsp.stat(target);
      if (!stats.isFile()) throw fail('只能打开文件');
      await openExternal(target);
      return { path: target };
    }
    default:
      throw fail(`未知操作：${String(op)}`);
  }
}

/** The Session's effective directory, from its header or the working-directory service. */
function sessionCwd(ctx, sessionId) {
  if (typeof sessionId !== 'string' || sessionId.length === 0) return undefined;
  let session;
  try {
    session = ctx.get('sessions')?.get?.(sessionId);
  } catch {
    session = undefined;
  }
  const recorded = session?.header?.cwd;
  if (typeof recorded === 'string' && recorded.length > 0) return recorded;
  try {
    const directory = ctx.get('workingDirectory');
    if (session && typeof directory?.get === 'function') return directory.get(session);
    if (typeof directory?.defaultDirectory === 'string') return directory.defaultDirectory;
  } catch {
    /* fall through */
  }
  return undefined;
}

/** Choose a child name that does not exist yet: `name (2).ext`, `name (3).ext`, … */
async function uniqueChildName(dir, name) {
  const extension = extname(name);
  const stem = extension && extension !== name ? name.slice(0, name.length - extension.length) : name;
  let candidate = name;
  for (let index = 2; index < 1000; index += 1) {
    try {
      await fsp.access(join(dir, candidate));
    } catch {
      return candidate;
    }
    candidate = `${stem} (${index})${extension}`;
  }
  throw fail('同名项目过多，无法生成新名称');
}

/**
 * Copy each source into a target directory.
 *
 * Node streams the bytes on the Host, so the browser only sends paths and the
 * panel's memory does not grow with file size. Nothing is overwritten: an
 * existing name gets a ` (2)` style suffix, and one failing source does not
 * abort the rest.
 */
async function pasteInto(roots, target, sources) {
  const items = [];
  const failed = [];
  for (const source of sources) {
    let from;
    try {
      from = requireRoot(roots, source);
    } catch (error) {
      failed.push({ path: String(source), message: messageOf(error) });
      continue;
    }
    try {
      const stats = await fsp.stat(from);
      if (stats.isDirectory() && isWithin(from, target)) {
        throw fail('不能把文件夹粘贴到它自己里面');
      }
      const name = await uniqueChildName(target, basename(from));
      const to = join(target, name);
      await fsp.cp(from, to, { recursive: true, force: false, errorOnExist: true });
      items.push({ from, to, name });
    } catch (error) {
      failed.push({ path: from, message: messageOf(error) });
    }
  }
  if (items.length === 0 && failed.length > 0) {
    throw fail(`粘贴失败：${failed[0].message}`);
  }
  return { items, failed };
}

/** Start a detached OS launcher without letting a missing binary crash the Host. */
function launch(command, args) {
  const child = spawn(command, args, { detached: true, stdio: 'ignore', windowsHide: true });
  child.on('error', () => {});
  child.unref();
}

/** Open the OS file manager at one file (selected) or directory (opened). */
async function reveal(path, revealInParent) {
  const stats = await fsp.stat(path);
  const selectFile = !stats.isDirectory() && revealInParent;
  if (process.platform === 'win32') {
    launch('explorer.exe', selectFile ? ['/select,', path] : [path]);
    return;
  }
  if (process.platform === 'darwin') {
    launch('open', selectFile ? ['-R', path] : [path]);
    return;
  }
  launch('xdg-open', [stats.isDirectory() ? path : dirname(path)]);
}

/** Open one file with the OS default handler (a browser for .html). */
async function openExternal(path) {
  if (process.platform === 'win32') {
    launch('explorer.exe', [path]);
    return;
  }
  if (process.platform === 'darwin') {
    launch('open', [path]);
    return;
  }
  launch('xdg-open', [path]);
}

/* ---------------------------------------------------------------- byte route */

async function handleRead(ctx, req, res, state) {
  const payload = await admit(ctx, req, res);
  if (payload === undefined) return;
  let path;
  try {
    path = requireRoot(state.roots, payload.path);
  } catch (error) {
    sendJson(res, 403, { ok: false, error: { message: messageOf(error) } });
    return;
  }
  let stats;
  try {
    stats = await fsp.stat(path);
  } catch (error) {
    sendJson(res, 404, { ok: false, error: { message: messageOf(error) } });
    return;
  }
  if (!stats.isFile()) {
    sendJson(res, 400, { ok: false, error: { message: '这不是一个文件' } });
    return;
  }
  if (stats.size > state.limits.maxFileBytes) {
    sendJson(res, 413, {
      ok: false,
      error: { message: `文件过大：${formatSize(stats.size)}，单文件上限 ${formatSize(state.limits.maxFileBytes)}` },
    });
    return;
  }
  const name = basename(path);
  res.writeHead(200, {
    'content-type': mimeFor(name),
    'content-length': stats.size,
    'cache-control': 'no-store',
    'x-file-name': encodeURIComponent(name),
  });
  const stream = createReadStream(path);
  stream.on('error', () => res.destroy());
  stream.pipe(res);
}

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}
