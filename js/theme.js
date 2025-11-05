// テーマ管理クラス
class ThemeManager {
  constructor() {
    this.settings = window.ZenWriterStorage.loadSettings();
    // 最初にテーマを適用
    this.applyTheme(this.settings.theme);
    // カスタムカラーが有効な場合のみ上書き
    if (this.settings.useCustomColors) {
      this.applyCustomColors(
        this.settings.bgColor,
        this.settings.textColor,
        true,
      );
    } else {
      this.clearCustomColors();
    }
    this.applyFontSettings(
      this.settings.fontFamily || this.settings.fontFamilyContent,
      this.settings.fontSize,
      this.settings.lineHeight,
      this.settings.uiFontSize,
      this.settings.editorFontSize,
    );
  }

  /**
   * テーマを適用
   * @param {string} theme - テーマ名 (light, dark, sepia)
   */
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.settings.theme = theme;
    // カスタムカラー無効時はテーマの既定色を使うため、上書きをクリア
    if (!this.settings.useCustomColors) {
      this.clearCustomColors();
    }
    window.ZenWriterStorage.saveSettings(this.settings);
    try { window.dispatchEvent(new CustomEvent('ZenWriterSettingsChanged')); } catch(_) {}
  }

  /**
   * カスタムカラーを適用
   * @param {string} bgColor - 背景色
   * @param {string} textColor - 文字色
   */
  applyCustomColors(bgColor, textColor, enable = true) {
    const root = document.documentElement;
    root.style.setProperty('--bg-color', bgColor);
    root.style.setProperty('--text-color', textColor);

    // 背景色の明るさに応じてテキスト色を調整
    const isLight = this.isLightColor(bgColor);
    root.style.setProperty(
      '--sidebar-bg',
      isLight ? this.adjustColor(bgColor, -10) : this.adjustColor(bgColor, 20),
    );
    root.style.setProperty(
      '--toolbar-bg',
      isLight ? this.adjustColor(bgColor, -5) : this.adjustColor(bgColor, 15),
    );
    root.style.setProperty(
      '--border-color',
      isLight ? this.adjustColor(bgColor, -15) : this.adjustColor(bgColor, 30),
    );

    this.settings.bgColor = bgColor;
    this.settings.textColor = textColor;
    this.settings.useCustomColors = !!enable;
    window.ZenWriterStorage.saveSettings(this.settings);
    try { window.dispatchEvent(new CustomEvent('ZenWriterSettingsChanged')); } catch(_) {}
  }

  /**
   * ボタン色を適用
   * @param {string} buttonColor - ボタン色
   */
  applyButtonColor(buttonColor) {
    const root = document.documentElement;
    root.style.setProperty('--button-color', buttonColor);
    this.settings.buttonColor = buttonColor;
    window.ZenWriterStorage.saveSettings(this.settings);
    try { window.dispatchEvent(new CustomEvent('ZenWriterSettingsChanged')); } catch(_) {}
  }

  /**
   * カスタムカラーの上書きを解除
   */
  clearCustomColors() {
    const root = document.documentElement;
    root.style.removeProperty('--bg-color');
    root.style.removeProperty('--text-color');
    root.style.removeProperty('--sidebar-bg');
    root.style.removeProperty('--toolbar-bg');
    root.style.removeProperty('--border-color');
    this.settings.useCustomColors = false;
    window.ZenWriterStorage.saveSettings(this.settings);
    try { window.dispatchEvent(new CustomEvent('ZenWriterSettingsChanged')); } catch(_) {}
  }

  /**
   * フォント設定を適用
   * @param {string} fontFamily - 本文フォントファミリー
   * @param {number} fontSize - フォントサイズ (px)
   * @param {number} lineHeight - 行の高さ
   * @param {number} uiFontSize - UIフォントサイズ (px)
   * @param {number} editorFontSize - エディタフォントサイズ (px)
   */
  applyFontSettings(
    fontFamily,
    fontSize,
    lineHeight,
    uiFontSize,
    editorFontSize,
  ) {
    const root = document.documentElement;
    root.style.setProperty('--font-family', fontFamily);
    root.style.setProperty('--font-size', `${fontSize}px`);
    root.style.setProperty('--ui-font-size', `${uiFontSize || fontSize}px`);
    root.style.setProperty(
      '--editor-font-size',
      `${editorFontSize || fontSize}px`,
    );
    root.style.setProperty('--line-height', lineHeight);

    this.settings.fontFamily = fontFamily;
    this.settings.fontSize = fontSize; // 後方互換
    this.settings.uiFontSize = uiFontSize || fontSize;
    this.settings.editorFontSize = editorFontSize || fontSize;
    this.settings.lineHeight = lineHeight;
    window.ZenWriterStorage.saveSettings(this.settings);
    try { window.dispatchEvent(new CustomEvent('ZenWriterSettingsChanged')); } catch(_) {}
  }

  /**
   * 色が明るいかどうかを判定
   * @param {string} hexColor - 16進数カラーコード
   * @returns {boolean} 明るい色の場合はtrue
   */
  isLightColor(hexColor) {
    // #を削除
    const hex = hexColor.replace('#', '');

    // RGBに変換
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // 相対輝度を計算 (0.299*R + 0.587*G + 0.114*B)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    return brightness > 128;
  }

  /**
   * 色を調整する
   * @param {string} hexColor - 16進数カラーコード
   * @param {number} percent - 調整する割合 (-100 〜 100)
   * @returns {string} 調整後の16進数カラーコード
   */
  adjustColor(hexColor, percent) {
    // #を削除
    let hex = hexColor.replace('#', '');

    // 3桁の場合は6桁に変換
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('');
    }

    // RGBに変換
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // 色を調整
    r = Math.min(255, Math.max(0, r + Math.round((r * percent) / 100)));
    g = Math.min(255, Math.max(0, g + Math.round((g * percent) / 100)));
    b = Math.min(255, Math.max(0, b + Math.round((b * percent) / 100)));

    // 16進数に戻す
    const toHex = (c) => {
      const hex = c.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
}

// グローバルオブジェクトに追加
window.ZenWriterTheme = new ThemeManager();
