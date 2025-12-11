// テーマ管理クラス
class ThemeManager {
  constructor() {
    // テーマごとの既定色（ThemeRegistry から取得、フォールバック付き）
    this.themeColors = (window.ThemeRegistry && typeof window.ThemeRegistry.toThemeColorsMap === 'function')
      ? window.ThemeRegistry.toThemeColorsMap()
      : {
          light: { bgColor: '#ffffff', textColor: '#333333' },
          dark: { bgColor: '#1e1e1e', textColor: '#e0e0e0' },
          night: { bgColor: '#262626', textColor: '#e5e5e5' },
          sepia: { bgColor: '#f4ecd8', textColor: '#5b4636' },
          'high-contrast': { bgColor: '#000000', textColor: '#ffffff' },
          solarized: { bgColor: '#fdf6e3', textColor: '#586e75' }
        };
    
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
    
    // テーマの既定色を取得
    const themeColor = this.themeColors[theme] || this.themeColors.light;
    
    // カスタムカラー無効時はテーマの既定色を使うため、上書きをクリア
    if (!this.settings.useCustomColors) {
      this.clearCustomColors();
      // カラーピッカーの値をテーマの既定色に更新
      this.updateColorPickers(themeColor.bgColor, themeColor.textColor);
    }
    window.ZenWriterStorage.saveSettings(this.settings);
    try { window.dispatchEvent(new CustomEvent('ZenWriterSettingsChanged')); } catch(e) { void e; }
  }

  /**
   * カラーピッカーの値を更新
   * @param {string} bgColor - 背景色
   * @param {string} textColor - 文字色
   */
  updateColorPickers(bgColor, textColor) {
    const bgColorInput = document.getElementById('bg-color');
    const textColorInput = document.getElementById('text-color');
    if (bgColorInput) bgColorInput.value = bgColor;
    if (textColorInput) textColorInput.value = textColor;
  }

  /**
   * カスタムカラーを適用
   * C-3 Step3: UI/Editor レイヤを個別に扱えるよう拡張
   * @param {string} bgColor - 背景色（主に Editor レイヤ用、UI レイヤのベースとしても使用）
   * @param {string} textColor - 文字色（主に Editor レイヤ用、UI レイヤのベースとしても使用）
   * @param {boolean} enable - カスタムカラーを有効にするか
   * @param {Object} options - 追加オプション（C-3 Step3）
   * @param {string} options.uiBgColor - UI レイヤの背景色（省略時は bgColor を使用）
   * @param {string} options.uiTextColor - UI レイヤの文字色（省略時は textColor を使用）
   */
  applyCustomColors(bgColor, textColor, enable = true, options = {}) {
    const root = document.documentElement;
    
    // C-3 Step3: UI/Editor レイヤ別の色を取得（省略時は bgColor/textColor を使用）
    const uiBgColor = options.uiBgColor || bgColor;
    const uiTextColor = options.uiTextColor || textColor;
    const editorBgColor = bgColor;
    const editorTextColor = textColor;
    
    // レガシー変数（後方互換）
    root.style.setProperty('--bg-color', bgColor);
    root.style.setProperty('--text-color', textColor);
    
    // UI レイヤ
    root.style.setProperty('--ui-bg', uiBgColor);
    root.style.setProperty('--ui-text', uiTextColor);
    
    // Editor レイヤ
    root.style.setProperty('--editor-bg', editorBgColor);
    root.style.setProperty('--editor-text', editorTextColor);

    // UI 背景色の明るさに応じて派生色を調整
    const isLight = this.isLightColor(uiBgColor);
    root.style.setProperty(
      '--sidebar-bg',
      isLight ? this.adjustColor(uiBgColor, -10) : this.adjustColor(uiBgColor, 20),
    );
    root.style.setProperty(
      '--toolbar-bg',
      isLight ? this.adjustColor(uiBgColor, -5) : this.adjustColor(uiBgColor, 15),
    );
    root.style.setProperty(
      '--border-color',
      isLight ? this.adjustColor(uiBgColor, -15) : this.adjustColor(uiBgColor, 30),
    );

    this.settings.bgColor = bgColor;
    this.settings.textColor = textColor;
    this.settings.useCustomColors = !!enable;
    
    // カラーピッカーの値も更新（Editor レイヤの色を表示）
    this.updateColorPickers(editorBgColor, editorTextColor);
    
    window.ZenWriterStorage.saveSettings(this.settings);
    try { window.dispatchEvent(new CustomEvent('ZenWriterSettingsChanged')); } catch(e) { void e; }
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
    try { window.dispatchEvent(new CustomEvent('ZenWriterSettingsChanged')); } catch(e) { void e; }
  }

  /**
   * カスタムカラーの上書きを解除
   * C-3 Step3: ThemeRegistry 経由で Editor レイヤの既定色を取得
   */
  clearCustomColors() {
    const root = document.documentElement;
    root.style.removeProperty('--bg-color');
    root.style.removeProperty('--text-color');
    root.style.removeProperty('--ui-bg');
    root.style.removeProperty('--ui-text');
    root.style.removeProperty('--editor-bg');
    root.style.removeProperty('--editor-text');
    root.style.removeProperty('--sidebar-bg');
    root.style.removeProperty('--toolbar-bg');
    root.style.removeProperty('--border-color');
    this.settings.useCustomColors = false;
    
    // 設定からカスタムカラーを削除
    delete this.settings.bgColor;
    delete this.settings.textColor;
    
    // カラーピッカーを現在のテーマの Editor レイヤ既定色に更新（C-3 Step3）
    const currentTheme = this.settings.theme || 'light';
    const editorColors = (window.ThemeRegistry && typeof window.ThemeRegistry.getEditorColors === 'function')
      ? window.ThemeRegistry.getEditorColors(currentTheme)
      : (this.themeColors[currentTheme] || this.themeColors.light);
    this.updateColorPickers(editorColors.bgColor, editorColors.textColor);
    
    window.ZenWriterStorage.saveSettings(this.settings);
    try { window.dispatchEvent(new CustomEvent('ZenWriterSettingsChanged')); } catch(e) { void e; }
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
    try { window.dispatchEvent(new CustomEvent('ZenWriterSettingsChanged')); } catch(e) { void e; }
  }

  /**
   * 背景ビジュアルを設定
   * @param {Object} options - 背景設定オプション
   * @param {string} options.gradient - グラデーションCSS
   * @param {string} options.image - 背景画像URL
   * @param {number} options.opacity - 画像不透明度
   * @param {number} options.scrollFactor - スクロール連動係数
   * @param {number} options.blur - ぼかし量
   */
  setBackgroundVisual(options = {}) {
    const root = document.documentElement;
    
    if (options.gradient !== undefined) {
      root.style.setProperty('--bg-gradient', options.gradient);
      this.settings.bgGradient = options.gradient;
    }
    
    if (options.image !== undefined) {
      const imageUrl = options.image ? `url(${options.image})` : 'none';
      root.style.setProperty('--bg-image', imageUrl);
      this.settings.bgImage = options.image;
    }
    
    if (options.opacity !== undefined) {
      root.style.setProperty('--bg-image-opacity', options.opacity);
      this.settings.bgImageOpacity = options.opacity;
    }
    
    if (options.scrollFactor !== undefined) {
      root.style.setProperty('--bg-scroll-factor', options.scrollFactor);
      this.settings.bgScrollFactor = options.scrollFactor;
    }
    
    if (options.blur !== undefined) {
      root.style.setProperty('--bg-blur', `${options.blur}px`);
      this.settings.bgBlur = options.blur;
    }
    
    window.ZenWriterStorage.saveSettings(this.settings);
    try { window.dispatchEvent(new CustomEvent('ZenWriterSettingsChanged')); } catch(e) { void e; }
  }

  /**
   * ランダム背景を適用
   */
  applyRandomBackground() {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)'
    ];
    
    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
    this.setBackgroundVisual({ gradient: randomGradient, image: null, opacity: 0.1 });
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
