// エディタ管理クラス
class EditorManager {
    constructor() {
        this.editor = document.getElementById('editor');
        this.wordCountElement = document.querySelector('.word-count');
        // 自動スナップショット用の状態
        this._lastSnapTs = 0;
        this._lastSnapLen = 0;
        this.SNAPSHOT_MIN_INTERVAL = 120000; // 2分
        this.SNAPSHOT_MIN_DELTA = 300; // 300文字以上の変化
        this.setupEventListeners();
        this.loadContent();
        this.updateWordCount();
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // コンテンツ変更時の自動保存
        this.editor.addEventListener('input', () => {
            this.saveContent();
            this.updateWordCount();
            this.maybeAutoSnapshot();
        });

        // タブキーでインデント
        this.editor.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                this.insertTextAtCursor('\t');
            }
        });

        // 保存ショートカット (Ctrl+S or Cmd+S)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveContent();
                this.showNotification('保存しました');
            }

            // フォントサイズ調整ショートカット
            if (e.ctrlKey || e.metaKey) {
                if (e.key === '+' || e.key === '=') {
                    e.preventDefault();
                    this.adjustGlobalFontSize(1);
                } else if (e.key === '-') {
                    e.preventDefault();
                    this.adjustGlobalFontSize(-1);
                } else if (e.key === '0') {
                    e.preventDefault();
                    const defaults = window.ZenWriterStorage.DEFAULT_SETTINGS;
                    this.setGlobalFontSize(defaults.fontSize);
                }
            }
        });
    }

    /**
     * カーソル位置にテキストを挿入
     * @param {string} text - 挿入するテキスト
     */
    insertTextAtCursor(text) {
        const start = this.editor.selectionStart;
        const end = this.editor.selectionEnd;
        const before = this.editor.value.substring(0, start);
        const after = this.editor.value.substring(end, this.editor.value.length);
        
        this.editor.value = before + text + after;
        const newPos = start + text.length;
        this.editor.selectionStart = newPos;
        this.editor.selectionEnd = newPos;
        this.editor.focus();
        
        this.saveContent();
        this.updateWordCount();
    }

    /**
     * コンテンツをローカルストレージに保存
     */
    saveContent() {
        window.ZenWriterStorage.saveContent(this.editor.value);
    }

    maybeAutoSnapshot(){
        if (!window.ZenWriterStorage || !window.ZenWriterStorage.addSnapshot) return;
        const now = Date.now();
        const len = (this.editor.value || '').length;
        if (this._lastSnapTs === 0) {
            // 初回基準
            this._lastSnapTs = now;
            this._lastSnapLen = len;
            return;
        }
        const dt = now - this._lastSnapTs;
        const dlen = Math.abs(len - this._lastSnapLen);
        if (dt >= this.SNAPSHOT_MIN_INTERVAL && dlen >= this.SNAPSHOT_MIN_DELTA) {
            window.ZenWriterStorage.addSnapshot(this.editor.value);
            this._lastSnapTs = now;
            this._lastSnapLen = len;
            if (typeof this.showNotification === 'function') {
                this.showNotification('自動バックアップを保存しました');
            }
        }
    }

    /**
     * ローカルストレージからコンテンツを読み込み
     */
    loadContent() {
        const savedContent = window.ZenWriterStorage.loadContent();
        if (savedContent) {
            this.editor.value = savedContent;
        }
    }

    /**
     * エディタ内容を置き換える（読み込み時など）
     * @param {string} text
     */
    setContent(text) {
        this.editor.value = text || '';
        this.saveContent();
        this.updateWordCount();
    }

    /**
     * 新しいドキュメントを作成
     */
    newDocument() {
        if (confirm('現在の内容を破棄して新規ドキュメントを作成しますか？')) {
            this.editor.value = '';
            this.saveContent();
            this.updateWordCount();
        }
    }

    /**
     * テキストとしてエクスポート
     */
    exportAsText() {
        const content = this.editor.value || ' ';
        const filename = `zenwriter_${this.getFormattedDate()}.txt`;
        window.ZenWriterStorage.exportText(content, filename, 'text/plain');
    }

    /**
     * Markdownとしてエクスポート
     */
    exportAsMarkdown() {
        const content = this.editor.value || ' ';
        const filename = `zenwriter_${this.getFormattedDate()}.md`;
        window.ZenWriterStorage.exportText(content, filename, 'text/markdown');
    }

    /**
     * 現在日時をフォーマット
     * @returns {string} フォーマットされた日時文字列 (YYYYMMDD_HHMMSS)
     */
    getFormattedDate() {
        const now = new Date();
        const pad = (num) => num.toString().padStart(2, '0');
        
        const year = now.getFullYear();
        const month = pad(now.getMonth() + 1);
        const day = pad(now.getDate());
        const hours = pad(now.getHours());
        const minutes = pad(now.getMinutes());
        const seconds = pad(now.getSeconds());
        
        return `${year}${month}${day}_${hours}${minutes}${seconds}`;
    }

    /**
     * 文字数を更新
     */
    updateWordCount() {
        const text = this.editor.value;
        const charCount = text.length;
        const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        
        this.wordCountElement.textContent = `${charCount} 文字 / ${wordCount} 語`;
        // ミニHUDに一時表示（ツールバー非表示時のみ）
        if (window.ZenWriterHUD) {
            const toolbarHidden = document.body.classList.contains('toolbar-hidden') ||
                                  document.documentElement.getAttribute('data-toolbar-hidden') === 'true';
            if (toolbarHidden && typeof window.ZenWriterHUD.publish === 'function') {
                // HUD 設定の既定時間に従う（durationを渡さない）
                window.ZenWriterHUD.publish(`${charCount} 文字 / ${wordCount} 語`);
            } else if (!toolbarHidden && typeof window.ZenWriterHUD.hide === 'function') {
                window.ZenWriterHUD.hide();
            }
        }
    }

    /**
     * 通知を表示
     * @param {string} message - 表示するメッセージ
     * @param {number} duration - 表示時間 (ミリ秒)
     */
    showNotification(message, duration = 2000) {
        // 既存の通知を削除
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // 通知要素を作成
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        // スタイルを適用
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        notification.style.color = 'white';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '4px';
        notification.style.zIndex = '1000';
        notification.style.transition = 'opacity 0.3s';
        
        // ドキュメントに追加
        document.body.appendChild(notification);
        
        // アニメーション用に少し遅らせる
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        // 指定時間後に削除
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, duration);
    }

    /**
     * 現在の設定に対してフォントサイズを増減
     * @param {number} delta 正または負の増分
     */
    adjustGlobalFontSize(delta) {
        const settings = window.ZenWriterStorage.loadSettings();
        const next = this.clampFontSize((settings.fontSize || 16) + delta);
        this.setGlobalFontSize(next);
    }

    /**
     * フォントサイズを指定値に設定し、関連UIを同期
     * @param {number} sizePx
     */
    setGlobalFontSize(sizePx) {
        const settings = window.ZenWriterStorage.loadSettings();
        const next = this.clampFontSize(sizePx);
        window.ZenWriterTheme.applyFontSettings(
            settings.fontFamily,
            next,
            settings.lineHeight
        );
        // UI同期（存在する場合）
        const sidebarRange = document.getElementById('font-size');
        const sidebarValue = document.getElementById('font-size-value');
        if (sidebarRange) sidebarRange.value = next;
        if (sidebarValue) sidebarValue.textContent = next;
        const panelRange = document.getElementById('global-font-size');
        const panelNumber = document.getElementById('global-font-size-number');
        if (panelRange) panelRange.value = next;
        if (panelNumber) panelNumber.value = next;
    }

    clampFontSize(px) {
        return Math.min(48, Math.max(12, Math.round(px)));
    }
}

// グローバルオブジェクトに追加
window.ZenWriterEditor = new EditorManager();
