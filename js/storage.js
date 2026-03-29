// ローカルストレージのキー
const STORAGE_KEYS = {
    CONTENT: 'zenWriter_content',
    SETTINGS: 'zenWriter_settings',
    OUTLINE: 'zenWriter_outline',
    SNAPSHOTS: 'zenWriter_snapshots',
    DOCS: 'zenWriter_docs',
    CURRENT_DOC_ID: 'zenWriter_currentDocId',
    ASSETS: 'zenWriter_assets',
    WIKI_PAGES: 'zenWriter_wiki_pages',
    STORY_WIKI: 'zenWriter_story_wiki',
    STORY_WIKI_CATEGORIES: 'zenWriter_story_wiki_categories',
    STORY_WIKI_SETTINGS: 'zenWriter_story_wiki_settings'
};

// デフォルト設定
const DEFAULT_SETTINGS = {
    theme: 'dark',
    fontFamily: '"Noto Serif JP", serif',
    fontSize: 16,
    uiFontSize: 16,
    editorFontSize: 16,
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
        sidebarSettingsOpen: false, // 執筆集中サイドバー: 設定領域の開閉
        showWordCount: false,
        uiMode: 'focus', // 'normal' | 'focus' | 'reader'
        tabPlacement: 'left', // 'left' | 'right' | 'top' | 'bottom'
        tabOrder: [] // タブIDの配列（空の場合はデフォルト順序）
    },
    // エディタ設定
    editor: {
        richtextEnhanced: true,
        wordWrap: {
            enabled: false,
            maxChars: 80 // 折り返し文字数
        },
        canvas: {
            betaEnabled: false,
            enabled: false,
            panX: 0,
            panY: 0,
            zoom: 1
        },
        extendedTextbox: {
            enabled: true,
            defaultPreset: 'inner-voice',
            showSfxField: true,
            userPresets: []
        },
        textExpression: {
            enabled: true,
            tier: 1,
            fallbackMode: 'plain',
            realtimePreview: true
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
    },
    // 見出しタイポグラフィ設定
    heading: {
        preset: 'default',
        custom: {},
        userPresets: []
    },
    // 本文マイクロタイポグラフィ設定 (SP-057)
    microTypography: {
        letterSpacing: 0,        // em (-0.02 ~ 0.12)
        paragraphSpacing: 1,     // em (段落末尾マージン)
        paragraphIndent: 0,      // em (段落頭字下げ, 和文向け既定1em)
        lineBreakMode: 'normal'  // 'normal' | 'strict-ja'
    },
    // ルビ表示設定 (SP-059 Phase 2)
    ruby: {
        sizeRatio: 0.5,       // 0.3 ~ 0.7 (本文比)
        position: 'over',     // 'over' | 'under'
        visible: true
    }
};

// ===== スナップショット（自動バックアップ） =====
// SP-077: スナップショット メモリキャッシュ
var _snapsCache = null;
var _snapsCacheDirty = false;

function _flushSnapsToIDB() {
    if (!_snapsCacheDirty || !_snapsCache) return;
    if (window.ZenWriterIDB && window.ZenWriterIDB.isAvailable()) {
        _snapsCacheDirty = false;
        // 全件クリアして再投入
        window.ZenWriterIDB.clearSnapshots()
            .then(function () {
                var snaps = _snapsCache.slice();
                var tx = Promise.resolve();
                for (var i = 0; i < snaps.length; i++) {
                    (function (s) { tx = tx.then(function () { return window.ZenWriterIDB.addSnapshot(s); }); })(snaps[i]);
                }
                return tx;
            })
            .catch(function (e) {
                console.warn('[IDB] Snapshots flush error:', e);
                _snapsCacheDirty = true;
            });
    }
}

function loadSnapshots() {
    if (_snapsCache !== null) return _snapsCache;
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.SNAPSHOTS);
        _snapsCache = raw ? JSON.parse(raw) : [];
        return _snapsCache;
    } catch (e) {
        console.error('スナップショット読込エラー:', e);
        _snapsCache = [];
        return [];
    }
}

function saveSnapshots(list) {
    _snapsCache = list || [];
    _snapsCacheDirty = true;
    try {
        localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(_snapsCache));
    } catch (e) {
        if (window.ZenWriterIDB && window.ZenWriterIDB.isAvailable()) {
            console.warn('[Storage] localStorage quota exceeded for snapshots, using IDB only');
        } else {
            console.error('スナップショット保存エラー:', e);
            return false;
        }
    }
    setTimeout(_flushSnapsToIDB, 1000);
    return true;
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
        // _docsCache とも同期してキャッシュ不整合を防ぐ
        try {
            const curId = localStorage.getItem(STORAGE_KEYS.CURRENT_DOC_ID);
            if (curId) {
                // キャッシュ優先: _docsCache があればそこを更新、なければ localStorage から読む
                const docs = _docsCache || (function () {
                    const raw = localStorage.getItem(STORAGE_KEYS.DOCS);
                    return raw ? JSON.parse(raw) : [];
                })();
                const idx = docs.findIndex(d => d && d.id === curId);
                if (idx >= 0) {
                    const nextContent = content || '';
                    const prevContent = String(docs[idx].content || '');
                    docs[idx].content = nextContent;
                    if (prevContent !== nextContent) {
                        docs[idx].updatedAt = Date.now();
                    }
                    // キャッシュと localStorage の両方を更新
                    _docsCache = docs;
                    _docsCacheDirty = true;
                    try {
                        localStorage.setItem(STORAGE_KEYS.DOCS, JSON.stringify(docs));
                    } catch (lsErr) {
                        // localStorage 容量超過時は IDB に任せる
                        if (window.ZenWriterIDB && window.ZenWriterIDB.isAvailable()) {
                            console.warn('[Storage] saveContent: localStorage quota exceeded, IDB will sync');
                        }
                    }
                    _scheduleIDBFlush();
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

// SP-077: アセット メモリキャッシュ
var _assetsCache = null;
var _assetsCacheDirty = false;

function _flushAssetsToIDB() {
    if (!_assetsCacheDirty || !_assetsCache) return;
    if (window.ZenWriterIDB && window.ZenWriterIDB.isAvailable()) {
        _assetsCacheDirty = false;
        var keys = Object.keys(_assetsCache);
        var tx = Promise.resolve();
        for (var i = 0; i < keys.length; i++) {
            (function (asset) {
                tx = tx.then(function () { return window.ZenWriterIDB.putAsset(asset); });
            })(_assetsCache[keys[i]]);
        }
        tx.catch(function (e) {
            console.warn('[IDB] Assets flush error:', e);
            _assetsCacheDirty = true;
        });
    }
}

function loadAssets() {
    if (_assetsCache !== null) return _assetsCache;
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.ASSETS);
        const parsed = raw ? JSON.parse(raw) : {};
        Object.keys(parsed).forEach(key => { parsed[key] = normalizeAsset(parsed[key]); });
        _assetsCache = parsed;
        return _assetsCache;
    } catch (e) {
        console.error('アセット読込エラー:', e);
        _assetsCache = {};
        return {};
    }
}

function saveAssets(map) {
    _assetsCache = map || {};
    _assetsCacheDirty = true;
    try {
        localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(_assetsCache));
    } catch (e) {
        if (window.ZenWriterIDB && window.ZenWriterIDB.isAvailable()) {
            console.warn('[Storage] localStorage quota exceeded for assets, using IDB only');
        } else {
            console.error('アセット保存エラー:', e);
            return false;
        }
    }
    setTimeout(_flushAssetsToIDB, 1000);
    return true;
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

// SP-077: メモリキャッシュ (IndexedDB が利用可能ならキャッシュ経由)
var _docsCache = null;
var _docsCacheDirty = false;
var _idbFlushTimer = null;

function _flushDocsToIDB() {
    if (!_docsCacheDirty || !_docsCache) return;
    if (window.ZenWriterIDB && window.ZenWriterIDB.isAvailable()) {
        var docs = _docsCache.slice();
        _docsCacheDirty = false;
        // 全件 put (単純だが小規模では十分)
        var tx = Promise.resolve();
        for (var i = 0; i < docs.length; i++) {
            (function (doc) {
                tx = tx.then(function () { return window.ZenWriterIDB.putDoc(doc); });
            })(docs[i]);
        }
        tx.catch(function (e) {
            console.warn('[IDB] Flush error:', e);
            _docsCacheDirty = true; // リトライのためフラグを戻す
        });
    }
}

function _scheduleIDBFlush() {
    if (_idbFlushTimer) clearTimeout(_idbFlushTimer);
    _idbFlushTimer = setTimeout(_flushDocsToIDB, 2000);
}

/**
 * SP-077: IDB 初期化 — アプリ起動時に呼ぶ
 * IndexedDB を開き、localStorage からの移行を実行し、キャッシュを初期化する。
 * @returns {Promise<boolean>} IDB が利用可能かどうか
 */
function _initIDB() {
    if (!window.ZenWriterIDB) return Promise.resolve(false);
    return window.ZenWriterIDB.open()
        .then(function (opened) {
            if (!opened) return false;
            return window.ZenWriterIDB.migrateFromLocalStorage()
                .then(function (result) {
                    if (result.migrated) {
                        console.log('[Storage] IDB migration complete:', result.counts);
                    }
                    // IDB からキャッシュを初期化 (docs, assets, snapshots, wiki)
                    return Promise.all([
                        window.ZenWriterIDB.getAllDocs(),
                        window.ZenWriterIDB.getAllAssets(),
                        window.ZenWriterIDB.getSnapshots(),
                        window.ZenWriterIDB.getWikiPages()
                    ]);
                })
                .then(function (results) {
                    var docs = results[0], assets = results[1], snaps = results[2], wiki = results[3];
                    if (docs && docs.length > 0) _docsCache = docs;
                    if (assets && assets.length > 0) {
                        _assetsCache = {};
                        for (var i = 0; i < assets.length; i++) {
                            if (assets[i] && assets[i].id) _assetsCache[assets[i].id] = normalizeAsset(assets[i]);
                        }
                    }
                    if (snaps && snaps.length > 0) _snapsCache = snaps;
                    if (wiki && wiki.length > 0) _wikiCache = wiki;
                    return true;
                });
        })
        .catch(function (e) {
            console.warn('[Storage] IDB init failed, using localStorage:', e);
            return false;
        });
}

function loadDocuments() {
    // キャッシュがあればそこから返す
    if (_docsCache !== null) return _docsCache;
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.DOCS);
        _docsCache = raw ? JSON.parse(raw) : [];
        return _docsCache;
    } catch (e) {
        console.error('ドキュメント読込エラー:', e);
        _docsCache = [];
        return [];
    }
}

function saveDocuments(list) {
    _docsCache = list || [];
    _docsCacheDirty = true;
    try {
        localStorage.setItem(STORAGE_KEYS.DOCS, JSON.stringify(_docsCache));
    } catch (e) {
        // localStorage 容量超過 — IDB があれば IDB のみに保存
        if (window.ZenWriterIDB && window.ZenWriterIDB.isAvailable()) {
            console.warn('[Storage] localStorage quota exceeded, using IDB only');
        } else {
            console.error('ドキュメント保存エラー:', e);
            return false;
        }
    }
    _scheduleIDBFlush();
    return true;
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
        chapterMode: true,
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

function normalizeExtendedTextboxSettings(raw, rootSettings) {
    const defaults = DEFAULT_SETTINGS.editor.extendedTextbox;
    const next = { ...defaults, ...(raw || {}) };
    next.enabled = typeof next.enabled === 'boolean' ? next.enabled : defaults.enabled;
    next.showSfxField = typeof next.showSfxField === 'boolean' ? next.showSfxField : defaults.showSfxField;
    next.defaultPreset = typeof next.defaultPreset === 'string' ? next.defaultPreset : defaults.defaultPreset;
    next.userPresets = Array.isArray(next.userPresets) ? next.userPresets : [];

    const hasWindow = typeof window !== 'undefined';
    if (hasWindow && window.TextboxPresetRegistry && typeof window.TextboxPresetRegistry.list === 'function') {
        const list = window.TextboxPresetRegistry.list(rootSettings || {});
        const validIds = new Set(list.map(p => p.id));
        if (!validIds.has(next.defaultPreset)) {
            next.defaultPreset = defaults.defaultPreset;
        }
    }
    if (hasWindow && window.TextboxPresetRegistry && typeof window.TextboxPresetRegistry.MAX_USER_PRESETS === 'number') {
        const max = window.TextboxPresetRegistry.MAX_USER_PRESETS;
        next.userPresets = next.userPresets.slice(0, max);
    }
    return next;
}

function createDefaultSettingsSnapshot() {
    return {
        ...DEFAULT_SETTINGS,
        goal: { ...DEFAULT_SETTINGS.goal },
        hud: { ...DEFAULT_SETTINGS.hud },
        typewriter: { ...DEFAULT_SETTINGS.typewriter },
        focusMode: { ...DEFAULT_SETTINGS.focusMode },
        snapshot: { ...DEFAULT_SETTINGS.snapshot },
        preview: { ...DEFAULT_SETTINGS.preview },
        autoSave: { ...DEFAULT_SETTINGS.autoSave },
        ui: {
            ...DEFAULT_SETTINGS.ui,
            tabOrder: Array.isArray(DEFAULT_SETTINGS.ui.tabOrder) ? DEFAULT_SETTINGS.ui.tabOrder.slice() : []
        },
        editor: {
            ...DEFAULT_SETTINGS.editor,
            wordWrap: { ...DEFAULT_SETTINGS.editor.wordWrap },
            canvas: { ...DEFAULT_SETTINGS.editor.canvas },
            extendedTextbox: normalizeExtendedTextboxSettings({ ...DEFAULT_SETTINGS.editor.extendedTextbox }),
            textExpression: { ...DEFAULT_SETTINGS.editor.textExpression }
        },
        editorLayout: { ...DEFAULT_SETTINGS.editorLayout },
        pomodoro: { ...DEFAULT_SETTINGS.pomodoro },
        heading: { ...DEFAULT_SETTINGS.heading },
        microTypography: { ...DEFAULT_SETTINGS.microTypography },
        ruby: { ...DEFAULT_SETTINGS.ruby }
    };
}

function isPlainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

function normalizeSettingsShape(raw) {
    const parsed = isPlainObject(raw) ? raw : {};
    const defaults = createDefaultSettingsSnapshot();
    const merged = { ...defaults, ...parsed };
    merged.goal = { ...defaults.goal, ...(parsed.goal || {}) };
    merged.hud = { ...defaults.hud, ...(parsed.hud || {}) };
    merged.typewriter = { ...defaults.typewriter, ...(parsed.typewriter || {}) };
    merged.focusMode = { ...defaults.focusMode, ...(parsed.focusMode || {}) };
    merged.snapshot = { ...defaults.snapshot, ...(parsed.snapshot || {}) };
    merged.preview = { ...defaults.preview, ...(parsed.preview || {}) };
    merged.autoSave = { ...defaults.autoSave, ...(parsed.autoSave || {}) };
    merged.ui = { ...defaults.ui, ...(parsed.ui || {}) };
    if (!merged.ui.tabPlacement) merged.ui.tabPlacement = defaults.ui.tabPlacement;
    if (!Array.isArray(merged.ui.tabOrder)) merged.ui.tabOrder = [];
    merged.editor = { ...defaults.editor, ...(parsed.editor || {}) };
    merged.editor.wordWrap = { ...defaults.editor.wordWrap, ...(parsed.editor?.wordWrap || {}) };
    merged.editor.canvas = { ...defaults.editor.canvas, ...(parsed.editor?.canvas || {}) };
    // Canvas Mode は Phase 1 (30%) のためデフォルト OFF に強制
    merged.editor.canvas.betaEnabled = defaults.editor.canvas.betaEnabled;
    merged.editor.extendedTextbox = normalizeExtendedTextboxSettings(parsed.editor?.extendedTextbox || {}, merged);
    merged.editor.textExpression = { ...defaults.editor.textExpression, ...(parsed.editor?.textExpression || {}) };
    if (merged.editor.textExpression.fallbackMode !== 'backlog') {
        merged.editor.textExpression.fallbackMode = 'plain';
    }
    merged.editor.textExpression.tier = 1;
    merged.editor.textExpression.enabled = merged.editor.textExpression.enabled !== false;
    merged.editor.textExpression.realtimePreview = merged.editor.textExpression.realtimePreview !== false;
    merged.editorLayout = { ...defaults.editorLayout, ...(parsed.editorLayout || {}) };
    merged.pomodoro = { ...defaults.pomodoro, ...(parsed.pomodoro || {}) };
    merged.heading = { ...defaults.heading, ...(parsed.heading || {}) };
    if (!merged.heading.custom || typeof merged.heading.custom !== 'object') {
        merged.heading.custom = {};
    }
    if (!Array.isArray(merged.heading.userPresets)) {
        merged.heading.userPresets = [];
    }
    merged.microTypography = { ...defaults.microTypography, ...(parsed.microTypography || {}) };
    merged.ruby = { ...defaults.ruby, ...(parsed.ruby || {}) };

    // Font settings normalization (backward compatibility)
    if (typeof merged.fontSize !== 'number' || Number.isNaN(merged.fontSize)) {
        merged.fontSize = defaults.fontSize;
    }
    const hasParsedEditorFontSize = hasOwn(parsed, 'editorFontSize');
    const hasParsedUiFontSize = hasOwn(parsed, 'uiFontSize');
    if (!hasParsedEditorFontSize || typeof merged.editorFontSize !== 'number' || Number.isNaN(merged.editorFontSize)) {
        merged.editorFontSize = merged.fontSize;
    }
    if (!hasParsedUiFontSize || typeof merged.uiFontSize !== 'number' || Number.isNaN(merged.uiFontSize)) {
        merged.uiFontSize = merged.fontSize;
    }

    // Optional custom colors are removable from persisted settings.
    if (!hasOwn(parsed, 'bgColor')) delete merged.bgColor;
    if (!hasOwn(parsed, 'textColor')) delete merged.textColor;

    return merged;
}

function mergeSettings(base, patch) {
    const current = normalizeSettingsShape(base);
    if (!isPlainObject(patch)) {
        return current;
    }

    const merged = { ...current, ...patch };
    if (isPlainObject(patch.goal)) merged.goal = { ...current.goal, ...patch.goal };
    if (isPlainObject(patch.hud)) merged.hud = { ...current.hud, ...patch.hud };
    if (isPlainObject(patch.typewriter)) merged.typewriter = { ...current.typewriter, ...patch.typewriter };
    if (isPlainObject(patch.focusMode)) merged.focusMode = { ...current.focusMode, ...patch.focusMode };
    if (isPlainObject(patch.snapshot)) merged.snapshot = { ...current.snapshot, ...patch.snapshot };
    if (isPlainObject(patch.preview)) merged.preview = { ...current.preview, ...patch.preview };
    if (isPlainObject(patch.autoSave)) merged.autoSave = { ...current.autoSave, ...patch.autoSave };
    if (isPlainObject(patch.ui)) merged.ui = { ...current.ui, ...patch.ui };
    if (isPlainObject(patch.editorLayout)) merged.editorLayout = { ...current.editorLayout, ...patch.editorLayout };
    if (isPlainObject(patch.pomodoro)) merged.pomodoro = { ...current.pomodoro, ...patch.pomodoro };
    if (isPlainObject(patch.heading)) merged.heading = { ...current.heading, ...patch.heading };
    if (isPlainObject(patch.microTypography)) merged.microTypography = { ...current.microTypography, ...patch.microTypography };
    if (isPlainObject(patch.ruby)) merged.ruby = { ...current.ruby, ...patch.ruby };

    if (isPlainObject(patch.editor)) {
        merged.editor = { ...current.editor, ...patch.editor };
        if (isPlainObject(patch.editor.wordWrap)) {
            merged.editor.wordWrap = { ...current.editor.wordWrap, ...patch.editor.wordWrap };
        }
        if (isPlainObject(patch.editor.canvas)) {
            merged.editor.canvas = { ...current.editor.canvas, ...patch.editor.canvas };
        }
        if (isPlainObject(patch.editor.extendedTextbox)) {
            merged.editor.extendedTextbox = { ...current.editor.extendedTextbox, ...patch.editor.extendedTextbox };
        }
        if (isPlainObject(patch.editor.textExpression)) {
            merged.editor.textExpression = { ...current.editor.textExpression, ...patch.editor.textExpression };
        }
    }

    return normalizeSettingsShape(merged);
}

function isFullSettingsSnapshot(settings) {
    return isPlainObject(settings)
        && hasOwn(settings, 'theme')
        && hasOwn(settings, 'fontFamily')
        && hasOwn(settings, 'fontSize')
        && isPlainObject(settings.ui)
        && isPlainObject(settings.editor);
}

/**
 * 設定をローカルストレージに保存
 * @param {Object} settings - 保存する設定オブジェクト
 */
function saveSettings(settings) {
    try {
        const next = isFullSettingsSnapshot(settings)
            ? normalizeSettingsShape(settings)
            : mergeSettings(loadSettings(), settings);
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(next));
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
            const parsed = JSON.parse(savedSettings);
            return normalizeSettingsShape(parsed);
        }
    } catch (e) {
        console.error('設定の読み込み中にエラーが発生しました:', e);
    }
    return createDefaultSettingsSnapshot();
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

// ===== プロジェクト JSON 保存/読込 =====

/**
 * ドキュメント(+ 全章)を構造保持 JSON としてエクスポート
 * @param {string} docId - 対象ドキュメントID
 * @returns {boolean} 成功/失敗
 */
function exportProjectJSON(docId) {
    try {
        const docs = loadDocuments();
        const doc = docs.find(d => d.id === docId && d.type === 'document');
        if (!doc) {
            console.error('ドキュメントが見つかりません:', docId);
            return false;
        }

        const chapters = docs
            .filter(d => d.type === 'chapter' && d.parentId === docId)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        const pages = chapters.map(ch => ({
            title: ch.name || '',
            content: ch.content || '',
            order: ch.order || 0,
            level: ch.level || 2,
            visibility: ch.visibility || 'visible',
            metadata: ch.metadata || {}
        }));

        const project = {
            format: 'zenwriter-v1',
            version: (window.ZEN_WRITER_VERSION || '0.3.29'),
            document: {
                name: doc.name || '',
                chapterMode: doc.chapterMode !== false,
                createdAt: doc.createdAt || null,
                updatedAt: doc.updatedAt || null
            },
            pages: pages,
            exportedAt: new Date().toISOString()
        };

        const json = JSON.stringify(project, null, 2);
        const filename = (doc.name || 'untitled') + '.zwp.json';
        const blob = new Blob([json], { type: 'application/json' });
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
        console.error('プロジェクト JSON エクスポート中にエラー:', e);
        return false;
    }
}

/**
 * JSON ファイルからプロジェクトをインポート
 * @param {string} jsonString - JSON 文字列
 * @returns {string|null} 作成されたドキュメントID、失敗時 null
 */
function importProjectJSON(jsonString) {
    try {
        const project = JSON.parse(jsonString);

        if (!project.format || !project.format.startsWith('zenwriter-')) {
            console.error('未対応のフォーマット:', project.format);
            return null;
        }

        const docName = (project.document && project.document.name) || '読み込みドキュメント';
        const doc = createDocument(docName);
        if (!doc) return null;

        // chapterMode を設定
        const docs = loadDocuments();
        const docRecord = docs.find(d => d.id === doc.id);
        if (docRecord) {
            docRecord.chapterMode = project.document ? project.document.chapterMode !== false : true;
            if (project.document && project.document.createdAt) {
                docRecord.createdAt = project.document.createdAt;
            }
        }

        // createDocument が作った空の初期章を削除
        const emptyChapters = docs.filter(d => d.type === 'chapter' && d.parentId === doc.id);
        for (const ch of emptyChapters) {
            const idx = docs.indexOf(ch);
            if (idx >= 0) docs.splice(idx, 1);
        }

        // ページ(章)を復元
        const pages = project.pages || [];
        const now = Date.now();
        for (let i = 0; i < pages.length; i++) {
            const p = pages[i];
            docs.push({
                id: 'ch_' + now + '_' + Math.random().toString(36).slice(2, 8),
                type: 'chapter',
                parentId: doc.id,
                name: p.title || ('ページ ' + (i + 1)),
                content: p.content || '',
                order: typeof p.order === 'number' ? p.order : i,
                level: p.level || 2,
                visibility: p.visibility || 'visible',
                metadata: p.metadata || {},
                createdAt: now,
                updatedAt: now
            });
        }

        saveDocuments(docs);
        return doc.id;
    } catch (e) {
        console.error('プロジェクト JSON インポート中にエラー:', e);
        return null;
    }
}

/**
 * ファイル選択ダイアログを開いて JSON プロジェクトをインポート
 * @returns {Promise<string|null>} 作成されたドキュメントID
 */
function importProjectJSONFromFile() {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.zwp.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) { resolve(null); return; }
            const reader = new FileReader();
            reader.onload = (ev) => {
                const docId = importProjectJSON(ev.target.result);
                resolve(docId);
            };
            reader.onerror = () => resolve(null);
            reader.readAsText(file);
        };
        input.click();
    });
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

// ─── Story Wiki (新設計) ───────────────────────────

const STORY_WIKI_PRESET_CATEGORIES = [
    { id: 'character', label: 'キャラクター', icon: 'user', isPreset: true },
    { id: 'location', label: '場所', icon: 'map-pin', isPreset: true },
    { id: 'item', label: 'アイテム', icon: 'gem', isPreset: true },
    { id: 'organization', label: '組織', icon: 'users', isPreset: true },
    { id: 'term', label: '用語', icon: 'book-open', isPreset: true },
    { id: 'event', label: 'イベント', icon: 'calendar', isPreset: true },
    { id: 'concept', label: '概念', icon: 'lightbulb', isPreset: true }
];

// SP-077: Story Wiki メモリキャッシュ
var _wikiCache = null;
var _wikiCacheDirty = false;

function _flushWikiToIDB() {
    if (!_wikiCacheDirty || !_wikiCache) return;
    if (window.ZenWriterIDB && window.ZenWriterIDB.isAvailable()) {
        _wikiCacheDirty = false;
        var entries = _wikiCache.slice();
        var tx = Promise.resolve();
        for (var i = 0; i < entries.length; i++) {
            (function (e) { tx = tx.then(function () { return window.ZenWriterIDB.putWikiPage(e); }); })(entries[i]);
        }
        tx.catch(function (e) {
            console.warn('[IDB] Wiki flush error:', e);
            _wikiCacheDirty = true;
        });
    }
}

function loadStoryWiki() {
    if (_wikiCache !== null) return _wikiCache;
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.STORY_WIKI);
        _wikiCache = raw ? JSON.parse(raw) : [];
        return _wikiCache;
    } catch (e) {
        console.error('StoryWiki読込エラー:', e);
        _wikiCache = [];
        return [];
    }
}

function saveStoryWiki(entries) {
    _wikiCache = entries || [];
    _wikiCacheDirty = true;
    try {
        localStorage.setItem(STORAGE_KEYS.STORY_WIKI, JSON.stringify(_wikiCache));
    } catch (e) {
        if (window.ZenWriterIDB && window.ZenWriterIDB.isAvailable()) {
            console.warn('[Storage] localStorage quota exceeded for wiki, using IDB only');
        } else {
            console.error('StoryWiki保存エラー:', e);
            return false;
        }
    }
    setTimeout(_flushWikiToIDB, 2000);
    return true;
}

function loadStoryWikiCategories() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.STORY_WIKI_CATEGORIES);
        const custom = raw ? JSON.parse(raw) : [];
        return STORY_WIKI_PRESET_CATEGORIES.concat(custom);
    } catch (e) {
        console.error('StoryWikiカテゴリ読込エラー:', e);
        return STORY_WIKI_PRESET_CATEGORIES.slice();
    }
}

function saveStoryWikiCustomCategories(categories) {
    try {
        const custom = (categories || []).filter(function (c) { return !c.isPreset; });
        localStorage.setItem(STORAGE_KEYS.STORY_WIKI_CATEGORIES, JSON.stringify(custom));
        return true;
    } catch (e) {
        console.error('StoryWikiカテゴリ保存エラー:', e);
        return false;
    }
}

function loadStoryWikiSettings() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.STORY_WIKI_SETTINGS);
        var defaults = { autoDetect: true, ignoredTerms: [] };
        if (!raw) return defaults;
        var parsed = JSON.parse(raw);
        return Object.assign(defaults, parsed);
    } catch (e) {
        return { autoDetect: true, ignoredTerms: [] };
    }
}

function saveStoryWikiSettings(settings) {
    try {
        localStorage.setItem(STORAGE_KEYS.STORY_WIKI_SETTINGS, JSON.stringify(settings || {}));
        return true;
    } catch (e) {
        return false;
    }
}

function createStoryWikiEntry(data) {
    if (!data || typeof data !== 'object') return null;
    var entries = loadStoryWiki();
    var entry = {
        id: 'swiki_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        title: data.title || '無題',
        category: data.category || 'term',
        aliases: Array.isArray(data.aliases) ? data.aliases : [],
        content: data.content || '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        relatedIds: Array.isArray(data.relatedIds) ? data.relatedIds : [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        source: data.source || 'manual'
    };
    entries.push(entry);
    saveStoryWiki(entries);
    return entry;
}

function getStoryWikiEntry(entryId) {
    var entries = loadStoryWiki();
    return entries.find(function (e) { return e.id === entryId; }) || null;
}

function updateStoryWikiEntry(entryId, updates) {
    var entries = loadStoryWiki();
    var idx = entries.findIndex(function (e) { return e.id === entryId; });
    if (idx === -1) return null;
    var entry = entries[idx];
    if (updates.title !== undefined) entry.title = updates.title;
    if (updates.category !== undefined) entry.category = updates.category;
    if (updates.aliases !== undefined) entry.aliases = updates.aliases;
    if (updates.content !== undefined) entry.content = updates.content;
    if (updates.tags !== undefined) entry.tags = updates.tags;
    if (updates.relatedIds !== undefined) entry.relatedIds = updates.relatedIds;
    entry.updatedAt = Date.now();
    entries[idx] = entry;
    saveStoryWiki(entries);
    return entry;
}

function deleteStoryWikiEntry(entryId) {
    var entries = loadStoryWiki();
    var filtered = entries.filter(function (e) { return e.id !== entryId; });
    if (filtered.length === entries.length) return false;
    saveStoryWiki(filtered);
    return true;
}

function searchStoryWiki(query) {
    var entries = loadStoryWiki();
    if (!query || typeof query !== 'string') return entries;
    var lq = query.toLowerCase();
    return entries.filter(function (e) {
        var inTitle = String(e.title || '').toLowerCase().includes(lq);
        var inAliases = Array.isArray(e.aliases) && e.aliases.some(function (a) { return String(a).toLowerCase().includes(lq); });
        var inContent = String(e.content || '').toLowerCase().includes(lq);
        var inTags = Array.isArray(e.tags) && e.tags.some(function (t) { return String(t).toLowerCase().includes(lq); });
        return inTitle || inAliases || inContent || inTags;
    });
}

function getStoryWikiByCategory(categoryId) {
    var entries = loadStoryWiki();
    if (!categoryId) return entries;
    return entries.filter(function (e) { return e.category === categoryId; });
}

function getStoryWikiCategoryCounts() {
    var entries = loadStoryWiki();
    var counts = {};
    entries.forEach(function (e) {
        var cat = e.category || 'term';
        counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
}

function migrateOldWikiToStoryWiki() {
    var existing = loadStoryWiki();
    if (existing.length > 0) return false; // 既にデータがある場合はスキップ
    var oldPages = loadWikiPages();
    if (!oldPages || oldPages.length === 0) return false;
    var migrated = oldPages.map(function (page) {
        return {
            id: 'swiki_migrated_' + (page.id || Date.now() + '_' + Math.random().toString(36).slice(2, 8)),
            title: page.title || '無題',
            category: 'term',
            aliases: [],
            content: page.content || '',
            tags: Array.isArray(page.tags) ? page.tags : [],
            relatedIds: [],
            createdAt: page.createdAt || Date.now(),
            updatedAt: page.updatedAt || Date.now(),
            source: 'manual'
        };
    });
    saveStoryWiki(migrated);
    return true;
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
        exportProjectJSON,
        importProjectJSON,
        importProjectJSONFromFile,
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
        searchWikiPages,
        // story wiki
        loadStoryWiki,
        saveStoryWiki,
        loadStoryWikiCategories,
        saveStoryWikiCustomCategories,
        loadStoryWikiSettings,
        saveStoryWikiSettings,
        createStoryWikiEntry,
        getStoryWikiEntry,
        updateStoryWikiEntry,
        deleteStoryWikiEntry,
        searchStoryWiki,
        getStoryWikiByCategory,
        getStoryWikiCategoryCounts,
        migrateOldWikiToStoryWiki,
        STORY_WIKI_PRESET_CATEGORIES
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
        exportProjectJSON,
        importProjectJSON,
        importProjectJSONFromFile,
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
        // SP-077: IDB 初期化
        initIDB: _initIDB,
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
        searchWikiPages,
        // story wiki
        loadStoryWiki,
        saveStoryWiki,
        loadStoryWikiCategories,
        saveStoryWikiCustomCategories,
        loadStoryWikiSettings,
        saveStoryWikiSettings,
        createStoryWikiEntry,
        getStoryWikiEntry,
        updateStoryWikiEntry,
        deleteStoryWikiEntry,
        searchStoryWiki,
        getStoryWikiByCategory,
        getStoryWikiCategoryCounts,
        migrateOldWikiToStoryWiki,
        STORY_WIKI_PRESET_CATEGORIES
    };
}
