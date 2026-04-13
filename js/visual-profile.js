// Visual Profile 管理 — Phase A 実装 + SP-061 Typography Pack
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
 * @property {string} uiMode - 表示モード ('normal' | 'focus')
 * @property {string} [typographyPack] - SP-061 タイポグラフィパックID
 */

/**
 * SP-061 Typography Pack 定義
 * 作業文脈ごとにタイポグラフィ設定を一括切替するためのパック。
 * @typedef {Object} TypographyPack
 * @property {string} id - パックID
 * @property {string} label - UI表示名
 * @property {string} description - 説明文
 * @property {Object} values - タイポグラフィ設定値
 */
const TYPOGRAPHY_PACKS = [
  {
    id: 'silent-writing',
    label: '執筆集中',
    description: '大きめの本文、広い行間。見出しは控えめ。ルビ非表示。字間ゆったり。',
    values: {
      editorFontSize: 18,
      lineHeight: 2.0,
      letterSpacing: 0.04,
      paragraphIndent: true,
      headingPreset: 'novel',
      rubyVisibility: 'hidden'
    }
  },
  {
    id: 'reference-reading',
    label: '資料読解',
    description: '標準サイズ、詰め気味の行間。ルビ表示。見出しは視認性重視。',
    values: {
      editorFontSize: 15,
      lineHeight: 1.5,
      letterSpacing: 0.0,
      paragraphIndent: false,
      headingPreset: 'default',
      rubyVisibility: 'visible'
    }
  },
  {
    id: 'proofreading',
    label: '校正',
    description: 'やや大きめ本文、広い行間と字間。ルビ表示。赤入れしやすい余白。',
    values: {
      editorFontSize: 17,
      lineHeight: 2.2,
      letterSpacing: 0.06,
      paragraphIndent: true,
      headingPreset: 'default',
      rubyVisibility: 'visible'
    }
  },
  {
    id: 'staging-check',
    label: '演出確認',
    description: '読者体験に近い設定。標準本文サイズ、適度な行間。ルビ表示。',
    values: {
      editorFontSize: 16,
      lineHeight: 1.8,
      letterSpacing: 0.02,
      paragraphIndent: true,
      headingPreset: 'novel',
      rubyVisibility: 'visible'
    }
  }
];

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
    editorWidthMode: 'narrow',
    typographyPack: 'silent-writing'
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

    // 4) 表示モード（UIモード）を適用 — setUIMode 経由で副作用を統一
    if (profile.uiMode) {
      var uiMode = profile.uiMode === 'reader' ? 'focus' : profile.uiMode;
      if (window.ZenWriterApp && typeof window.ZenWriterApp.setUIMode === 'function') {
        window.ZenWriterApp.setUIMode(uiMode);
      } else {
        var currentMode = document.documentElement.getAttribute('data-ui-mode') || 'focus';
        if (currentMode !== uiMode) {
          document.documentElement.setAttribute('data-ui-mode', uiMode);
        }
      }
    }

    // 5) SP-061: Typography Pack を適用
    if (profile.typographyPack) {
      applyTypographyPack(profile.typographyPack);
    }

    // 適用完了イベントを発火
    try {
      window.dispatchEvent(new CustomEvent('ZenWriterVisualProfileApplied', {
        detail: { profileId: profile.id, profile: profile }
      }));
    } catch (e) {
      console.warn('Failed to dispatch visual profile applied event:', e);
    }

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

// ===== Phase B: ユーザー定義プロファイル =====

const USER_PROFILES_KEY = 'zenWriter_visualProfiles:user';
const CURRENT_PROFILE_KEY = 'zenWriter_visualProfiles:current';

/**
 * ユーザー定義プロファイルを取得
 * @returns {VisualProfile[]}
 */
function getUserProfiles() {
  try {
    const stored = localStorage.getItem(USER_PROFILES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load user profiles:', e);
  }
  return [];
}

/**
 * ユーザー定義プロファイルを保存
 * @param {VisualProfile[]} profiles
 */
function saveUserProfiles(profiles) {
  try {
    localStorage.setItem(USER_PROFILES_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.error('Failed to save user profiles:', e);
  }
}

/**
 * すべてのプロファイル（組み込み + ユーザー定義）を取得
 * @returns {VisualProfile[]}
 */
function getAllProfiles() {
  return [...BUILT_IN_PROFILES, ...getUserProfiles()];
}

/**
 * IDからプロファイルを取得（組み込み + ユーザー定義）
 * @param {string} profileId
 * @returns {VisualProfile|null}
 */
function getProfile(profileId) {
  return getAllProfiles().find(p => p.id === profileId) || null;
}

/**
 * 現在の設定からプロファイルを作成して保存
 * @param {string} name - プロファイル名
 * @returns {VisualProfile} 作成されたプロファイル
 */
function saveCurrentAsProfile(name) {
  const id = 'user-' + Date.now();
  const profile = {
    id,
    label: name,
    theme: document.documentElement.getAttribute('data-theme') || 'light',
    useCustomColors: false,
    fontFamily: getComputedStyle(document.documentElement).getPropertyValue('--font-family').trim() || 'serif',
    uiFontSize: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--ui-font-size')) || 16,
    editorFontSize: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--font-size')) || 16,
    lineHeight: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--line-height')) || 1.6,
    editorWidthMode: localStorage.getItem('zenWriter_editorWidthMode') || 'medium',
    isUserDefined: true
  };
  
  const userProfiles = getUserProfiles();
  userProfiles.push(profile);
  saveUserProfiles(userProfiles);
  
  return profile;
}

/**
 * ユーザー定義プロファイルを削除
 * @param {string} profileId
 * @returns {boolean} 削除成功
 */
function deleteUserProfile(profileId) {
  if (!profileId.startsWith('user-')) return false;
  
  const userProfiles = getUserProfiles();
  const index = userProfiles.findIndex(p => p.id === profileId);
  if (index === -1) return false;
  
  userProfiles.splice(index, 1);
  saveUserProfiles(userProfiles);
  return true;
}

/**
 * ユーザー定義プロファイルを更新
 * @param {string} profileId
 * @param {Partial<VisualProfile>} updates
 * @returns {boolean}
 */
function updateUserProfile(profileId, updates) {
  if (!profileId.startsWith('user-')) return false;
  
  const userProfiles = getUserProfiles();
  const index = userProfiles.findIndex(p => p.id === profileId);
  if (index === -1) return false;
  
  userProfiles[index] = { ...userProfiles[index], ...updates };
  saveUserProfiles(userProfiles);
  return true;
}

/**
 * 現在適用中のプロファイルIDを取得
 * @returns {string|null}
 */
function getCurrentProfileId() {
  try {
    return localStorage.getItem(CURRENT_PROFILE_KEY) || null;
  } catch (e) {
    return null;
  }
}

/**
 * 現在適用中のプロファイルIDを保存
 * @param {string} profileId
 */
function setCurrentProfileId(profileId) {
  try {
    localStorage.setItem(CURRENT_PROFILE_KEY, profileId);
  } catch (e) {
    console.warn('Failed to save current profile ID:', e);
  }
}

/**
 * プロファイルを適用し、IDを記録
 * @param {string} profileId
 * @returns {boolean}
 */
function applyProfileById(profileId) {
  const profile = getProfile(profileId);
  if (!profile) return false;
  
  applyVisualProfile(profile);
  setCurrentProfileId(profileId);
  return true;
}

// ===== SP-061: Typography Pack =====

/**
 * Typography Pack をIDで取得
 * @param {string} packId
 * @returns {TypographyPack|null}
 */
function getTypographyPack(packId) {
  return TYPOGRAPHY_PACKS.find(p => p.id === packId) || null;
}

/**
 * すべてのTypography Packを取得
 * @returns {TypographyPack[]}
 */
function getTypographyPacks() {
  return [...TYPOGRAPHY_PACKS];
}

/**
 * Typography Pack を適用する
 * 見出しプリセット、字間、行間、本文サイズ、ルビ可視性を一括設定。
 * @param {string} packId - パックID
 * @returns {boolean} 適用成功
 */
function applyTypographyPack(packId) {
  var pack = getTypographyPack(packId);
  if (!pack) return false;

  var v = pack.values;
  var root = document.documentElement;

  // 本文フォントサイズ
  if (v.editorFontSize) {
    root.style.setProperty('--font-size', (v.editorFontSize / 16) + 'rem');
  }

  // 行間
  if (v.lineHeight) {
    root.style.setProperty('--line-height', String(v.lineHeight));
  }

  // 字間 (既存CSS変数 --body-letter-spacing に合わせる)
  if (typeof v.letterSpacing === 'number') {
    root.style.setProperty('--body-letter-spacing', v.letterSpacing + 'em');
  }

  // 段落字下げ
  if (typeof v.paragraphIndent === 'boolean') {
    root.setAttribute('data-paragraph-indent', v.paragraphIndent ? 'true' : 'false');
  }

  // 見出しプリセット (HeadingPresetRegistry 経由)
  if (v.headingPreset && window.HeadingPresetRegistry) {
    var preset = window.HeadingPresetRegistry.getPreset(v.headingPreset);
    if (preset && preset.values) {
      var vals = preset.values;
      for (var level = 1; level <= 6; level++) {
        var key = 'h' + level;
        if (vals[key]) {
          if (vals[key].fontSize) root.style.setProperty('--heading-h' + level + '-size', vals[key].fontSize);
          if (vals[key].fontWeight) root.style.setProperty('--heading-h' + level + '-weight', vals[key].fontWeight);
          if (vals[key].lineHeight) root.style.setProperty('--heading-h' + level + '-line-height', String(vals[key].lineHeight));
        }
      }
    }
  }

  // ルビ可視性 (既存 data-ruby-hidden 属性に変換)
  if (v.rubyVisibility) {
    if (v.rubyVisibility === 'hidden') {
      root.setAttribute('data-ruby-hidden', 'true');
    } else {
      root.removeAttribute('data-ruby-hidden');
    }
  }

  // 適用中パックIDを保存
  try {
    localStorage.setItem('zenWriter_typographyPack', packId);
  } catch (_) { /* ignore */ }

  // イベント発火
  try {
    window.dispatchEvent(new CustomEvent('ZenWriterTypographyPackApplied', {
      detail: { packId: packId, pack: pack }
    }));
  } catch (_) { /* ignore */ }

  return true;
}

/**
 * 現在適用中のTypography Pack IDを取得
 * @returns {string|null}
 */
function getCurrentTypographyPackId() {
  try {
    return localStorage.getItem('zenWriter_typographyPack') || null;
  } catch (_) {
    return null;
  }
}

/**
 * Typography Pack をクリア（デフォルト状態に戻す）
 */
function clearTypographyPack() {
  var root = document.documentElement;
  root.style.removeProperty('--body-letter-spacing');
  root.removeAttribute('data-paragraph-indent');
  root.removeAttribute('data-ruby-hidden');
  try {
    localStorage.removeItem('zenWriter_typographyPack');
  } catch (_) { /* ignore */ }
}

// グローバルオブジェクトに公開
window.ZenWriterVisualProfile = {
  // Phase A
  applyVisualProfile,
  getBuiltInProfile,
  getBuiltInProfiles,
  BUILT_IN_PROFILES,
  // Phase B
  getUserProfiles,
  getAllProfiles,
  getProfile,
  saveCurrentAsProfile,
  deleteUserProfile,
  updateUserProfile,
  getCurrentProfileId,
  setCurrentProfileId,
  applyProfileById,
  // SP-061: Typography Pack
  TYPOGRAPHY_PACKS,
  getTypographyPack,
  getTypographyPacks,
  applyTypographyPack,
  getCurrentTypographyPackId,
  clearTypographyPack
};
