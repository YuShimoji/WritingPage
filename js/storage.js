// ローカルストレージのキー
const STORAGE_KEYS = {
    CONTENT: 'zenWriter_content',
    SETTINGS: 'zenWriter_settings'
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
    useCustomColors: false
};

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
        exportText,
        DEFAULT_SETTINGS
    };
} else {
    // ブラウザ環境
    window.ZenWriterStorage = {
        saveContent,
        loadContent,
        saveSettings,
        loadSettings,
        exportText,
        DEFAULT_SETTINGS
    };
}
