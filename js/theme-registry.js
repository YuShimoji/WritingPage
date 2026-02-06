/**
 * theme-registry.js
 * テーマプリセットの集中管理レジストリ
 * 
 * 目的:
 * - テーマ定義（ID、ラベル、色パレット）を単一箇所で管理
 * - ThemeManager / Themes ガジェット / CSS / ドキュメントの不整合を防止
 * - UI/エディタ配色分離の基盤（C-3 Step3）
 */
(function () {
  'use strict';

  /**
   * テーマプリセット定義
   * 各プリセットは以下の構造を持つ:
   * - id: テーマID（data-theme 属性値）
   * - labelKey: UILabels のキー名
   * - fallbackLabel: UILabels が未定義の場合のフォールバックラベル
   * - colors: 既定の背景色・文字色（後方互換用）
   *   - bgColor: 背景色
   *   - textColor: 文字色
   * - uiColors: UI レイヤ（サイドバー/ツールバー/ガジェット等）の色セット（C-3 Step3）
   * - editorColors: エディタ本文エリアの色セット（C-3 Step3）
   */
  var THEME_PRESETS = [
    {
      id: 'light',
      labelKey: 'THEME_NAME_LIGHT',
      fallbackLabel: 'ライト',
      colors: { bgColor: '#ffffff', textColor: '#333333' },
      uiColors: { bgColor: '#ffffff', textColor: '#333333' },
      editorColors: { bgColor: '#ffffff', textColor: '#333333' }
    },
    {
      id: 'dark',
      labelKey: 'THEME_NAME_DARK',
      fallbackLabel: 'ダーク',
      colors: { bgColor: '#1e1e1e', textColor: '#e0e0e0' },
      uiColors: { bgColor: '#1e1e1e', textColor: '#e0e0e0' },
      editorColors: { bgColor: '#1e1e1e', textColor: '#e0e0e0' }
    },
    {
      id: 'night',
      labelKey: 'THEME_NAME_NIGHT',
      fallbackLabel: 'ナイト',
      colors: { bgColor: '#262626', textColor: '#e5e5e5' },
      uiColors: { bgColor: '#262626', textColor: '#e5e5e5' },
      editorColors: { bgColor: '#262626', textColor: '#e5e5e5' }
    },
    {
      id: 'sepia',
      labelKey: 'THEME_NAME_SEPIA',
      fallbackLabel: 'セピア',
      colors: { bgColor: '#f4ecd8', textColor: '#5b4636' },
      uiColors: { bgColor: '#f4ecd8', textColor: '#5b4636' },
      editorColors: { bgColor: '#f4ecd8', textColor: '#5b4636' }
    },
    {
      id: 'high-contrast',
      labelKey: 'THEME_NAME_HIGH_CONTRAST',
      fallbackLabel: '高コントラスト',
      colors: { bgColor: '#000000', textColor: '#ffffff' },
      uiColors: { bgColor: '#000000', textColor: '#ffffff' },
      editorColors: { bgColor: '#000000', textColor: '#ffffff' }
    },
    {
      id: 'solarized',
      labelKey: 'THEME_NAME_SOLARIZED',
      fallbackLabel: 'ソラリゼド',
      colors: { bgColor: '#fdf6e3', textColor: '#586e75' },
      uiColors: { bgColor: '#fdf6e3', textColor: '#586e75' },
      editorColors: { bgColor: '#fdf6e3', textColor: '#586e75' }
    }
  ];

  /**
   * 追加テーマ（ThemeManager 内で使われているが UI には未公開のもの）
   * 将来的に UI に追加する場合は THEME_PRESETS に移動
   */
  var EXTRA_THEMES = {
    midnight: { bgColor: '#0f0f23', textColor: '#cccccc' },
    charcoal: { bgColor: '#2d3748', textColor: '#e2e8f0' },
    abyss: { bgColor: '#0a0a0a', textColor: '#d4d4d4' },
    'deep-space': { bgColor: '#001122', textColor: '#a0c4ff' }
  };

  /**
   * ThemeRegistry - テーマプリセットの中央管理
   */
  var ThemeRegistry = {
    /**
     * すべてのプリセットを取得
     * @returns {Array} プリセット配列
     */
    listPresets: function () {
      return THEME_PRESETS.slice();
    },

    /**
     * プリセットIDの一覧を取得
     * @returns {Array<string>} ID配列
     */
    listPresetIds: function () {
      return THEME_PRESETS.map(function (p) { return p.id; });
    },

    /**
     * 指定IDのプリセットを取得
     * @param {string} id - テーマID
     * @returns {Object|null} プリセットオブジェクト、見つからない場合は null
     */
    getPreset: function (id) {
      for (var i = 0; i < THEME_PRESETS.length; i++) {
        if (THEME_PRESETS[i].id === id) {
          return THEME_PRESETS[i];
        }
      }
      return null;
    },

    /**
     * 指定IDのテーマ色を取得（EXTRA_THEMES も含む）
     * @param {string} id - テーマID
     * @returns {Object} { bgColor, textColor } または light のフォールバック
     */
    getColors: function (id) {
      var preset = this.getPreset(id);
      if (preset && preset.colors) {
        return { bgColor: preset.colors.bgColor, textColor: preset.colors.textColor };
      }
      if (EXTRA_THEMES[id]) {
        return { bgColor: EXTRA_THEMES[id].bgColor, textColor: EXTRA_THEMES[id].textColor };
      }
      // フォールバック: light
      return { bgColor: '#ffffff', textColor: '#333333' };
    },

    /**
     * 指定IDの UI レイヤ色を取得（C-3 Step3）
     * @param {string} id - テーマID
     * @returns {Object} { bgColor, textColor } または light のフォールバック
     */
    getUIColors: function (id) {
      var preset = this.getPreset(id);
      if (preset && preset.uiColors) {
        return { bgColor: preset.uiColors.bgColor, textColor: preset.uiColors.textColor };
      }
      // uiColors がない場合は colors にフォールバック
      return this.getColors(id);
    },

    /**
     * 指定IDの Editor レイヤ色を取得（C-3 Step3）
     * @param {string} id - テーマID
     * @returns {Object} { bgColor, textColor } または light のフォールバック
     */
    getEditorColors: function (id) {
      var preset = this.getPreset(id);
      if (preset && preset.editorColors) {
        return { bgColor: preset.editorColors.bgColor, textColor: preset.editorColors.textColor };
      }
      // editorColors がない場合は colors にフォールバック
      return this.getColors(id);
    },

    /**
     * プリセットのラベルを取得
     * @param {string} id - テーマID
     * @returns {string} ラベル文字列
     */
    getLabel: function (id) {
      var preset = this.getPreset(id);
      if (!preset) return id;
      if (window.UILabels && window.UILabels[preset.labelKey]) {
        return window.UILabels[preset.labelKey];
      }
      return preset.fallbackLabel || id;
    },

    /**
     * ThemeManager 互換の themeColors オブジェクトを生成
     * @returns {Object} { [id]: { bgColor, textColor }, ... }
     */
    toThemeColorsMap: function () {
      var map = {};
      THEME_PRESETS.forEach(function (p) {
        map[p.id] = { bgColor: p.colors.bgColor, textColor: p.colors.textColor };
      });
      // EXTRA_THEMES も追加
      for (var key in EXTRA_THEMES) {
        if (EXTRA_THEMES.hasOwnProperty(key)) {
          map[key] = { bgColor: EXTRA_THEMES[key].bgColor, textColor: EXTRA_THEMES[key].textColor };
        }
      }
      return map;
    },

    /**
     * 指定IDが有効なプリセットかどうか
     * @param {string} id - テーマID
     * @returns {boolean}
     */
    isValidPreset: function (id) {
      return this.getPreset(id) !== null || EXTRA_THEMES.hasOwnProperty(id);
    }
  };

  // グローバル公開
  window.ThemeRegistry = ThemeRegistry;

})();
