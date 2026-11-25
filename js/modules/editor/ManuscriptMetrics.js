/**
 * ManuscriptMetrics
 * 文字数・原稿用紙枚数の集計を 1 か所に集約する（状態表示・目標・Design Cockpit・セクション一覧が共有）。
 * 「読者に見える本文」を数える。保存形式（Markdown + 独自タグ）の記号は数えない。
 * 純関数は Node（node --test）からも読み込める。ブラウザでは設定の数え方を window.ZenWriterStorage から読む。
 */
(function (root) {
  'use strict';

  /** 数え方。既定は日本語の小説ツールで一般的な「改行・空白を除く」。 */
  var MODES = {
    noSpaces: { label: '改行・空白を除く', hint: '改行・空白・字下げの全角スペースを数えません' },
    noBreaks: { label: '改行を除く', hint: '改行だけを除き、空白と字下げは数えます' },
    all: { label: 'すべて数える', hint: '改行と空白も 1 文字として数えます（先頭と末尾の空白を除く）' }
  };
  var MODE_ORDER = ['noSpaces', 'noBreaks', 'all'];
  var DEFAULT_MODE = 'noSpaces';
  /** 原稿用紙 1 枚の文字数（20 字 × 20 行）。行 × 字の設定は文書の組み設定で扱う。 */
  var DEFAULT_CHARS_PER_SHEET = 400;

  /**
   * 装飾・アニメーション・テクスチャの対記法 `[tag]…[/tag]` のタグ名（閉じた一覧）。
   * RichTextTurndownRules / TextAnimationDictionary が書き出す名前と一致させる。
   * 本文中の `[メモ]` のような括弧書きを巻き込まないよう、任意の英小文字ではなく一覧に限る。
   */
  var INLINE_MARKUP_TAG_RE = /\[\/?(?:bold|italic|underline|strike|smallcaps|light|shadow|black|uppercase|lowercase|capitalize|outline|glow|wide|narrow|fade|slide|type|pulse|shake|bounce|fadein|wave|sparkle|cosmic|fire|glitch)\]/g;

  var cachedMode = null;

  function normalizeMode(mode) {
    return MODES[mode] ? mode : DEFAULT_MODE;
  }

  /**
   * Markdown 正本から、読者に見える本文を取り出す。
   * ルビは親文字、傍点とリンクは本文、見出し記号・DSL 行・装飾タグ・強調記号・揃え用 HTML は除く。
   */
  function visibleText(markdown) {
    if (!markdown) return '';
    return String(markdown)
      .replace(/^> \[!PLAY-DIARY\]([^\n]*)((?:\n>[^\n]*)*)/gm, (_match, day, body) =>
        (day.trimStart() + body.replace(/^> \[!SPEAKER:(?:npc|player|unknown)\] ?/gm, '> ')
          .replace(/\n>(?: ?>(?: )?| )?/g, '\n'))
          .replace(/!\[(?:\\.|[^\]\\])*\]\([^)]+\)/g, '')
          .replace(/&#(\d{1,3});/g, (_entity, number) => String.fromCharCode(Number(number))))
      .replace(/^:::zw-[^\n]*\n?/gm, '')
      .replace(/^:::\s*$/gm, '')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // 傍点はルビ記法 {親|ルビ} と同じ形なので、先に処理しないと "kenten" が数えられる
      .replace(/\{kenten\|([^}]+)\}/g, '$1')
      .replace(/\{([^|}]+)\|[^}]+\}/g, '$1')
      .replace(INLINE_MARKUP_TAG_RE, '')
      .replace(/<\/?(?:p|h[1-3]|blockquote|li)\b[^>]*>/gi, '')
      .replace(/\*\*|~~/g, '')
      .replace(/(^|[^*\w])\*([^*\n]+)\*(?=[^*\w]|$)/g, '$1$2');
  }

  /** 画面に出ている文字列（選択範囲など、記号を含まないもの）へ数え方だけを適用して数える。 */
  function countRendered(text, mode) {
    var s = String(text == null ? '' : text);
    switch (normalizeMode(mode)) {
      case 'noSpaces': return s.replace(/\s/g, '').length;
      case 'noBreaks': return s.replace(/[\r\n]/g, '').length;
      default: return s.trim().length;
    }
  }

  /** Markdown 正本の文字数。mode を省くと設定（既定: 改行・空白を除く）に従う。 */
  function count(markdown, mode) {
    return countRendered(visibleText(markdown), mode === undefined ? getMode() : mode);
  }

  /** 原稿用紙の枚数（小数 1 桁）。400 字詰め換算。 */
  function sheets(charCount, charsPerSheet) {
    var per = charsPerSheet > 0 ? charsPerSheet : DEFAULT_CHARS_PER_SHEET;
    return Math.round((charCount / per) * 10) / 10;
  }

  function readModeFromSettings() {
    try {
      var storage = root.ZenWriterStorage;
      var settings = storage && typeof storage.loadSettings === 'function' ? storage.loadSettings() : null;
      return normalizeMode(settings && settings.editor && settings.editor.countMode);
    } catch (_) {
      return DEFAULT_MODE;
    }
  }

  /** 設定中の数え方。入力のたびに設定 JSON を読まないよう、変更通知まで保持する。 */
  function getMode() {
    if (cachedMode === null) cachedMode = readModeFromSettings();
    return cachedMode;
  }

  function setMode(mode) {
    var next = normalizeMode(mode);
    try {
      var storage = root.ZenWriterStorage;
      if (storage && typeof storage.loadSettings === 'function' && typeof storage.saveSettings === 'function') {
        var settings = storage.loadSettings();
        settings.editor = settings.editor || {};
        settings.editor.countMode = next;
        storage.saveSettings(settings);
      }
    } catch (_) { /* 保存に失敗しても表示中の数え方は切り替える */ }
    cachedMode = next;
    notifyChanged();
    return next;
  }

  /** 次の数え方へ順に切り替える（コマンドパレット用）。 */
  function cycleMode() {
    var index = MODE_ORDER.indexOf(getMode());
    return setMode(MODE_ORDER[(index + 1) % MODE_ORDER.length]);
  }

  function notifyChanged() {
    try {
      if (typeof root.dispatchEvent === 'function' && typeof root.CustomEvent === 'function') {
        root.dispatchEvent(new root.CustomEvent('ZWManuscriptMetricsChanged'));
      }
    } catch (_) { /* noop */ }
  }

  if (typeof root.addEventListener === 'function') {
    root.addEventListener('ZenWriterSettingsChanged', function () {
      var next = readModeFromSettings();
      if (next !== cachedMode) {
        cachedMode = next;
        notifyChanged();
      }
    });
  }

  var api = {
    MODES: MODES,
    MODE_ORDER: MODE_ORDER,
    DEFAULT_MODE: DEFAULT_MODE,
    DEFAULT_CHARS_PER_SHEET: DEFAULT_CHARS_PER_SHEET,
    visibleText: visibleText,
    countRendered: countRendered,
    count: count,
    sheets: sheets,
    getMode: getMode,
    setMode: setMode,
    cycleMode: cycleMode
  };

  root.ManuscriptMetrics = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
