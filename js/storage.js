// ローカルストレージのキー
const STORAGE_KEYS = {
  CONTENT: 'zenWriter_content',
  SETTINGS: 'zenWriter_settings',
  OUTLINE: 'zenWriter_outline',
  SNAPSHOTS: 'zenWriter_snapshots',
  DOCS: 'zenWriter_docs',
  CURRENT_DOC_ID: 'zenWriter_currentDocId',
  ASSETS: 'zenWriter_assets',
};

// デフォルト設定
const DEFAULT_SETTINGS = {
  theme: 'light',
  fontFamily: '"Noto Serif JP", serif',
  fontSize: 16,
  lineHeight: 1.6,
  bgColor: '#ffffff',
  textColor: '#333333',
  // カスタムカラーを適用するか（true のときだけCSS変数を上書き）
  useCustomColors: false,
  // ツールバー（文字数バー含む）の表示状態（初回は非表示）
  toolbarVisible: false,
  // 執筆目標
  goal: {
    target: 0, // 目標文字数（0 は未設定）
    deadline: null, // 'YYYY-MM-DD' または null
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
    fontSize: 14,
  },
  typewriter: {
    enabled: false,
    anchorRatio: 0.5,
    stickiness: 0.9,
  },
  snapshot: {
    intervalMs: 120000,
    deltaChars: 300,
    retention: 10,
  },
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
    content: content || '',
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
  const next = list.filter((s) => s.id !== id);
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
        const idx = docs.findIndex((d) => d && d.id === curId);
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
    } catch (e) {
      /* ignore */
    }
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
    Object.keys(parsed).forEach((key) => {
      parsed[key] = normalizeAsset(parsed[key]);
    });
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
  return (
    String(name || 'image')
      .replace(/[\/:*?"<>|]/g, '_')
      .replace(/[\x00-\x1F\x7F]/g, '_')
      .trim() || 'image'
  );
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
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image'))
    return null;
  const assets = loadAssets();
  const existing = findExistingAssetByDataUrl(assets, dataUrl);
  if (existing) {
    const normalized = normalizeAsset(existing);
    assets[normalized.id] = normalized;
    saveAssets(assets);
    return normalized;
  }
  const id =
    'asset_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  const name = sanitizeAssetName(meta.name || meta.fileName || 'image');
  const extensionMatch = (meta.name || meta.fileName || '').match(
    /\.([a-zA-Z0-9]+)$/,
  );
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
    order: meta.order || 0,
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
  return text.replace(
    /(!\[[^\]]*\])\((asset:\/\/([^\s)]+))\)/g,
    (match, label, _link, assetId) => {
      const asset = assets[assetId];
      if (!asset) return match;
      if (mode === 'relative-path' && asset.fileName) {
        return `${label}(assets/${asset.fileName})`;
      }
      return `${label}(${asset.dataUrl})`;
    },
  );
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
  } catch (e) {
    return null;
  }
}

function setCurrentDocId(id) {
  try {
    if (id) localStorage.setItem(STORAGE_KEYS.CURRENT_DOC_ID, id);
    else localStorage.removeItem(STORAGE_KEYS.CURRENT_DOC_ID);
    return true;
  } catch (e) {
    return false;
  }
}

function createDocument(name = '新規ドキュメント', content = '') {
  const docs = loadDocuments();
  const doc = {
    id: 'doc_' + Date.now(),
    name: String(name || '新規ドキュメント'),
    content: String(content || ''),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  docs.push(doc);
  saveDocuments(docs);
  return doc;
}

function updateDocumentContent(id, content) {
  const docs = loadDocuments();
  const idx = docs.findIndex((d) => d && d.id === id);
  if (idx < 0) return false;
  docs[idx].content = String(content || '');
  docs[idx].updatedAt = Date.now();
  saveDocuments(docs);
  // 現在ドキュメントなら CONTENT も同期
  if (getCurrentDocId() === id) {
    try {
      localStorage.setItem(STORAGE_KEYS.CONTENT, docs[idx].content);
    } catch (_) {}
  }
  return true;
}

function renameDocument(id, name) {
  const docs = loadDocuments();
  const idx = docs.findIndex((d) => d && d.id === id);
  if (idx < 0) return false;
  docs[idx].name = String(name || docs[idx].name || '無題');
  docs[idx].updatedAt = Date.now();
  saveDocuments(docs);
  return true;
}

function deleteDocument(id) {
  const docs = loadDocuments();
  const next = docs.filter((d) => d && d.id !== id);
  saveDocuments(next);
  if (getCurrentDocId() === id) setCurrentDocId(null);
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
      merged.typewriter = {
        ...DEFAULT_SETTINGS.typewriter,
        ...(parsed.typewriter || {}),
      };
      merged.snapshot = {
        ...DEFAULT_SETTINGS.snapshot,
        ...(parsed.snapshot || {}),
      };
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
    snapshot: { ...DEFAULT_SETTINGS.snapshot },
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

// モジュールとしてエクスポート
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
  };
}
