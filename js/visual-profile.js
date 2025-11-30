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
  applyProfileById
};
