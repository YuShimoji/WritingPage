// ローカルストレージのキー
const STORAGE_KEYS = {
    CONTENT: 'zenWriter_content',
    SETTINGS: 'zenWriter_settings',
    OUTLINE: 'zenWriter_outline',
    SNAPSHOTS: 'zenWriter_snapshots',
    DOCS: 'zenWriter_docs',
    CURRENT_DOC_ID: 'zenWriter_currentDocId',
    ASSETS: 'zenWriter_assets',
    WIKI_PAGES: 'zenWriter_wiki_pages'
};

// デフォルト設定
const DEFAULT_SETTINGS = {
    theme: 'dark',
    fontFamily: '"Noto Serif JP", serif',
    fontSize: 16,
    lineHeight: 1.6,
    bgColor: '#1e1e1e',
    textColor: '#cccccc',
    // カスタムカラーを適用するか（true のときだけCSS変数を上書き）
    useCustomColors: false,
    // ツールバー（文字数バー含む）の表示状態（初回は非表示）
    toolbarVisible: true,
    // 執筆目標
    goal: {
        target: 0,       // 目標文字数（0 は未設定）
        deadline: null   // 'YYYY-MM-DD' または null
    },
    // ミニHUDの設定
    hud: {
        position: 'bottom-left', // 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
        duration: 1200,
        bg: '#000000',
        fg: '#ffffff',
        opacity: 0.75,
        message: '',
        pinned: false,
        width: 240,
        fontSize: 14
    },
    // タイプライターモード
    typewriter: {
        enabled: false,
        anchorRatio: 0.5,
        stickiness: 0.9
    },
    // フォーカスモード（現在行以外を減光/ぼかし）
    focusMode: {
        enabled: false,
        dimOpacity: 0.3,      // 減光の不透明度（0.0-1.0）
        blurRadius: 2         // ぼかしの半径（px、0でぼかし無効）
    },
    // オートセーブ & スナップショット
    snapshot: {
        intervalMs: 120000,
        deltaChars: 300,
        retention: 10
    },
    // プレビュー設定
    preview: {
        syncScroll: false
    },
    // 自動保存設定
    autoSave: {
        enabled: false,
        delayMs: 2000
    },
    // UI設定
    ui: {
        tabsPresentation: 'tabs', // 'buttons' | 'tabs' | 'dropdown' | 'accordion'
        sidebarWidth: 320,
        showWordCount: false,
        uiMode: 'normal', // 'normal' | 'focus' | 'blank'
        tabPlacement: 'left', // 'left' | 'right' | 'top' | 'bottom'
        tabOrder: [] // タブIDの配列（空の場合はデフォルト順序）
    },
    // エディタ設定
    editor: {
        wordWrap: {
            enabled: false,
            maxChars: 80 // 折り返し文字数
        },
        placeholder: ''
    },
    // エディタレイアウト設定
    editorLayout: {
        maxWidth: 0, // 0=全幅
        padding: 0,  // 0=余白なし
        marginBgColor: '#f5f5dc' // ベージュ
    },
    // Pomodoro/集中タイマー設定
    pomodoro: {
        workMinutes: 25,      // 作業時間（分）
        breakMinutes: 5,       // 休憩時間（分）
        customMinutes: 25      // カスタム時間のデフォルト（分）
    }
};

// ===== スナップショット（自動バックアップ） =====
function loadSnapshots() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.SNAPSHOTS);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('スナップショット読込エラー:', e);
        return [];
    }
}

function saveSnapshots(list) {
    try {
        localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(list));
        return true;
    } catch (e) {
        console.error('スナップショット保存エラー:', e);
        return false;
    }
}

function addSnapshot(content, maxKeep = 10) {
    const list = loadSnapshots();
    const snap = {
        id: 'snap_' + Date.now(),
        ts: Date.now(),
        len: (content || '').length,
        content: content || ''
    };
    list.push(snap);
    // 新しい順に並べ替えて上位 maxKeep 件に制限
    list.sort((a, b) => b.ts - a.ts);
    const trimmed = list.slice(0, Math.max(1, maxKeep));
    saveSnapshots(trimmed);
    return snap;
}

function deleteSnapshot(id) {
    const list = loadSnapshots();
    const next = list.filter(s => s.id !== id);
    saveSnapshots(next);
    return true;
}


/**
 * コンテンツをローカルストレージに保存
 * @param {string} content - 保存するテキスト
 */
function saveContent(content) {
    try {
        localStorage.setItem(STORAGE_KEYS.CONTENT, content);
        // 複数ドキュメント管理が有効な場合は、現在ドキュメントにも反映
        try {
            const curId = localStorage.getItem(STORAGE_KEYS.CURRENT_DOC_ID);
            if (curId) {
                const raw = localStorage.getItem(STORAGE_KEYS.DOCS);
                const docs = raw ? JSON.parse(raw) : [];
                const idx = docs.findIndex(d => d && d.id === curId);
                if (idx >= 0) {
                    const nextContent = content || '';
                    const prevContent = String(docs[idx].content || '');
                    docs[idx].content = nextContent;
                    if (prevContent !== nextContent) {
                        docs[idx].updatedAt = Date.now();
                    }
                    localStorage.setItem(STORAGE_KEYS.DOCS, JSON.stringify(docs));
                }
            }
        } catch (e) { /* ignore */ }
        return true;
    } catch (e) {
        console.error('保存中にエラーが発生しました:', e);
        return false;
    }
}

/**
 * アウトラインデータを保存
 * @param {Object} outline - セット一覧や現在のセットなどのオブジェクト
 */
function saveOutline(outline) {
    try {
        localStorage.setItem(STORAGE_KEYS.OUTLINE, JSON.stringify(outline));
        return true;
    } catch (e) {
        console.error('アウトライン保存中にエラーが発生しました:', e);
        return false;
    }
}

/**
 * アウトラインデータを読み込み
 * @returns {Object|null} 保存されていたアウトラインデータ、無ければ null
 */
function loadOutline() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.OUTLINE);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.error('アウトライン読込中にエラーが発生しました:', e);
        return null;
    }
}

/**
 * ローカルストレージからコンテンツを読み込む
 * @returns {string} 保存されていたテキスト、または空文字列
 */
function loadContent() {
    try {
        return localStorage.getItem(STORAGE_KEYS.CONTENT) || '';
    } catch (e) {
        console.error('読み込み中にエラーが発生しました:', e);
        return '';
    }
}

// ===== 画像アセット管理 =====
function normalizeAsset(asset) {
    if (!asset) return null;
    if (typeof asset.hidden !== 'boolean') asset.hidden = false;
    if (typeof asset.widthPercent !== 'number') asset.widthPercent = 60;
    if (!asset.alignment) asset.alignment = 'auto';
    if (typeof asset.order !== 'number') asset.order = 0;
    return asset;
}

function loadAssets() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.ASSETS);
        const parsed = raw ? JSON.parse(raw) : {};
        Object.keys(parsed).forEach(key => { parsed[key] = normalizeAsset(parsed[key]); });
        return parsed;
    } catch (e) {
        console.error('アセット読込エラー:', e);
        return {};
    }
}

function saveAssets(map) {
    try {
        localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(map || {}));
        return true;
    } catch (e) {
        console.error('アセット保存エラー:', e);
        return false;
    }
}

function sanitizeAssetName(name) {
    var s = String(name || 'image');
    var out = '';
    for (var i = 0; i < s.length; i++) {
        var ch = s.charAt(i);
        var code = ch.charCodeAt(0);
        if (code < 0x20 || code === 0x7f) { out += '_'; continue; }
        if (ch === '/' || ch === '\\' || ch === ':' || ch === '*' || ch === '?' || ch === '"' || ch === '<' || ch === '>' || ch === '|') { out += '_'; continue; }
        out += ch;
    }
    out = out.trim();
    return out || 'image';
}

function findExistingAssetByDataUrl(map, dataUrl) {
    const entries = Object.values(map || {});
    for (let i = 0; i < entries.length; i += 1) {
        if (entries[i] && entries[i].dataUrl === dataUrl) {
            return entries[i];
        }
    }
    return null;
}

function saveAssetFromDataUrl(dataUrl, meta = {}) {
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) return null;
    const assets = loadAssets();
    const existing = findExistingAssetByDataUrl(assets, dataUrl);
    if (existing) {
        const normalized = normalizeAsset(existing);
        assets[normalized.id] = normalized;
        saveAssets(assets);
        return normalized;
    }
    const id = 'asset_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const name = sanitizeAssetName(meta.name || meta.fileName || 'image');
    const extensionMatch = (meta.name || meta.fileName || '').match(/\.([a-zA-Z0-9]+)$/);
    const extension = extensionMatch ? extensionMatch[1].toLowerCase() : 'png';
    const fileName = `${id}.${extension}`;
    const asset = {
        id,
        name,
        fileName,
        type: meta.type || '',
        size: typeof meta.size === 'number' ? meta.size : null,
        dataUrl,
        createdAt: Date.now(),
        hidden: false,
        widthPercent: 60,
        alignment: 'auto',
        order: meta.order || 0
    };
    assets[id] = asset;
    saveAssets(assets);
    return asset;
}

function getAsset(id) {
    if (!id) return null;
    const assets = loadAssets();
    return assets[id] || null;
}

function deleteAsset(id) {
    const assets = loadAssets();
    if (!assets[id]) return false;
    delete assets[id];
    return saveAssets(assets);
}

function updateAssetMeta(id, patch) {
    if (!id) return null;
    const assets = loadAssets();
    const current = assets[id];
    if (!current) return null;
    const next = normalizeAsset(Object.assign({}, current, patch || {}));
    assets[id] = next;
    saveAssets(assets);
    return next;
}

function replaceAssetPlaceholders(text, mode = 'data-url') {
    if (typeof text !== 'string' || text.indexOf('asset://') === -1) return text;
    const assets = loadAssets();
    return text.replace(/(!\[[^\]]*\])\((asset:\/\/([^\s)]+))\)/g, (match, label, _link, assetId) => {
        const asset = assets[assetId];
        if (!asset) return match;
        if (mode === 'relative-path' && asset.fileName) {
            return `${label}(assets/${asset.fileName})`;
        }
        return `${label}(${asset.dataUrl})`;
    });
}

// ===== 複数ドキュメント管理 =====
function loadDocuments() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.DOCS);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('ドキュメント読込エラー:', e);
        return [];
    }
}

function saveDocuments(list) {
    try {
        localStorage.setItem(STORAGE_KEYS.DOCS, JSON.stringify(list || []));
        return true;
    } catch (e) {
        console.error('ドキュメント保存エラー:', e);
        return false;
    }
}

function getCurrentDocId() {
    try {
        return localStorage.getItem(STORAGE_KEYS.CURRENT_DOC_ID);
    } catch (e) { return null; }
}

function setCurrentDocId(id) {
    try {
        if (id) localStorage.setItem(STORAGE_KEYS.CURRENT_DOC_ID, id);
        else localStorage.removeItem(STORAGE_KEYS.CURRENT_DOC_ID);
        return true;
    } catch (e) { return false; }
}

function createDocument(name = '新規ドキュメント', content = '', parentId = null) {
    const docs = loadDocuments();
    const doc = {
        id: 'doc_' + Date.now(),
        type: 'document',
        name: String(name || '新規ドキュメント'),
        content: String(content || ''),
        parentId: parentId || null,
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    docs.push(doc);
    saveDocuments(docs);
    return doc;
}

/**
 * フォルダを作成
 * @param {string} name - フォルダ名
 * @param {string|null} parentId - 親フォルダID
 * @returns {Object} 作成されたフォルダ
 */
function createFolder(name = '新規フォルダ', parentId = null) {
    const docs = loadDocuments();
    const folder = {
        id: 'folder_' + Date.now(),
        type: 'folder',
        name: String(name || '新規フォルダ'),
        parentId: parentId || null,
        collapsed: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    docs.push(folder);
    saveDocuments(docs);
    return folder;
}

/**
 * アイテム（ドキュメントまたはフォルダ）を移動
 * @param {string} itemId - 移動するアイテムのID
 * @param {string|null} newParentId - 新しい親フォルダID
 * @returns {boolean} 成功したかどうか
 */
function moveItem(itemId, newParentId = null) {
    const docs = loadDocuments();
    const idx = docs.findIndex(d => d && d.id === itemId);
    if (idx < 0) return false;

    // 循環参照チェック
    if (newParentId && isDescendant(docs, itemId, newParentId)) {
        console.error('循環参照: フォルダを自分自身の子孫に移動できません');
        return false;
    }

    docs[idx].parentId = newParentId || null;
    docs[idx].updatedAt = Date.now();
    saveDocuments(docs);
    return true;
}

/**
 * フォルダの折りたたみ状態を切り替え
 * @param {string} folderId - フォルダID
 * @param {boolean|undefined} collapsed - 折りたたみ状態（未指定の場合はトグル）
 * @returns {boolean} 成功したかどうか
 */
function toggleFolderCollapsed(folderId, collapsed) {
    const docs = loadDocuments();
    const idx = docs.findIndex(d => d && d.id === folderId && d.type === 'folder');
    if (idx < 0) return false;

    docs[idx].collapsed = collapsed !== undefined ? collapsed : !docs[idx].collapsed;
    docs[idx].updatedAt = Date.now();
    saveDocuments(docs);
    return true;
}

/**
 * 階層構造を取得
 * @param {string|null} parentId - 親フォルダID（nullの場合はルート）
 * @returns {Array} 指定された親の子アイテム
 */
function getChildren(parentId = null) {
    const docs = loadDocuments();
    return docs.filter(d => d && (d.parentId === parentId || (!d.parentId && !parentId)));
}

/**
 * ツリー構造を構築
 * @returns {Array} ルートアイテムのツリー構造
 */
function buildTree() {
    const docs = loadDocuments();
    const tree = [];
    const idMap = new Map();

    // まず全アイテムをマップに登録
    docs.forEach(doc => {
        if (!doc) return;
        // 後方互換性: typeがない場合はdocumentとして扱う
        if (!doc.type) doc.type = 'document';
        idMap.set(doc.id, { ...doc, children: [] });
    });

    // 親子関係を構築
    docs.forEach(doc => {
        if (!doc) return;
        const item = idMap.get(doc.id);
        if (doc.parentId && idMap.has(doc.parentId)) {
            idMap.get(doc.parentId).children.push(item);
        } else {
            // 親がない場合はルートに追加
            tree.push(item);
        }
    });

    // フォルダを先に、ドキュメントを後にソート
    const sortItems = (items) => {
        return items.sort((a, b) => {
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;
            return (b.updatedAt || 0) - (a.updatedAt || 0);
        });
    };

    const sortTreeRecursive = (items) => {
        sortItems(items);
        items.forEach(item => {
            if (item.children && item.children.length > 0) {
                sortTreeRecursive(item.children);
            }
        });
    };

    sortTreeRecursive(tree);
    return tree;
}

/**
 * 子孫かどうかをチェック（循環参照防止用）
 * @param {Array} docs - 全ドキュメントリスト
 * @param {string} ancestorId - 祖先候補のID
 * @param {string} descendantId - 子孫候補のID
 * @returns {boolean} descendantIdがancestorIdの子孫である場合true
 */
function isDescendant(docs, ancestorId, descendantId) {
    if (ancestorId === descendantId) return true;

    const idMap = new Map();
    docs.forEach(d => { if (d) idMap.set(d.id, d); });

    let current = idMap.get(descendantId);
    while (current && current.parentId) {
        if (current.parentId === ancestorId) return true;
        current = idMap.get(current.parentId);
    }
    return false;
}

/**
 * データ移行: 既存のドキュメントに type と parentId を追加
 */
function migrateDocumentsToHierarchy() {
    const docs = loadDocuments();
    let migrated = false;

    docs.forEach(doc => {
        if (!doc) return;
        if (!doc.type) {
            doc.type = 'document';
            migrated = true;
        }
        if (doc.parentId === undefined) {
            doc.parentId = null;
            migrated = true;
        }
    });

    if (migrated) {
        saveDocuments(docs);
    }
    return migrated;
}

function updateDocumentContent(id, content) {
    const docs = loadDocuments();
    const idx = docs.findIndex(d => d && d.id === id);
    if (idx < 0) return false;
    docs[idx].content = String(content || '');
    docs[idx].updatedAt = Date.now();
    saveDocuments(docs);
    // 現在ドキュメントなら CONTENT も同期
    if (getCurrentDocId() === id) {
        try { localStorage.setItem(STORAGE_KEYS.CONTENT, docs[idx].content); } catch (e) { void e; }
    }
    return true;
}

function renameDocument(id, name) {
    const docs = loadDocuments();
    const idx = docs.findIndex(d => d && d.id === id);
    if (idx < 0) return false;
    docs[idx].name = String(name || docs[idx].name || '無題');
    docs[idx].updatedAt = Date.now();
    saveDocuments(docs);
    return true;
}

function deleteDocument(id) {
    const docs = loadDocuments();
    const item = docs.find(d => d && d.id === id);

    // フォルダの場合、子アイテムをルートに移動
    if (item && item.type === 'folder') {
        docs.forEach(d => {
            if (d && d.parentId === id) {
                d.parentId = item.parentId || null;
            }
        });
    }

    const next = docs.filter(d => d && d.id !== id);
    saveDocuments(next);
    if (getCurrentDocId() === id) setCurrentDocId(null);
    return true;
}

/**
 * フォルダとその中身を再帰的に削除
 * @param {string} folderId - フォルダID
 * @returns {boolean} 成功したかどうか
 */
function deleteFolderRecursive(folderId) {
    const docs = loadDocuments();
    const toDelete = new Set([folderId]);

    // 削除対象の子孫を収集
    const collectDescendants = (parentId) => {
        docs.forEach(d => {
            if (d && d.parentId === parentId) {
                toDelete.add(d.id);
                if (d.type === 'folder') {
                    collectDescendants(d.id);
                }
            }
        });
    };

    collectDescendants(folderId);

    // 削除対象を除外
    const next = docs.filter(d => d && !toDelete.has(d.id));
    saveDocuments(next);

    // 現在のドキュメントが削除対象なら解除
    if (toDelete.has(getCurrentDocId())) {
        setCurrentDocId(null);
    }

    return true;
}

/**
 * 設定をローカルストレージに保存
 * @param {Object} settings - 保存する設定オブジェクト
 */
function saveSettings(settings) {
    try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        return true;
    } catch (e) {
        console.error('設定の保存中にエラーが発生しました:', e);
        return false;
    }
}

/**
 * ローカルストレージから設定を読み込む
 * @returns {Object} 保存されていた設定、またはデフォルト設定
 */
function loadSettings() {
    try {
        const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (savedSettings) {
            // 既存保存データに新規キーが無い場合へ配慮しデフォルトをマージ
            const parsed = JSON.parse(savedSettings);
            const merged = { ...DEFAULT_SETTINGS, ...parsed };
            merged.goal = { ...DEFAULT_SETTINGS.goal, ...(parsed.goal || {}) };
            merged.hud = { ...DEFAULT_SETTINGS.hud, ...(parsed.hud || {}) };
            merged.typewriter = { ...DEFAULT_SETTINGS.typewriter, ...(parsed.typewriter || {}) };
            merged.focusMode = { ...DEFAULT_SETTINGS.focusMode, ...(parsed.focusMode || {}) };
            merged.snapshot = { ...DEFAULT_SETTINGS.snapshot, ...(parsed.snapshot || {}) };
            merged.preview = { ...DEFAULT_SETTINGS.preview, ...(parsed.preview || {}) };
            merged.autoSave = { ...DEFAULT_SETTINGS.autoSave, ...(parsed.autoSave || {}) };
            merged.ui = { ...DEFAULT_SETTINGS.ui, ...(parsed.ui || {}) };
            // タブ配置と順序のデフォルト値確保
            if (!merged.ui.tabPlacement) merged.ui.tabPlacement = DEFAULT_SETTINGS.ui.tabPlacement;
            if (!Array.isArray(merged.ui.tabOrder)) merged.ui.tabOrder = [];
            merged.editor = { ...DEFAULT_SETTINGS.editor, ...(parsed.editor || {}) };
            merged.editor.wordWrap = { ...DEFAULT_SETTINGS.editor.wordWrap, ...(parsed.editor?.wordWrap || {}) };
            return merged;
        }
    } catch (e) {
        console.error('設定の読み込み中にエラーが発生しました:', e);
    }
    return {
        ...DEFAULT_SETTINGS,
        goal: { ...DEFAULT_SETTINGS.goal },
        hud: { ...DEFAULT_SETTINGS.hud },
        typewriter: { ...DEFAULT_SETTINGS.typewriter },
        focusMode: { ...DEFAULT_SETTINGS.focusMode },
        snapshot: { ...DEFAULT_SETTINGS.snapshot },
        preview: { ...DEFAULT_SETTINGS.preview },
        autoSave: { ...DEFAULT_SETTINGS.autoSave },
        ui: { ...DEFAULT_SETTINGS.ui },
        editor: { ...DEFAULT_SETTINGS.editor }
    };
}

/**
 * テキストをファイルとしてエクスポート
 * @param {string} text - エクスポートするテキスト
 * @param {string} filename - ファイル名
 * @param {string} type - MIMEタイプ
 */
function exportText(text, filename, type = 'text/plain') {
    try {
        const resolved = replaceAssetPlaceholders(text, 'data-url');
        const blob = new Blob([resolved], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return true;
    } catch (e) {
        console.error('エクスポート中にエラーが発生しました:', e);
        return false;
    }
}

// ===== Wiki ページ管理 =====

/**
 * Wikiページを読み込み
 * @returns {Array} Wikiページの配列
 */
function loadWikiPages() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.WIKI_PAGES);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('Wikiページ読込エラー:', e);
        return [];
    }
}

/**
 * Wikiページを保存
 * @param {Array} pages - Wikiページの配列
 * @returns {boolean} 保存成功かどうか
 */
function saveWikiPages(pages) {
    try {
        localStorage.setItem(STORAGE_KEYS.WIKI_PAGES, JSON.stringify(pages || []));
        return true;
    } catch (e) {
        console.error('Wikiページ保存エラー:', e);
        return false;
    }
}

/**
 * 新しいWikiページを作成
 * @param {Object} pageData - ページデータ {title, content, tags}
 * @returns {Object} 作成されたページ
 */
function createWikiPage(pageData) {
    if (!pageData || typeof pageData !== 'object') {
        console.error('createWikiPage: 無効なページデータ');
        return null;
    }
    const pages = loadWikiPages();
    const page = {
        id: 'wiki_' + Date.now(),
        title: pageData.title || '無題',
        content: pageData.content || '',
        tags: Array.isArray(pageData.tags) ? pageData.tags : [],
        folder: typeof pageData.folder === 'string' ? pageData.folder : '',
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    pages.push(page);
    saveWikiPages(pages);
    return page;
}

/**
 * Wikiページを取得
 * @param {string} pageId - ページID
 * @returns {Object|null} ページデータまたはnull
 */
function getWikiPage(pageId) {
    const pages = loadWikiPages();
    return pages.find(p => p.id === pageId) || null;
}

/**
 * Wikiページを更新
 * @param {string} pageId - ページID
 * @param {Object} updates - 更新データ {title, content, tags}
 * @returns {boolean} 更新成功かどうか
 */
function updateWikiPage(pageId, updates) {
    const pages = loadWikiPages();
    const index = pages.findIndex(p => p.id === pageId);
    if (index === -1) return false;

    // id, createdAt は上書き禁止
    const { id: _id, createdAt: _ca, ...safeUpdates } = updates || {};
    pages[index] = {
        ...pages[index],
        ...safeUpdates,
        updatedAt: Date.now()
    };
    return saveWikiPages(pages);
}

/**
 * Wikiページを削除
 * @param {string} pageId - ページID
 * @returns {boolean} 削除成功かどうか
 */
function deleteWikiPage(pageId) {
    const pages = loadWikiPages();
    const filtered = pages.filter(p => p.id !== pageId);
    if (filtered.length === pages.length) return false;
    return saveWikiPages(filtered);
}

/**
 * Wikiページを一覧取得
 * @returns {Array} Wikiページの配列
 */
function listWikiPages() {
    return loadWikiPages();
}

/**
 * Wikiページを検索
 * @param {string} query - 検索クエリ
 * @returns {Array} 一致するページの配列
 */
function searchWikiPages(query) {
    if (!query || typeof query !== 'string') return listWikiPages();

    const pages = loadWikiPages();
    const lowerQuery = query.toLowerCase();

    return pages.filter(page => {
        const inTitle = String(page.title || '').toLowerCase().includes(lowerQuery);
        const inBody = String(page.content || '').toLowerCase().includes(lowerQuery);
        const inTags = Array.isArray(page.tags) && page.tags.some(tag => String(tag).toLowerCase().includes(lowerQuery));
        const inFolder = String(page.folder || '').toLowerCase().includes(lowerQuery);
        return inTitle || inBody || inTags || inFolder;
    });
}
if (typeof module !== 'undefined' && module.exports) {
    // Node.js環境
    module.exports = {
        saveContent,
        loadContent,
        saveSettings,
        loadSettings,
        saveOutline,
        loadOutline,
        exportText,
        // assets
        loadAssets,
        saveAssetFromDataUrl,
        getAsset,
        deleteAsset,
        updateAssetMeta,
        replaceAssetPlaceholders,
        DEFAULT_SETTINGS,
        // snapshots
        loadSnapshots,
        addSnapshot,
        deleteSnapshot,
        // docs
        loadDocuments,
        saveDocuments,
        getCurrentDocId,
        setCurrentDocId,
        createDocument,
        updateDocumentContent,
        renameDocument,
        deleteDocument,
        // hierarchy
        createFolder,
        moveItem,
        toggleFolderCollapsed,
        getChildren,
        buildTree,
        deleteFolderRecursive,
        migrateDocumentsToHierarchy,
        // wiki
        loadWikiPages,
        saveWikiPages,
        createWikiPage,
        getWikiPage,
        updateWikiPage,
        deleteWikiPage,
        listWikiPages,
        searchWikiPages
    };
} else {
    // ブラウザ環境
    window.ZenWriterStorage = {
        saveContent,
        loadContent,
        saveSettings,
        loadSettings,
        saveOutline,
        loadOutline,
        exportText,
        // assets
        loadAssets,
        saveAssetFromDataUrl,
        getAsset,
        deleteAsset,
        replaceAssetPlaceholders,
        DEFAULT_SETTINGS,
        // snapshots
        loadSnapshots,
        addSnapshot,
        deleteSnapshot,
        // docs
        loadDocuments,
        saveDocuments,
        getCurrentDocId,
        setCurrentDocId,
        createDocument,
        updateDocumentContent,
        renameDocument,
        deleteDocument,
        // hierarchy
        createFolder,
        moveItem,
        toggleFolderCollapsed,
        getChildren,
        buildTree,
        deleteFolderRecursive,
        migrateDocumentsToHierarchy,
        // wiki
        loadWikiPages,
        saveWikiPages,
        createWikiPage,
        getWikiPage,
        updateWikiPage,
        deleteWikiPage,
        listWikiPages,
        searchWikiPages
    };
}
