// Visual Profile 管理 — Phase A 実装
// テーマ/背景/フォント/余白/表示モードの設定群を「Visual Profile」としてまとめて扱う

/**
 * Visual Profile の概念モデル定義
 * @typedef {Object} VisualProfile
 * @property {string} id - プロファイルID
 * @property {string} label - UI表示名
 * @property {string} theme - テーマ名 ('light' | 'dark' | 'sepia')
 * @property {boolean} useCustomColors - カスタム色を使用するか
 * @property {string} [bgColor] - 背景色（useCustomColors=trueの場合）
 * @property {string} [textColor] - 文字色（useCustomColors=trueの場合）
 * @property {string} fontFamily - フォントファミリー
 * @property {number} uiFontSize - UIフォントサイズ
 * @property {number} editorFontSize - エディタフォントサイズ
 * @property {number} lineHeight - 行間
 * @property {string} editorWidthMode - エディタ幅モード ('narrow' | 'medium' | 'wide')
 * @property {string} uiMode - 表示モード ('normal' | 'focus' | 'blank')
 */

/**
 * 組み込み Visual Profile の定義
 * @type {VisualProfile[]}
 */
const BUILT_IN_PROFILES = [
  {
    id: 'default',
    label: (window.UILabels && window.UILabels.VISUAL_PROFILE_STANDARD) || '標準',
    theme: 'light',
    useCustomColors: false,
    fontFamily: 'serif',
    uiFontSize: 16,
    editorFontSize: 16,
    lineHeight: 1.6,
    editorWidthMode: 'medium'
  },
  {
    id: 'focus-dark',
    label: (window.UILabels && window.UILabels.VISUAL_PROFILE_FOCUS_DARK) || '集中（ダーク）',
    theme: 'dark',
    useCustomColors: false,
    fontFamily: 'serif',
    uiFontSize: 14,
    editorFontSize: 18,
    lineHeight: 1.7,
    editorWidthMode: 'narrow'
  },
  {
    id: 'blank-light',
    label: (window.UILabels && window.UILabels.VISUAL_PROFILE_BLANK_LIGHT) || 'ブランク（ライト）',
    theme: 'light',
    useCustomColors: false,
    fontFamily: 'sans-serif',
    uiFontSize: 16,
    editorFontSize: 16,
    lineHeight: 1.5,
    editorWidthMode: 'wide'
  }
];

/**
 * Visual Profile を適用する関数
 * @param {VisualProfile} profile - 適用するプロファイル
 */
function applyVisualProfile(profile) {
  if (!profile || typeof profile !== 'object') {
    console.error('Invalid visual profile:', profile);
    return;
  }

  try {
    // 1) テーマと色を適用
    if (window.ZenWriterTheme && typeof window.ZenWriterTheme.applyTheme === 'function') {
      window.ZenWriterTheme.applyTheme(profile.theme);
    }

    // カスタムカラー設定
    if (profile.useCustomColors && profile.bgColor && profile.textColor) {
      if (window.ZenWriterTheme && typeof window.ZenWriterTheme.applyCustomColors === 'function') {
        window.ZenWriterTheme.applyCustomColors(profile.bgColor, profile.textColor, true);
      }
    } else {
      if (window.ZenWriterTheme && typeof window.ZenWriterTheme.clearCustomColors === 'function') {
        window.ZenWriterTheme.clearCustomColors();
      }
    }

    // 2) フォント設定を適用
    if (window.ZenWriterTheme && typeof window.ZenWriterTheme.applyFontSettings === 'function') {
      window.ZenWriterTheme.applyFontSettings(
        profile.fontFamily,
        profile.editorFontSize, // fontSizeとして使用
        profile.lineHeight,
        profile.uiFontSize,
        profile.editorFontSize
      );
    }

    // 3) エディタレイアウト設定（幅モード）
    if (profile.editorWidthMode && window.ZenWriterEditor && typeof window.ZenWriterEditor.applyWidthMode === 'function') {
      window.ZenWriterEditor.applyWidthMode(profile.editorWidthMode);
    }

    // 4) 表示モード（UIモード）を適用
    if (false && profile.uiMode && window.app && typeof window.app.setUIMode === 'function') {
      window.app.setUIMode(profile.uiMode);
    }

    // 適用完了イベントを発火
    try {
      window.dispatchEvent(new CustomEvent('ZenWriterVisualProfileApplied', {
        detail: { profileId: profile.id, profile: profile }
      }));
    } catch (e) {
      console.warn('Failed to dispatch visual profile applied event:', e);
    }

    console.log('Visual Profile applied:', profile.label, profile);

  } catch (error) {
    console.error('Failed to apply visual profile:', error, profile);
  }
}

/**
 * プロファイルIDから組み込みプロファイルを取得する
 * @param {string} profileId - プロファイルID
 * @returns {VisualProfile|null} 見つかったプロファイル、またはnull
 */
function getBuiltInProfile(profileId) {
  return BUILT_IN_PROFILES.find(p => p.id === profileId) || null;
}

/**
 * すべての組み込みプロファイルを取得する
 * @returns {VisualProfile[]} 組み込みプロファイル一覧
 */
function getBuiltInProfiles() {
  return [...BUILT_IN_PROFILES];
}

// グローバルオブジェクトに公開
window.ZenWriterVisualProfile = {
  applyVisualProfile,
  getBuiltInProfile,
  getBuiltInProfiles,
  BUILT_IN_PROFILES
};
