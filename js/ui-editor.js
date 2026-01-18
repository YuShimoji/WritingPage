/**
 * ui-editor.js
 * ビジュアルUIエディタ: クリックで要素選択、個別またはタイプ別の一括色変更
 * テーマやVisual Profileの調整を視覚的に行えるようにする
 */
(function () {
  'use strict';

  /**
   * UIエディタクラス
   */
  class UIVisualEditor {
    constructor() {
      this.isActive = false;
      this.selectedElement = null;
      this.selectedElementType = null;
      this.originalStyles = new Map(); // 元のスタイルを保存
      this.previewStyles = new Map(); // プレビュー用のスタイル
      this.changes = []; // 変更履歴
      this.currentChangeIndex = -1;
      this.overlay = null;
      this.panel = null;
      this.clickHandler = null;
      this.keyboardHandler = null;
    }

    /**
     * UIエディタを有効化
     */
    activate() {
      if (this.isActive) return;
      this.isActive = true;
      this.createOverlay();
      this.createPanel();
      this.attachEventListeners();
      document.body.classList.add('ui-editor-active');
      document.documentElement.setAttribute('data-ui-editor', 'active');
    }

    /**
     * UIエディタを無効化
     */
    deactivate() {
      if (!this.isActive) return;
      this.isActive = false;
      this.restoreAllStyles();
      this.removeOverlay();
      this.removePanel();
      this.detachEventListeners();
      document.body.classList.remove('ui-editor-active');
      document.documentElement.removeAttribute('data-ui-editor');
      this.selectedElement = null;
      this.selectedElementType = null;
    }

    /**
     * オーバーレイを作成（要素選択用のハイライト表示）
     */
    createOverlay() {
      if (this.overlay) return;
      this.overlay = document.createElement('div');
      this.overlay.id = 'ui-editor-overlay';
      this.overlay.className = 'ui-editor-overlay';
      this.overlay.setAttribute('aria-hidden', 'true');
      document.body.appendChild(this.overlay);
    }

    /**
     * オーバーレイを削除
     */
    removeOverlay() {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
        this.overlay = null;
      }
    }

    /**
     * コントロールパネルを作成
     */
    createPanel() {
      if (this.panel) return;
      this.panel = document.createElement('div');
      this.panel.id = 'ui-editor-panel';
      this.panel.className = 'ui-editor-panel';
      this.panel.setAttribute('role', 'dialog');
      this.panel.setAttribute('aria-label', 'UIエディタ');
      this.panel.innerHTML = this.getPanelHTML();
      document.body.appendChild(this.panel);
      this.attachPanelEventListeners();
    }

    /**
     * パネルのHTMLを生成
     */
    getPanelHTML() {
      const labels = window.UILabels || {};
      return `
        <div class="ui-editor-panel__header">
          <h3>${labels.UI_EDITOR_TITLE || 'UIエディタ'}</h3>
          <button type="button" class="ui-editor-panel__close" id="ui-editor-close" aria-label="閉じる">
            <i data-lucide="x" aria-hidden="true"></i>
          </button>
        </div>
        <div class="ui-editor-panel__body">
          <div class="ui-editor-section">
            <label class="ui-editor-label">
              <input type="checkbox" id="ui-editor-enable" checked>
              <span>${labels.UI_EDITOR_ENABLE || 'エディタモード'}</span>
            </label>
          </div>
          <div class="ui-editor-section" id="ui-editor-selection-info" style="display: none;">
            <div class="ui-editor-info">
              <strong>${labels.UI_EDITOR_SELECTED || '選択中'}:</strong>
              <span id="ui-editor-selected-name">-</span>
            </div>
            <div class="ui-editor-info">
              <strong>${labels.UI_EDITOR_TYPE || 'タイプ'}:</strong>
              <span id="ui-editor-selected-type">-</span>
            </div>
          </div>
          <div class="ui-editor-section" id="ui-editor-color-controls" style="display: none;">
            <h4>${labels.UI_EDITOR_COLOR || '色の変更'}</h4>
            <div class="ui-editor-row">
              <label>
                ${labels.UI_EDITOR_BACKGROUND_COLOR || '背景色'}:
                <input type="color" id="ui-editor-bg-color" value="#ffffff">
              </label>
            </div>
            <div class="ui-editor-row">
              <label>
                ${labels.UI_EDITOR_TEXT_COLOR || '文字色'}:
                <input type="color" id="ui-editor-text-color" value="#333333">
              </label>
            </div>
            <div class="ui-editor-row">
              <button type="button" class="small" id="ui-editor-apply-color">${labels.UI_EDITOR_APPLY || '適用'}</button>
              <button type="button" class="small" id="ui-editor-reset-color">${labels.UI_EDITOR_RESET || 'リセット'}</button>
            </div>
          </div>
          <div class="ui-editor-section">
            <h4>${labels.UI_EDITOR_BULK_CHANGE || '一括変更'}</h4>
            <div class="ui-editor-row">
              <select id="ui-editor-element-type">
                <option value="">${labels.UI_EDITOR_SELECT_TYPE || '要素タイプを選択'}</option>
                <option value="button">${labels.UI_EDITOR_TYPE_BUTTON || 'ボタン'}</option>
                <option value="link">${labels.UI_EDITOR_TYPE_LINK || 'リンク'}</option>
                <option value="input">${labels.UI_EDITOR_TYPE_INPUT || '入力欄'}</option>
                <option value="sidebar">${labels.UI_EDITOR_TYPE_SIDEBAR || 'サイドバー'}</option>
                <option value="toolbar">${labels.UI_EDITOR_TYPE_TOOLBAR || 'ツールバー'}</option>
              </select>
            </div>
            <div class="ui-editor-row">
              <label>
                ${labels.UI_EDITOR_BACKGROUND_COLOR || '背景色'}:
                <input type="color" id="ui-editor-bulk-bg-color" value="#ffffff">
              </label>
            </div>
            <div class="ui-editor-row">
              <label>
                ${labels.UI_EDITOR_TEXT_COLOR || '文字色'}:
                <input type="color" id="ui-editor-bulk-text-color" value="#333333">
              </label>
            </div>
            <div class="ui-editor-row">
              <button type="button" class="small" id="ui-editor-apply-bulk">${labels.UI_EDITOR_APPLY || '適用'}</button>
            </div>
          </div>
          <div class="ui-editor-section">
            <h4>${labels.UI_EDITOR_SAVE || '保存'}</h4>
            <div class="ui-editor-row">
              <button type="button" class="small" id="ui-editor-save-theme">${labels.UI_EDITOR_SAVE_TO_THEME || 'テーマに保存'}</button>
              <button type="button" class="small" id="ui-editor-save-profile">${labels.UI_EDITOR_SAVE_TO_PROFILE || 'プロファイルに保存'}</button>
            </div>
            <div class="ui-editor-row">
              <button type="button" class="small" id="ui-editor-preview">${labels.UI_EDITOR_PREVIEW || 'プレビュー'}</button>
              <button type="button" class="small" id="ui-editor-undo">${labels.UI_EDITOR_UNDO || '元に戻す'}</button>
            </div>
          </div>
        </div>
      `;
    }

    /**
     * パネルのイベントリスナーをアタッチ
     */
    attachPanelEventListeners() {
      if (!this.panel) return;

      // 閉じるボタン
      const closeBtn = this.panel.querySelector('#ui-editor-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.deactivate());
      }

      // エディタモードの有効/無効
      const enableCheckbox = this.panel.querySelector('#ui-editor-enable');
      if (enableCheckbox) {
        enableCheckbox.addEventListener('change', (e) => {
          if (e.target.checked) {
            this.activate();
          } else {
            this.deactivate();
          }
        });
      }

      // 色変更コントロール
      const bgColorInput = this.panel.querySelector('#ui-editor-bg-color');
      const textColorInput = this.panel.querySelector('#ui-editor-text-color');
      const applyColorBtn = this.panel.querySelector('#ui-editor-apply-color');
      const resetColorBtn = this.panel.querySelector('#ui-editor-reset-color');

      if (applyColorBtn) {
        applyColorBtn.addEventListener('click', () => {
          if (this.selectedElement && bgColorInput && textColorInput) {
            this.applyColorToElement(
              this.selectedElement,
              bgColorInput.value,
              textColorInput.value
            );
          }
        });
      }

      if (resetColorBtn) {
        resetColorBtn.addEventListener('click', () => {
          if (this.selectedElement) {
            this.resetElementColor(this.selectedElement);
          }
        });
      }

      // 一括変更コントロール
      const bulkApplyBtn = this.panel.querySelector('#ui-editor-apply-bulk');
      if (bulkApplyBtn) {
        bulkApplyBtn.addEventListener('click', () => {
          const typeSelect = this.panel.querySelector('#ui-editor-element-type');
          const bulkBgColor = this.panel.querySelector('#ui-editor-bulk-bg-color');
          const bulkTextColor = this.panel.querySelector('#ui-editor-bulk-text-color');
          if (typeSelect && bulkBgColor && bulkTextColor && typeSelect.value) {
            this.applyBulkColorChange(
              typeSelect.value,
              bulkBgColor.value,
              bulkTextColor.value
            );
          }
        });
      }

      // 保存ボタン
      const saveThemeBtn = this.panel.querySelector('#ui-editor-save-theme');
      const saveProfileBtn = this.panel.querySelector('#ui-editor-save-profile');
      if (saveThemeBtn) {
        saveThemeBtn.addEventListener('click', () => this.saveToTheme());
      }
      if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', () => this.saveToProfile());
      }

      // プレビュー・元に戻す
      const previewBtn = this.panel.querySelector('#ui-editor-preview');
      const undoBtn = this.panel.querySelector('#ui-editor-undo');
      if (previewBtn) {
        previewBtn.addEventListener('click', () => this.togglePreview());
      }
      if (undoBtn) {
        undoBtn.addEventListener('click', () => this.undo());
      }

      // Lucideアイコンの初期化
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    }

    /**
     * イベントリスナーをアタッチ
     */
    attachEventListeners() {
      // クリックで要素選択
      this.clickHandler = (e) => {
        if (!this.isActive) return;
        // パネルやオーバーレイ自体のクリックは無視
        if (e.target.closest('#ui-editor-panel') || e.target.closest('#ui-editor-overlay')) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        this.selectElement(e.target);
      };

      // キーボード操作（ESCで閉じる、Escapeで選択解除）
      this.keyboardHandler = (e) => {
        if (!this.isActive) return;
        if (e.key === 'Escape') {
          if (this.selectedElement) {
            this.deselectElement();
          } else {
            this.deactivate();
          }
        }
      };

      document.addEventListener('click', this.clickHandler, true);
      document.addEventListener('keydown', this.keyboardHandler);
    }

    /**
     * イベントリスナーをデタッチ
     */
    detachEventListeners() {
      if (this.clickHandler) {
        document.removeEventListener('click', this.clickHandler, true);
        this.clickHandler = null;
      }
      if (this.keyboardHandler) {
        document.removeEventListener('keydown', this.keyboardHandler);
        this.keyboardHandler = null;
      }
    }

    /**
     * 要素を選択
     */
    selectElement(element) {
      // エディタやプレビューエリア内の要素は除外
      if (element.closest('#editor') || element.closest('#wysiwyg-editor') || 
          element.closest('.editor-preview') || element.closest('#editor-overlay')) {
        return;
      }

      this.deselectElement();
      this.selectedElement = element;
      this.selectedElementType = this.getElementType(element);
      this.updateSelectionInfo();
      this.updateColorInputs();
      this.highlightElement(element);
    }

    /**
     * 要素の選択を解除
     */
    deselectElement() {
      if (this.selectedElement) {
        this.unhighlightElement(this.selectedElement);
        this.selectedElement = null;
        this.selectedElementType = null;
        this.updateSelectionInfo();
      }
    }

    /**
     * 要素タイプを取得
     */
    getElementType(element) {
      const tagName = element.tagName.toLowerCase();
      const className = element.className || '';
      const id = element.id || '';

      if (tagName === 'button' || className.includes('button') || className.includes('btn')) {
        return 'button';
      }
      if (tagName === 'a' || className.includes('link')) {
        return 'link';
      }
      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        return 'input';
      }
      if (id === 'sidebar' || className.includes('sidebar')) {
        return 'sidebar';
      }
      if (id === 'toolbar' || className.includes('toolbar')) {
        return 'toolbar';
      }
      return tagName;
    }

    /**
     * 選択情報を更新
     */
    updateSelectionInfo() {
      if (!this.panel) return;
      const infoSection = this.panel.querySelector('#ui-editor-selection-info');
      const colorControls = this.panel.querySelector('#ui-editor-color-controls');
      const selectedName = this.panel.querySelector('#ui-editor-selected-name');
      const selectedType = this.panel.querySelector('#ui-editor-selected-type');

      if (this.selectedElement) {
        if (infoSection) infoSection.style.display = 'block';
        if (colorControls) colorControls.style.display = 'block';
        if (selectedName) {
          selectedName.textContent = this.selectedElement.tagName.toLowerCase() + 
            (this.selectedElement.id ? '#' + this.selectedElement.id : '') +
            (this.selectedElement.className ? '.' + this.selectedElement.className.split(' ')[0] : '');
        }
        if (selectedType) {
          selectedType.textContent = this.selectedElementType;
        }
      } else {
        if (infoSection) infoSection.style.display = 'none';
        if (colorControls) colorControls.style.display = 'none';
      }
    }

    /**
     * カラー入力欄を更新
     */
    updateColorInputs() {
      if (!this.panel || !this.selectedElement) return;
      const bgColorInput = this.panel.querySelector('#ui-editor-bg-color');
      const textColorInput = this.panel.querySelector('#ui-editor-text-color');

      if (bgColorInput) {
        const bgColor = this.getComputedColor(this.selectedElement, 'background-color');
        bgColorInput.value = this.rgbToHex(bgColor);
      }
      if (textColorInput) {
        const textColor = this.getComputedColor(this.selectedElement, 'color');
        textColorInput.value = this.rgbToHex(textColor);
      }
    }

    /**
     * 計算済み色を取得
     */
    getComputedColor(element, property) {
      const computed = window.getComputedStyle(element);
      return computed.getPropertyValue(property);
    }

    /**
     * RGB/RGBAをHEXに変換
     */
    rgbToHex(rgb) {
      if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') {
        return '#ffffff';
      }
      const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        const r = parseInt(match[1], 10).toString(16).padStart(2, '0');
        const g = parseInt(match[2], 10).toString(16).padStart(2, '0');
        const b = parseInt(match[3], 10).toString(16).padStart(2, '0');
        return '#' + r + g + b;
      }
      // 既にHEX形式の場合
      if (rgb.startsWith('#')) {
        return rgb;
      }
      return '#ffffff';
    }

    /**
     * 要素をハイライト
     */
    highlightElement(element) {
      if (!this.overlay) return;
      const rect = element.getBoundingClientRect();
      this.overlay.style.display = 'block';
      this.overlay.style.left = rect.left + 'px';
      this.overlay.style.top = rect.top + 'px';
      this.overlay.style.width = rect.width + 'px';
      this.overlay.style.height = rect.height + 'px';
    }

    /**
     * ハイライトを解除
     */
    unhighlightElement(element) {
      if (this.overlay) {
        this.overlay.style.display = 'none';
      }
    }

    /**
     * 要素に色を適用
     */
    applyColorToElement(element, bgColor, textColor) {
      if (!element) return;

      // 元のスタイルを保存（初回のみ）
      if (!this.originalStyles.has(element)) {
        this.originalStyles.set(element, {
          backgroundColor: element.style.backgroundColor || '',
          color: element.style.color || ''
        });
      }

      // スタイルを適用
      element.style.backgroundColor = bgColor;
      element.style.color = textColor;

      // 変更履歴に追加
      this.addChange({
        type: 'element-color',
        element: element,
        bgColor: bgColor,
        textColor: textColor
      });
    }

    /**
     * 要素の色をリセット
     */
    resetElementColor(element) {
      if (!element) return;
      const original = this.originalStyles.get(element);
      if (original) {
        element.style.backgroundColor = original.backgroundColor || '';
        element.style.color = original.color || '';
        this.originalStyles.delete(element);
      } else {
        element.style.backgroundColor = '';
        element.style.color = '';
      }
      this.updateColorInputs();
    }

    /**
     * 一括色変更を適用
     */
    applyBulkColorChange(elementType, bgColor, textColor) {
      const elements = this.getElementsByType(elementType);
      elements.forEach(element => {
        this.applyColorToElement(element, bgColor, textColor);
      });
    }

    /**
     * タイプ別に要素を取得
     */
    getElementsByType(type) {
      const elements = [];
      switch (type) {
        case 'button':
          elements.push(...document.querySelectorAll('button, .button, .btn, [class*="button"], [class*="btn"]'));
          break;
        case 'link':
          elements.push(...document.querySelectorAll('a, .link, [class*="link"]'));
          break;
        case 'input':
          elements.push(...document.querySelectorAll('input, textarea, select, .input, [class*="input"]'));
          break;
        case 'sidebar':
          elements.push(...document.querySelectorAll('#sidebar, .sidebar, [class*="sidebar"]'));
          break;
        case 'toolbar':
          elements.push(...document.querySelectorAll('#toolbar, .toolbar, [class*="toolbar"]'));
          break;
      }
      // エディタ内の要素は除外
      return elements.filter(el => 
        !el.closest('#editor') && 
        !el.closest('#wysiwyg-editor') && 
        !el.closest('.editor-preview')
      );
    }

    /**
     * すべてのスタイルを復元
     */
    restoreAllStyles() {
      this.originalStyles.forEach((original, element) => {
        element.style.backgroundColor = original.backgroundColor || '';
        element.style.color = original.color || '';
      });
      this.originalStyles.clear();
      this.previewStyles.clear();
    }

    /**
     * 変更履歴に追加
     */
    addChange(change) {
      // 現在位置より後ろの履歴を削除（redo用）
      if (this.currentChangeIndex < this.changes.length - 1) {
        this.changes = this.changes.slice(0, this.currentChangeIndex + 1);
      }
      this.changes.push(change);
      this.currentChangeIndex = this.changes.length - 1;
    }

    /**
     * 元に戻す
     */
    undo() {
      if (this.currentChangeIndex < 0) return;
      const change = this.changes[this.currentChangeIndex];
      if (change.type === 'element-color' && change.element) {
        const original = this.originalStyles.get(change.element);
        if (original) {
          change.element.style.backgroundColor = original.backgroundColor || '';
          change.element.style.color = original.color || '';
        }
      }
      this.currentChangeIndex--;
    }

    /**
     * プレビューを切り替え
     */
    togglePreview() {
      // プレビューモードの実装（必要に応じて拡張）
      const isPreview = document.body.classList.toggle('ui-editor-preview');
      if (isPreview) {
        // プレビューモード: 一時的に変更を適用
        this.applyPreviewStyles();
      } else {
        // 通常モード: プレビューを解除
        this.clearPreviewStyles();
      }
    }

    /**
     * プレビュースタイルを適用
     */
    applyPreviewStyles() {
      // 実装は必要に応じて拡張
    }

    /**
     * プレビュースタイルをクリア
     */
    clearPreviewStyles() {
      // 実装は必要に応じて拡張
    }

    /**
     * テーマに保存
     */
    saveToTheme() {
      if (!window.ZenWriterTheme) {
        alert('テーマシステムが利用できません');
        return;
      }

      // 変更された要素の色を集計してテーマに反映
      const colorMap = new Map();
      this.originalStyles.forEach((original, element) => {
        const computed = window.getComputedStyle(element);
        const bgColor = element.style.backgroundColor || computed.backgroundColor;
        const textColor = element.style.color || computed.color;
        
        // 要素タイプごとに色を集計
        const type = this.getElementType(element);
        if (!colorMap.has(type)) {
          colorMap.set(type, { bgColors: [], textColors: [] });
        }
        const colors = colorMap.get(type);
        if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
          colors.bgColors.push(this.rgbToHex(bgColor));
        }
        if (textColor && textColor !== 'transparent') {
          colors.textColors.push(this.rgbToHex(textColor));
        }
      });

      // 最も多く使われている色を選択（簡易的な実装）
      let mostCommonBg = '#ffffff';
      let mostCommonText = '#333333';
      
      if (colorMap.size > 0) {
        // ボタンやリンクなどのUI要素の色を優先
        const uiTypes = ['button', 'link', 'sidebar', 'toolbar'];
        for (const type of uiTypes) {
          if (colorMap.has(type)) {
            const colors = colorMap.get(type);
            if (colors.bgColors.length > 0) {
              mostCommonBg = this.getMostCommonColor(colors.bgColors);
            }
            if (colors.textColors.length > 0) {
              mostCommonText = this.getMostCommonColor(colors.textColors);
            }
            break;
          }
        }
      }

      // テーマシステムに反映
      if (window.ZenWriterTheme.applyCustomColors) {
        window.ZenWriterTheme.applyCustomColors(mostCommonBg, mostCommonText, true);
        alert('テーマに保存しました');
      }
    }

    /**
     * 最も多く使われている色を取得
     */
    getMostCommonColor(colors) {
      const counts = new Map();
      colors.forEach(color => {
        counts.set(color, (counts.get(color) || 0) + 1);
      });
      let maxCount = 0;
      let mostCommon = colors[0] || '#ffffff';
      counts.forEach((count, color) => {
        if (count > maxCount) {
          maxCount = count;
          mostCommon = color;
        }
      });
      return mostCommon;
    }

    /**
     * プロファイルに保存
     */
    saveToProfile() {
      if (!window.ZenWriterVisualProfile) {
        alert('Visual Profileシステムが利用できません');
        return;
      }

      // まずテーマに保存してからプロファイルに保存
      this.saveToTheme();
      
      const name = prompt('プロファイル名を入力してください:', '');
      if (name && name.trim()) {
        try {
          window.ZenWriterVisualProfile.saveCurrentAsProfile(name.trim());
          alert('プロファイルに保存しました: ' + name.trim());
        } catch (e) {
          console.error('プロファイル保存エラー:', e);
          alert('プロファイルの保存に失敗しました');
        }
      }
    }

    /**
     * HEXをRGBに変換（簡易版）
     */
    hexToRgb(hex) {
      if (!hex || !hex.startsWith('#')) return hex;
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? 
        `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : 
        hex;
    }

    /**
     * パネルを削除
     */
    removePanel() {
      if (this.panel && this.panel.parentNode) {
        this.panel.parentNode.removeChild(this.panel);
        this.panel = null;
      }
    }
  }

  // グローバルに公開
  window.UIVisualEditor = UIVisualEditor;

  // DOMContentLoaded後に初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      window.uiVisualEditor = new UIVisualEditor();
    });
  } else {
    window.uiVisualEditor = new UIVisualEditor();
  }

})();
