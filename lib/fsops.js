/**
 * Folder Dock — filesystem helpers for the Host half.
 *
 * Pure functions over `node:fs`: list one level for the tree, and walk a set of
 * targets into a bounded file batch for "add to conversation". Nothing here
 * knows about Cordis or HTTP; `index.js` owns the route and the path policy.
 */
import { promises as fsp } from 'node:fs';
import { basename, dirname, join } from 'node:path';

/**
 * Heavy directories a bulk folder add never descends into by default. An
 * explicit selection of such a directory is still walked: the exclusion only
 * applies below the targets the caller named.
 */
const DEFAULT_EXCLUDES = [
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  '.cache',
  '.next',
  '.nuxt',
  '.turbo',
  '.gradle',
  '.pnpm-store',
  '__pycache__',
  '.venv',
  'venv',
  'coverage',
  '.idea',
  '.DS_Store',
  'Thumbs.db',
];

export const DEFAULT_LIMITS = {
  /** Files one add-to-conversation batch may carry. */
  maxFiles: 50,
  /** Bytes one file may have; larger files are reported, not uploaded. */
  maxFileBytes: 8 * 1024 * 1024,
  /** Bytes one batch may carry in total. */
  maxBatchBytes: 32 * 1024 * 1024,
  /** Entries one directory listing returns. */
  maxDirEntries: 2000,
  /** Entries one recursive folder walk visits before giving up. */
  maxEntries: 8000,
  excludes: DEFAULT_EXCLUDES,
};

/** Coerce one positive number from config, falling back on nonsense. */
function positive(value, fallback, max) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return fallback;
  return Math.min(Math.floor(number), max);
}

/**
 * Normalize the plugin's raw config into the limits every operation uses.
 * @param {Record<string, unknown>} [config] - raw Loader row config.
 * @returns {typeof DEFAULT_LIMITS} resolved limits.
 */
export function resolveLimits(config = {}) {
  const source = config && typeof config === 'object' ? config : {};
  const excludes = Array.isArray(source.excludes)
    ? source.excludes.filter((value) => typeof value === 'string' && value.length > 0)
    : DEFAULT_LIMITS.excludes;
  return {
    maxFiles: positive(source.maxFiles, DEFAULT_LIMITS.maxFiles, 500),
    maxFileBytes: positive(source.maxFileMB, 8, 512) * 1024 * 1024,
    maxBatchBytes: positive(source.maxBatchMB, 32, 2048) * 1024 * 1024,
    maxDirEntries: positive(source.maxDirEntries, DEFAULT_LIMITS.maxDirEntries, 20000),
    maxEntries: positive(source.maxEntries, DEFAULT_LIMITS.maxEntries, 200000),
    excludes,
  };
}

/** Browser-declared MIME type for a file name, so the composer sorts images correctly. */
const MIME = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  pdf: 'application/pdf',
  txt: 'text/plain',
  md: 'text/markdown',
  markdown: 'text/markdown',
  json: 'application/json',
  jsonl: 'application/jsonl',
  csv: 'text/csv',
  tsv: 'text/tab-separated-values',
  html: 'text/html',
  htm: 'text/html',
  css: 'text/css',
  js: 'text/javascript',
  mjs: 'text/javascript',
  cjs: 'text/javascript',
  ts: 'text/typescript',
  tsx: 'text/typescript',
  jsx: 'text/javascript',
  py: 'text/x-python',
  rs: 'text/rust',
  go: 'text/x-go',
  java: 'text/x-java',
  c: 'text/x-c',
  h: 'text/x-c',
  cpp: 'text/x-c++',
  hpp: 'text/x-c++',
  sh: 'text/x-sh',
  ps1: 'text/x-powershell',
  yml: 'text/yaml',
  yaml: 'text/yaml',
  toml: 'text/toml',
  xml: 'text/xml',
  svg: 'image/svg+xml',
  zip: 'application/zip',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

/**
 * MIME type for one file name.
 * @param {string} name - basename.
 * @returns {string} a MIME type, never empty.
 */
export function mimeFor(name) {
  const dot = name.lastIndexOf('.');
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
  return MIME[ext] ?? 'application/octet-stream';
}

/**
 * List one directory level for the sidebar tree.
 * @param {string} path - absolute directory path.
 * @param {typeof DEFAULT_LIMITS} limits - resolved limits.
 * @returns {Promise<{ path: string, name: string, parent: string | null, entries: Array<object>, truncated: boolean }>}
 */
export async function listDirectory(path, limits) {
  const names = await fsp.readdir(path, { withFileTypes: true });
  const truncated = names.length > limits.maxDirEntries;
  const kept = truncated ? names.slice(0, limits.maxDirEntries) : names;
  const entries = await Promise.all(
    kept.map(async (dirent) => {
      const child = join(path, dirent.name);
      const entry = {
        name: dirent.name,
        path: child,
        type: 'other',
        size: 0,
        mtime: 0,
        hidden: dirent.name.startsWith('.'),
        link: false,
      };
      let kind = dirent;
      if (dirent.isSymbolicLink()) {
        entry.link = true;
        try {
          kind = await fsp.stat(child);
        } catch {
          return entry;
        }
      }
      if (kind.isDirectory()) entry.type = 'directory';
      else if (kind.isFile()) entry.type = 'file';
      try {
        const stats = kind === dirent ? await fsp.stat(child) : kind;
        entry.size = stats.size;
        entry.mtime = stats.mtimeMs;
      } catch {
        /* a vanished entry stays listed without stats */
      }
      return entry;
    }),
  );
  return {
    path,
    name: basename(path) || path,
    parent: dirname(path) === path ? null : dirname(path),
    entries,
    truncated,
  };
}

/**
 * Walk the named targets into one bounded batch of files.
 *
 * Directories are walked depth-first; excluded directory names are skipped
 * below a target, never at a target the caller named explicitly. The walk stops
 * as soon as a limit is crossed, so one huge tree cannot make the Host read the
 * disk for minutes: the batch is reported as over-limit instead.
 *
 * @param {string[]} targets - absolute files and directories.
 * @param {typeof DEFAULT_LIMITS} limits - resolved limits.
 * @returns {Promise<{ files: Array<{ path: string, name: string, size: number }>, count: number, bytes: number, over: boolean, reason: string | null, skipped: { tooLarge: number, symlink: number, unreadable: number }, truncated: boolean }>}
 */
export async function scanTargets(targets, limits) {
  const roots = new Set(targets);
  const files = [];
  let bytes = 0;
  let over = false;
  let reason = null;
  let visited = 0;
  let truncated = false;
  const skipped = { tooLarge: 0, symlink: 0, unreadable: 0 };

  /** Admit one file, or report why the batch must stop. */
  const admit = (path, name, size) => {
    if (size > limits.maxFileBytes) {
      skipped.tooLarge += 1;
      return;
    }
    if (files.length >= limits.maxFiles) {
      over = true;
      reason = 'too-many';
      return;
    }
    if (bytes + size > limits.maxBatchBytes) {
      over = true;
      reason = 'too-big';
      return;
    }
    files.push({ path, name, size });
    bytes += size;
  };

  const stack = [...roots];
  while (stack.length > 0 && !over) {
    if (visited >= limits.maxEntries) {
      truncated = true;
      break;
    }
    const current = stack.pop();
    let stats;
    try {
      stats = await fsp.lstat(current);
    } catch {
      skipped.unreadable += 1;
      continue;
    }
    if (stats.isSymbolicLink()) {
      skipped.symlink += 1;
      continue;
    }
    if (stats.isFile()) {
      admit(current, basename(current), stats.size);
      continue;
    }
    if (!stats.isDirectory()) continue;

    const atTarget = roots.has(current);
    if (!atTarget && limits.excludes.includes(basename(current))) continue;

    let children;
    try {
      children = await fsp.readdir(current, { withFileTypes: true });
    } catch {
      skipped.unreadable += 1;
      continue;
    }
    children.sort((left, right) => (left.name < right.name ? 1 : left.name > right.name ? -1 : 0));
    for (const dirent of children) {
      visited += 1;
      if (visited >= limits.maxEntries) {
        truncated = true;
        break;
      }
      if (over) break;
      const child = join(current, dirent.name);
      if (dirent.isSymbolicLink()) {
        skipped.symlink += 1;
        continue;
      }
      if (dirent.isDirectory()) {
        if (!limits.excludes.includes(dirent.name)) stack.push(child);
        continue;
      }
      if (!dirent.isFile()) continue;
      let childStats;
      try {
        childStats = await fsp.stat(child);
      } catch {
        skipped.unreadable += 1;
        continue;
      }
      admit(child, dirent.name, childStats.size);
    }
  }

  return {
    files,
    count: files.length,
    bytes,
    over,
    reason,
    skipped,
    truncated,
  };
}
