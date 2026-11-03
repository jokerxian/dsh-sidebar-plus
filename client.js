/* eslint-disable */
/**
 * Sidebar Plus — browser half.
 *
 * One package, two right-Sidebar pages plus the Git conversation view:
 *  - Folder Dock  (folder tree + add to conversation)
 *  - Git Workbench (status, history, diff, commit)
 *
 * Both halves keep their own CSS prefix (`fd-` / `gw-`) and their own Host
 * routes; this file only composes them into one plugin.
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-sidebar-plus',
  factory(require) {
    const React = require('react');

    const folderPlugin = (function (React) {

    const h = React.createElement;

    const ID = '@local/dsh-sidebar-plus';
    const KIND = 'sidebar-plus-folder';
    const NS = 'folderDock';
    const RPC_ROUTE = '/sidebar-plus/folder/rpc';
    const READ_ROUTE = '/sidebar-plus/folder/read';
    const REQUEST_HEADER = 'x-dsh-folder-dock';
    const LS_ROOT = 'dsh.folderDock.root';
    const LS_RECENT = 'dsh.folderDock.recent';

    /** Plugin context, captured so components can reach services. */
    let pluginCtx = null;
    /** Namespace-bound translate, replaced in `apply`. */
    let T = (key) => key;

    /* ------------------------------------------------------------- dictionaries */

    const ZH = {
      'tab.title': '文件夹',
      'guide.title': '文件夹 · 添加到对话',
      'guide.description': '浏览任意本地文件夹，右键把文件或整个文件夹添加到对话。',
      'entry.title': '文件夹',
      'entry.tooltip': '文件夹：右键添加到对话',
      'empty.title': '还没有打开文件夹',
      'empty.body': '选择一个本地文件夹，右键文件或文件夹即可添加到对话。',
      'recent.title': '最近打开',
      'action.pick': '选择文件夹',
      'action.useSession': '使用会话目录',
      'action.enterPath': '输入路径',
      'action.refresh': '刷新',
      'action.openInExplorer': '在文件管理器中打开',
      'action.cancel': '取消',
      'action.add': '添加到对话',
      'action.clear': '清除选择',
      'action.collapse': '收起',
      'action.closeRoot': '关闭此文件夹',
      'menu.addFile': '添加到对话',
      'menu.addFolder': '添加整个文件夹到对话',
      'menu.addSelected': '添加 {n} 个所选项目到对话',
      'menu.copy': '复制',
      'menu.copyMany': '复制 {n} 项',
      'menu.paste': '粘贴',
      'menu.pasteMany': '粘贴 {n} 项',
      'menu.copyPath': '复制路径',
      'menu.copyRelative': '复制相对路径',
      'menu.preview': '预览',
      'menu.openBrowser': '在浏览器中打开',
      'menu.reveal': '在文件管理器中显示',
      'menu.newFolder': '新建文件夹',
      'menu.refresh': '刷新',
      'menu.pick': '选择文件夹',
      'menu.changeFolder': '更换文件夹…',
      'selection.count': '已选 {n} 项',
      'hint.rightClick': '右键文件或文件夹，可添加到对话',
      'status.preparing': '正在检查所选项目…',
      'status.adding': '正在添加 {done}/{total}…',
      'status.added': '已添加 {n} 个文件到对话',
      'status.skipped': '，跳过 {n} 个（过大或链接）',
      'status.copyHint': '已复制 {n} 项，右键目标文件夹可粘贴',
      'status.pasting': '正在粘贴…',
      'status.pasted': '已粘贴 {n} 项',
      'status.pastedFailed': '，{n} 项失败',
      'status.nothing': '没有可添加的文件',
      'status.noConversation': '会话服务不可用，无法添加到对话',
      'status.noInput': '输入框尚未就绪，无法添加到对话',
      'status.inputBusy': '输入框正在提交，请稍后再试',
      'status.copied': '已复制路径',
      'error.grantFailed': '无法打开该文件夹：{message}',
      'error.pickFailed': '无法打开系统文件夹选择器，请改用「输入路径」',
      'error.addFailed': '添加失败：{message}',
      'error.pasteFailed': '粘贴失败：{message}',
      'error.listFailed': '无法读取目录：{message}',
      'error.previewFailed': '预览失败：该文件可能不在会话的工作目录内',
      'error.tooManyFiles': '超过单次上限：已数到 {n} 个文件（上限 {max} 个）。请选择子文件夹或减少选择。',
      'error.tooBig': '超过单次上限：已数到 {size}（上限 {max}）。请选择子文件夹或减少选择。',
      'error.mkdirFailed': '新建文件夹失败：{message}',
      'loading': '加载中…',
      'empty.dir': '空文件夹',
      'truncated': '条目过多，仅显示前一部分',
      'create.placeholder': '新文件夹名称，回车确认',
      'create.confirm': '创建',
      'path.placeholder': '绝对路径，例如 D:\\projects\\demo',
      'path.title': '输入文件夹路径',
    };

    const EN = {
      'tab.title': 'Folder',
      'guide.title': 'Folder → conversation',
      'guide.description': 'Browse any local folder and right-click files or whole folders to add them to the conversation.',
      'entry.title': 'Folder',
      'entry.tooltip': 'Folder: right-click to add to the conversation',
      'empty.title': 'No folder open yet',
      'empty.body': 'Pick a local folder, then right-click a file or folder to add it to the conversation.',
      'recent.title': 'Recent',
      'action.pick': 'Choose folder',
      'action.useSession': 'Use session folder',
      'action.enterPath': 'Enter path',
      'action.refresh': 'Refresh',
      'action.openInExplorer': 'Open in file manager',
      'action.cancel': 'Cancel',
      'action.add': 'Add to conversation',
      'action.clear': 'Clear',
      'action.collapse': 'Collapse',
      'action.closeRoot': 'Close this folder',
      'menu.addFile': 'Add to conversation',
      'menu.addFolder': 'Add the whole folder to the conversation',
      'menu.addSelected': 'Add {n} selected items to the conversation',
      'menu.copy': 'Copy',
      'menu.copyMany': 'Copy {n} items',
      'menu.paste': 'Paste',
      'menu.pasteMany': 'Paste {n} items',
      'menu.copyPath': 'Copy path',
      'menu.copyRelative': 'Copy relative path',
      'menu.preview': 'Preview',
      'menu.openBrowser': 'Open in browser',
      'menu.reveal': 'Show in file manager',
      'menu.newFolder': 'New folder',
      'menu.refresh': 'Refresh',
      'menu.pick': 'Choose folder',
      'menu.changeFolder': 'Change folder…',
      'selection.count': '{n} selected',
      'hint.rightClick': 'Right-click a file or folder to add it to the conversation',
      'status.preparing': 'Checking the selected items…',
      'status.adding': 'Adding {done}/{total}…',
      'status.added': 'Added {n} files to the conversation',
      'status.skipped': '; skipped {n} (too large or a link)',
      'status.copyHint': 'Copied {n} items; right-click a target folder to paste',
      'status.pasting': 'Pasting…',
      'status.pasted': 'Pasted {n} items',
      'status.pastedFailed': '; {n} failed',
      'status.nothing': 'Nothing to add',
      'status.noConversation': 'The conversation service is unavailable',
      'status.noInput': 'The composer is not ready',
      'status.inputBusy': 'The composer is submitting; try again shortly',
      'status.copied': 'Path copied',
      'error.grantFailed': 'Could not open that folder: {message}',
      'error.pickFailed': 'The system folder picker is unavailable; use “Enter path” instead',
      'error.addFailed': 'Could not add: {message}',
      'error.pasteFailed': 'Paste failed: {message}',
      'error.listFailed': 'Could not read the directory: {message}',
      'error.previewFailed': 'Preview failed; the file may be outside the session folder',
      'error.tooManyFiles': 'Over the batch limit: {n} files found (limit {max}). Pick a subfolder or select fewer.',
      'error.tooBig': 'Over the batch limit: {size} found (limit {max}). Pick a subfolder or select fewer.',
      'error.mkdirFailed': 'Could not create the folder: {message}',
      'loading': 'Loading…',
      'empty.dir': 'Empty folder',
      'truncated': 'Too many entries; only the first part is shown',
      'create.placeholder': 'New folder name, Enter to create',
      'create.confirm': 'Create',
      'path.placeholder': 'Absolute path, e.g. D:\\projects\\demo',
      'path.title': 'Folder path',
    };

    /* ------------------------------------------------------------------- helpers */

    async function rpc(op, payload = {}) {
      try {
        const response = await fetch(RPC_ROUTE, {
          method: 'POST',
          headers: { 'content-type': 'application/json', [REQUEST_HEADER]: '1' },
          body: JSON.stringify({ op, ...payload }),
          cache: 'no-store',
        });
        const data = await response.json().catch(() => null);
        if (!data) return { ok: false, error: { message: `HTTP ${response.status}` } };
        return data;
      } catch (error) {
        return { ok: false, error: { message: error && error.message ? error.message : String(error) } };
      }
    }

    /** Fetch one file as a browser `File`, the shape the Conversation draft intake takes. */
    async function fetchFile(path) {
      const response = await fetch(READ_ROUTE, {
        method: 'POST',
        headers: { 'content-type': 'application/json', [REQUEST_HEADER]: '1' },
        body: JSON.stringify({ path }),
        cache: 'no-store',
      });
      if (!response.ok) {
        let message = `HTTP ${response.status}`;
        try {
          const data = await response.json();
          message = (data && data.error && data.error.message) || message;
        } catch {
          /* the body was not JSON */
        }
        throw new Error(message);
      }
      const blob = await response.blob();
      const encoded = response.headers.get('x-file-name');
      let name = path.split(/[\\/]/).pop() || 'file';
      if (encoded) {
        try {
          name = decodeURIComponent(encoded);
        } catch {
          /* keep the path-derived name */
        }
      }
      const type = response.headers.get('content-type') || 'application/octet-stream';
      return new File([blob], name, { type });
    }

    function formatSize(bytes) {
      if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
      if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
      if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
      return `${bytes} B`;
    }

    const COLLATOR = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

    function sortEntries(entries) {
      return [...entries].sort((left, right) => {
        const group = Number(right.type === 'directory') - Number(left.type === 'directory');
        return group !== 0 ? group : COLLATOR.compare(left.name, right.name);
      });
    }

    function baseName(path) {
      const trimmed = String(path).replace(/[\\/]+$/, '');
      return trimmed.split(/[\\/]/).pop() || trimmed;
    }

    function relativeTo(root, path) {
      if (!root) return path;
      const rootSlash = root.replace(/\\/g, '/').replace(/\/+$/, '');
      const target = path.replace(/\\/g, '/');
      if (target.toLowerCase() === rootSlash.toLowerCase()) return '.';
      if (target.toLowerCase().startsWith(`${rootSlash.toLowerCase()}/`)) {
        return target.slice(rootSlash.length + 1);
      }
      return path;
    }

    function isInside(root, path) {
      if (!root) return false;
      const parent = root.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
      const child = path.replace(/\\/g, '/').toLowerCase();
      return child === parent || child.startsWith(`${parent}/`);
    }

    function encodeAddressPath(path) {
      return path
        .split('/')
        .map((segment) => encodeURIComponent(segment).replace(/%3A/gi, ':'))
        .join('/');
    }

    function fileAddress(sessionId, cwd, path) {
      const normalized = path.replace(/\\/g, '/').replace(/^(?:\.\/)+/, '');
      const root = cwd ? cwd.replace(/\\/g, '/').replace(/\/+$/, '') : '';
      let relative = normalized;
      if (root && normalized.toLowerCase().startsWith(`${root.toLowerCase()}/`)) {
        relative = normalized.slice(root.length + 1);
      }
      return `dsh-resource://file/session/${encodeURIComponent(String(sessionId))}/${encodeAddressPath(relative)}`;
    }

    function readRecent() {
      try {
        const raw = localStorage.getItem(LS_RECENT);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.filter((value) => typeof value === 'string').slice(0, 8) : [];
      } catch {
        return [];
      }
    }

    /* --------------------------------------------------------------------- icons */

    function FolderIcon({ size = 14, className, open = false }) {
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.2,
          strokeLinejoin: 'round',
          strokeLinecap: 'round',
          'aria-hidden': true,
          className,
        },
        open
          ? h('path', { d: 'M1.9 12.4V5.3h3.3l1.3-1.4h3.1l1.1 1.4h3.4v7.1z' })
          : h('path', { d: 'M1.9 4.6c0-.5.4-.9.9-.9h3l1.2 1.3h6.2c.5 0 .9.4.9.9v6.5c0 .5-.4.9-.9.9H2.8a.9.9 0 0 1-.9-.9z' }),
      );
    }

    function DocIcon({ size = 14, className }) {
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.2,
          strokeLinejoin: 'round',
          strokeLinecap: 'round',
          'aria-hidden': true,
          className,
        },
        h('path', { d: 'M4 2.6h4.9L12 5.5v7.9H4z' }),
        h('path', { d: 'M8.9 2.6v2.9H12' }),
      );
    }

    function ChevronIcon({ size = 12, className, open = false }) {
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.5,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          className,
          style: open ? { transform: 'rotate(90deg)' } : undefined,
        },
        h('path', { d: 'M6 3.5 10.5 8 6 12.5' }),
      );
    }

    function RefreshIcon({ size = 15 }) {
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.3,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
        },
        h('path', { d: 'M13 8a5 5 0 1 1-1.7-3.8' }),
        h('path', { d: 'M13.2 2.9v3.2h-3.2' }),
      );
    }

    function OpenInIcon({ size = 15 }) {
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.3,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
        },
        h('path', { d: 'M6.6 3.4H4.2a1.4 1.4 0 0 0-1.4 1.4v7A1.4 1.4 0 0 0 4.2 13.2h7a1.4 1.4 0 0 0 1.4-1.4V9.4' }),
        h('path', { d: 'M9.8 2.6h3.6v3.6' }),
        h('path', { d: 'M13.2 2.8 8.1 7.9' }),
      );
    }

    function FolderPlusIcon({ size = 15 }) {
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
        },
        h('path', { d: 'M1.9 4.6c0-.5.4-.9.9-.9h3l1.2 1.3h6.2c.5 0 .9.4.9.9v6.5c0 .5-.4.9-.9.9H2.8a.9.9 0 0 1-.9-.9z' }),
        h('path', { d: 'M8 7.3v3.1M6.5 8.85h3' }),
      );
    }

    /* ------------------------------------------------------------------ the panel */

    function buildRows(levels, expanded, root, creating, tr) {
      const rows = [];
      if (!root) return rows;
      const visit = (dir, depth) => {
        if (creating && creating.dir === dir) rows.push({ kind: 'create', key: `create:${dir}`, depth: depth + 1 });
        const level = levels[dir];
        if (level === undefined || level.kind === 'loading') {
          rows.push({ kind: 'note', key: `loading:${dir}`, depth, text: tr('loading') });
          return;
        }
        if (level.kind === 'error') {
          rows.push({ kind: 'note', key: `error:${dir}`, depth, text: tr('error.listFailed', { message: level.message }), error: true });
          return;
        }
        const entries = sortEntries(level.entries || []);
        if (entries.length === 0) rows.push({ kind: 'note', key: `empty:${dir}`, depth, text: tr('empty.dir') });
        for (const entry of entries) {
          rows.push({ kind: 'entry', key: entry.path, depth, entry });
          if (entry.type === 'directory' && expanded.has(entry.path)) visit(entry.path, depth + 1);
        }
        if (level.truncated) rows.push({ kind: 'note', key: `truncated:${dir}`, depth, text: tr('truncated') });
      };
      visit(root, 0);
      return rows;
    }

    function FolderDock({ sessionId, inputActions, t }) {
      const translate = t || T;
      const tr = React.useCallback(
        (key, params) => (typeof translate === 'function' ? translate(key, params) : `${key} ${JSON.stringify(params || {})}`),
        [translate],
      );

      const actionRef = React.useRef(inputActions);
      actionRef.current = inputActions;
      const sessionRef = React.useRef(sessionId);
      sessionRef.current = sessionId;

      const [root, setRoot] = React.useState('');
      const [sessionRoot, setSessionRoot] = React.useState('');
      const [levels, setLevels] = React.useState({});
      const [expanded, setExpanded] = React.useState(() => new Set());
      const [selected, setSelected] = React.useState(() => new Set());
      const [menu, setMenu] = React.useState(null);
      const [creating, setCreating] = React.useState(null);
      const [notice, setNotice] = React.useState(null);
      const [busy, setBusy] = React.useState(null);
      const [clipboard, setClipboard] = React.useState([]);
      const [pasting, setPasting] = React.useState(false);
      const [askPath, setAskPath] = React.useState(false);
      const [pathDraft, setPathDraft] = React.useState('');
      const [recent, setRecent] = React.useState(() => readRecent());

      const rootRef = React.useRef('');
      rootRef.current = root;
      const sessionRootRef = React.useRef('');
      sessionRootRef.current = sessionRoot;
      const levelsRef = React.useRef(levels);
      levelsRef.current = levels;
      const expandedRef = React.useRef(expanded);
      expandedRef.current = expanded;
      const selectedRef = React.useRef(selected);
      selectedRef.current = selected;
      const anchorRef = React.useRef(-1);
      const menuRef = React.useRef(null);
      const createInputRef = React.useRef(null);

      const load = React.useCallback(
        async (path) => {
          setLevels((previous) => ({ ...previous, [path]: { kind: 'loading' } }));
          const result = await rpc('list', { path });
          if (!result.ok) {
            setLevels((previous) => ({
              ...previous,
              [path]: { kind: 'error', message: (result.error && result.error.message) || '' },
            }));
            return;
          }
          setLevels((previous) => ({
            ...previous,
            [path]: { kind: 'ready', entries: result.value.entries || [], truncated: Boolean(result.value.truncated) },
          }));
        },
        [],
      );

      const expand = React.useCallback((path) => {
        setExpanded((previous) => {
          if (previous.has(path)) return previous;
          const next = new Set(previous);
          next.add(path);
          return next;
        });
        const level = levelsRef.current[path];
        if (level === undefined || level.kind === 'error') void load(path);
      }, [load]);

      const collapse = React.useCallback((path) => {
        setExpanded((previous) => {
          if (!previous.has(path)) return previous;
          const next = new Set(previous);
          next.delete(path);
          return next;
        });
      }, []);

      const rememberRoot = React.useCallback((path) => {
        setRecent((previous) => {
          const next = [path, ...previous.filter((value) => value !== path)].slice(0, 8);
          try {
            localStorage.setItem(LS_RECENT, JSON.stringify(next));
          } catch {
            /* storage may be unavailable */
          }
          return next;
        });
      }, []);

      const openRoot = React.useCallback(
        async (path, options = {}) => {
          if (typeof path !== 'string' || path.length === 0) return false;
          const granted = await rpc('grant', { path });
          if (!granted.ok) {
            if (!options.silent) {
              setNotice({ kind: 'error', text: tr('error.grantFailed', { message: (granted.error && granted.error.message) || '' }) });
            }
            return false;
          }
          const resolved = granted.value.path;
          setRoot(resolved);
          setLevels({});
          setExpanded(new Set());
          setSelected(new Set());
          setCreating(null);
          setMenu(null);
          setNotice(null);
          try {
            localStorage.setItem(`${LS_ROOT}:${sessionId}`, resolved);
          } catch {
            /* storage may be unavailable */
          }
          rememberRoot(resolved);
          void load(resolved);
          return true;
        },
        [load, rememberRoot, tr, sessionId],
      );

      React.useEffect(() => {
        let cancelled = false;
        (async () => {
          const session = await rpc('session-root', { sessionId });
          if (!cancelled && session.ok) setSessionRoot(session.value.path);
          if (cancelled) return;
          let saved = null;
          try {
            saved = localStorage.getItem(`${LS_ROOT}:${sessionId}`);
          } catch {
            saved = null;
          }
          if (saved) {
            const restored = await openRoot(saved, { silent: true });
            if (restored || cancelled) return;
          }
          if (session.ok) await openRoot(session.value.path, { silent: true });
        })();
        return () => {
          cancelled = true;
        };
        // The panel re-seeds when the tab's Session changes.
      }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

      React.useEffect(() => {
        if (!notice) return undefined;
        const delay = notice.kind === 'error' ? 9000 : 4200;
        const timer = window.setTimeout(() => setNotice(null), delay);
        return () => window.clearTimeout(timer);
      }, [notice]);

      React.useEffect(() => {
        if (!menu) return undefined;
        const onPointerDown = (event) => {
          if (menuRef.current && menuRef.current.contains(event.target)) return;
          setMenu(null);
        };
        const onKeyDown = (event) => {
          if (event.key === 'Escape') {
            setMenu(null);
            setCreating(null);
            setAskPath(false);
          }
        };
        window.addEventListener('pointerdown', onPointerDown, true);
        window.addEventListener('keydown', onKeyDown, true);
        return () => {
          window.removeEventListener('pointerdown', onPointerDown, true);
          window.removeEventListener('keydown', onKeyDown, true);
        };
      }, [menu]);

      React.useEffect(() => {
        if (creating && createInputRef.current) createInputRef.current.focus();
      }, [creating]);

      const rows = React.useMemo(() => buildRows(levels, expanded, root, creating, tr), [levels, expanded, root, creating, tr]);

      /* --------------------------------------------------------------- actions */

      const pick = React.useCallback(async () => {
        setAskPath(false);
        const workspace = pluginCtx ? pluginCtx.get('uiWorkspace') : undefined;
        if (workspace && typeof workspace.pickDirectory === 'function') {
          try {
            const picked = await workspace.pickDirectory();
            if (!picked) return;
            await openRoot(picked);
            return;
          } catch {
            /* fall through to the Host picker */
          }
        }
        const result = await rpc('pick');
        if (result.ok) {
          if (result.value && result.value.path) {
            await openRoot(result.value.path);
          } else {
            setNotice({ kind: 'info', text: tr('error.pickFailed') });
          }
          return;
        }
        setNotice({ kind: 'error', text: tr('error.pickFailed') });
        setAskPath(true);
      }, [openRoot, tr]);

      const useSessionRoot = React.useCallback(async () => {
        const result = await rpc('session-root', { sessionId: sessionRef.current });
        if (result.ok) {
          setSessionRoot(result.value.path);
          await openRoot(result.value.path);
        } else {
          setNotice({ kind: 'error', text: (result.error && result.error.message) || tr('status.noConversation') });
        }
      }, [openRoot, tr]);

      const closeRoot = React.useCallback(() => {
        try {
          localStorage.removeItem(`${LS_ROOT}:${sessionId}`);
        } catch {
          /* storage may be unavailable */
        }
        setRoot('');
        setLevels({});
        setExpanded(new Set());
        setSelected(new Set());
        setNotice(null);
        setMenu(null);
      }, [sessionId]);

      const copyText = React.useCallback(
        async (text) => {
          try {
            await navigator.clipboard.writeText(text);
            setNotice({ kind: 'ok', text: tr('status.copied') });
          } catch {
            setNotice({ kind: 'info', text });
          }
        },
        [tr],
      );

      const preview = React.useCallback(
        (path) => {
          try {
            const sidebarRight = pluginCtx ? pluginCtx.get('sidebarRight') : undefined;
            if (!sidebarRight || typeof sidebarRight.openResource !== 'function') throw new Error('no sidebar');
            sidebarRight.openResource(fileAddress(sessionRef.current, sessionRootRef.current, path));
          } catch {
            setNotice({ kind: 'error', text: tr('error.previewFailed') });
          }
        },
        [tr],
      );

      const addPaths = React.useCallback(
        async (paths) => {
          const unique = [...new Set(paths.filter((value) => typeof value === 'string' && value.length > 0))];
          if (unique.length === 0) return;
          setBusy({ done: 0, total: 0 });
          setNotice({ kind: 'info', text: tr('status.preparing') });
          try {
            const scan = await rpc('scan', { paths: unique });
            if (!scan.ok) throw new Error((scan.error && scan.error.message) || '');
            const batch = scan.value;
            const limits = batch.limits || {};
            if (batch.over) {
              if (batch.reason === 'too-big') {
                setNotice({
                  kind: 'error',
                  text: tr('error.tooBig', { size: formatSize(batch.bytes), max: formatSize(limits.maxBatchBytes || 0) }),
                });
              } else {
                setNotice({
                  kind: 'error',
                  text: tr('error.tooManyFiles', { n: batch.count, max: limits.maxFiles || 0 }),
                });
              }
              return;
            }
            if (batch.count === 0) {
              setNotice({ kind: 'info', text: tr('status.nothing') });
              return;
            }
            const conversation = pluginCtx ? pluginCtx.get('conversation') : undefined;
            if (!conversation || typeof conversation.createDrafts !== 'function') {
              throw new Error(tr('status.noConversation'));
            }
            const actions = actionRef.current;
            if (!actions || typeof actions.addAttachments !== 'function') {
              throw new Error(tr('status.noInput'));
            }
            setBusy({ done: 0, total: batch.count });
            const files = [];
            for (let index = 0; index < batch.files.length; index += 1) {
              setBusy({ done: index, total: batch.count });
              files.push(await fetchFile(batch.files[index].path));
            }
            setBusy({ done: batch.count, total: batch.count });
            const drafts = conversation.createDrafts(sessionRef.current, files);
            const accepted = actions.addAttachments(drafts.map((draft) => draft.id));
            if (!accepted) {
              if (typeof conversation.releaseDraftAttachments === 'function') conversation.releaseDraftAttachments(drafts);
              throw new Error(tr('status.inputBusy'));
            }
            const skipped = batch.skipped || {};
            const skippedCount = (skipped.tooLarge || 0) + (skipped.symlink || 0);
            setSelected(new Set());
            setNotice({
              kind: 'ok',
              text: tr('status.added', { n: drafts.length }) + (skippedCount > 0 ? tr('status.skipped', { n: skippedCount }) : ''),
            });
          } catch (error) {
            setNotice({ kind: 'error', text: tr('error.addFailed', { message: error && error.message ? error.message : String(error) }) });
          } finally {
            setBusy(null);
          }
        },
        [tr],
      );

      const pasteSelection = React.useCallback(
        async (targetDir) => {
          if (!targetDir || clipboard.length === 0) return;
          setPasting(true);
          setNotice({ kind: 'info', text: tr('status.pasting') });
          try {
            const result = await rpc('paste', { to: targetDir, paths: clipboard });
            if (!result.ok) throw new Error((result.error && result.error.message) || '');
            const value = result.value;
            if (targetDir !== rootRef.current) expand(targetDir);
            await load(targetDir);
            const pasted = (value.items || []).map((item) => item.to);
            setSelected(new Set(pasted));
            const failed = (value.failed || []).length;
            setNotice({
              kind: 'ok',
              text: tr('status.pasted', { n: pasted.length }) + (failed > 0 ? tr('status.pastedFailed', { n: failed }) : ''),
            });
          } catch (error) {
            setNotice({ kind: 'error', text: tr('error.pasteFailed', { message: error && error.message ? error.message : String(error) }) });
          } finally {
            setPasting(false);
          }
        },
        [clipboard, expand, load, tr],
      );

      const submitCreate = React.useCallback(async () => {
        const current = creating;
        if (!current) return;
        const name = (current.name || '').trim();
        if (!name) {
          setCreating(null);
          return;
        }
        const result = await rpc('mkdir', { path: current.dir, name });
        if (!result.ok) {
          setNotice({ kind: 'error', text: tr('error.mkdirFailed', { message: (result.error && result.error.message) || '' }) });
          return;
        }
        setCreating(null);
        const parent = current.dir;
        if (!expandedRef.current.has(parent)) expand(parent);
        await load(parent);
      }, [creating, expand, load, tr]);

      /* ------------------------------------------------------------ interaction */

      const toggleFolder = React.useCallback(
        (entry) => {
          if (expandedRef.current.has(entry.path)) collapse(entry.path);
          else expand(entry.path);
        },
        [collapse, expand],
      );

      const onRowClick = (event, row) => {
        if (row.kind !== 'entry') return;
        const entry = row.entry;
        const index = rows.indexOf(row);
        if (event.shiftKey && anchorRef.current >= 0) {
          const start = Math.min(anchorRef.current, index);
          const end = Math.max(anchorRef.current, index);
          const next = new Set(event.ctrlKey || event.metaKey ? selectedRef.current : []);
          for (let cursor = start; cursor <= end; cursor += 1) {
            const candidate = rows[cursor];
            if (candidate && candidate.kind === 'entry') next.add(candidate.entry.path);
          }
          setSelected(next);
          return;
        }
        anchorRef.current = index;
        if (event.ctrlKey || event.metaKey) {
          const next = new Set(selectedRef.current);
          if (next.has(entry.path)) next.delete(entry.path);
          else next.add(entry.path);
          setSelected(next);
          return;
        }
        setSelected(new Set([entry.path]));
        if (entry.type === 'directory') toggleFolder(entry);
      };

      const onRowContextMenu = (event, row) => {
        event.preventDefault();
        event.stopPropagation();
        const entry = row && row.kind === 'entry' ? row.entry : null;
        if (entry && !selectedRef.current.has(entry.path)) setSelected(new Set([entry.path]));
        setMenu({ x: event.clientX, y: event.clientY, row });
      };

      const menuPaths = React.useMemo(() => {
        if (!menu || !menu.row || menu.row.kind !== 'entry') return [];
        const entry = menu.row.entry;
        if (selectedRef.current.has(entry.path) && selectedRef.current.size > 1) return [...selectedRef.current];
        return [entry.path];
      }, [menu]);

      const menuItems = React.useMemo(() => {
        if (!menu) return [];
        const entry = menu.row && menu.row.kind === 'entry' ? menu.row.entry : null;
        const items = [];
        if (entry) {
          if (menuPaths.length > 1) items.push({ id: 'add', label: tr('menu.addSelected', { n: menuPaths.length }), primary: true });
          else items.push({ id: 'add', label: entry.type === 'directory' ? tr('menu.addFolder') : tr('menu.addFile'), primary: true });
          items.push({
            id: 'copy',
            label: menuPaths.length > 1 ? tr('menu.copyMany', { n: menuPaths.length }) : tr('menu.copy'),
          });
          items.push({ id: 'copyPath', label: tr('menu.copyPath') });
          if (root) items.push({ id: 'copyRelative', label: tr('menu.copyRelative') });
          if (entry.type === 'file' && sessionRoot && isInside(sessionRoot, entry.path)) {
            items.push({ id: 'preview', label: tr('menu.preview') });
          }
          if (entry.type === 'file' && /\.(html?|xhtml)$/i.test(entry.path)) {
            items.push({ id: 'openBrowser', label: tr('menu.openBrowser') });
          }
          items.push({ id: 'reveal', label: tr('menu.reveal') });
          if (entry.type === 'directory') {
            items.push({ separator: true });
            items.push({
              id: 'paste',
              label: clipboard.length > 0 ? tr('menu.pasteMany', { n: clipboard.length }) : tr('menu.paste'),
              disabled: clipboard.length === 0 || pasting,
            });
            items.push({ id: 'newFolder', label: tr('menu.newFolder') });
            items.push({ id: 'refresh', label: tr('menu.refresh') });
            if (expanded.has(entry.path)) items.push({ id: 'collapse', label: tr('action.collapse') });
          }
          if (root && entry.path === root) {
            items.push({ separator: true });
            items.push({ id: 'pick', label: tr('menu.changeFolder') });
            items.push({ id: 'closeRoot', label: tr('action.closeRoot') });
          }
        } else {
          items.push({ id: 'pick', label: tr('menu.pick') });
          if (root) {
            items.push({
              id: 'paste',
              label: clipboard.length > 0 ? tr('menu.pasteMany', { n: clipboard.length }) : tr('menu.paste'),
              disabled: clipboard.length === 0 || pasting,
            });
            items.push({ id: 'refresh', label: tr('menu.refresh') });
            items.push({ id: 'newFolderHere', label: tr('menu.newFolder') });
            items.push({ separator: true });
            items.push({ id: 'closeRoot', label: tr('action.closeRoot') });
          }
        }
        return items;
      }, [menu, menuPaths, root, sessionRoot, expanded, clipboard, pasting, tr]);

      const runMenu = (id) => {
        const entry = menu && menu.row && menu.row.kind === 'entry' ? menu.row.entry : null;
        const paths = menuPaths;
        setMenu(null);
        switch (id) {
          case 'add':
            void addPaths(paths);
            break;
          case 'copy':
            if (paths.length > 0) {
              setClipboard(paths);
              setNotice({ kind: 'ok', text: tr('status.copyHint', { n: paths.length }) });
            }
            break;
          case 'paste':
            if (entry && entry.type === 'directory') void pasteSelection(entry.path);
            else if (root) void pasteSelection(root);
            break;
          case 'copyPath':
            if (paths[0]) void copyText(paths[0]);
            break;
          case 'copyRelative':
            if (paths[0]) void copyText(relativeTo(root, paths[0]));
            break;
          case 'preview':
            if (paths[0]) preview(paths[0]);
            break;
          case 'openBrowser':
            if (paths[0]) {
              void rpc('open', { path: paths[0] }).then((result) => {
                if (!result.ok) {
                  setNotice({ kind: 'error', text: (result.error && result.error.message) || tr('menu.openBrowser') });
                }
              });
            }
            break;
          case 'reveal':
            if (paths[0]) void rpc('reveal', { path: paths[0], revealInParent: true });
            break;
          case 'newFolder':
            if (pathOfKind(entry, 'directory')) setCreating({ dir: entry.path, name: '' });
            break;
          case 'newFolderHere':
            if (root) setCreating({ dir: root, name: '' });
            break;
          case 'refresh':
            if (entry && entry.type === 'directory') void load(entry.path);
            else if (root) void load(root);
            break;
          case 'collapse':
            if (entry) collapse(entry.path);
            break;
          case 'closeRoot':
            closeRoot();
            break;
          case 'pick':
            void pick();
            break;
          default:
            break;
        }
      };

      function pathOfKind(entry, type) {
        return entry && entry.type === type ? entry.path : '';
      }

      const menuStyle = menu
        ? {
            left: Math.max(6, Math.min(menu.x, (window.innerWidth || 1200) - 236)),
            top: Math.max(6, Math.min(menu.y, (window.innerHeight || 800) - menuItems.length * 30 - 24)),
          }
        : undefined;

      /* ------------------------------------------------------------- rendering */

      const header = h(
        'div',
        { className: 'fd-head' },
        h(
          'div',
          { className: 'fd-head-main', title: root || tr('empty.title') },
          h(FolderIcon, { size: 15, className: 'fd-head-icon', open: Boolean(root) }),
          h('span', { className: 'fd-head-path' }, root || tr('tab.title')),
        ),
        h(
          'button',
          {
            type: 'button',
            className: 'fd-tool',
            title: tr('action.openInExplorer'),
            'aria-label': tr('action.openInExplorer'),
            disabled: !root,
            onClick: () => {
              if (root) void rpc('reveal', { path: root, revealInParent: false });
            },
          },
          h(OpenInIcon, {}),
        ),
        h(
          'button',
          {
            type: 'button',
            className: 'fd-tool',
            title: tr('action.refresh'),
            'aria-label': tr('action.refresh'),
            onClick: () => {
              if (root) {
                setLevels({});
                void load(root);
              }
            },
          },
          h(RefreshIcon, {}),
        ),
      );

      let body;
      if (!root) {
        body = h(
          'div',
          { className: 'fd-empty' },
          h(FolderIcon, { size: 34, className: 'fd-empty-icon' }),
          h('p', { className: 'fd-empty-title' }, tr('empty.title')),
          h('p', { className: 'fd-empty-body' }, tr('empty.body')),
          h(
            'div',
            { className: 'fd-empty-actions' },
            h('button', { type: 'button', className: 'fd-btn fd-btn-primary', onClick: () => void pick() }, tr('action.pick')),
            h('button', { type: 'button', className: 'fd-btn', onClick: () => void useSessionRoot() }, tr('action.useSession')),
            h('button', { type: 'button', className: 'fd-btn', onClick: () => setAskPath(true) }, tr('action.enterPath')),
          ),
          recent.length > 0
            ? h(
                'div',
                { className: 'fd-recent' },
                h('div', { className: 'fd-recent-title' }, tr('recent.title')),
                recent.map((path) =>
                  h(
                    'button',
                    {
                      key: path,
                      type: 'button',
                      className: 'fd-recent-row',
                      title: path,
                      onClick: () => void openRoot(path),
                    },
                    baseName(path),
                    h('span', { className: 'fd-recent-path' }, path),
                  ),
                ),
              )
            : null,
        );
      } else {
        body = h(
          'div',
          {
            className: 'fd-body',
            onContextMenu: (event) => onRowContextMenu(event, null),
            onClick: () => setSelected(new Set()),
          },
          rows.map((row) => {
            if (row.kind === 'note') {
              return h(
                'div',
                { key: row.key, className: row.error ? 'fd-note fd-note-error' : 'fd-note', style: { paddingLeft: 10 + row.depth * 14 } },
                row.text,
              );
            }
            if (row.kind === 'create') {
              return h(
                'div',
                { key: row.key, className: 'fd-create', style: { paddingLeft: 10 + row.depth * 14 } },
                h('input', {
                  ref: createInputRef,
                  className: 'fd-create-input',
                  value: creating ? creating.name : '',
                  placeholder: tr('create.placeholder'),
                  onChange: (event) => setCreating({ dir: creating.dir, name: event.target.value }),
                  onKeyDown: (event) => {
                    if (event.key === 'Enter') void submitCreate();
                    else if (event.key === 'Escape') setCreating(null);
                  },
                }),
                h('button', { type: 'button', className: 'fd-btn fd-btn-small', onClick: () => void submitCreate() }, tr('create.confirm')),
                h('button', { type: 'button', className: 'fd-btn fd-btn-small', onClick: () => setCreating(null) }, tr('action.cancel')),
              );
            }
            const entry = row.entry;
            const isSelected = selected.has(entry.path);
            const isOpen = entry.type === 'directory' && expanded.has(entry.path);
            return h(
              React.Fragment,
              { key: row.key },
              h(
                'button',
                {
                  type: 'button',
                  className: isSelected ? 'fd-row is-selected' : 'fd-row',
                  style: { paddingLeft: 6 + row.depth * 14 },
                  title: entry.path,
                  onClick: (event) => {
                    event.stopPropagation();
                    onRowClick(event, row);
                  },
                  onContextMenu: (event) => onRowContextMenu(event, row),
                  onDoubleClick: () => {
                    if (entry.type === 'directory') toggleFolder(entry);
                    else void addPaths([entry.path]);
                  },
                },
                h(
                  'span',
                  { className: entry.type === 'directory' ? 'fd-row-chevron' : 'fd-row-chevron is-blank' },
                  entry.type === 'directory' ? h(ChevronIcon, { open: isOpen }) : null,
                ),
                entry.type === 'directory'
                  ? h(FolderIcon, { size: 14, className: 'fd-row-icon', open: isOpen })
                  : h(DocIcon, { size: 14, className: 'fd-row-icon' }),
                h('span', { className: 'fd-row-name' }, entry.name),
                entry.type === 'file' ? h('span', { className: 'fd-row-size' }, formatSize(entry.size)) : null,
              ),
            );
          }),
        );
      }

      const foot = pasting
        ? h('div', { className: 'fd-foot fd-foot-busy' }, tr('status.pasting'))
        : busy
        ? h('div', { className: 'fd-foot fd-foot-busy' }, tr('status.adding', { done: busy.done, total: busy.total }))
        : selected.size > 0
          ? h(
              'div',
              { className: 'fd-foot' },
              h('span', { className: 'fd-foot-count' }, tr('selection.count', { n: selected.size })),
              h('span', { className: 'fd-foot-spacer' }),
              h('button', { type: 'button', className: 'fd-btn fd-btn-small', onClick: () => setSelected(new Set()) }, tr('action.clear')),
              h('button', { type: 'button', className: 'fd-btn fd-btn-primary fd-btn-small', onClick: () => void addPaths([...selected]) }, tr('action.add')),
            )
          : h('div', { className: 'fd-foot fd-foot-hint' }, tr('hint.rightClick'));

      return h(
        'div',
        { className: 'fd-root' },
        header,
        body,
        askPath
          ? h(
              'div',
              { className: 'fd-pathbar' },
              h('input', {
                className: 'fd-create-input',
                value: pathDraft,
                placeholder: tr('path.placeholder'),
                autoFocus: true,
                onChange: (event) => setPathDraft(event.target.value),
                onKeyDown: (event) => {
                  if (event.key === 'Enter') {
                    void openRoot(pathDraft).then((ok) => {
                      if (ok) {
                        setAskPath(false);
                        setPathDraft('');
                      }
                    });
                  } else if (event.key === 'Escape') {
                    setAskPath(false);
                  }
                },
              }),
              h(
                'button',
                {
                  type: 'button',
                  className: 'fd-btn fd-btn-small',
                  onClick: () => {
                    void openRoot(pathDraft).then((ok) => {
                      if (ok) {
                        setAskPath(false);
                        setPathDraft('');
                      }
                    });
                  },
                },
                tr('action.enterPath'),
              ),
              h('button', { type: 'button', className: 'fd-btn fd-btn-small', onClick: () => setAskPath(false) }, tr('action.cancel')),
            )
          : null,
        notice ? h('div', { className: `fd-notice fd-notice-${notice.kind}` }, notice.text) : null,
        foot,
        menu
          ? h(
              'div',
              { className: 'fd-menu', ref: menuRef, style: menuStyle, role: 'menu' },
              menuItems.map((item, index) =>
                item.separator
                  ? h('div', { key: `sep-${index}`, className: 'fd-menu-sep' })
                  : h(
                      'button',
                      {
                        key: item.id,
                        type: 'button',
                        role: 'menuitem',
                        disabled: Boolean(item.disabled),
                        className: item.primary ? 'fd-menu-item is-primary' : 'fd-menu-item',
                        onClick: () => runMenu(item.id),
                      },
                      item.label,
                    ),
              ),
            )
          : null,
      );
    }

    /* -------------------------------------------------------------- entry point */

    function HeaderButton() {
      const openPanel = (attempt) => {
        const sidebarRight = pluginCtx ? pluginCtx.get('sidebarRight') : undefined;
        if (!sidebarRight || typeof sidebarRight.openTab !== 'function') return;
        try {
          sidebarRight.openTab(KIND);
        } catch (error) {
          if (attempt >= 2) {
            console.error('[folder-dock] open failed', error);
            return;
          }
          // A collapsed right column may not have minted this Session's surface
          // yet; expanding it once lets a retry land on a live surface.
          try {
            pluginCtx.get('layout')?.openRightbar?.(true, false);
          } catch {
            /* the frame may refuse to expand on a narrow viewport */
          }
          window.setTimeout(() => openPanel(attempt + 1), 160 + attempt * 240);
        }
      };
      return h(
        'button',
        {
          type: 'button',
          className: 'fd-entry',
          title: T('entry.tooltip'),
          'aria-label': T('entry.title'),
          onClick: () => openPanel(0),
        },
        h(FolderIcon, { size: 16 }),
      );
    }

    /**
     * The guide card's artwork: a filled, colored folder rather than the
     * monochrome outline the in-app chrome uses. Artwork may carry its own
     * colors; the host chrome icons stay token-colored.
     */
    /**
     * The tab chip's artwork: a small colored folder, drawn without the badge so
     * it stays legible at chip size.
     */
    function TabArtwork({ size = 15, className }) {
      const edge = typeof size === 'number' ? size : 15;
      return h(
        'svg',
        { viewBox: '0 0 64 64', width: edge, height: edge, className, 'aria-hidden': true },
        h(
          'defs',
          null,
          h(
            'linearGradient',
            { id: 'fd-tab-folder', x1: '0', y1: '0', x2: '0', y2: '1' },
            h('stop', { offset: '0', 'stop-color': '#63a4ff' }),
            h('stop', { offset: '1', 'stop-color': '#2c6ad0' }),
          ),
        ),
        h('path', { d: 'M5 16.5A5.5 5.5 0 0 1 10.5 11h12.8L28 16.4h25.5A5.5 5.5 0 0 1 59 21.9V25H5z', fill: '#2a63c4' }),
        h('path', { d: 'M5 24.5h54v23A5.5 5.5 0 0 1 53.5 53h-43A5.5 5.5 0 0 1 5 47.5z', fill: 'url(#fd-tab-folder)' }),
        h('path', { d: 'M5 24.5h54v3H5z', fill: '#ffffff', 'fill-opacity': '0.22' }),
      );
    }

    /**
     * What the tab chip and a floating panel's header show: the colored folder
     * followed by the tab's name.
     */
    function TabTitle() {
      return h(React.Fragment, null, h(TabArtwork, { size: 15, className: 'fd-title-icon' }), T('tab.title'));
    }

    function GuideArtwork({ size = 20, className }) {
      const edge = typeof size === 'number' ? size : 20;
      return h(
        'svg',
        {
          viewBox: '0 0 64 64',
          width: edge,
          height: edge,
          className,
          'aria-hidden': true,
          style: { display: 'block' },
        },
        h(
          'defs',
          null,
          h(
            'linearGradient',
            { id: 'fd-guide-folder', x1: '0', y1: '0', x2: '0', y2: '1' },
            h('stop', { offset: '0', 'stop-color': '#63a4ff' }),
            h('stop', { offset: '1', 'stop-color': '#2c6ad0' }),
          ),
        ),
        h('path', {
          d: 'M6 17.5A6.5 6.5 0 0 1 12.5 11h12.2l5.1 5.4h21.7A6.5 6.5 0 0 1 58 22.9v6.3H6z',
          fill: '#2a63c4',
        }),
        h('path', {
          d: 'M6 25.6h52v20.9A6.5 6.5 0 0 1 51.5 53h-39A6.5 6.5 0 0 1 6 46.5z',
          fill: 'url(#fd-guide-folder)',
        }),
        h('path', {
          d: 'M6 25.6h52v3.2H6z',
          fill: '#ffffff',
          'fill-opacity': '0.22',
        }),
        h('circle', { cx: '46.5', cy: '45.5', r: '11.5', fill: '#12a594' }),
        h('path', {
          d: 'M46.5 39.6v11.8M40.6 45.5h11.8',
          stroke: '#ffffff',
          'stroke-width': '3.4',
          'stroke-linecap': 'round',
        }),
      );
    }

    /* ------------------------------------------------------------------- styles */

    const CSS = `
.fd-root{height:100%;min-height:0;display:flex;flex-direction:column;color:var(--dsw-alias-label-primary);font-size:var(--dsh-content-font-size-secondary,13px);line-height:1.5}
.fd-head{flex:none;min-height:38px;display:flex;align-items:center;gap:2px;padding:4px 6px 4px 10px;border-bottom:.5px solid var(--dsw-alias-border-l3);box-sizing:border-box}
.fd-head-main{flex:1;min-width:0;display:flex;align-items:center;gap:6px}
.fd-head-icon{flex:none;color:var(--dsw-alias-label-tertiary)}
.fd-head-path{min-width:0;font-size:11.5px;line-height:1.4;color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;user-select:text}
.fd-tool{width:28px;height:28px;flex:none;display:inline-flex;align-items:center;justify-content:center;padding:6px;border:0;border-radius:var(--dsw-radius-sm);background:0 0;color:var(--dsw-alias-label-secondary);cursor:pointer;line-height:1}
.fd-tool:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}
.fd-tool:disabled{opacity:.4;cursor:default;background:0 0;color:var(--dsw-alias-label-tertiary)}
.fd-title-icon{flex:none;display:block;margin-right:4px}
.fd-body{flex:1;min-height:0;overflow:auto;padding:6px 4px 10px;scrollbar-gutter:stable}
.fd-row{width:100%;min-width:0;display:flex;align-items:center;gap:5px;padding:4px 8px 4px 6px;border:0;border-radius:var(--dsw-radius-sm);background:0 0;color:inherit;font:inherit;text-align:left;cursor:pointer}
.fd-row:hover{background:var(--dsw-alias-interactive-bg-hover)}
.fd-row.is-selected{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 15%,transparent)}
.fd-row.is-selected:hover{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 21%,transparent)}
.fd-row-chevron{flex:none;width:12px;height:12px;display:inline-flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-tertiary)}
.fd-row-chevron.is-blank{visibility:hidden}
.fd-row-icon{flex:none;color:var(--dsw-alias-label-tertiary)}
.fd-row-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fd-row-tag{flex:none;margin-left:auto;font-size:10px;color:var(--dsw-alias-label-tertiary);opacity:.7}
.fd-row-size{flex:none;margin-left:auto;font-size:10.5px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}
.fd-note{padding:4px 8px;color:var(--dsw-alias-label-tertiary);font-size:12px}
.fd-note-error{color:var(--dsw-alias-state-error-primary)}
.fd-create{display:flex;align-items:center;gap:4px;padding:3px 8px 3px 0}
.fd-create-input{flex:1;min-width:0;height:26px;padding:0 8px;border-radius:var(--dsw-radius-sm);border:.5px solid var(--dsw-alias-border-l2,var(--dsw-alias-border-l3));background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;outline:none}
.fd-create-input:focus{border-color:var(--dsw-alias-brand-primary)}
.fd-foot{flex:none;display:flex;align-items:center;gap:6px;padding:6px 8px;border-top:.5px solid var(--dsw-alias-border-l3);min-height:38px;box-sizing:border-box;font-size:12px}
.fd-foot-hint,.fd-foot-busy{color:var(--dsw-alias-label-tertiary)}
.fd-foot-count{color:var(--dsw-alias-label-secondary)}
.fd-foot-spacer{flex:1}
.fd-btn{height:26px;padding:0 10px;display:inline-flex;align-items:center;justify-content:center;border-radius:var(--dsw-radius-sm);border:.5px solid var(--dsw-alias-border-l2,var(--dsw-alias-border-l3));background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;cursor:pointer;white-space:nowrap}
.fd-btn:hover{background:var(--dsw-alias-interactive-bg-hover)}
.fd-btn-small{height:24px;padding:0 8px;font-size:11.5px}
.fd-btn-primary{background:var(--dsw-alias-brand-primary);border-color:transparent;color:#fff}
.fd-btn-primary:hover{filter:brightness(1.07);background:var(--dsw-alias-brand-primary)}
.fd-empty{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:24px 18px;text-align:center;overflow:auto}
.fd-empty-icon{color:var(--dsw-alias-label-tertiary);opacity:.75}
.fd-empty-title{margin:2px 0 0;font-size:13px;font-weight:600}
.fd-empty-body{margin:0;font-size:12px;color:var(--dsw-alias-label-secondary);max-width:260px;line-height:1.6}
.fd-empty-actions{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:4px}
.fd-recent{margin-top:14px;width:100%;text-align:left;border-top:.5px solid var(--dsw-alias-border-l3);padding-top:8px}
.fd-recent-title{font-size:11px;color:var(--dsw-alias-label-tertiary);padding:0 2px 4px}
.fd-recent-row{display:flex;flex-direction:column;gap:1px;width:100%;min-width:0;padding:5px 8px;border:0;border-radius:var(--dsw-radius-sm);background:0 0;color:inherit;font:inherit;text-align:left;cursor:pointer}
.fd-recent-row:hover{background:var(--dsw-alias-interactive-bg-hover)}
.fd-recent-path{font-size:10.5px;color:var(--dsw-alias-label-tertiary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fd-pathbar{flex:none;display:flex;align-items:center;gap:4px;padding:6px 8px;border-top:.5px solid var(--dsw-alias-border-l3)}
.fd-notice{flex:none;padding:6px 10px;font-size:11.5px;line-height:1.5;border-top:.5px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-layer-1,transparent);color:var(--dsw-alias-label-secondary);word-break:break-word}
.fd-notice-error{color:var(--dsw-alias-state-error-primary)}
.fd-notice-ok{color:var(--dsw-alias-state-success-primary,var(--dsw-alias-label-primary))}
.fd-menu{position:fixed;z-index:9999;min-width:210px;max-width:260px;padding:4px;border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-2);border:.5px solid var(--dsw-alias-border-l2,var(--dsw-alias-border-l3));box-shadow:0 10px 28px rgba(0,0,0,.22);display:flex;flex-direction:column;gap:1px}
.fd-menu-item{display:flex;align-items:center;width:100%;padding:6px 10px;border:0;border-radius:var(--dsw-radius-sm);background:0 0;color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px;text-align:left;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fd-menu-item:hover{background:var(--dsw-alias-interactive-bg-hover)}
.fd-menu-item.is-primary{font-weight:600;color:var(--dsw-alias-brand-primary)}
.fd-menu-item:disabled{opacity:.45;cursor:default;background:0 0}
.fd-menu-sep{height:.5px;margin:4px 6px;background:var(--dsw-alias-border-l3)}
.fd-entry{width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:var(--dsw-radius-sm);background:0 0;color:var(--dsw-alias-label-secondary);cursor:pointer;padding:0}
.fd-entry:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}
`;

    /* --------------------------------------------------------------------- apply */

    function injectStyles() {
      const style = document.createElement('style');
      style.setAttribute('data-dsh-plugin', ID);
      style.textContent = CSS;
      document.head.appendChild(style);
      return () => style.remove();
    }

    function apply(ctx) {
      pluginCtx = ctx;
      T = ctx.locale.bind(NS);

      ctx.effect(() => ctx.locale.register(NS, 'zh', ZH), 'folder-dock: zh copy');
      ctx.effect(() => ctx.locale.register(NS, 'en', EN), 'folder-dock: en copy');
      ctx.effect(() => injectStyles(), 'folder-dock: styles');

      ctx.effect(
        () =>
          ctx.slots.inject('conversation.session.header.utilities', () =>
            ctx.slots.register(
              {
                name: 'conversation.session.header.utilities',
                id: 'folder-dock',
                order: 40,
              },
              HeaderButton,
            ),
          ),
        'folder-dock: header button',
      );

      ctx.inject(['sidebarRightTabs', 'sidebarRight'], (scoped) => {
        scoped.effect(
          () =>
            scoped.sidebarRightTabs.register({
              id: ID,
              kind: KIND,
              multiple: false,
              keepMounted: true,
              priority: 'extension',
              title: () => T('tab.title'),
              guide: [
                {
                  id: 'folder-dock',
                  order: 25,
                  title: () => T('guide.title'),
                  description: () => T('guide.description'),
                  icon: GuideArtwork,
                },
              ],
            }),
          'folder-dock: tab type',
        );

        scoped.effect(
          () =>
            scoped.slots.inject('sidebar.right.pane.tab', () =>
              scoped.slots.register(
                {
                  name: 'sidebar.right.pane.tab',
                  key: ID,
                  locale: NS,
                },
                FolderDock,
              ),
            ),
          'folder-dock: tab body',
        );

        scoped.effect(
          () =>
            scoped.slots.inject('sidebar.right.pane.tab.title', () =>
              scoped.slots.register(
                {
                  name: 'sidebar.right.pane.tab.title',
                  key: ID,
                },
                TabTitle,
              ),
            ),
          'folder-dock: tab title',
        );
      });
    }

    return { inject: ['slots', 'locale'], apply };
    })(React);

    const gitPlugin = (function (React) {

    const { useCallback, useEffect, useMemo, useRef, useState } = React;
    const h = React.createElement;

    const ROUTE = '/sidebar-plus/git/rpc';

    /* ------------------------------------------------------------- helpers */

    function cx(...parts) {
      return parts.filter(Boolean).join(' ');
    }

    function makeRpc(sessionId) {
      return async function rpc(method, args = {}) {
        const res = await fetch(ROUTE, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-dsh-git': '1' },
          body: JSON.stringify({ sessionId, method, args }),
        });
        if (!res.ok) throw new Error(`请求失败（HTTP ${res.status}）`);
        const data = await res.json();
        if (!data.ok) {
          const error = new Error(data.error?.message || '操作失败');
          if (data.error?.hint) error.hint = data.error.hint;
          throw error;
        }
        return data.value;
      };
    }

    function relativeTime(ms) {
      const delta = Date.now() - ms;
      if (delta < 15_000) return '刚刚';
      if (delta < 60_000) return `${Math.round(delta / 1000)} 秒前`;
      if (delta < 3_600_000) return `${Math.round(delta / 60_000)} 分钟前`;
      return `${Math.round(delta / 3_600_000)} 小时前`;
    }

    function shortPath(path) {
      const parts = String(path).split(/[\\/]/);
      return parts.length > 2 ? `…/${parts.slice(-2).join('/')}` : path;
    }

    function statusLabel(file) {
      if (file.conflict) return '!';
      if (file.untracked) return 'U';
      if (file.staged && file.unstaged) return 'M';
      if (file.staged) return file.x === 'R' ? 'R' : file.x === 'A' ? 'A' : file.x === 'D' ? 'D' : 'M';
      return file.y === 'D' ? 'D' : 'M';
    }

    function statusTone(file) {
      const label = statusLabel(file);
      if (label === '!' || label === 'D') return 'danger';
      if (label === 'A' || label === 'U') return 'success';
      if (label === 'R') return 'info';
      return 'warn';
    }

    function fileKind(path) {
      const name = String(path).split(/[\\/]/).pop() || '';
      const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
      if (ext === 'ts' || ext === 'tsx') return 'ts';
      if (ext === 'js' || ext === 'jsx' || ext === 'mjs' || ext === 'cjs') return 'js';
      if (ext === 'json') return 'json';
      if (ext === 'md' || ext === 'mdx') return 'md';
      if (ext === 'css' || ext === 'scss' || ext === 'less') return 'css';
      if (ext === 'html' || ext === 'htm' || ext === 'vue' || ext === 'svelte') return 'html';
      if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp'].includes(ext)) return 'img';
      if (['yml', 'yaml', 'toml', 'ini', 'env', 'conf'].includes(ext)) return 'cfg';
      if (name.endsWith('lock') || ext === 'lock') return 'lock';
      return 'file';
    }

    const FILE_KIND_LABEL = { ts: 'TS', js: 'JS', json: '{}', md: 'MD', css: 'CSS', html: '<>', img: 'IMG', cfg: 'CFG', lock: 'LK', file: '·' };

    function FileGlyph(props) {
      const kind = fileKind(props.path);
      return h('span', { className: `gw-ftype gw-ftype-${kind}`, 'aria-hidden': true }, FILE_KIND_LABEL[kind] || '·');
    }

    function initials(name) {
      const text = String(name || '?').trim();
      if (!text) return '?';
      return /[a-zA-Z]/.test(text[0]) ? text[0].toUpperCase() : text.slice(0, 1);
    }

    function hashTone(seed) {
      const tones = ['a', 'b', 'c', 'd', 'e'];
      let sum = 0;
      for (const ch of String(seed)) sum += ch.charCodeAt(0);
      return tones[sum % tones.length];
    }

    function refKind(ref) {
      if (ref.startsWith('HEAD')) return 'head';
      if (ref.startsWith('tag:')) return 'tag';
      if (ref.includes('/')) return 'remote';
      return 'branch';
    }

    function copyText(text) {
      try {
        navigator.clipboard?.writeText(text);
      } catch {
        /* clipboard unavailable */
      }
    }

    /* ---------------------------------------------------------------- icons */

    function Svg(props) {
      return h('svg', {
        width: props.size || 14,
        height: props.size || 14,
        viewBox: '0 0 16 16',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: props.stroke || 1.5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
        className: props.className,
      }, props.children);
    }

    const Icon = {
      branch: (p) => h(Svg, p,
        h('circle', { cx: 4, cy: 3, r: 1.6 }),
        h('circle', { cx: 4, cy: 13, r: 1.6 }),
        h('circle', { cx: 12, cy: 6, r: 1.6 }),
        h('path', { d: 'M4 4.6v6.8' }),
        h('path', { d: 'M4 9.5c0-2.2 2.4-3.5 6.4-3.5' })),
      up: (p) => h(Svg, p, h('path', { d: 'M8 13V3' }), h('path', { d: 'M3.5 7.5 8 3l4.5 4.5' })),
      down: (p) => h(Svg, p, h('path', { d: 'M8 3v10' }), h('path', { d: 'M3.5 8.5 8 13l4.5-4.5' })),
      refresh: (p) => h(Svg, p,
        h('path', { d: 'M13 8a5 5 0 1 1-1.6-3.7' }),
        h('path', { d: 'M13 3v3.2h-3.2' })),
      sparkle: (p) => h(Svg, p,
        h('path', { d: 'M8 2.2 9.3 6 13 7.3 9.3 8.6 8 12.4 6.7 8.6 3 7.3 6.7 6Z' }),
        h('path', { d: 'M12.6 11.2l.5 1.4 1.4.5-1.4.5-.5 1.4-.5-1.4-1.4-.5 1.4-.5Z' })),
      check: (p) => h(Svg, p, h('path', { d: 'm3 8.5 3.2 3.2L13 5' })),
      plus: (p) => h(Svg, p, h('path', { d: 'M8 3v10' }), h('path', { d: 'M3 8h10' })),
      minus: (p) => h(Svg, p, h('path', { d: 'M3 8h10' })),
      dots: (p) => h(Svg, p,
        h('circle', { cx: 3, cy: 8, r: 1 }),
        h('circle', { cx: 8, cy: 8, r: 1 }),
        h('circle', { cx: 13, cy: 8, r: 1 })),
      close: (p) => h(Svg, p, h('path', { d: 'm4 4 8 8' }), h('path', { d: 'm12 4-8 8' })),
      warn: (p) => h(Svg, p,
        h('path', { d: 'M8 2.6 14 13H2Z' }),
        h('path', { d: 'M8 6.4v3.4' }),
        h('path', { d: 'M8 11.6v.1' })),
      file: (p) => h(Svg, p,
        h('path', { d: 'M4 2.5h5L13 6v7.5H4Z' }),
        h('path', { d: 'M9 2.5V6h4' })),
      eye: (p) => h(Svg, p,
        h('path', { d: 'M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z' }),
        h('circle', { cx: 8, cy: 8, r: 2 })),
      undo: (p) => h(Svg, p,
        h('path', { d: 'M4 6.5H10a3.5 3.5 0 0 1 0 7H7' }),
        h('path', { d: 'M6.5 4 4 6.5 6.5 9' })),
      copy: (p) => h(Svg, p,
        h('rect', { x: 5.5, y: 5.5, width: 8, height: 8, rx: 1.5 }),
        h('path', { d: 'M10.5 5.5V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5' })),
      chevron: (p) => h(Svg, p, h('path', { d: 'M10 3 5 8l5 5' })),
    };

    /* ------------------------------------------------------------ primitives */

    function Btn(props) {
      const { variant = 'ghost', size = 'md', icon, children, busy, ...rest } = props;
      return h('button', {
        ...rest,
        type: 'button',
        className: cx('gw-btn', `gw-btn-${variant}`, `gw-btn-${size}`, rest.className),
        disabled: rest.disabled || busy,
      }, busy ? h('span', { className: 'gw-spin' }) : icon ? h('span', { className: 'gw-btn-icon' }, icon) : null,
        children ? h('span', null, children) : null);
    }

    function Chip(props) {
      return h('span', { className: cx('gw-chip-tag', props.tone && `gw-tone-${props.tone}`, props.className) }, props.children);
    }

    function Modal(props) {
      if (!props.open) return null;
      return h('div', { className: 'gw-modal-backdrop', onMouseDown: (e) => { if (e.target === e.currentTarget) props.onCancel(); } },
        h('div', { className: 'gw-modal', role: 'dialog', 'aria-modal': 'true' },
          h('div', { className: 'gw-modal-title' }, props.title),
          h('div', { className: 'gw-modal-body' }, props.body),
          h('div', { className: 'gw-modal-actions' },
            props.extraLabel
              ? h(Btn, { onClick: props.onExtra, disabled: props.busy }, props.extraLabel)
              : null,
            h(Btn, { onClick: props.onCancel, disabled: props.busy }, '取消'),
            h(Btn, { variant: props.danger ? 'danger' : 'primary', onClick: props.onConfirm, busy: props.busy },
              props.confirmLabel || '确认'))));
    }

    /* -------------------------------------------------------------- the view */

    function GitView(props) {
      const sessionId = props.sessionId;
      const compact = Boolean(props.compact);
      const rpc = useMemo(() => makeRpc(sessionId), [sessionId]);

      const [snap, setSnap] = useState(null);
      const [error, setError] = useState(null);
      const [loading, setLoading] = useState(true);
      const [busy, setBusy] = useState('');
      const [tab, setTab] = useState(props.compact ? 'changes' : 'history');
      const [selected, setSelected] = useState(null);
      const [diff, setDiff] = useState(null);
      const [diffLoading, setDiffLoading] = useState(false);
      const [message, setMessage] = useState('');
      const [amend, setAmend] = useState(false);
      const [pushAfter, setPushAfter] = useState(false);
      const [ai, setAi] = useState(null);
      const [aiBusy, setAiBusy] = useState(false);
      const [toast, setToast] = useState(null);
      const [confirm, setConfirm] = useState(null);
      const [menuOpen, setMenuOpen] = useState(false);
      const [commitSel, setCommitSel] = useState(null);
      const [frameHeight, setFrameHeight] = useState(0);
      const mounted = useRef(true);
      const rootRef = useRef(null);
      const messageRef = useRef(message);
      messageRef.current = message;

      /* The Conversation View is rendered inside a host scroll area whose own height
       * is not guaranteed, so measure the available box instead of trusting 100%. */
      useEffect(() => {
        const measure = () => {
          const el = rootRef.current;
          const parent = el?.parentElement;
          const limit = window.innerHeight - 120;
          let next = parent?.clientHeight || 0;
          if (!next || next > limit) next = window.innerHeight - 190;
          setFrameHeight(Math.max(360, Math.min(next, window.innerHeight - 120)));
        };
        measure();
        const observer = typeof ResizeObserver !== 'undefined' && rootRef.current?.parentElement
          ? new ResizeObserver(measure)
          : null;
        observer?.observe(rootRef.current.parentElement);
        window.addEventListener('resize', measure);
        return () => {
          observer?.disconnect();
          window.removeEventListener('resize', measure);
        };
      }, [sessionId]);

      useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
      }, []);

      const notify = useCallback((text, tone = 'info') => {
        setToast({ text, tone, id: Date.now() });
        window.setTimeout(() => {
          setToast((current) => (current && Date.now() - current.id > 4000 ? null : current));
        }, 4200);
      }, []);

      const load = useCallback(async (quiet) => {
        if (!quiet) setLoading(true);
        try {
          const next = await rpc('snapshot');
          if (!mounted.current) return;
          setSnap(next);
          setError(null);
        } catch (err) {
          if (!mounted.current) return;
          setError(err.message);
        } finally {
          if (mounted.current) setLoading(false);
        }
      }, [rpc]);

      useEffect(() => {
        load(false);
        const timer = window.setInterval(() => load(true), 10_000);
        const onFocus = () => load(true);
        window.addEventListener('focus', onFocus);
        return () => {
          window.clearInterval(timer);
          window.removeEventListener('focus', onFocus);
        };
      }, [load]);

      const refresh = useCallback(() => load(true), [load]);

      const run = useCallback(async (label, method, args) => {
        setBusy(label);
        try {
          const value = await rpc(method, args);
          await refresh();
          return value;
        } catch (err) {
          notify(err.hint ? `${err.message}（${err.hint}）` : err.message, 'error');
          throw err;
        } finally {
          if (mounted.current) setBusy('');
        }
      }, [rpc, refresh, notify]);

      const openDiff = useCallback(async (file) => {
        setSelected(file);
        setTab('diff');
        setDiffLoading(true);
        setDiff(null);
        try {
          const value = await rpc('diff', {
            path: file.path,
            staged: Boolean(file.staged && !file.unstaged),
            untracked: Boolean(file.untracked),
            conflict: Boolean(file.conflict),
          });
          if (mounted.current) setDiff(value);
        } catch (err) {
          if (mounted.current) setDiff({ text: err.message, error: true });
        } finally {
          if (mounted.current) setDiffLoading(false);
        }
      }, [rpc]);

      const openCommit = useCallback(async (commit) => {
        setCommitSel({ sha: commit.short, loading: true });
        try {
          const detail = await rpc('commitDetail', { sha: commit.short, dir: snap?.cwd });
          if (mounted.current) setCommitSel({ sha: commit.short, detail });
        } catch (err) {
          if (mounted.current) setCommitSel(null);
          notify(err.message, 'error');
        }
      }, [rpc, snap?.cwd, notify]);

      const openCommitFile = useCallback(async (file) => {
        const sha = commitSel?.sha;
        if (!sha) return;
        setCommitSel((current) => (current ? { ...current, diffFile: file, diff: null, diffLoading: true } : current));
        try {
          const value = await rpc('commitDiff', { sha, path: file.path, dir: snap?.cwd });
          if (mounted.current) {
            setCommitSel((current) => (current && current.sha === sha ? { ...current, diff: value, diffLoading: false } : current));
          }
        } catch (err) {
          if (mounted.current) {
            setCommitSel((current) => (current && current.sha === sha ? { ...current, diffLoading: false } : current));
          }
          notify(err.message, 'error');
        }
      }, [rpc, commitSel?.sha, snap?.cwd, notify]);

      const ask = useCallback((spec) => {
        setConfirm({ step: 1, ...spec });
      }, []);

      const act = useCallback(async (label, method, args, okText) => {
        try {
          const value = await run(label, method, args);
          if (okText) notify(okText, 'success');
          return value;
        } catch {
          return null;
        }
      }, [run, notify]);

      if (!sessionId) {
        return h('div', { className: 'gw-root gw-center' }, h('div', { className: 'gw-empty' }, '等待会话…'));
      }

      const repo = snap?.isRepo ? snap.repo : null;
      const dirty = snap?.counts?.total ?? 0;

      const commitDisabled = !message.trim() || busy !== '' || !snap || snap.counts.staged === 0;

      const doCommit = async () => {
        if (!message.trim()) {
          notify('先写提交信息，或点「AI 生成」', 'error');
          return;
        }
        const value = await act('commit', 'commit', { message: message.trim(), amend, dir: snap.cwd }, '已提交');
        if (!value) return;
        setMessage('');
        setAi(null);
        if (pushAfter) {
          const pushed = await act('push', 'push', { dir: snap.cwd }, '已推送');
          if (!pushed) return;
        }
        refresh();
      };

      const doPull = async () => {
        const value = await act('pull', 'pull', { dir: snap?.cwd }, null);
        if (!value) return;
        if (value.ok) notify('已拉取（fast-forward）', 'success');
        else if (value.conflict) {
          notify('拉取遇到冲突，请先处理冲突文件', 'error');
          ask({
            title: '拉取未完成：检测到冲突',
            body: h('div', { className: 'gw-prose' },
              h('p', null, '当前分支与上游分叉，`git pull --ff-only` 拒绝自动合并。'),
              h('pre', { className: 'gw-error-pre' }, value.output.slice(0, 1200)),
              h('p', null, '建议：先提交或暂存本地改动，再决定 rebase 还是手动合并。')),
            confirmLabel: '知道了',
            danger: false,
            onConfirm: () => setConfirm(null),
          });
        } else {
          notify(value.output || '拉取失败', 'error');
        }
      };

      const doPush = async (force) => {
        const value = await act('push', 'push', { force, dir: snap?.cwd }, force ? '已强推' : '已推送');
        if (value) notify(value.output || '已推送', 'success');
      };

      const askForcePush = () => {
        ask({
          title: '强制推送（--force-with-lease）',
          body: h('div', { className: 'gw-prose' },
            h('p', null, '这会改写远端分支历史，其他人已拉取的提交可能丢失。'),
            h('p', { className: 'gw-muted' }, '只会覆盖远端仍是本地已知提交的情况（lease 保护）。')),
          danger: true,
          requireTwice: true,
          confirmLabel: '继续',
          onConfirm: () => doPush(true),
        });
      };

      const askDiscard = (file) => {
        ask({
          title: `丢弃改动：${shortPath(file.path)}`,
          body: h('div', { className: 'gw-prose' },
            h('p', null, file.untracked ? '该文件未跟踪，丢弃会直接删除文件。' : '未暂存的修改会被还原，无法通过 Git 恢复。'),
            h('p', { className: 'gw-muted' }, '已暂存的改动不受影响。')),
          danger: true,
          requireTwice: true,
          confirmLabel: '继续',
          onConfirm: () => act('discard', 'discard', {
            paths: [file.path],
            untracked: Boolean(file.untracked),
            dir: snap.cwd,
          }, '已丢弃'),
        });
      };

      const askSwitch = (branch) => {
        const dirty = snap.counts.total;
        const switchTo = async (stash) => {
          setConfirm(null);
          const value = await act('switch', 'switch', {
            name: branch.name,
            dir: snap.cwd,
            stash,
          }, stash ? `已暂存改动并切换到 ${branch.name}` : `已切换到 ${branch.name}`);
          if (value?.stashed) {
            notify(`改动已放入 stash，随时可以恢复`, 'info');
          }
        };
        ask({
          title: `切换到 ${branch.name}`,
          body: h('div', { className: 'gw-prose' },
            dirty
              ? h(React.Fragment, null,
                h('p', null, `当前工作区有 ${dirty} 个未提交改动。先暂存再切换最安全：改动会进入 stash，切换后可以再恢复。`),
                h('p', { className: 'gw-muted' }, '也可以选择「直接切换」——有冲突的改动会被 Git 拒绝，不会丢失。'))
              : h('p', null, '切换分支会更新工作区文件。'),
            branch.upstream ? h('p', { className: 'gw-muted' }, `上游：${branch.upstream}`) : null),
          confirmLabel: dirty ? '暂存并切换' : '切换',
          extraLabel: dirty ? '直接切换' : undefined,
          onExtra: dirty ? () => switchTo(false) : undefined,
          onConfirm: () => switchTo(dirty > 0),
        });
      };

      const aiGenerate = async () => {
        setAiBusy(true);
        setAi(null);
        try {
          const value = await rpc('aiMessage', { dir: snap?.cwd });
          setAi(value);
          setMessage(value.message);
          notify(`已生成提交信息（${value.model}）`, 'success');
        } catch (err) {
          notify(err.message, 'error');
        } finally {
          if (mounted.current) setAiBusy(false);
        }
      };

      const confirmNode = confirm ? h(Modal, {
        open: true,
        title: confirm.step === 1 ? confirm.title : '再次确认',
        body: confirm.step === 1 ? confirm.body : h('div', { className: 'gw-prose' },
          h('p', null, '这是不可撤销的操作。确认继续吗？'),
          h('p', { className: 'gw-muted' }, confirm.title)),
        danger: Boolean(confirm.danger),
        busy: Boolean(busy),
        extraLabel: confirm.step === 1 ? confirm.extraLabel : undefined,
        onExtra: confirm.step === 1 ? confirm.onExtra : undefined,
        confirmLabel: confirm.step === 1 ? (confirm.requireTwice ? '继续' : confirm.confirmLabel) : '再次确认',
        onCancel: () => setConfirm(null),
        onConfirm: async () => {
          if (confirm.requireTwice && confirm.step === 1) {
            setConfirm({ ...confirm, step: 2 });
            return;
          }
          const action = confirm.onConfirm;
          setConfirm(null);
          await action();
        },
      }) : null;

      if (compact) {
        const ctab = (id, label, count) => h('button', {
          type: 'button',
          className: cx('gw-tab', tab === id && 'is-active'),
          onClick: () => { setCommitSel(null); setTab(id); },
        }, label, count ? h('span', { className: 'gw-tab-count' }, count) : null);
        return h('div', {
          className: 'gw-root gw-compact',
          ref: rootRef,
          style: frameHeight ? { height: `${frameHeight}px` } : undefined,
        },
          h(Header, {
            snap, busy, loading, onRefresh: refresh,
            onFetch: () => act('fetch', 'fetch', { dir: snap?.cwd }, '已抓取'),
            onPull: doPull, onPush: () => doPush(false), onForcePush: askForcePush,
            menuOpen, setMenuOpen,
          }),
          !snap && loading ? h('div', { className: 'gw-center' }, h('div', { className: 'gw-empty' }, '读取仓库…')) : null,
          !snap && error ? h('div', { className: 'gw-center' }, h('div', { className: 'gw-empty gw-tone-danger' }, error)) : null,
          snap && !snap.isRepo ? h('div', { className: 'gw-center' }, h('div', { className: 'gw-empty' },
            h('div', { className: 'gw-empty-icon' }, h(Icon.branch, { size: 26 })),
            h('div', { className: 'gw-empty-title' }, '当前目录不是 Git 仓库'),
            h('div', { className: 'gw-empty-path' }, snap.cwd),
            h('div', { className: 'gw-empty-hint' }, '在会话目录里执行 git init，或把会话打开到已有仓库。'))) : null,
          snap?.isRepo ? h(React.Fragment, null,
            snap.operation || snap.branch.unborn || snap.branch.detached || snap.counts.conflict > 0
              ? h(Banner, { snap }) : null,
            h(SyncBar, { snap }),
            commitSel
              ? h(CommitDetail, {
                state: commitSel,
                onBack: () => setCommitSel(null),
                onOpenFile: openCommitFile,
              })
              : h(React.Fragment, null,
                h('div', { className: 'gw-tabs gw-tabs-compact' },
                  ctab('changes', '改动', snap.counts.total),
                  ctab('history', '历史', snap.commits.length),
                  ctab('diff', '差异', 0)),
                h('div', { className: 'gw-compact-body' },
                  tab === 'changes'
                    ? h('div', { className: 'gw-compact-scroll' },
                      h(Changes, {
                        snap, busy, tab, selected, onToggle: (file) => {
                          const method = file.staged ? 'unstage' : 'stage';
                          act(method, method, { paths: [file.path], dir: snap.cwd });
                        },
                        onStageAll: () => act('stageAll', 'stage', { paths: snap.files.map((f) => f.path), dir: snap.cwd }),
                        onOpen: openDiff, onDiscard: askDiscard,
                      }),
                      h(SideSections, {
                        snap, busy,
                        onSwitch: askSwitch,
                        onStashPush: () => act('stashPush', 'stashPush', { dir: snap.cwd }, '已暂存改动'),
                        onStashApply: (item, pop) => act('stashApply', 'stashApply', { index: item.index, pop, dir: snap.cwd }, pop ? '已弹出暂存' : '已应用暂存'),
                        onStashDrop: (item) => ask({
                          title: '删除这条 stash？',
                          body: h('div', { className: 'gw-prose' }, h('p', null, item.subject), h('p', { className: 'gw-muted' }, '删除后无法通过 Git 恢复。')),
                          danger: true,
                          requireTwice: true,
                          confirmLabel: '继续',
                          onConfirm: () => act('stashDrop', 'stashDrop', { index: item.index, dir: snap.cwd }, '已删除 stash'),
                        }),
                      }))
                    : tab === 'history'
                      ? h(History, { snap, onOpenCommit: openCommit, selectedSha: null })
                      : h(DiffPane, { diff, loading: diffLoading, file: selected })),
                h(Composer, {
                  snap, message, setMessage, amend, setAmend, pushAfter, setPushAfter,
                  ai, aiBusy, onAi: aiGenerate, onCommit: doCommit, disabled: commitDisabled, busy,
                })),
            h(StatusBar, { snap })) : null,
          toast ? h('div', { className: cx('gw-toast', `gw-tone-${toast.tone}`) }, toast.text) : null,
          confirmNode);
      }

      return h('div', {
        className: 'gw-root',
        ref: rootRef,
        style: frameHeight ? { height: `${frameHeight}px` } : undefined,
      },
        h(Header, {
          snap, busy, loading, onRefresh: refresh, onFetch: () => act('fetch', 'fetch', { dir: snap?.cwd }, '已抓取'),
          onPull: doPull, onPush: () => doPush(false), onForcePush: askForcePush,
          menuOpen, setMenuOpen, repo,
        }),

        !snap && loading ? h('div', { className: 'gw-center' }, h('div', { className: 'gw-empty' }, '读取仓库…')) : null,
        !snap && error ? h('div', { className: 'gw-center' }, h('div', { className: 'gw-empty gw-tone-danger' }, error)) : null,
        snap && !snap.isRepo ? h('div', { className: 'gw-center' }, h('div', { className: 'gw-empty' },
          h('div', { className: 'gw-empty-icon' }, h(Icon.branch, { size: 26 })),
          h('div', { className: 'gw-empty-title' }, '当前目录不是 Git 仓库'),
          h('div', { className: 'gw-empty-path' }, snap.cwd),
          h('div', { className: 'gw-empty-hint' }, '在会话目录里执行 git init，或把会话打开到已有仓库。'))) : null,

        snap?.isRepo ? h(React.Fragment, null,
          h(SyncBar, { snap, onPull: doPull, onPush: () => doPush(false) }),
          snap.operation || snap.branch.unborn || snap.branch.detached || snap.counts.conflict > 0
            ? h(Banner, { snap }) : null,
          h('div', { className: 'gw-body' },
            h('div', { className: 'gw-left' },
              h(Composer, {
                snap, message, setMessage, amend, setAmend, pushAfter, setPushAfter,
                ai, aiBusy, onAi: aiGenerate, onCommit: doCommit, disabled: commitDisabled, busy,
              }),
              h(Changes, {
                snap, busy, tab, selected, onToggle: (file) => {
                  const method = file.staged ? 'unstage' : 'stage';
                  act(method, method, { paths: [file.path], dir: snap.cwd });
                },
                onStageAll: () => act('stageAll', 'stage', { paths: snap.files.map((f) => f.path), dir: snap.cwd }),
                onOpen: openDiff, onDiscard: askDiscard,
              }),
              h(SideSections, {
                snap, busy,
                onSwitch: askSwitch,
                onStashPush: () => act('stashPush', 'stashPush', { dir: snap.cwd }, '已暂存改动'),
                onStashApply: (item, pop) => act('stashApply', 'stashApply', { index: item.index, pop, dir: snap.cwd }, pop ? '已弹出暂存' : '已应用暂存'),
                onStashDrop: (item) => ask({
                  title: '删除这条 stash？',
                  body: h('div', { className: 'gw-prose' }, h('p', null, item.subject), h('p', { className: 'gw-muted' }, '删除后无法通过 Git 恢复。')),
                  danger: true,
                  requireTwice: true,
                  confirmLabel: '继续',
                  onConfirm: () => act('stashDrop', 'stashDrop', { index: item.index, dir: snap.cwd }, '已删除 stash'),
                }),
              })),
            h('div', { className: 'gw-right' },
              commitSel
                ? h(CommitDetail, {
                  state: commitSel,
                  onBack: () => setCommitSel(null),
                  onOpenFile: openCommitFile,
                })
                : h(React.Fragment, null,
                  h('div', { className: 'gw-tabs' },
                    h('button', { type: 'button', className: cx('gw-tab', tab === 'history' && 'is-active'), onClick: () => setTab('history') }, '历史'),
                    h('button', { type: 'button', className: cx('gw-tab', tab === 'diff' && 'is-active'), onClick: () => setTab('diff') },
                      '差异', selected ? h('span', { className: 'gw-tab-sub' }, shortPath(selected.path)) : null)),
                  tab === 'history'
                    ? h(History, { snap, onOpenCommit: openCommit, selectedSha: null })
                    : h(DiffPane, { diff, loading: diffLoading, file: selected })))),
          h(StatusBar, { snap })) : null,

        toast ? h('div', { className: cx('gw-toast', `gw-tone-${toast.tone}`) }, toast.text) : null,
        confirmNode);
    }

    /* -------------------------------------------------------------- header */

    function Header(props) {
      const { snap, busy, loading, onRefresh, onFetch, onPull, onPush, onForcePush, menuOpen, setMenuOpen } = props;
      const repo = snap?.isRepo ? snap.repo : null;
      const ahead = snap?.branch?.ahead ?? 0;
      const hasUpstream = Boolean(snap?.branch?.upstream);
      return h('div', { className: 'gw-head' },
        h('div', { className: 'gw-head-main' },
          h('span', { className: 'gw-title' }, 'Git'),
          repo ? h(Chip, null, repo.name) : null,
          repo ? h('span', { className: 'gw-path', title: repo.root }, repo.root) : null,
          repo?.worktree ? h(Chip, { tone: 'warn' }, 'worktree') : null),
        h('div', { className: 'gw-head-actions' },
          h('div', { className: 'gw-actions', role: 'group', 'aria-label': '同步操作' },
            h('button', {
              type: 'button',
              className: 'gw-act',
              onClick: onFetch,
              disabled: !repo || busy === 'fetch',
              title: '抓取（fetch --prune --all）',
            }, busy === 'fetch' ? h('span', { className: 'gw-spin' }) : h(Icon.refresh, { size: 13 }), h('span', null, '抓取')),
            h('button', {
              type: 'button',
              className: 'gw-act',
              onClick: onPull,
              disabled: !repo || busy === 'pull',
              title: '拉取（ff-only）',
            }, busy === 'pull' ? h('span', { className: 'gw-spin' }) : h(Icon.down, { size: 13 }), h('span', null, '拉取'),
              snap?.branch?.behind ? h('span', { className: 'gw-act-count' }, snap.branch.behind) : null),
            h('button', {
              type: 'button',
              className: 'gw-act gw-act-primary',
              onClick: onPush,
              disabled: !repo || busy === 'push',
              title: hasUpstream ? '推送当前分支' : '发布分支并设置上游',
            }, busy === 'push' ? h('span', { className: 'gw-spin' }) : h(Icon.up, { size: 13 }), h('span', null, '推送'),
              ahead ? h('span', { className: 'gw-act-count is-on-primary' }, ahead) : null)),
          h('div', { className: 'gw-menu-wrap' },
            h(Btn, { size: 'icon', onClick: () => setMenuOpen(!menuOpen), disabled: !repo, title: '更多' }, h(Icon.dots, { size: 15 })),
            menuOpen ? h('div', { className: 'gw-menu', onMouseLeave: () => setMenuOpen(false) },
              h('button', { type: 'button', className: 'gw-menu-item', onClick: () => { setMenuOpen(false); onRefresh(); }, disabled: loading }, '刷新'),
              h('button', { type: 'button', className: 'gw-menu-item is-danger', onClick: () => { setMenuOpen(false); onForcePush(); } }, '强制推送（--force-with-lease）'),
              snap?.branch?.upstream ? h('div', { className: 'gw-menu-note' }, `上游 ${snap.branch.upstream}`) : null) : null)));
    }

    /* ------------------------------------------------------------- sync bar */

    function SyncBar(props) {
      const { snap } = props;
      const { counts, branch } = snap;
      const total = Math.max(1, counts.staged + counts.modified + counts.untracked + counts.conflict);
      const width = (n) => `${(n / total) * 100}%`;
      return h('div', { className: 'gw-sync' },
        h('div', { className: 'gw-sync-left' },
          h('div', { className: 'gw-sync-branch' },
            h('span', { className: 'gw-branch-icon' }, h(Icon.branch, { size: 15 })),
            h('span', { className: 'gw-branch-name' }, branch.detached ? 'HEAD（分离）' : branch.name || '（无分支）'),
            branch.upstream
              ? h('span', { className: 'gw-upstream', title: branch.upstream }, branch.upstream)
              : h(Chip, { tone: 'warn' }, '无上游'))),
        h('div', { className: 'gw-badges' },
          h(Badge, { tone: 'success', count: counts.staged, label: '已暂存' }),
          h(Badge, { tone: 'warn', count: counts.modified, label: '已修改' }),
          h(Badge, { tone: 'info', count: counts.untracked, label: '未跟踪' }),
          counts.conflict ? h(Badge, { tone: 'danger', count: counts.conflict, label: '冲突' }) : null,
          h('span', { className: 'gw-diffstat' },
            h('span', { className: 'gw-add' }, `+${counts.additions}`),
            h('span', { className: 'gw-del' }, `−${counts.deletions}`))),
        h('div', { className: 'gw-bar', role: 'img', 'aria-label': '改动构成' },
          counts.conflict ? h('span', { className: 'gw-bar-seg gw-tone-danger', style: { width: width(counts.conflict) } }) : null,
          counts.staged ? h('span', { className: 'gw-bar-seg gw-tone-success', style: { width: width(counts.staged) } }) : null,
          counts.modified ? h('span', { className: 'gw-bar-seg gw-tone-warn', style: { width: width(counts.modified) } }) : null,
          counts.untracked ? h('span', { className: 'gw-bar-seg gw-tone-info', style: { width: width(counts.untracked) } }) : null));
    }

    function Badge(props) {
      return h('span', { className: `gw-badge gw-badge-${props.tone}${props.count ? '' : ' is-zero'}` },
        h('span', { className: 'gw-badge-dot' }),
        h('b', null, props.count),
        h('span', null, props.label));
    }

    function Banner(props) {
      const { snap } = props;
      const text = snap.branch.unborn
        ? '这个仓库还没有提交：先暂存改动，写下第一条提交信息'
        : snap.operation
          ? `正在进行 ${snap.operation}，完成或中止后才能继续提交`
          : snap.counts.conflict > 0
            ? `存在 ${snap.counts.conflict} 个冲突文件，解决后先暂存再提交`
            : 'HEAD 处于分离状态，这里的提交不会属于任何分支';
      return h('div', { className: 'gw-banner' }, h(Icon.warn, { size: 15 }), h('span', null, text));
    }

    /* ------------------------------------------------------------- changes */

    function Changes(props) {
      const { snap, busy, onToggle, onStageAll, onOpen, onDiscard } = props;
      const groups = [
        { key: 'conflict', title: '冲突', items: snap.groups.conflict },
        { key: 'staged', title: '已暂存', items: snap.groups.staged },
        { key: 'modified', title: '已修改', items: snap.groups.modified },
        { key: 'untracked', title: '未跟踪', items: snap.groups.untracked },
      ].filter((group) => group.items.length > 0);

      const renderRow = (file, groupKey) => h('div', {
        key: `${groupKey}:${file.path}`,
        className: cx('gw-row', props.selected?.path === file.path && 'is-selected'),
        onClick: () => onOpen(file),
        role: 'button',
        tabIndex: 0,
        onKeyDown: (event) => { if (event.key === 'Enter') onOpen(file); },
      },
      h('span', {
        className: 'gw-row-check',
        onClick: (event) => { event.stopPropagation(); onToggle(file); },
        role: 'checkbox',
        'aria-checked': file.staged,
        tabIndex: 0,
      }, h('span', { className: cx('gw-tick', file.staged && 'is-on') },
        file.staged ? h(Icon.check, { size: 10, stroke: 2 }) : null)),
      h(FileGlyph, { path: file.path }),
      h('span', { className: cx('gw-file-name', `gw-name-${statusTone(file)}`), title: file.path }, shortPath(file.path)),
      h('span', { className: 'gw-file-num' },
        file.additions ? h('span', { className: 'gw-add' }, `+${file.additions}`) : null,
        file.deletions ? h('span', { className: 'gw-del' }, `−${file.deletions}`) : null),
      h('span', { className: `gw-st gw-st-${statusTone(file)}`, title: statusLabel(file) }, statusLabel(file)),
      h('span', { className: 'gw-row-actions' },
        h('button', {
          type: 'button', className: 'gw-icon-btn', title: '查看差异',
          onClick: (event) => { event.stopPropagation(); onOpen(file); },
        }, h(Icon.eye, { size: 13 })),
        h('button', {
          type: 'button', className: 'gw-icon-btn', title: file.staged ? '取消暂存' : '暂存',
          onClick: (event) => { event.stopPropagation(); onToggle(file); },
        }, file.staged ? h(Icon.minus, { size: 13 }) : h(Icon.plus, { size: 13 })),
        !file.staged && !file.conflict
          ? h('button', {
            type: 'button', className: 'gw-icon-btn is-danger', title: '丢弃改动',
            onClick: (event) => { event.stopPropagation(); onDiscard(file); },
          }, h(Icon.undo, { size: 13 }))
          : null));

      const body = groups.length === 0
        ? h('div', { className: 'gw-empty-small' }, '工作区干净')
        : groups.map((group) => h('div', { key: group.key, className: 'gw-group' },
          h('div', { className: 'gw-group-head' },
            h('span', null, group.title),
            h('span', { className: 'gw-group-count' }, group.items.length)),
          group.items.map((file) => renderRow(file, group.key))));

      return h('div', { className: 'gw-changes' },
        h('div', { className: 'gw-pane-head' },
          h('span', { className: 'gw-pane-title' }, '改动'),
          h('span', { className: 'gw-muted' }, `${snap.counts.total} 个文件`),
          h('span', { className: 'gw-spacer' }),
          h('button', {
            type: 'button',
            className: 'gw-link',
            onClick: onStageAll,
            disabled: Boolean(busy) || snap.counts.total === 0,
          }, '全部暂存')),
        h('div', { className: 'gw-change-list' }, body));
    }

    /* -------------------------------------------------------------- history */

    function computeLanes(commits) {
      const lanes = [];
      return commits.map((commit) => {
        let lane = lanes.indexOf(commit.short);
        if (lane === -1) {
          lane = lanes.length;
          lanes.push(commit.short);
        }
        const before = lanes.slice();
        const parents = (commit.parents || []).filter(Boolean);
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
        return { lane, before, after: lanes.slice(), parents };
      });
    }

    const LANE_COLORS = [
      'var(--dsw-alias-brand-primary)',
      'var(--dsw-alias-state-success-primary)',
      'var(--dsw-alias-state-warn-primary)',
    ];

    function laneColor(index) {
      return LANE_COLORS[index % LANE_COLORS.length];
    }

    function GraphRow(props) {
      const { row } = props;
      const height = 52;
      const step = 12;
      const x = (i) => 8 + i * step;
      const count = Math.max(row.before.length, row.after.length, row.lane + 1);
      const width = props.width || Math.max(20, x(count - 1) + 8);
      const cy = height / 2;
      const children = [];

      for (let i = 0; i < count; i += 1) {
        if (i === row.lane) continue;
        const above = i < row.before.length;
        const below = i < row.after.length;
        if (!above && !below) continue;
        // A lane that first exists below this row is created by a merge edge,
        // which the curve already draws; starting it here would double the line.
        if (!above) continue;
        children.push(h('line', {
          key: `lane-${i}`,
          x1: x(i),
          y1: 0,
          x2: x(i),
          y2: below ? height : cy,
          stroke: laneColor(i),
          strokeWidth: 2,
          strokeLinecap: 'round',
          opacity: 0.75,
        }));
      }

      const firstParent = row.parents[0];
      const firstTarget = firstParent ? row.after.indexOf(firstParent) : -1;
      const straightDown = firstTarget === row.lane || (firstParent && firstTarget < 0);

      if (row.before.length > row.lane) {
        children.push(h('line', { key: 'dot-up', x1: x(row.lane), y1: 0, x2: x(row.lane), y2: cy, stroke: laneColor(row.lane), strokeWidth: 2 }));
      }
      if (straightDown) {
        children.push(h('line', { key: 'dot-down', x1: x(row.lane), y1: cy, x2: x(row.lane), y2: height, stroke: laneColor(row.lane), strokeWidth: 2 }));
      }
      if (firstParent && firstTarget >= 0 && firstTarget !== row.lane) {
        children.push(h('path', {
          key: 'first-parent-shift',
          d: `M ${x(row.lane)} ${cy} C ${x(row.lane)} ${cy + 16}, ${x(firstTarget)} ${height - 16}, ${x(firstTarget)} ${height}`,
          fill: 'none',
          stroke: laneColor(firstTarget),
          strokeWidth: 2,
          strokeLinecap: 'round',
          opacity: 0.9,
        }));
      }

      for (let p = 1; p < row.parents.length; p += 1) {
        const target = row.after.indexOf(row.parents[p]);
        if (target < 0) continue;
        children.push(h('path', {
          key: `merge-${p}`,
          d: `M ${x(row.lane)} ${cy} C ${x(row.lane)} ${cy + 16}, ${x(target)} ${height - 16}, ${x(target)} ${height}`,
          fill: 'none',
          stroke: laneColor(target),
          strokeWidth: 2,
          strokeLinecap: 'round',
          opacity: 0.9,
        }));
      }

      children.push(h('circle', {
        key: 'dot',
        cx: x(row.lane),
        cy,
        r: 4.5,
        fill: 'var(--dsw-alias-brand-primary)',
        stroke: 'var(--dsw-alias-bg-base)',
        strokeWidth: 2,
      }));

      return h('svg', {
        className: 'gw-graph-svg',
        width,
        height,
        viewBox: `0 0 ${width} ${height}`,
        'aria-hidden': true,
      }, children);
    }

    function History(props) {
      const { snap, onOpenCommit, selectedSha } = props;
      const commits = snap.commits ?? [];
      const graph = computeLanes(commits);
      const laneMax = graph.reduce((max, row) => Math.max(max, row.before.length, row.after.length, row.lane + 1), 1);
      const graphWidth = Math.max(20, 8 + (laneMax - 1) * 12 + 8);
      return h('div', { className: 'gw-history' },
        h('div', { className: 'gw-pane-head' },
          h('span', { className: 'gw-pane-title' }, '提交'),
          h('span', { className: 'gw-muted gw-small' }, `${commits.length} 条`),
          h('span', { className: 'gw-spacer' }),
          h('span', { className: 'gw-muted gw-small' }, snap.branch.name || '')),
        h('div', { className: 'gw-commit-list' },
          commits.length === 0 ? h('div', { className: 'gw-empty-small' }, '还没有提交') : null,
          commits.map((commit, index) => h('div', {
            key: commit.short,
            className: cx('gw-commit', selectedSha === commit.short && 'is-selected'),
            onClick: () => onOpenCommit(commit),
            role: 'button',
            tabIndex: 0,
            onKeyDown: (event) => { if (event.key === 'Enter') onOpenCommit(commit); },
          },
            h('span', { className: 'gw-graph-cell', 'aria-hidden': true }, h(GraphRow, { row: graph[index], width: graphWidth })),
            h('span', { className: `gw-avatar gw-avatar-${hashTone(commit.author)}`, title: commit.author }, initials(commit.author)),
            h('div', { className: 'gw-commit-main' },
              h('div', { className: 'gw-commit-subject', title: commit.subject }, commit.subject),
              h('div', { className: 'gw-commit-meta' },
                h('span', { className: 'gw-commit-author' }, commit.author),
                h('span', { className: 'gw-sep' }, '·'),
                h('span', null, commit.when || (commit.time ? relativeTime(commit.time * 1000) : '')),
                commit.refs.slice(0, 3).map((ref) => h('span', {
                  key: ref,
                  className: `gw-ref gw-ref-${refKind(ref)}`,
                  title: ref,
                }, ref.replace('HEAD -> ', ''))))),
            h('code', {
              className: 'gw-sha',
              title: '复制 SHA',
              onClick: (event) => { event.stopPropagation(); copyText(commit.short); },
            }, commit.short)))));
    }

    /* ----------------------------------------------------------------- diff */

    function DiffBody(props) {
      const lines = String(props.diff?.text || '').split('\n');
      const visible = lines.slice(0, 2000);
      return h('pre', { className: 'gw-diff-body' },
        visible.map((line, index) => h('span', {
          key: index,
          className: cx('gw-diff-line',
            line.startsWith('+++') || line.startsWith('---') ? 'is-file' :
              line.startsWith('+') ? 'is-add' :
                line.startsWith('-') ? 'is-del' :
                  line.startsWith('@@') ? 'is-hunk' :
                    line.startsWith('diff ') || line.startsWith('index ') ? 'is-meta' : null),
        }, line || ' ')),
        lines.length > visible.length
          ? h('span', { className: 'gw-diff-line is-meta' }, `… 还有 ${lines.length - visible.length} 行`)
          : null);
    }

    function DiffPane(props) {
      const { diff, loading, file } = props;
      if (!file) {
        return h('div', { className: 'gw-center' }, h('div', { className: 'gw-empty' },
          h('div', { className: 'gw-empty-icon' }, h(Icon.file, { size: 24 })),
          h('div', { className: 'gw-empty-title' }, '选一个改动文件'),
          h('div', { className: 'gw-empty-hint' }, '左侧列表里点文件名，这里显示完整的 diff。')));
      }
      if (loading) return h('div', { className: 'gw-center' }, h('div', { className: 'gw-empty' }, '读取差异…'));
      if (!diff) return h('div', { className: 'gw-center' }, h('div', { className: 'gw-empty' }, '没有差异'));
      const lineCount = String(diff.text || '').split('\n').length;
      return h('div', { className: 'gw-diff' },
        h('div', { className: 'gw-pane-head' },
          h(FileGlyph, { path: file.path }),
          h('span', { className: 'gw-pane-title', title: file.path }, shortPath(file.path)),
          h(Chip, { tone: file.staged ? 'success' : 'warn' }, file.staged ? '已暂存' : file.untracked ? '未跟踪' : '未暂存'),
          h('span', { className: 'gw-spacer' }),
          h('span', { className: 'gw-muted gw-small' }, diff.truncated ? '已截断' : `${lineCount} 行`)),
        h(DiffBody, { diff }));
    }

    /* -------------------------------------------------------- commit detail */

    function commitTone(status) {
      return status === 'A' ? 'success' : status === 'D' ? 'danger' : status === 'R' ? 'info' : 'warn';
    }

    function CommitDetail(props) {
      const { state, onBack, onOpenFile } = props;
      const detail = state.detail;
      if (state.loading || !detail) {
        return h('div', { className: 'gw-center' }, h('div', { className: 'gw-empty' }, '读取提交…'));
      }
      return h('div', { className: 'gw-detail' },
        h('div', { className: 'gw-detail-head' },
          h('button', { type: 'button', className: 'gw-back', onClick: onBack, title: '返回提交历史' },
            h(Icon.chevron, { size: 13 }), '历史'),
          h('code', { className: 'gw-sha is-static' }, detail.short),
          h('span', { className: 'gw-spacer' }),
          h('span', { className: 'gw-file-num' },
            h('span', { className: 'gw-add' }, `+${detail.additions}`),
            h('span', { className: 'gw-del' }, `−${detail.deletions}`))),
        h('div', { className: 'gw-detail-summary' },
          h('div', { className: 'gw-detail-subject' }, detail.subject),
          h('div', { className: 'gw-detail-author' },
            h('span', { className: `gw-avatar gw-avatar-${hashTone(detail.author)}` }, initials(detail.author)),
            h('span', null, detail.author),
            h('span', { className: 'gw-sep' }, '·'),
            h('span', { className: 'gw-muted' }, detail.time ? relativeTime(detail.time * 1000) : '')),
          detail.body ? h('pre', { className: 'gw-detail-message' }, detail.body) : null),
        h('div', { className: 'gw-detail-files' },
          detail.files.map((file) => h('button', {
            key: file.path,
            type: 'button',
            className: cx('gw-dfile', state.diffFile?.path === file.path && 'is-active'),
            onClick: () => onOpenFile(file),
            title: file.path,
          },
            h(FileGlyph, { path: file.path }),
            h('span', { className: 'gw-dfile-name' }, shortPath(file.path)),
            h('span', { className: 'gw-file-num' },
              file.additions ? h('span', { className: 'gw-add' }, `+${file.additions}`) : null,
              file.deletions ? h('span', { className: 'gw-del' }, `−${file.deletions}`) : null),
            h('span', { className: `gw-st gw-st-${commitTone(file.status)}` }, file.status)))),
        h('div', { className: 'gw-detail-diff' },
          state.diffLoading
            ? h('div', { className: 'gw-empty-small' }, '读取差异…')
            : state.diff
              ? h(DiffBody, { diff: state.diff })
              : h('div', { className: 'gw-empty-small' }, '点一个文件查看这次提交的差异')));
    }

    /* ------------------------------------------------------- branches/stash */

    function SideSections(props) {
      const { snap, busy, onSwitch, onStashPush, onStashApply, onStashDrop } = props;
      const [open, setOpen] = useState('branches');
      const branches = snap.branches ?? [];
      const stash = snap.stash ?? [];
      return h('div', { className: 'gw-side' },
        h('div', { className: 'gw-side-head' },
          h('button', { type: 'button', className: cx('gw-seg', open === 'branches' && 'is-active'), onClick: () => setOpen('branches') }, `分支 ${branches.length}`),
          h('button', { type: 'button', className: cx('gw-seg', open === 'stash' && 'is-active'), onClick: () => setOpen('stash') }, `stash ${stash.length}`),
          open === 'branches'
            ? h(React.Fragment, null,
              h('span', { className: 'gw-spacer' }),
              h('span', { className: 'gw-muted gw-small' }, '点击分支可切换'))
            : null),
        open === 'branches'
          ? h('div', { className: 'gw-side-list' },
            branches.map((branch) => h('button', {
              key: branch.name,
              type: 'button',
              className: cx('gw-side-row', branch.current && 'is-current'),
              onClick: () => { if (!branch.current) onSwitch(branch); },
              disabled: branch.current || Boolean(busy),
              title: branch.current ? '当前分支' : `切换到 ${branch.name}`,
            },
              h('span', { className: cx('gw-dot', branch.current && 'is-on') }),
              h('span', { className: 'gw-side-name' }, branch.name),
              branch.ahead ? h('span', { className: 'gw-tone-success gw-mono' }, `↑${branch.ahead}`) : null,
              branch.behind ? h('span', { className: 'gw-tone-warn gw-mono' }, `↓${branch.behind}`) : null,
              branch.gone ? h(Chip, { tone: 'muted' }, 'gone') : null)))
          : h('div', { className: 'gw-side-list' },
            h('button', { type: 'button', className: 'gw-side-add', onClick: onStashPush, disabled: Boolean(busy) || snap.counts.total === 0 },
              h(Icon.plus, { size: 12 }), '暂存当前改动'),
            stash.length === 0 ? h('div', { className: 'gw-empty-small' }, '没有 stash') : null,
            stash.map((item) => h('div', { key: item.ref, className: 'gw-stash' },
              h('div', { className: 'gw-stash-main' },
                h('div', { className: 'gw-side-name' }, item.subject || item.ref),
                h('div', { className: 'gw-muted gw-small' }, `${item.ref} · ${item.when}`)),
              h('div', { className: 'gw-stash-actions' },
                h('button', { type: 'button', className: 'gw-link', onClick: () => onStashApply(item, true) }, '弹出'),
                h('button', { type: 'button', className: 'gw-link', onClick: () => onStashApply(item, false) }, '应用'),
                h('button', { type: 'button', className: 'gw-link is-danger', onClick: () => onStashDrop(item) }, '删除'))))));
    }

    /* ------------------------------------------------------------- composer */

    function Composer(props) {
      const { snap, message, setMessage, amend, setAmend, pushAfter, setPushAfter, ai, aiBusy, onAi, onCommit, disabled, busy } = props;
      const staged = snap.counts.staged;
      const canAi = snap.counts.total > 0;
      return h('div', { className: 'gw-composer' },
        h('div', { className: 'gw-composer-head' },
          h('span', { className: 'gw-pane-title' }, '提交信息'),
          h('span', { className: 'gw-muted gw-small' }, ai ? `AI · ${ai.model}` : 'AI · 会话模型')),
        h('div', { className: 'gw-input-wrap' },
          h('textarea', {
            className: 'gw-textarea',
            value: message,
            rows: 3,
            placeholder: '写提交信息，或让 AI 读取改动…',
            onChange: (event) => setMessage(event.target.value),
            onKeyDown: (event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') onCommit();
            },
          }),
          h('button', {
            type: 'button',
            className: 'gw-ai-btn',
            onClick: onAi,
            disabled: aiBusy || !canAi,
            title: canAi ? '基于改动生成提交信息' : '没有可用的改动',
          }, aiBusy ? h('span', { className: 'gw-spin gw-spin-light' }) : h(Icon.sparkle, { size: 12 }),
            h('span', null, aiBusy ? '生成中' : 'AI'))),
        ai ? h('div', { className: 'gw-ai-meta' },
          h(Icon.check, { size: 10 }),
          h('span', null, `${ai.outputTokens ?? '—'} tokens · ${ai.fileCount} 个文件`),
          h('span', { className: 'gw-spacer' }),
          h('button', { type: 'button', className: 'gw-link', onClick: onAi, disabled: aiBusy }, '重新生成'),
          h('button', { type: 'button', className: 'gw-link', onClick: () => setMessage(ai.message.split('\n')[0]) }, '只取首行')) : null,
        h('div', { className: 'gw-composer-actions' },
          h('label', { className: 'gw-check' },
            h('input', { type: 'checkbox', checked: pushAfter, onChange: (e) => setPushAfter(e.target.checked) }),
            '提交后推送'),
          h('label', { className: 'gw-check' },
            h('input', { type: 'checkbox', checked: amend, onChange: (e) => setAmend(e.target.checked) }),
            '修订上次提交')),
        h('button', {
          type: 'button',
          className: cx('gw-commit-btn', disabled && 'is-disabled'),
          onClick: onCommit,
          disabled,
        }, busy === 'commit' ? h('span', { className: 'gw-spin gw-spin-light' }) : h(Icon.check, { size: 14 }),
          staged > 0 ? `提交 ${staged} 个文件` : '暂存改动后提交'));
    }

    /* ----------------------------------------------------------- status bar */

    function StatusBar(props) {
      const { snap } = props;
      return h('div', { className: 'gw-status' },
        h('span', { className: 'gw-status-item' }, h(Icon.branch, { size: 11 }), snap.branch.detached ? 'detached' : snap.branch.name || '—'),
        h('span', { className: 'gw-status-item gw-path', title: snap.repo.root }, snap.repo.root),
        h('span', { className: 'gw-spacer' }),
        h('span', { className: 'gw-status-item' }, snap.branch.upstream || '无上游'),
        h('span', { className: 'gw-status-item' }, `自动刷新 10s`));
    }

    /* ------------------------------------------------------------ status chip */    function StatusChip(props) {
      const sessionId = props.sessionId;
      const rpc = useMemo(() => makeRpc(sessionId), [sessionId]);
      const [snap, setSnap] = useState(null);
      const [open, setOpen] = useState(false);
      const [busy, setBusy] = useState('');

      const load = useCallback(async () => {
        if (!sessionId) return;
        try {
          const next = await rpc('snapshot');
          setSnap(next);
        } catch {
          setSnap(null);
        }
      }, [rpc, sessionId]);

      useEffect(() => {
        load();
        const timer = window.setInterval(load, 15_000);
        return () => window.clearInterval(timer);
      }, [load]);

      if (!sessionId || !snap?.isRepo) return null;
      const { branch, counts } = snap;
      const dirty = counts.total;

      const act = async (label, method, okText) => {
        setBusy(label);
        try {
          await rpc(method, {});
          await load();
        } catch (error) {
          window.console?.error?.(`[git-workbench] ${error.message}`);
        } finally {
          setBusy('');
        }
      };

      return h('div', { className: 'gw-chip-wrap' },
        h('button', {
          type: 'button',
          className: cx('gw-status-chip', open && 'is-open'),
          onClick: () => setOpen(!open),
          title: 'Git 工作台',
        },
          h('span', { className: 'gw-chip-icon' }, h(Icon.branch, { size: 13 })),
          h('span', { className: 'gw-chip-branch' }, branch.detached ? 'detached' : branch.name || '—'),
          branch.ahead ? h('span', { className: 'gw-chip-stat gw-tone-success' }, `↑${branch.ahead}`) : null,
          branch.behind ? h('span', { className: 'gw-chip-stat gw-tone-warn' }, `↓${branch.behind}`) : null,
          dirty ? h('span', { className: 'gw-chip-dirty' }, h('span', { className: 'gw-dot' }), String(dirty)) : h('span', { className: 'gw-chip-clean' }, '干净')),
        open ? h('div', { className: 'gw-chip-pop', onMouseLeave: () => setOpen(false) },
          h('div', { className: 'gw-pop-head' },
            h('span', { className: 'gw-pop-title' }, snap.repo.name),
            h('span', { className: 'gw-muted gw-small' }, branch.upstream || '无上游')),
          h('div', { className: 'gw-pop-stats' },
            h('span', null, `↑${branch.ahead}`), h('span', null, `↓${branch.behind}`),
            h('span', null, `${dirty} 个改动`), h('span', { className: 'gw-add' }, `+${counts.additions}`), h('span', { className: 'gw-del' }, `−${counts.deletions}`)),
          h('div', { className: 'gw-pop-actions' },
            h(Btn, { onClick: () => act('fetch', 'fetch'), busy: busy === 'fetch' }, '抓取'),
            h(Btn, { onClick: () => act('pull', 'pull'), busy: busy === 'pull' }, '拉取'),
            h(Btn, { variant: 'primary', onClick: () => act('push', 'push'), busy: busy === 'push' }, '推送')),
          h('div', { className: 'gw-pop-hint' }, '在上方打开「Git」标签查看完整面板')) : null);
    }

    /* ------------------------------------------------------------- boundary */

    class Boundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { error: null };
      }

      static getDerivedStateFromError(error) {
        return { error };
      }

      componentDidCatch(error, info) {
        console.error('[git-workbench] panel render failed', error, info);
      }

      render() {
        if (!this.state.error) return this.props.children;
        if (this.props.silent) return null;
        return h('div', { className: 'gw-center' },
          h('div', { className: 'gw-empty gw-tone-danger' },
            h('div', { className: 'gw-empty-title' }, 'Git 面板渲染失败'),
            h('div', { className: 'gw-empty-hint' }, String(this.state.error.message || this.state.error))));
      }
    }

    const GitViewSafe = (props) => h(Boundary, null, h(GitView, props));
    const GitTabSafe = (props) => h(Boundary, null, h(GitView, { ...props, compact: true }));
    const ChipSafe = (props) => h(Boundary, { silent: true }, h(StatusChip, props));

    function GitGuideArtwork() {
      return h('span', { className: 'gw-guide-art' }, h(Icon.branch, { size: 20 }));
    }

    function GitTabTitle() {
      return h(React.Fragment, null,
        h('span', { className: 'gw-tab-icon' }, h(Icon.branch, { size: 14 })),
        'Git');
    }

    /* ------------------------------------------------------------------ css */

    const CSS = `
.gw-root{display:flex;flex-direction:column;height:100%;width:100%;max-width:100%;min-height:0;flex:1 1 auto;overflow:hidden;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.5}
.gw-root *{box-sizing:border-box}
.gw-muted{color:var(--dsw-alias-label-secondary)}
.gw-small{font-size:11px}
.gw-mono,.gw-mono *{font-variant-numeric:tabular-nums}
.gw-spacer{flex:1}
.gw-add{color:var(--dsw-alias-state-success-primary)}
.gw-del{color:var(--dsw-alias-state-error-primary)}
.gw-tone-success{color:var(--dsw-alias-state-success-primary)}
.gw-tone-warn{color:var(--dsw-alias-state-warn-primary)}
.gw-tone-danger{color:var(--dsw-alias-state-error-primary)}
.gw-tone-muted{color:var(--dsw-alias-label-secondary)}
.gw-tone-accent{color:var(--dsw-alias-brand-primary)}
.gw-center{display:flex;align-items:center;justify-content:center;flex:1;min-height:0;padding:24px}
.gw-empty{text-align:center;color:var(--dsw-alias-label-secondary);display:flex;flex-direction:column;align-items:center;gap:6px}
.gw-empty-icon{opacity:.6;margin-bottom:4px}
.gw-empty-title{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:600}
.gw-empty-path{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;word-break:break-all}
.gw-empty-hint{font-size:12px;max-width:360px}
.gw-empty-small{padding:14px;color:var(--dsw-alias-label-secondary);font-size:12px;text-align:center}
.gw-btn{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 11px;border-radius:8px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-size:12px;font-family:inherit;cursor:pointer;white-space:nowrap}
.gw-btn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-1)}
.gw-btn:disabled{opacity:.45;cursor:default}
.gw-btn-primary{background:var(--dsw-alias-brand-primary);border-color:transparent;color:var(--dsw-alias-bg-base);font-weight:600}
.gw-btn-primary:hover:not(:disabled){background:var(--dsw-alias-brand-primary);filter:brightness(1.06)}
.gw-btn-danger{background:var(--dsw-alias-state-error-primary);border-color:transparent;color:var(--dsw-alias-bg-base);font-weight:600}
.gw-btn-icon{display:inline-flex;align-items:center}
.gw-btn-sm{height:26px;padding:0 9px;font-size:11px}
.gw-btn-icon{padding:0;width:30px;justify-content:center}
.gw-spin{width:12px;height:12px;border-radius:50%;border:2px solid var(--dsw-alias-border-l2);border-top-color:var(--dsw-alias-brand-primary);animation:gw-spin .7s linear infinite}
@keyframes gw-spin{to{transform:rotate(360deg)}}
.gw-head{display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid var(--dsw-alias-border-l1);flex-wrap:wrap}
.gw-head-main{display:flex;align-items:center;gap:8px;min-width:0;flex:1}
.gw-title{font-size:15px;font-weight:700}
.gw-path{color:var(--dsw-alias-label-secondary);font-size:11px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.gw-head-actions{display:flex;align-items:center;gap:6px;position:relative}
.gw-chip-tag{display:inline-flex;align-items:center;height:19px;padding:0 7px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:10.5px;white-space:nowrap}
.gw-chip-tag.gw-tone-accent{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 16%,transparent);color:var(--dsw-alias-brand-primary)}
.gw-chip-tag.gw-tone-success{background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 15%,transparent);color:var(--dsw-alias-state-success-primary)}
.gw-chip-tag.gw-tone-warn{background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 16%,transparent);color:var(--dsw-alias-state-warn-primary)}
.gw-menu-wrap{position:relative}
.gw-menu{position:absolute;right:0;top:36px;min-width:230px;padding:6px;border-radius:10px;background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l1);box-shadow:0 12px 28px rgba(0,0,0,.28);z-index:20}
.gw-menu-item{display:block;width:100%;text-align:left;padding:7px 9px;border:0;background:none;color:var(--dsw-alias-label-primary);font-size:12px;border-radius:6px;cursor:pointer;font-family:inherit}
.gw-menu-item:hover{background:var(--dsw-alias-bg-layer-2)}
.gw-menu-item.is-danger{color:var(--dsw-alias-state-error-primary)}
.gw-menu-note{padding:6px 9px 2px;font-size:10.5px;color:var(--dsw-alias-label-secondary);border-top:1px solid var(--dsw-alias-border-l1);margin-top:4px}
.gw-sync{display:grid;grid-template-columns:1fr auto;gap:10px 18px;padding:12px 16px 10px;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
.gw-sync-left{min-width:0}
.gw-sync-branch{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.gw-branch-icon{display:inline-flex;color:var(--dsw-alias-brand-primary)}
.gw-branch-name{font-weight:600;font-size:14px}
.gw-sync-sub{display:flex;gap:6px;color:var(--dsw-alias-label-secondary);font-size:10.5px;margin-top:4px}
.gw-sync-stats{display:flex;align-items:center;gap:16px}
.gw-stat{display:flex;flex-direction:column;align-items:flex-end;min-width:44px}
.gw-stat-value{font-size:18px;font-weight:650;line-height:1.1;font-variant-numeric:tabular-nums}
.gw-stat-label{font-size:10px;color:var(--dsw-alias-label-secondary)}
.gw-sync-diffstat{display:flex;gap:6px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;margin-left:4px}
.gw-bar{grid-column:1/-1;display:flex;height:6px;border-radius:999px;overflow:hidden;background:var(--dsw-alias-bg-layer-2)}
.gw-bar-seg{display:block;height:100%}
.gw-bar-seg.gw-tone-success{background:var(--dsw-alias-state-success-primary)}
.gw-bar-seg.gw-tone-warn{background:var(--dsw-alias-state-warn-primary)}
.gw-bar-seg.gw-tone-danger{background:var(--dsw-alias-state-error-primary)}
.gw-bar-seg.gw-tone-muted{background:var(--dsw-alias-state-idle-primary)}
.gw-bar-seg.gw-tone-info{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 62%,var(--dsw-alias-label-secondary) 38%)}
.gw-banner{display:flex;align-items:center;gap:8px;padding:8px 16px;font-size:12px;color:var(--dsw-alias-state-warn-primary);background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 12%,transparent);border-bottom:1px solid var(--dsw-alias-border-l1)}
.gw-body{display:flex;flex:1;min-height:0;min-width:0;overflow:hidden}
.gw-left{width:380px;min-width:300px;display:flex;flex-direction:column;border-right:1px solid var(--dsw-alias-border-l1);min-height:0}
.gw-right{flex:1;display:flex;flex-direction:column;min-width:0;min-height:0}
.gw-history{display:flex;flex-direction:column;min-height:0;min-width:0;flex:1}
.gw-commit-list{overflow:auto;min-height:0;flex:1;padding:4px 0 12px}
.gw-commit{display:flex;align-items:flex-start;gap:8px;padding:6px 12px 6px 8px;position:relative;min-width:0}
.gw-pane-head{display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);min-height:36px}
.gw-pane-title{font-weight:600;font-size:12px}
.gw-changes{display:flex;flex-direction:column;min-height:0;flex:0 1 auto;max-height:58%}
.gw-change-list{overflow:auto;min-height:0;flex:1}
.gw-group{margin-bottom:2px}
.gw-group-head{display:flex;align-items:center;justify-content:space-between;padding:6px 12px 3px;font-size:10.5px;color:var(--dsw-alias-label-secondary);position:sticky;top:0;background:var(--dsw-alias-bg-base);z-index:1}
.gw-group-count{opacity:.7}
.gw-row{display:flex;align-items:center;gap:7px;padding:5px 10px 5px 12px;cursor:pointer;min-height:29px}
.gw-row:hover{background:var(--dsw-alias-bg-layer-1)}
.gw-row.is-selected{background:var(--dsw-alias-bg-layer-2)}
.gw-row-check{display:inline-flex;flex:0 0 auto;cursor:pointer}
.gw-tick{width:12px;height:12px;border-radius:3px;border:1px solid var(--dsw-alias-border-l2);display:inline-flex;align-items:center;justify-content:center;color:var(--dsw-alias-bg-base)}
.gw-tick.is-on{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}
.gw-file-status{flex:0 0 18px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10.5px;font-weight:600}
.gw-file-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}
.gw-file-num{display:flex;gap:5px;font-size:10.5px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;opacity:.85}
.gw-row-action{display:inline-flex;border:0;background:none;color:var(--dsw-alias-label-secondary);cursor:pointer;padding:2px;border-radius:4px;opacity:0}
.gw-row:hover .gw-row-action{opacity:.8}
.gw-row-action:hover{color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-bg-layer-2)}
.gw-side{border-top:1px solid var(--dsw-alias-border-l1);display:flex;flex-direction:column;min-height:0;flex:0 0 auto;max-height:34%}
.gw-side-head{display:flex;align-items:center;gap:4px;padding:8px 10px 4px}
.gw-seg{border:0;background:none;color:var(--dsw-alias-label-secondary);font-size:11px;padding:4px 8px;border-radius:6px;cursor:pointer;font-family:inherit}
.gw-seg.is-active{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.gw-side-list{overflow:auto;min-height:0;padding:0 8px 8px}
.gw-side-row{display:flex;align-items:center;gap:7px;width:100%;padding:5px 6px;border:0;background:none;color:var(--dsw-alias-label-primary);font-size:12px;border-radius:6px;cursor:pointer;font-family:inherit;text-align:left}
.gw-side-row:hover:not(:disabled){background:var(--dsw-alias-bg-layer-1)}
.gw-side-row.is-current{color:var(--dsw-alias-label-primary)}
.gw-side-row:disabled{cursor:default}
.gw-side-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gw-dot{width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-state-idle-primary);flex:0 0 auto}
.gw-dot.is-on{background:var(--dsw-alias-brand-primary)}
.gw-side-add{display:flex;align-items:center;gap:6px;width:100%;padding:6px;margin-bottom:4px;border:1px dashed var(--dsw-alias-border-l1);border-radius:6px;background:none;color:var(--dsw-alias-label-secondary);font-size:11.5px;cursor:pointer;font-family:inherit}
.gw-side-add:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2)}
.gw-stash{padding:6px;border-radius:6px}
.gw-stash:hover{background:var(--dsw-alias-bg-layer-1)}
.gw-stash-main{font-size:11.5px}
.gw-stash-actions{display:flex;gap:10px;margin-top:2px}
.gw-link{border:0;background:none;color:var(--dsw-alias-brand-primary);font-size:11px;cursor:pointer;padding:2px 0;font-family:inherit}
.gw-link:disabled{opacity:.4;cursor:default}
.gw-link.is-danger{color:var(--dsw-alias-state-error-primary)}
.gw-tabs{display:flex;gap:2px;padding:6px 12px 0;border-bottom:1px solid var(--dsw-alias-border-l1)}
.gw-tab{border:0;background:none;color:var(--dsw-alias-label-secondary);font-size:12px;padding:6px 10px;border-bottom:2px solid transparent;cursor:pointer;font-family:inherit;display:flex;gap:6px;align-items:center;max-width:70%}
.gw-tab.is-active{color:var(--dsw-alias-label-primary);border-bottom-color:var(--dsw-alias-brand-primary)}
.gw-tab-sub{font-size:10px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px}
.gw-commit:hover{background:var(--dsw-alias-bg-layer-1)}
.gw-graph{position:relative;width:34px;flex:0 0 34px;height:34px;margin-top:-2px}
.gw-graph-rail{position:absolute;left:4px;top:0;bottom:-14px;width:1px;background:var(--dsw-alias-border-l1)}
.gw-graph-line{position:absolute;top:-14px;bottom:-8px;width:1px;background:var(--dsw-alias-border-l1)}
.gw-graph-dot{position:absolute;top:11px;width:7px;height:7px;border-radius:50%;background:var(--dsw-alias-brand-primary);margin-left:1px}
.gw-commit-main{flex:1;min-width:0}
.gw-commit-subject{font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gw-commit-meta{display:flex;align-items:center;gap:6px;font-size:10.5px;color:var(--dsw-alias-label-secondary);flex-wrap:wrap;margin-top:2px}
.gw-commit-sha{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;color:var(--dsw-alias-label-secondary);opacity:.7}
.gw-diff{display:flex;flex-direction:column;min-height:0;flex:1}
.gw-diff-body{margin:0;padding:8px 0 20px;overflow:auto;flex:1;min-height:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;line-height:1.55;background:var(--dsw-alias-bg-base)}
.gw-diff-line{display:block;padding:0 14px;white-space:pre-wrap;word-break:break-all}
.gw-diff-line.is-add{background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 12%,transparent)}
.gw-diff-line.is-del{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 12%,transparent)}
.gw-diff-line.is-hunk{color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-1)}
.gw-diff-line.is-file,.gw-diff-line.is-meta{color:var(--dsw-alias-label-secondary)}
.gw-composer{border-bottom:1px solid var(--dsw-alias-border-l1);padding:10px 12px 12px;background:var(--dsw-alias-bg-layer-1);flex:0 0 auto}
.gw-composer-head{display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap}
.gw-textarea{width:100%;resize:vertical;min-height:58px;max-height:180px;padding:8px 10px;border-radius:8px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:12.5px;line-height:1.55;outline:none}
.gw-textarea:focus{border-color:var(--dsw-alias-brand-primary)}
.gw-ai-meta{display:flex;align-items:center;gap:6px;font-size:10.5px;color:var(--dsw-alias-label-secondary);margin-top:4px}
.gw-composer-actions{display:flex;align-items:center;gap:14px;margin-top:7px;flex-wrap:wrap}
.gw-composer-footer{display:flex;align-items:center;gap:6px;margin-top:8px}
.gw-composer-hint{flex:1;min-width:0;font-size:10.5px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gw-composer-footer .gw-btn{height:28px;padding:0 10px;font-size:11.5px}
.gw-check{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;color:var(--dsw-alias-label-secondary);cursor:pointer}
.gw-check input{accent-color:var(--dsw-alias-brand-primary)}
.gw-status{display:flex;align-items:center;gap:14px;padding:5px 14px;border-top:1px solid var(--dsw-alias-border-l1);font-size:10.5px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-1)}
.gw-status-item{display:inline-flex;align-items:center;gap:5px;min-width:0}
.gw-status .gw-path{max-width:46vw}
.gw-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);padding:8px 14px;border-radius:8px;background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l1);font-size:12px;z-index:60;box-shadow:0 10px 28px rgba(0,0,0,.3)}
.gw-toast.gw-tone-error{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}
.gw-toast.gw-tone-success{border-color:var(--dsw-alias-state-success-primary)}
.gw-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.42);display:flex;align-items:center;justify-content:center;z-index:80;padding:24px}
.gw-modal{width:min(520px,100%);border-radius:12px;background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l1);box-shadow:0 24px 60px rgba(0,0,0,.4);overflow:hidden}
.gw-modal-title{padding:14px 16px 0;font-size:13px;font-weight:600}
.gw-modal-body{padding:8px 16px 14px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.gw-modal-actions{display:flex;justify-content:flex-end;gap:8px;padding:10px 14px 14px;border-top:1px solid var(--dsw-alias-border-l1)}
.gw-prose p{margin:0 0 8px}
.gw-error-pre{max-height:160px;overflow:auto;padding:8px;border-radius:6px;background:var(--dsw-alias-bg-layer-1);font-size:11px;white-space:pre-wrap;word-break:break-all;color:var(--dsw-alias-label-secondary)}
.gw-status-chip{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 9px;border-radius:8px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font-size:11px;cursor:pointer;font-family:inherit}
.gw-status-chip:hover,.gw-status-chip.is-open{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary)}
.gw-chip-branch{max-width:132px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-primary)}
.gw-chip-stat{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10.5px}
.gw-chip-dirty{display:inline-flex;align-items:center;gap:4px;font-size:10.5px}
.gw-chip-dirty .gw-dot{background:var(--dsw-alias-state-warn-primary)}
.gw-chip-clean{font-size:10.5px;color:var(--dsw-alias-state-success-primary)}
.gw-chip-wrap{position:relative;display:inline-flex}
.gw-chip-pop{position:absolute;right:0;top:34px;width:290px;padding:10px;border-radius:10px;background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l1);box-shadow:0 16px 40px rgba(0,0,0,.35);z-index:40}
.gw-pop-head{display:flex;justify-content:space-between;gap:8px;align-items:baseline}
.gw-pop-title{font-weight:600;font-size:12px}
.gw-pop-stats{display:flex;gap:10px;font-size:11px;color:var(--dsw-alias-label-secondary);margin:6px 0 8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.gw-pop-actions{display:flex;gap:6px}
.gw-pop-actions .gw-btn{flex:1;justify-content:center;height:27px;font-size:11px}
.gw-pop-hint{margin-top:8px;font-size:10px;color:var(--dsw-alias-label-secondary);text-align:center}
@media (max-width:900px){.gw-left{width:320px;min-width:260px}.gw-sync-stats{gap:10px}}
/* ---------- polish: action group, badges, file rows, timeline, detail ---------- */
.gw-tone-info{color:color-mix(in srgb,var(--dsw-alias-brand-primary) 72%,var(--dsw-alias-state-warn-primary) 28%)}
.gw-actions{display:inline-flex;align-items:stretch;height:30px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;overflow:hidden;background:var(--dsw-alias-bg-layer-1)}
.gw-act{display:inline-flex;align-items:center;gap:6px;height:100%;padding:0 11px;border:0;border-right:1px solid var(--dsw-alias-border-l1);background:transparent;color:var(--dsw-alias-label-primary);font-family:inherit;font-size:12px;cursor:pointer;transition:background .12s}
.gw-act:last-child{border-right:0}
.gw-act:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2)}
.gw-act:disabled{opacity:.4;cursor:default}
.gw-act-primary{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base);font-weight:600;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--dsw-alias-brand-primary) 60%,transparent)}
.gw-act-primary:hover:not(:disabled){background:var(--dsw-alias-brand-primary);filter:brightness(1.07)}
.gw-act-count{min-width:16px;height:16px;padding:0 5px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;background:color-mix(in srgb,var(--dsw-alias-brand-primary) 16%,transparent);color:var(--dsw-alias-brand-primary)}
.gw-act-primary .gw-act-count{background:color-mix(in srgb,var(--dsw-alias-bg-base) 26%,transparent);color:var(--dsw-alias-bg-base)}
.gw-upstream{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10.5px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);padding:2px 7px;border-radius:999px;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gw-badges{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.gw-badge{display:inline-flex;align-items:center;gap:5px;height:24px;padding:0 9px;border-radius:999px;font-size:11px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);white-space:nowrap}
.gw-badge b{font-weight:650;font-variant-numeric:tabular-nums;color:inherit}
.gw-badge-dot{width:6px;height:6px;border-radius:50%;background:currentColor}
.gw-badge.is-zero{opacity:.45}
.gw-badge-success{background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 13%,transparent);color:var(--dsw-alias-state-success-primary)}
.gw-badge-warn{background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 14%,transparent);color:var(--dsw-alias-state-warn-primary)}
.gw-badge-danger{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 14%,transparent);color:var(--dsw-alias-state-error-primary)}
.gw-badge-info{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,transparent);color:color-mix(in srgb,var(--dsw-alias-brand-primary) 78%,var(--dsw-alias-state-warn-primary) 22%)}
.gw-diffstat{display:flex;gap:6px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;margin-left:2px}
.gw-ftype{flex:0 0 16px;width:16px;height:16px;border-radius:4px;display:inline-flex;align-items:center;justify-content:center;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:7.5px;font-weight:700;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary)}
.gw-ftype-ts{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 15%,transparent);color:var(--dsw-alias-brand-primary)}
.gw-ftype-js{background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 16%,transparent);color:var(--dsw-alias-state-warn-primary)}
.gw-ftype-json{background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 10%,transparent);color:var(--dsw-alias-state-warn-primary)}
.gw-ftype-md{background:color-mix(in srgb,var(--dsw-alias-label-secondary) 14%,transparent);color:var(--dsw-alias-label-secondary)}
.gw-ftype-css{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 10%,transparent);color:var(--dsw-alias-brand-primary)}
.gw-ftype-html{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 12%,transparent);color:var(--dsw-alias-state-error-primary)}
.gw-ftype-img{background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 14%,transparent);color:var(--dsw-alias-state-success-primary)}
.gw-ftype-cfg{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary)}
.gw-ftype-lock{background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 12%,transparent);color:var(--dsw-alias-state-warn-primary)}
.gw-st{flex:0 0 18px;width:18px;height:18px;border-radius:5px;display:inline-flex;align-items:center;justify-content:center;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;font-weight:700;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary)}
.gw-st-success{background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 15%,transparent);color:var(--dsw-alias-state-success-primary)}
.gw-st-warn{background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 16%,transparent);color:var(--dsw-alias-state-warn-primary)}
.gw-st-danger{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 15%,transparent);color:var(--dsw-alias-state-error-primary)}
.gw-st-info{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 14%,transparent);color:var(--dsw-alias-brand-primary)}
.gw-row{position:relative;padding-right:6px}
.gw-row-actions{display:inline-flex;gap:1px;opacity:0;transition:opacity .12s;flex:0 0 auto}
.gw-row:hover .gw-row-actions,.gw-row.is-selected .gw-row-actions{opacity:1}
.gw-icon-btn{width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;border:0;background:none;color:var(--dsw-alias-label-secondary);border-radius:5px;cursor:pointer;padding:0}
.gw-icon-btn:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.gw-icon-btn.is-danger:hover{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 14%,transparent);color:var(--dsw-alias-state-error-primary)}
.gw-input-wrap{position:relative}
.gw-textarea{padding-right:58px}
.gw-ai-btn{position:absolute;top:6px;right:6px;height:24px;padding:0 9px;border:0;border-radius:7px;display:inline-flex;align-items:center;gap:4px;font-family:inherit;font-size:10.5px;font-weight:650;color:var(--dsw-alias-bg-base);cursor:pointer;background:linear-gradient(135deg,var(--dsw-alias-brand-primary),color-mix(in srgb,var(--dsw-alias-brand-primary) 48%,var(--dsw-alias-state-warn-primary) 52%));box-shadow:0 2px 10px color-mix(in srgb,var(--dsw-alias-brand-primary) 32%,transparent)}
.gw-ai-btn:hover:not(:disabled){filter:brightness(1.08)}
.gw-ai-btn:disabled{opacity:.4;cursor:default;box-shadow:none}
.gw-spin-light{border-color:color-mix(in srgb,var(--dsw-alias-bg-base) 40%,transparent);border-top-color:var(--dsw-alias-bg-base)}
.gw-commit-btn{display:flex;align-items:center;justify-content:center;gap:7px;width:100%;height:34px;margin-top:10px;border:0;border-radius:8px;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base);font-family:inherit;font-size:12.5px;font-weight:650;cursor:pointer}
.gw-commit-btn:hover:not(:disabled){filter:brightness(1.07)}
.gw-commit-btn.is-disabled{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);cursor:default}
.gw-commit{display:flex;align-items:center;gap:10px;height:52px;padding:0 14px 0 6px;margin:0 6px;border-radius:0;cursor:pointer;position:relative;min-width:0}
.gw-commit:hover{background:var(--dsw-alias-bg-layer-1)}
.gw-commit.is-selected{background:var(--dsw-alias-bg-layer-2)}
.gw-node{position:relative;flex:0 0 14px;width:14px;align-self:stretch;display:flex;justify-content:center}
.gw-node-dot{width:9px;height:9px;border-radius:50%;background:var(--dsw-alias-brand-primary);border:2px solid var(--dsw-alias-bg-base);margin-top:10px;z-index:1;box-shadow:0 0 0 2px color-mix(in srgb,var(--dsw-alias-brand-primary) 16%,transparent)}
.gw-node-line{position:absolute;top:18px;bottom:-11px;left:50%;width:2px;transform:translateX(-50%);background:var(--dsw-alias-border-l1)}
.gw-graph-cell{flex:0 0 auto;display:flex;align-items:center;align-self:stretch}
.gw-graph-svg{display:block;overflow:visible}
.gw-file-name.gw-name-success{color:color-mix(in srgb,var(--dsw-alias-state-success-primary) 70%,var(--dsw-alias-label-primary) 30%)}
.gw-file-name.gw-name-danger{color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 78%,var(--dsw-alias-label-primary) 22%);text-decoration:line-through;text-decoration-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 50%,transparent)}
.gw-avatar{flex:0 0 22px;width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;margin-top:0;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary)}
.gw-avatar-a{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 18%,transparent);color:var(--dsw-alias-brand-primary)}
.gw-avatar-b{background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 16%,transparent);color:var(--dsw-alias-state-success-primary)}
.gw-avatar-c{background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 18%,transparent);color:var(--dsw-alias-state-warn-primary)}
.gw-avatar-d{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 15%,transparent);color:var(--dsw-alias-state-error-primary)}
.gw-avatar-e{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary)}
.gw-commit-main{flex:1;min-width:0}
.gw-commit-subject{font-size:12.5px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gw-commit-meta{display:flex;align-items:center;gap:6px;font-size:10.5px;color:var(--dsw-alias-label-secondary);margin-top:2px;flex-wrap:nowrap;overflow:hidden;white-space:nowrap;min-width:0}
.gw-sep{opacity:.45}
.gw-ref{display:inline-flex;align-items:center;height:16px;padding:0 6px;border-radius:999px;font-size:10px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);white-space:nowrap}
.gw-ref-branch{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 13%,transparent);color:var(--dsw-alias-brand-primary)}
.gw-ref-remote{background:color-mix(in srgb,color-mix(in srgb,var(--dsw-alias-brand-primary) 55%,var(--dsw-alias-state-warn-primary) 45%) 14%,transparent);color:color-mix(in srgb,var(--dsw-alias-brand-primary) 55%,var(--dsw-alias-state-warn-primary) 45%)}
.gw-ref-head{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base);font-weight:600}
.gw-ref-tag{background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 16%,transparent);color:var(--dsw-alias-state-warn-primary)}
.gw-sha{flex:0 0 auto;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10.5px;padding:2px 6px;border-radius:5px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);cursor:pointer;margin-top:0}
.gw-sha:hover{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 13%,transparent);color:var(--dsw-alias-label-primary)}
.gw-sha.is-static{cursor:default;margin-top:0}
.gw-detail{display:flex;flex-direction:column;flex:1;min-height:0}
.gw-detail-head{display:flex;align-items:center;gap:8px;padding:7px 14px;border-bottom:1px solid var(--dsw-alias-border-l1);flex:0 0 auto}
.gw-back{display:inline-flex;align-items:center;gap:3px;border:0;background:none;color:var(--dsw-alias-label-secondary);font-family:inherit;font-size:11.5px;cursor:pointer;padding:4px 6px;border-radius:6px}
.gw-back:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.gw-detail-summary{padding:12px 16px 10px;border-bottom:1px solid var(--dsw-alias-border-l1);flex:0 0 auto}
.gw-detail-subject{font-size:14px;font-weight:600;line-height:1.45}
.gw-detail-author{display:flex;align-items:center;gap:6px;margin-top:8px;font-size:11px;color:var(--dsw-alias-label-secondary)}
.gw-detail-author .gw-avatar{width:20px;height:20px;flex-basis:20px;margin-top:0}
.gw-detail-message{margin:10px 0 0;white-space:pre-wrap;font-family:inherit;font-size:12px;color:var(--dsw-alias-label-secondary);max-height:110px;overflow:auto}
.gw-detail-files{max-height:30%;overflow:auto;padding:6px;border-bottom:1px solid var(--dsw-alias-border-l1);flex:0 0 auto}
.gw-dfile{display:flex;align-items:center;gap:8px;width:100%;padding:5px 8px;border:0;background:none;border-radius:6px;color:var(--dsw-alias-label-primary);font-family:inherit;font-size:12px;cursor:pointer;text-align:left}
.gw-dfile:hover{background:var(--dsw-alias-bg-layer-1)}
.gw-dfile.is-active{background:var(--dsw-alias-bg-layer-2)}
.gw-dfile-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gw-detail-diff{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}
.gw-detail-diff .gw-diff-body{flex:1;min-height:0}
/* right-sidebar compact layout */
.gw-guide-art{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9px;background:color-mix(in srgb,var(--dsw-alias-brand-primary) 13%,transparent);color:var(--dsw-alias-brand-primary)}
.gw-compact .gw-head{padding:8px 10px;gap:8px}
.gw-compact .gw-title{font-size:13.5px}
.gw-compact .gw-head-main{gap:6px}
.gw-compact .gw-path{display:none}
.gw-compact .gw-actions{height:28px}
.gw-compact .gw-act{padding:0 8px;font-size:11px;gap:4px}
.gw-compact .gw-act-count{min-width:14px;height:14px;font-size:9.5px}
.gw-compact .gw-sync{grid-template-columns:1fr;padding:8px 10px;gap:8px}
.gw-compact .gw-sync-branch{gap:6px}
.gw-compact .gw-branch-name{font-size:13px}
.gw-compact .gw-upstream{max-width:170px}
.gw-compact .gw-badges{justify-content:flex-start;gap:5px}
.gw-compact .gw-badge{height:22px;padding:0 8px;font-size:10.5px}
.gw-compact .gw-tabs{padding:0 6px;gap:0}
.gw-compact .gw-tab{padding:7px 9px;font-size:11.5px}
.gw-compact .gw-compact-body{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}
.gw-compact .gw-compact-scroll{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column}
.gw-compact .gw-changes{flex:0 0 auto;max-height:none}
.gw-compact .gw-change-list{overflow:visible}
.gw-compact .gw-side{flex:0 0 auto;max-height:none}
.gw-compact .gw-side-list{overflow:visible}
.gw-compact .gw-row{padding-left:8px;padding-right:6px}
.gw-compact .gw-file-name{font-size:11.5px}
.gw-compact .gw-composer{padding:8px 10px 10px}
.gw-compact .gw-textarea{min-height:52px;max-height:110px;font-size:12px}
.gw-compact .gw-commit-btn{height:32px;margin-top:8px;font-size:12px}
.gw-compact .gw-status{padding:4px 10px 12px;font-size:10px}
.gw-compact .gw-status .gw-path{display:none}
.gw-compact .gw-pane-head{padding:6px 10px;min-height:32px}
.gw-compact .gw-commit{height:52px;padding:0 8px 0 2px;margin:0 2px;gap:6px}
.gw-compact .gw-commit-subject{font-size:12px}
.gw-compact .gw-sha{margin-top:1px;font-size:10px}
.gw-compact .gw-avatar{width:20px;height:20px;flex-basis:20px;font-size:9.5px}
.gw-compact .gw-detail-files{max-height:26%}
.gw-tab-count{min-width:16px;height:16px;padding:0 5px;margin-left:2px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);font-size:10px;display:inline-flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-secondary)}
.gw-tab-icon{display:inline-flex;align-items:center;flex:none;margin-right:5px;color:var(--dsw-alias-brand-primary)}
`;

    function injectStyles() {
      const style = document.createElement('style');
      style.setAttribute('data-dsh-plugin', '@local/dsh-sidebar-plus/git');
      style.textContent = CSS;
      document.head.appendChild(style);
      return () => {
        style.remove();
      };
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.effect(() => injectStyles());
        ctx.slots.inject('conversation.view', () => ctx.slots.register({
          name: 'conversation.view',
          id: 'git',
          order: 20,
          label: () => 'Git',
        }, GitViewSafe));
        ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
          name: 'conversation.session.header.actions',
          id: 'git-status',
          order: 15,
        }, ChipSafe));

        ctx.inject(['sidebarRightTabs', 'sidebarRight'], (scoped) => {
          scoped.effect(() => scoped.sidebarRightTabs.register({
            id: 'git-workbench',
            kind: 'git-workbench',
            multiple: false,
            keepMounted: true,
            priority: 'extension',
            title: () => 'Git',
            guide: [{
              id: 'git-workbench',
              order: 30,
              title: () => 'Git 工作台',
              description: () => '查看仓库状态、提交历史与 diff，并完成抓取、拉取、推送与提交。',
              icon: GitGuideArtwork,
            }],
          }), 'git-workbench: sidebar tab type');
          scoped.effect(
            () => scoped.slots.inject('sidebar.right.pane.tab', () => scoped.slots.register({
              name: 'sidebar.right.pane.tab',
              key: 'git-workbench',
            }, GitTabSafe)),
            'git-workbench: sidebar tab body',
          );
          scoped.effect(
            () => scoped.slots.inject('sidebar.right.pane.tab.title', () => scoped.slots.register({
              name: 'sidebar.right.pane.tab.title',
              key: 'git-workbench',
            }, GitTabTitle)),
            'git-workbench: sidebar tab title',
          );
        });
      },
    };
    })(React);

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        folderPlugin.apply(ctx);
        gitPlugin.apply(ctx);
      },
    };
  },
});
