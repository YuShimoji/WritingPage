/**
 * typography-pack.js — SP-061 Visual Profile Typography Pack
 *
 * 作業シーン別タイポグラフィプリセット。
 * ワンクリックで fontFamily / fontSize / lineHeight / micro / heading / ruby を一括適用する。
 * 各設定は ZenWriterTheme の既存 API 経由で適用・マージ保存されるため、
 * 個別調整後の差分は自然に localStorage に残り、リロード後も復元される。
 */
(function () {
  'use strict';

  var CURRENT_PACK_KEY = 'zenWriter_typographyPack:current';

  /**
   * 組み込みパック定義
   * @typedef {Object} TypographyPack
   * @property {string} id
   * @property {string} label
   * @property {string} description
   * @property {string} fontFamily
   * @property {number} editorFontSize
   * @property {number} uiFontSize
   * @property {number} lineHeight
   * @property {Object} micro   - { letterSpacing, paragraphSpacing, paragraphIndent, lineBreakMode }
   * @property {string} headingPreset - HeadingPresetRegistry のプリセット ID
   * @property {Object} ruby    - { visible }
   */
  var BUILT_IN_PACKS = [
    {
      id: 'silent-writing',
      label: '執筆集中',
      description: '長文執筆向け。大きめ本文・広い行間・字下げで没入感を高める。',
      fontFamily: '"Noto Serif JP", serif',
      editorFontSize: 18,
      uiFontSize: 15,
      lineHeight: 1.9,
      micro: { letterSpacing: 0, paragraphSpacing: 1.5, paragraphIndent: 1, lineBreakMode: 'strict-ja' },
      headingPreset: 'body-emphasis',
      ruby: { visible: true }
    },
    {
      id: 'reference-reading',
      label: '資料読解',
      description: 'サンセリフ・コンパクト設定で情報密度を上げて資料参照しやすくする。',
      fontFamily: '"Noto Sans JP", sans-serif',
      editorFontSize: 15,
      uiFontSize: 14,
      lineHeight: 1.6,
      micro: { letterSpacing: 0.02, paragraphSpacing: 0.8, paragraphIndent: 0, lineBreakMode: 'normal' },
      headingPreset: 'default',
      ruby: { visible: false }
    },
    {
      id: 'proofreading',
      label: '校正',
      description: '広めの行間・字間でミスを見つけやすくする。段落頭揃えで流れを追いやすい。',
      fontFamily: '"Noto Serif JP", serif',
      editorFontSize: 16,
      uiFontSize: 15,
      lineHeight: 2.2,
      micro: { letterSpacing: 0.02, paragraphSpacing: 2, paragraphIndent: 0, lineBreakMode: 'strict-ja' },
      headingPreset: 'default',
      ruby: { visible: true }
    },
    {
      id: 'staging-check',
      label: '演出確認',
      description: '読者目線のレイアウト。章扉スタイル見出しで演出の流れを確認する。',
      fontFamily: '"Noto Serif JP", serif',
      editorFontSize: 18,
      uiFontSize: 15,
      lineHeight: 1.7,
      micro: { letterSpacing: 0, paragraphSpacing: 1.2, paragraphIndent: 1, lineBreakMode: 'strict-ja' },
      headingPreset: 'chapter-title',
      ruby: { visible: true }
    }
  ];

  /**
   * 組み込みパック一覧を取得
   * @returns {TypographyPack[]}
   */
  function getBuiltInPacks() {
    return BUILT_IN_PACKS.slice();
  }

  /**
   * ID でパックを取得
   * @param {string} packId
   * @returns {TypographyPack|null}
   */
  function getPack(packId) {
    return BUILT_IN_PACKS.find(function (p) { return p.id === packId; }) || null;
  }

  /**
   * 現在適用中のパック ID を取得
   * @returns {string|null}
   */
  function getCurrentPackId() {
    try { return localStorage.getItem(CURRENT_PACK_KEY) || null; } catch (e) { return null; }
  }

  /**
   * 現在適用中のパック ID を保存
   * @param {string} packId
   */
  function setCurrentPackId(packId) {
    try { localStorage.setItem(CURRENT_PACK_KEY, packId); } catch (e) { /* noop */ }
  }

  /**
   * パックを適用する
   * ZenWriterTheme の各 API を順次呼ぶ。設定はマージ保存されるため後方互換。
   * @param {string} packId
   * @returns {boolean} 成功したか
   */
  function applyTypographyPack(packId) {
    var pack = getPack(packId);
    if (!pack) return false;

    var theme = window.ZenWriterTheme;
    if (!theme) {
      console.warn('[TypographyPack] ZenWriterTheme not available');
      return false;
    }

    try {
      // 1) フォント・行間
      if (typeof theme.applyFontSettings === 'function') {
        theme.applyFontSettings(
          pack.fontFamily,
          pack.editorFontSize,
          pack.lineHeight,
          pack.uiFontSize,
          pack.editorFontSize
        );
      }

      // 2) 本文マイクロタイポグラフィ
      if (typeof theme.applyMicroTypographySettings === 'function') {
        theme.applyMicroTypographySettings(pack.micro);
      }

      // 3) 見出しプリセット
      if (typeof theme.applyHeadingSettings === 'function') {
        theme.applyHeadingSettings(pack.headingPreset, {});
      }

      // 4) ルビ表示
      if (typeof theme.applyRubySettings === 'function') {
        theme.applyRubySettings(pack.ruby);
      }

      setCurrentPackId(packId);

      try {
        window.dispatchEvent(new CustomEvent('ZenWriterTypographyPackApplied', {
          detail: { packId: packId, pack: pack }
        }));
      } catch (e) { /* noop */ }

      return true;
    } catch (err) {
      console.error('[TypographyPack] applyTypographyPack failed:', err);
      return false;
    }
  }

  window.ZenWriterTypographyPack = {
    getBuiltInPacks: getBuiltInPacks,
    getPack: getPack,
    getCurrentPackId: getCurrentPackId,
    applyTypographyPack: applyTypographyPack
  };

})();
