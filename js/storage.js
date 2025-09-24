// ローカルストレージのキー
const STORAGE_KEYS = {
    CONTENT: 'zenWriter_content',
    SETTINGS: 'zenWriter_settings',
    OUTLINE: 'zenWriter_outline',
    SNAPSHOTS: 'zenWriter_snapshots'
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
    // ミニHUDの設定
    hud: {
        position: 'bottom-left', // 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
        duration: 1200,
        bg: '#000000',
        fg: '#ffffff',
        opacity: 0.75
    }
};

// ===== スナップショット（自動バックアップ） =====
function loadSnapshots(){
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.SNAPSHOTS);
        return raw ? JSON.parse(raw) : [];
    } catch(e){
        console.error('スナップショット読込エラー:', e);
        return [];
    }
}

function saveSnapshots(list){
    try {
        localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(list));
        return true;
    } catch(e){
        console.error('スナップショット保存エラー:', e);
        return false;
    }
}

function addSnapshot(content, maxKeep = 10){
    const list = loadSnapshots();
    const snap = {
        id: 'snap_' + Date.now(),
        ts: Date.now(),
        len: (content || '').length,
        content: content || ''
    };
    list.push(snap);
    // 新しい順に並べ替えて上位 maxKeep 件に制限
    list.sort((a,b)=> b.ts - a.ts);
    const trimmed = list.slice(0, Math.max(1, maxKeep));
    saveSnapshots(trimmed);
    return snap;
}

function deleteSnapshot(id){
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
            return { ...DEFAULT_SETTINGS, ...parsed };
        }
    } catch (e) {
        console.error('設定の読み込み中にエラーが発生しました:', e);
    }
    return { ...DEFAULT_SETTINGS };
}

/**
 * テキストをファイルとしてエクスポート
 * @param {string} text - エクスポートするテキスト
 * @param {string} filename - ファイル名
 * @param {string} type - MIMEタイプ
 */
function exportText(text, filename, type = 'text/plain') {
    try {
        const blob = new Blob([text], { type });
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
        DEFAULT_SETTINGS,
        // snapshots
        loadSnapshots,
        addSnapshot,
        deleteSnapshot
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
        DEFAULT_SETTINGS,
        // snapshots
        loadSnapshots,
        addSnapshot,
        deleteSnapshot
    };
}
