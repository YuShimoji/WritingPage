// エディタ管理クラス
class EditorManager {
    constructor() {
        this.editor = document.getElementById('editor');
        this.wordCountElement = document.querySelector('.word-count');
        this.goalProgressEl = document.getElementById('goal-progress');
        this.goalProgressBarEl = this.goalProgressEl ? this.goalProgressEl.querySelector('.goal-progress__bar') : null;
        // 自動スナップショット用の状態
        this._lastSnapTs = 0;
        this._lastSnapLen = 0;
        this.SNAPSHOT_MIN_INTERVAL = 120000; // 2分
        this.SNAPSHOT_MIN_DELTA = 300; // 300文字以上の変化
        // 目標達成の一時フラグ（再達成の過剰通知を抑止）
        this._goalReachedNotified = false;
        // テキスト修飾ツールチップ
        this.tooltip = null;
        this.createTooltip();
        this.setupEventListeners();
        this.loadContent();
        this.updateWordCount();
    }

    /**
     * テキスト修飾ツールチップを作成
     */
    createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'text-decoration-tooltip';
        this.tooltip.innerHTML = `
            <button data-decoration="bold" title="太字">B</button>
            <button data-decoration="italic" title="斜体">I</button>
            <button data-decoration="strikethrough" title="取り消し線">S</button>
            <button data-decoration="code" title="コード">` + '`' + `</button>
            <button data-decoration="link" title="リンク">[リンク]</button>
        `;
        document.body.appendChild(this.tooltip);

        // ボタンイベント
        this.tooltip.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (btn && btn.dataset.decoration) {
                this.applyDecoration(btn.dataset.decoration);
            }
        });

        // ツールチップ外クリックで非表示
        document.addEventListener('click', (e) => {
            if (!this.tooltip.contains(e.target) && e.target !== this.editor) {
                this.hideTooltip();
            }
        });
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

        // テキスト選択時のツールチップ表示
        document.addEventListener('selectionchange', () => {
            const selection = window.getSelection();
            if (selection.rangeCount > 0 && this.editor.contains(selection.anchorNode)) {
                const range = selection.getRangeAt(0);
                if (!range.collapsed) {
                    this.showTooltip(range);
                } else {
                    this.hideTooltip();
                }
            } else {
                this.hideTooltip();
            }
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
        const base = this.getCurrentDocBaseName();
        const filename = `${base}_${this.getFormattedDate()}.txt`;
        window.ZenWriterStorage.exportText(content, filename, 'text/plain');
    }

    /**
     * Markdownとしてエクスポート
     */
    exportAsMarkdown() {
        const content = this.editor.value || ' ';
        const base = this.getCurrentDocBaseName();
        const filename = `${base}_${this.getFormattedDate()}.md`;
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
     * 現在選択中ドキュメントのファイル名ベースを取得（無効文字は置換）
     * @returns {string}
     */
    getCurrentDocBaseName(){
        try {
            if (!window.ZenWriterStorage || !window.ZenWriterStorage.getCurrentDocId) return 'zenwriter';
            const id = window.ZenWriterStorage.getCurrentDocId();
            const docs = window.ZenWriterStorage.loadDocuments ? (window.ZenWriterStorage.loadDocuments() || []) : [];
            const doc = docs.find(d => d && d.id === id);
            const name = (doc && doc.name) ? String(doc.name) : 'zenwriter';
            return this.sanitizeForFilename(name.trim() || 'zenwriter');
        } catch(_) { return 'zenwriter'; }
    }

    /**
     * ファイル名に使えない文字を安全なものに置換
     * @param {string} s
     * @returns {string}
     */
    sanitizeForFilename(s){
        // Windows禁止文字 \ / : * ? " < > | と制御文字を置換し、連続空白を圧縮
        return s
            .replace(/[\\/:*?"<>|]/g, '_')
            .replace(/[\x00-\x1F\x7F]/g, '_')
            .replace(/\s+/g, ' ')
            .slice(0, 60) // 長すぎる名前を抑制
            || 'zenwriter';
    }

    /**
     * 文字数を更新
     */
    updateWordCount() {
        const text = this.editor.value;
        const charCount = text.length;
        const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        // 執筆目標の進捗（任意）
        const s = window.ZenWriterStorage.loadSettings();
        const goal = (s && s.goal) || {};
        let suffix = '';
        if (goal && (parseInt(goal.target,10) || 0) > 0) {
            const target = Math.max(0, parseInt(goal.target,10) || 0);
            const ratio = target > 0 ? Math.min(1, charCount / target) : 0;
            const pct = Math.floor(ratio * 100);
            suffix += ` | 目標 ${target} (${pct}%)`;
            // 進捗バーの表示と更新
            if (this.goalProgressEl && this.goalProgressBarEl) {
                this.goalProgressEl.style.display = 'inline-flex';
                this.goalProgressEl.setAttribute('aria-hidden', 'false');
                const w = Math.max(0, Math.min(100, pct));
                this.goalProgressBarEl.style.width = `${w}%`;
            }
            // 締切日がある場合は残日数を併記
            if (goal.deadline) {
                const today = new Date();
                const dl = new Date(`${goal.deadline}T00:00:00`);
                const msPerDay = 24*60*60*1000;
                const days = Math.ceil((dl - today) / msPerDay);
                if (!isNaN(days)) {
                    if (days >= 0) suffix += ` | 残り${days}日`;
                    else suffix += ` | 期限超過${Math.abs(days)}日`;
                }
            }
            // 目標達成時の通知（初回のみ）
            if (charCount >= target) {
                if (!this._goalReachedNotified) {
                    this._goalReachedNotified = true;
                    if (typeof this.showNotification === 'function') {
                        this.showNotification('目標達成！お疲れさまです 🎉');
                    }
                    if (window.ZenWriterHUD && typeof window.ZenWriterHUD.publish === 'function') {
                        window.ZenWriterHUD.publish('目標達成！', 1500);
                    }
                }
            } else {
                // 目標未達に戻った場合はフラグをリセット
                this._goalReachedNotified = false;
            }
        } else {
            // 目標未設定時はフラグをリセット
            this._goalReachedNotified = false;
            // 進捗バーを隠す
            if (this.goalProgressEl) {
                this.goalProgressEl.style.display = 'none';
                this.goalProgressEl.setAttribute('aria-hidden', 'true');
            }
        }

        this.wordCountElement.textContent = `${charCount} 文字 / ${wordCount} 語${suffix}`;
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

    /**
     * テキスト修飾ツールチップを表示
     * @param {Range} range - 選択範囲
     */
    showTooltip(range) {
        if (!this.tooltip) return;
        const rect = range.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        this.tooltip.style.left = (rect.left + scrollLeft + rect.width / 2 - this.tooltip.offsetWidth / 2) + 'px';
        this.tooltip.style.top = (rect.top + scrollTop - this.tooltip.offsetHeight - 8) + 'px';
        this.tooltip.classList.add('show');
    }

    /**
     * テキスト修飾ツールチップを非表示
     */
    hideTooltip() {
        if (!this.tooltip) return;
        this.tooltip.classList.remove('show');
    }

    clampFontSize(px) {
        return Math.min(48, Math.max(12, Math.round(px)));
    }

    /**
     * 修飾を適用
     * @param {string} type - 修飾タイプ
     */
    applyDecoration(type) {
        const start = this.editor.selectionStart;
        const end = this.editor.selectionEnd;
        if (start === end) return; // 選択なし

        const selectedText = this.editor.value.substring(start, end);
        let replacement = '';

        switch (type) {
            case 'bold':
                replacement = `**${selectedText}**`;
                break;
            case 'italic':
                replacement = `*${selectedText}*`;
                break;
            case 'strikethrough':
                replacement = `~~${selectedText}~~`;
                break;
            case 'code':
                replacement = `\`${selectedText}\``;
                break;
            case 'link':
                const url = prompt('リンクURLを入力:', 'https://');
                if (url) {
                    replacement = `[${selectedText}](${url})`;
                } else {
                    return; // キャンセル
                }
                break;
            default:
                return;
        }

        this.editor.setRangeText(replacement);
        this.editor.selectionStart = start;
        this.editor.selectionEnd = start + replacement.length;
        this.editor.focus();
        this.saveContent();
        this.updateWordCount();
        this.hideTooltip();
    }
}

// グローバルオブジェクトに追加
window.ZenWriterEditor = new EditorManager();
