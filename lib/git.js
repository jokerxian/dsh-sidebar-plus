/**
 * Git plumbing for the Git Workbench plugin.
 *
 * Every function takes an absolute repository working directory and shells out
 * to the user's own `git`, so credentials, hooks and configuration stay exactly
 * as the user set them. No function here talks to DSH; `index.js` owns that.
 */
import { execFile } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const MAX_BUFFER = 16 * 1024 * 1024;

export class GitError extends Error {
  constructor(message, detail = {}) {
    super(message);
    this.name = 'GitError';
    Object.assign(this, detail);
  }
}

const BASE = ['-c', 'core.quotepath=false', '-c', 'color.ui=false'];

function gitEnv() {
  return {
    ...process.env,
    GIT_TERMINAL_PROMPT: '0',
    GIT_OPTIONAL_LOCKS: '0',
    GIT_PAGER: 'cat',
    PAGER: 'cat',
    LC_ALL: 'C.UTF-8',
    LANG: 'C.UTF-8',
  };
}

export function run(cwd, args, options = {}) {
  const timeout = options.timeout ?? 30_000;
  return new Promise((resolve, reject) => {
    execFile(
      'git',
      [...BASE, ...args],
      {
        cwd,
        timeout,
        maxBuffer: MAX_BUFFER,
        windowsHide: true,
        encoding: 'utf8',
        env: gitEnv(),
      },
      (error, stdout, stderr) => {
        if (error) {
          const message = (stderr || '').trim() || error.message || 'git 命令失败';
          reject(new GitError(message, {
            exitCode: typeof error.code === 'number' ? error.code : undefined,
            killed: Boolean(error.killed),
            stdout: stdout ?? '',
            stderr: stderr ?? '',
            args,
          }));
          return;
        }
        resolve({ stdout: stdout ?? '', stderr: stderr ?? '' });
      },
    );
  });
}

async function optional(promise, fallback) {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

/* ------------------------------------------------------------------ status */

function splitZ(text) {
  return text.split('\0').filter((part) => part.length > 0);
}

function parseNumstat(text) {
  const map = new Map();
  const parts = splitZ(text);
  for (let i = 0; i < parts.length; i += 1) {
    const fields = parts[i].split('\t');
    if (fields.length < 3) continue;
    const [adds, dels, path] = fields;
    if (path === '') {
      const from = parts[i + 1];
      const to = parts[i + 2];
      i += 2;
      if (to) map.set(to, { additions: toNumber(adds), deletions: toNumber(dels), from });
      continue;
    }
    map.set(path, { additions: toNumber(adds), deletions: toNumber(dels) });
  }
  return map;
}

function toNumber(value) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : 0;
}

function statusLetter(code) {
  if (!code || code === '.' || code === ' ') return '';
  return code;
}

function parseStatus(text) {
  const parts = splitZ(text);
  const out = {
    branch: '',
    oid: '',
    upstream: '',
    ahead: 0,
    behind: 0,
    entries: [],
  };
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    if (part.startsWith('# branch.oid ')) out.oid = part.slice(13).trim();
    else if (part.startsWith('# branch.head ')) out.branch = part.slice(14).trim();
    else if (part.startsWith('# branch.upstream ')) out.upstream = part.slice(18).trim();
    else if (part.startsWith('# branch.ab ')) {
      const m = /\+(\d+) -(\d+)/.exec(part);
      if (m) {
        out.ahead = Number(m[1]);
        out.behind = Number(m[2]);
      }
    } else if (part.startsWith('1 ')) {
      const f = part.split(' ');
      const xy = f[1] ?? '..';
      const path = f.slice(8).join(' ');
      out.entries.push({ path, x: xy[0], y: xy[1], kind: 'tracked' });
    } else if (part.startsWith('2 ')) {
      const f = part.split(' ');
      const xy = f[1] ?? '..';
      const path = f.slice(9).join(' ');
      const from = parts[i + 1];
      i += 1;
      out.entries.push({ path, before: from, x: xy[0], y: xy[1], kind: 'renamed' });
    } else if (part.startsWith('u ')) {
      const f = part.split(' ');
      const path = f.slice(10).join(' ');
      out.entries.push({ path, x: 'U', y: 'U', kind: 'conflict' });
    } else if (part.startsWith('? ')) {
      out.entries.push({ path: part.slice(2), x: '?', y: '?', kind: 'untracked' });
    }
  }
  return out;
}

function groupFiles(status, stagedStats, unstagedStats) {
  const files = [];
  for (const entry of status.entries) {
    const staged = entry.kind === 'tracked' || entry.kind === 'renamed'
      ? statusLetter(entry.x) !== ''
      : false;
    const modified = entry.kind === 'tracked' || entry.kind === 'renamed'
      ? statusLetter(entry.y) !== ''
      : entry.kind === 'untracked' || entry.kind === 'conflict';
    const stats = (staged ? stagedStats.get(entry.path) : null)
      || (modified ? unstagedStats.get(entry.path) : null)
      || { additions: 0, deletions: 0 };
    files.push({
      path: entry.path,
      before: entry.before ?? null,
      x: entry.x,
      y: entry.y,
      kind: entry.kind,
      staged,
      unstaged: modified && entry.kind !== 'untracked' && entry.kind !== 'conflict',
      conflict: entry.kind === 'conflict',
      untracked: entry.kind === 'untracked',
      additions: stats.additions,
      deletions: stats.deletions,
    });
  }
  return files;
}

/* ------------------------------------------------------------------- graph */

export function layoutGraph(commits) {
  const lanes = [];
  return commits.map((commit) => {
    let lane = lanes.indexOf(commit.short);
    if (lane === -1) {
      lanes.push(commit.short);
      lane = lanes.length - 1;
    }
    const parents = commit.parents.filter(Boolean);
    if (parents.length === 0) {
      lanes.splice(lane, 1);
    } else {
      lanes[lane] = parents[0];
      for (let i = 1; i < parents.length; i += 1) {
        if (!lanes.includes(parents[i])) lanes.splice(lane + i, 0, parents[i]);
      }
    }
    for (let i = lanes.length - 1; i >= 0; i -= 1) {
      if (lanes.indexOf(lanes[i]) !== i) lanes.splice(i, 1);
    }
    return { ...commit, lane, laneCount: lanes.length };
  });
}

/* ---------------------------------------------------------------- snapshot */

export async function snapshot(cwd) {
  let root;
  try {
    const { stdout } = await run(cwd, ['rev-parse', '--show-toplevel']);
    root = stdout.trim().split('\n')[0];
  } catch {
    return { isRepo: false, cwd };
  }

  const [gitDir, commonDir, statusText, stagedNumstat, unstagedNumstat, logText, branchText, stashText] =
    await Promise.all([
      optional(run(root, ['rev-parse', '--absolute-git-dir']).then((r) => r.stdout.trim()), ''),
      optional(run(root, ['rev-parse', '--git-common-dir']).then((r) => r.stdout.trim()), ''),
      optional(run(root, ['status', '--porcelain=v2', '--branch', '-z', '--untracked-files=all']).then((r) => r.stdout), ''),
      optional(run(root, ['diff', '--numstat', '-z', '--cached']).then((r) => r.stdout), ''),
      optional(run(root, ['diff', '--numstat', '-z']).then((r) => r.stdout), ''),
      optional(
        run(root, [
          'log',
          '--topo-order',
          '-n',
          '40',
          '--pretty=format:%h%x1f%p%x1f%s%x1f%an%x1f%ct%x1f%D%x1e',
        ]).then((r) => r.stdout),
        '',
      ),
      optional(
        run(root, [
          'for-each-ref',
          '--format=%(refname:short)%1f%(HEAD)%1f%(upstream:short)%1f%(upstream:track)',
          'refs/heads',
        ]).then((r) => r.stdout),
        '',
      ),
      optional(run(root, ['stash', 'list', '--format=%gd%x1f%gs%x1f%cr']).then((r) => r.stdout), ''),
    ]);

  const status = parseStatus(statusText);
  const stagedStats = parseNumstat(stagedNumstat);
  const unstagedStats = parseNumstat(unstagedNumstat);
  const files = groupFiles(status, stagedStats, unstagedStats);

  const groups = {
    conflict: files.filter((f) => f.conflict),
    staged: files.filter((f) => f.staged && !f.conflict),
    modified: files.filter((f) => f.unstaged && !f.conflict),
    untracked: files.filter((f) => f.untracked && !f.conflict),
  };
  const counts = {
    conflict: groups.conflict.length,
    staged: groups.staged.length,
    modified: groups.modified.length,
    untracked: groups.untracked.length,
    total: files.length,
    additions: files.reduce((sum, f) => sum + f.additions, 0),
    deletions: files.reduce((sum, f) => sum + f.deletions, 0),
  };

  const commits = logText
    .split('\x1e')
    .map((row) => row.replace(/^\n/, ''))
    .filter(Boolean)
    .map((row) => {
      const [short, parents, subject, author, time, refs] = row.split('\x1f');
      return {
        short,
        parents: (parents || '').split(' ').filter(Boolean),
        subject,
        author,
        time: Number(time) || 0,
        refs: (refs || '').split(', ').filter(Boolean),
      };
    });

  const branches = branchText
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [name, head, upstream, track] = line.split('\x1f');
      const m = /ahead (\d+)/.exec(track || '');
      const b = /behind (\d+)/.exec(track || '');
      return {
        name,
        current: head === '*',
        upstream: upstream || '',
        ahead: m ? Number(m[1]) : 0,
        behind: b ? Number(b[1]) : 0,
        gone: /gone/.test(track || ''),
      };
    });

  const stash = stashText
    .split('\n')
    .filter(Boolean)
    .map((line, index) => {
      const [ref, subject, when] = line.split('\x1f');
      return { index, ref, subject, when };
    });

  let operation = null;
  if (gitDir) {
    if (existsSync(join(gitDir, 'MERGE_HEAD'))) operation = 'merge';
    else if (existsSync(join(gitDir, 'rebase-merge')) || existsSync(join(gitDir, 'rebase-apply'))) operation = 'rebase';
    else if (existsSync(join(gitDir, 'CHERRY_PICK_HEAD'))) operation = 'cherry-pick';
    else if (existsSync(join(gitDir, 'REVERT_HEAD'))) operation = 'revert';
  }

  const normalizedGit = gitDir.replace(/\\/g, '/').toLowerCase();
  const normalizedCommon = commonDir ? resolve(root, commonDir).replace(/\\/g, '/').toLowerCase() : '';

  return {
    isRepo: true,
    cwd,
    repo: {
      root,
      name: root.split(/[\\/]/).filter(Boolean).pop() || root,
      gitDir,
      worktree: Boolean(normalizedCommon) && normalizedCommon !== normalizedGit,
    },
    branch: {
      name: status.branch && status.branch !== '(detached)' ? status.branch : '',
      detached: status.branch === '(detached)',
      unborn: status.oid === '(initial)',
      oid: status.oid,
      upstream: status.upstream,
      ahead: status.ahead,
      behind: status.behind,
    },
    counts,
    files,
    groups,
    commits: layoutGraph(commits),
    branches,
    stash,
    operation,
    refreshedAt: Date.now(),
  };
}

/* -------------------------------------------------------------------- diff */

export async function fileDiff(cwd, { path, staged = false, untracked = false, conflict = false }) {
  const root = await repoRoot(cwd);
  if (untracked) {
    const absolute = join(root, path);
    if (!existsSync(absolute)) throw new GitError(`文件不存在：${path}`);
    const stat = statSync(absolute);
    if (!stat.isFile()) throw new GitError('目录不支持预览差异');
    if (stat.size > 400_000) return { text: `（文件较大，${Math.round(stat.size / 1024)} KB，请在编辑器中查看）`, truncated: true };
    const text = readFileSync(absolute, 'utf8');
    const lines = text.split(/\r?\n/);
    const body = lines.slice(0, 800).map((line) => `+${line}`).join('\n');
    return {
      text: `diff --git a/${path} b/${path}\nnew file mode 100644\n--- /dev/null\n+++ b/${path}\n@@ -0,0 +1,${lines.length} @@\n${body}`,
      truncated: lines.length > 800,
    };
  }
  if (conflict) {
    const absolute = join(root, path);
    if (existsSync(absolute) && statSync(absolute).size < 400_000) {
      const text = readFileSync(absolute, 'utf8');
      return { text: text.split(/\r?\n/).slice(0, 1200).join('\n'), truncated: text.split(/\r?\n/).length > 1200 };
    }
  }
  const args = ['diff', '--no-color', '--no-ext-diff'];
  if (staged) args.push('--cached');
  args.push('--', path);
  const { stdout } = await run(root, args, { timeout: 20_000 });
  const truncated = stdout.length > 200_000;
  return { text: truncated ? `${stdout.slice(0, 200_000)}\n…（差异过长，已截断）` : stdout, truncated };
}

async function repoRoot(cwd) {
  const { stdout } = await run(cwd, ['rev-parse', '--show-toplevel']);
  return stdout.trim().split('\n')[0];
}

/* --------------------------------------------------------- commit details */

export async function commitDetail(cwd, sha) {
  const root = await repoRoot(cwd);
  const meta = await run(root, ['show', '-s', '--format=%H%x1f%h%x1f%an%x1f%ae%x1f%ct%x1f%s%x1f%b', sha]);
  const [full, short, author, email, time, subject, ...rest] = meta.stdout.split('\x1f');
  const body = rest.join('\x1f').trim();

  const [statusText, statText] = await Promise.all([
    optional(run(root, ['diff-tree', '--no-commit-id', '--root', '-r', '-M', '--name-status', '-z', sha]).then((r) => r.stdout), ''),
    optional(run(root, ['show', '--numstat', '--format=', '-z', '--no-ext-diff', sha]).then((r) => r.stdout), ''),
  ]);

  const stats = parseNumstat(statText);
  const parts = splitZ(statusText);
  const files = [];
  for (let i = 0; i < parts.length; i += 1) {
    const status = parts[i];
    if (!/^[A-Z]\d*$/.test(status)) continue;
    let path = parts[i + 1] ?? '';
    if (status[0] === 'R' || status[0] === 'C') {
      path = parts[i + 2] ?? path;
      i += 2;
    } else {
      i += 1;
    }
    const stat = stats.get(path) ?? { additions: 0, deletions: 0 };
    files.push({ path, status: status[0], additions: stat.additions, deletions: stat.deletions });
  }

  if (!files.length) {
    for (const [path, stat] of stats.entries()) {
      files.push({ path, status: 'M', additions: stat.additions, deletions: stat.deletions });
    }
  }

  return {
    sha: full,
    short,
    author,
    email,
    time: Number(time) || 0,
    subject,
    body,
    files,
    additions: files.reduce((n, f) => n + f.additions, 0),
    deletions: files.reduce((n, f) => n + f.deletions, 0),
  };
}

export async function commitDiff(cwd, sha, path) {
  const root = await repoRoot(cwd);
  const { stdout } = await run(root, ['show', '--no-color', '--no-ext-diff', '--format=', sha, '--', path], { timeout: 20_000 });
  const truncated = stdout.length > 200_000;
  return { text: truncated ? `${stdout.slice(0, 200_000)}\n…（差异过长，已截断）` : stdout, truncated };
}

/* ----------------------------------------------------------------- actions */

export async function stage(cwd, paths) {
  const root = await repoRoot(cwd);
  await run(root, ['add', '-A', '--', ...paths]);
  return { ok: true };
}

export async function unstage(cwd, paths) {
  const root = await repoRoot(cwd);
  try {
    await run(root, ['restore', '--staged', '--', ...paths]);
  } catch (error) {
    await run(root, ['reset', '--', ...paths]);
  }
  return { ok: true };
}

export async function discard(cwd, paths, { untracked = false } = {}) {
  const root = await repoRoot(cwd);
  if (untracked) await run(root, ['clean', '-f', '-d', '--', ...paths]);
  else await run(root, ['restore', '--worktree', '--', ...paths]);
  return { ok: true };
}

export async function commit(cwd, { message, amend = false }) {
  const root = await repoRoot(cwd);
  const text = String(message ?? '').trim();
  if (!text) throw new GitError('提交信息不能为空');
  const args = ['commit', '-m', text];
  if (amend) args.push('--amend');
  const { stdout, stderr } = await run(root, args, { timeout: 60_000 });
  return { ok: true, output: `${stdout}${stderr}`.trim() };
}

export async function fetchAll(cwd) {
  const root = await repoRoot(cwd);
  const { stdout, stderr } = await run(root, ['fetch', '--prune', '--all', '--no-tags'], { timeout: 120_000 });
  return { ok: true, output: `${stdout}${stderr}`.trim() };
}

export async function pull(cwd, { strategy = 'ff-only' } = {}) {
  const root = await repoRoot(cwd);
  const status = parseStatus((await run(root, ['status', '--porcelain=v2', '--branch', '-z'])).stdout);
  if (!status.upstream) {
    return { ok: false, conflict: false, output: '当前分支没有上游。先「推送」发布分支，或为它设置 upstream 后再拉取。' };
  }
  const args = ['pull'];
  if (strategy === 'rebase') args.push('--rebase', '--autostash');
  else if (strategy === 'merge') args.push('--no-rebase');
  else args.push('--ff-only');
  try {
    const { stdout, stderr } = await run(root, args, { timeout: 120_000 });
    return { ok: true, output: `${stdout}${stderr}`.trim(), conflict: false };
  } catch (error) {
    const text = `${error.stdout ?? ''}\n${error.stderr ?? ''}\n${error.message}`;
    const conflict = /CONFLICT|Automatic merge failed|not possible to fast-forward|diverging branches|需要合并|冲突/i.test(text);
    return { ok: false, output: text.trim(), conflict };
  }
}

export async function push(cwd, { force = false } = {}) {
  const root = await repoRoot(cwd);
  const status = parseStatus((await run(root, ['status', '--porcelain=v2', '--branch', '-z'])).stdout);
  const args = ['push'];
  if (force) args.push('--force-with-lease');
  if (!status.upstream) {
    if (!status.branch || status.branch === '(detached)') throw new GitError('当前处于分离 HEAD，无法发布分支');
    args.push('--set-upstream', 'origin', status.branch);
  }
  try {
    const { stdout, stderr } = await run(root, args, { timeout: 120_000 });
    return { ok: true, output: `${stdout}${stderr}`.trim() };
  } catch (error) {
    if (/No configured push destination|does not appear to be a git repository|No such remote/i.test(error.message)) {
      throw new GitError(error.message, { hint: '这个仓库还没有可用的远程。先执行 git remote add origin <url>。' });
    }
    throw error;
  }
}

export async function switchBranch(cwd, name, { stash = false } = {}) {  const root = await repoRoot(cwd);
  const dirty = parseStatus((await run(root, ['status', '--porcelain=v2', '--branch', '-z'])).stdout).entries.length > 0;
  let stashed = false;
  if (dirty && stash) {
    await run(root, ['stash', 'push', '-u', '-m', `auto-stash before switching to ${name}`], { timeout: 60_000 });
    stashed = true;
  }
  try {
    const { stdout, stderr } = await run(root, ['switch', name]);
    return { ok: true, stashed, output: `${stdout}${stderr}`.trim() };
  } catch (error) {
    if (/not a git command/i.test(error.message)) {
      const { stdout, stderr } = await run(root, ['checkout', name]);
      return { ok: true, stashed, output: `${stdout}${stderr}`.trim() };
    }
    if (stashed) {
      try {
        await run(root, ['stash', 'pop'], { timeout: 60_000 });
      } catch {
        /* keep the stash rather than lose the changes */
      }
    }
    throw new GitError(error.message, {
      hint: stashed
        ? '切换失败，改动已放回工作区（若放回失败，可在 stash 里找到）。'
        : '若工作区有未提交改动，请先暂存或提交。',
    });
  }
}

/* ------------------------------------------------------- merge & cherry-pick */

async function listConflicts(root) {
  try {
    const { stdout } = await run(root, ['diff', '--name-only', '--diff-filter=U', '-z']);
    return stdout.split('\0').filter(Boolean);
  } catch {
    return [];
  }
}

async function requireCleanTree(root) {
  const status = parseStatus((await run(root, ['status', '--porcelain=v2', '--branch', '-z'])).stdout);
  if (status.entries.length > 0) {
    throw new GitError('工作区有未提交改动，无法执行合并或 cherry-pick', {
      hint: '先提交改动，或用「stash」暂存后再试。',
    });
  }
  return status;
}

/**
 * Merge `from` into `into`. Local uncommitted changes are allowed as long as
 * Git can carry them across; Git itself decides, and a refusal is reported
 * (never silently stashed or discarded). Conflicts are left in place.
 */
export async function mergeBranch(cwd, { from, into } = {}) {
  const root = await repoRoot(cwd);
  if (!from || !into) throw new GitError('缺少分支参数');
  if (from === into) throw new GitError('不能把分支合并到它自己');
  const status = parseStatus((await run(root, ['status', '--porcelain=v2', '--branch', '-z'])).stdout);
  const current = status.branch && status.branch !== '(detached)' ? status.branch : '';
  if (!current) throw new GitError('当前处于分离 HEAD，无法合并分支');

  let switched = false;
  if (current !== into) {
    try {
      await run(root, ['switch', into]);
      switched = true;
    } catch (switchError) {
      return {
        ok: false,
        blocked: true,
        reason: 'switch',
        output: switchError.message,
        from,
        into,
        current,
      };
    }
  }

  try {
    const { stdout, stderr } = await run(root, ['merge', '--no-ff', '--no-edit', from], { timeout: 120_000 });
    if (switched) {
      try {
        await run(root, ['switch', current]);
      } catch {
        /* stay on the merged branch if switching back fails */
      }
    }
    return { ok: true, output: `${stdout}${stderr}`.trim(), from, into, current };
  } catch (error) {
    const text = `${error.stdout || ''}\n${error.stderr || ''}\n${error.message}`;
    if (/local changes.*would be overwritten|Please commit your changes or stash/i.test(text)) {
      return {
        ok: false,
        blocked: true,
        reason: 'local-changes',
        files: filesFromGitRefusal(text),
        from,
        into,
        current,
        output: text.trim(),
      };
    }
    const conflicts = await listConflicts(root);
    if (conflicts.length > 0 || /CONFLICT/i.test(error.message)) {
      return {
        ok: false,
        conflict: true,
        conflicts,
        from,
        into,
        current,
        output: error.message,
      };
    }
    if (switched && current) {
      try {
        await run(root, ['switch', current]);
      } catch {
        /* keep the original branch when possible */
      }
    }
    throw error;
  }
}

/** Files Git listed after "would be overwritten by ...". */
function filesFromGitRefusal(text) {
  const files = [];
  let collecting = false;
  for (const line of String(text).split(/\r?\n/)) {
    if (/would be overwritten/i.test(line)) {
      collecting = true;
      continue;
    }
    if (!collecting) continue;
    const match = /^\s+(\S.*)$/.exec(line);
    if (match) {
      files.push(match[1].trim());
      continue;
    }
    if (line.trim() === '') break;
  }
  return files;
}

/** Cherry-pick one commit onto the current branch; local changes and conflicts follow Git. */
export async function cherryPick(cwd, sha) {
  const root = await repoRoot(cwd);
  if (!sha) throw new GitError('缺少要 cherry-pick 的提交');
  try {
    const { stdout, stderr } = await run(root, ['cherry-pick', sha], { timeout: 120_000 });
    return { ok: true, output: `${stdout}${stderr}`.trim(), sha };
  } catch (error) {
    const text = `${error.stdout || ''}\n${error.stderr || ''}\n${error.message}`;
    if (/previous cherry-pick is now empty|nothing to commit/i.test(text)) {
      try {
        await run(root, ['cherry-pick', '--abort']);
      } catch {
        /* nothing to abort */
      }
      return { ok: false, empty: true, output: text.trim(), sha };
    }
    if (/local changes.*would be overwritten|Please commit your changes or stash/i.test(text)) {
      return {
        ok: false,
        blocked: true,
        reason: 'local-changes',
        files: filesFromGitRefusal(text),
        sha,
        output: text.trim(),
      };
    }
    const conflicts = await listConflicts(root);
    if (conflicts.length > 0 || /CONFLICT/i.test(error.message)) {
      return { ok: false, conflict: true, conflicts, sha, output: error.message };
    }
    throw error;
  }
}

/** Recent commits of one branch, for the cherry-pick picker. */
export async function branchLog(cwd, name, { limit = 30 } = {}) {
  const root = await repoRoot(cwd);
  const { stdout } = await run(root, [
    'log',
    name,
    '-n',
    String(Math.max(1, Math.min(100, limit))),
    '--pretty=format:%h%x1f%s%x1f%an%x1f%ct',
  ]);
  return stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [short, subject, author, time] = line.split('\x1f');
      return { short, subject, author, time: Number(time) || 0 };
    });
}

export async function stashPush(cwd, message) {
  const root = await repoRoot(cwd);
  const text = String(message ?? '').trim() || `WIP ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`;
  const { stdout, stderr } = await run(root, ['stash', 'push', '-u', '-m', text]);
  return { ok: true, output: `${stdout}${stderr}`.trim() };
}

export async function stashApply(cwd, index, { pop = false } = {}) {
  const root = await repoRoot(cwd);
  const ref = `stash@{${index}}`;
  const { stdout, stderr } = await run(root, ['stash', pop ? 'pop' : 'apply', ref], { timeout: 60_000 });
  return { ok: true, output: `${stdout}${stderr}`.trim() };
}

export async function stashDrop(cwd, index) {
  const root = await repoRoot(cwd);
  const { stdout, stderr } = await run(root, ['stash', 'drop', `stash@{${index}}`]);
  return { ok: true, output: `${stdout}${stderr}`.trim() };
}

/* --------------------------------------------------------------- ai inputs */

export async function aiMaterial(cwd, { stagedOnly = false, maxDiffBytes = 24_000 } = {}) {
  const root = await repoRoot(cwd);
  const staged = (await run(root, ['diff', '--cached', '--no-color'])).stdout;
  const useStaged = staged.trim().length > 0;
  const unstaged = !useStaged && !stagedOnly ? (await run(root, ['diff', '--no-color'])).stdout : '';
  const status = parseStatus((await run(root, ['status', '--porcelain=v2', '--branch', '-z'])).stdout);

  const untrackedPaths = useStaged ? [] : status.entries.filter((e) => e.kind === 'untracked').map((e) => e.path);
  let untracked = '';
  for (const path of untrackedPaths.slice(0, 8)) {
    try {
      const abs = join(root, path);
      const stat = statSync(abs);
      if (!stat.isFile() || stat.size > 80_000) continue;
      const text = readFileSync(abs, 'utf8').split(/\r?\n/).slice(0, 120).join('\n');
      untracked += `\n--- 新文件 ${path} ---\n${text}\n`;
    } catch {
      /* skip unreadable */
    }
  }

  const diff = `${staged}${unstaged}${untracked}`.slice(0, maxDiffBytes);
  const files = status.entries.map((entry) => {
    const tag = entry.kind === 'untracked' ? '??' : `${entry.x}${entry.y}`;
    return `${tag} ${entry.path}${entry.before ? ` (原 ${entry.before})` : ''}`;
  });

  const recent = (await optional(run(root, ['log', '-n', '20', '--pretty=format:%s']).then((r) => r.stdout), ''))
    .split('\n')
    .filter(Boolean);

  return {
    root,
    stagedOnly,
    diff,
    diffBytes: Buffer.byteLength(diff, 'utf8'),
    files,
    recent,
    hasStaged: staged.trim().length > 0,
    hasChanges: diff.trim().length > 0,
  };
}
