/**
 * content-guard.js — データ保全ガード共通モジュール
 *
 * エディタ内容の取得・保存・書込を安全に行う共通関数群。
 * WYSIWYG / textarea / chapterMode の全パスに対応し、
 * 操作前のバックアップ・flush を一元管理する。
 *
 * 依存: storage.js (ZenWriterStorage), chapter-store.js (ZWChapterStore),
 *        chapter-list.js (ZWChapterList), editor.js (ZenWriterEditor)
 */
(function () {
  'use strict';

  // ---- 内部ヘルパー ----

  function _getStorage() {
    return window.ZenWriterStorage || null;
  }

  function _getEditor() {
    return window.ZenWriterEditor || null;
  }

  function _getChapterStore() {
    return window.ZWChapterStore || null;
  }

  function _getChapterList() {
    return window.ZWChapterList || null;
  }

  function _getCurrentDocId() {
    var S = _getStorage();
    return (S && typeof S.getCurrentDocId === 'function') ? (S.getCurrentDocId() || null) : null;
  }

  function _isChapterMode() {
    var docId = _getCurrentDocId();
    var Store = _getChapterStore();
    return !!(docId && Store && Store.isChapterMode(docId));
  }

  // ---- Public API ----

  /**
   * エディタの現在値を安全に取得する。
   * WYSIWYG / textarea / chapterMode のいずれにも対応。
   *
   * @returns {string} エディタの現在のテキスト内容
   */
  function getEditorContent() {
    // 1. ZenWriterEditor API (WYSIWYG でも Markdown を返す)
    var E = _getEditor();
    if (E && typeof E.getEditorValue === 'function') {
      var val = E.getEditorValue();
      if (val) return val;
    }

    // 2. textarea 直接
    var editorEl = document.getElementById('editor');
    if (editorEl && editorEl.value) {
      return editorEl.value;
    }

    // 3. WYSIWYG div の innerText
    var wysiwygEl = document.getElementById('wysiwyg-editor');
    if (wysiwygEl && wysiwygEl.innerText) {
      return wysiwygEl.innerText;
    }

    return '';
  }

  /**
   * chapterMode でアクティブ章が編集中なら、ストアにフラッシュする。
   * chapterMode でなければ何もしない。
   *
   * @returns {boolean} フラッシュが実行されたか
   */
  function flushChapterIfNeeded() {
    if (!_isChapterMode()) return false;

    var CL = _getChapterList();
    if (!CL) return false;

    // 公開API flushActive を優先 (内部キャッシュも更新される)
    if (typeof CL.flushActive === 'function') {
      CL.flushActive();
      return true;
    }

    // フォールバック: 直接ストアに書き込む
    var Store = _getChapterStore();
    var chapters = (typeof CL.getChapters === 'function') ? CL.getChapters() : [];
    var activeIdx = (typeof CL.getActiveIndex === 'function') ? CL.getActiveIndex() : -1;

    if (activeIdx >= 0 && activeIdx < chapters.length) {
      var ch = chapters[activeIdx];
      if (ch && ch.id) {
        var text = getEditorContent();
        Store.updateChapterContent(ch.id, text);
        ch.content = text;
        return true;
      }
    }
    return false;
  }

  /**
   * 破壊的操作の前に呼ぶ。現在のエディタ内容を確実に保存する。
   *
   * 1. chapterMode ならアクティブ章をフラッシュ
   * 2. メインドキュメントの content を更新
   * 3. スナップショットを作成 (バックアップ)
   *
   * @param {Object} [opts]
   * @param {boolean} [opts.snapshot=true] - スナップショットも作成するか
   * @returns {string} 保存した内容のテキスト
   */
  function ensureSaved(opts) {
    opts = opts || {};
    var doSnapshot = opts.snapshot !== false;

    // chapterMode の章をフラッシュ
    flushChapterIfNeeded();

    // メイン内容を取得・保存
    var content = getEditorContent();
    var S = _getStorage();

    if (S && content) {
      // ドキュメントの content フィールドを更新
      if (typeof S.saveContent === 'function') {
        S.saveContent(content);
      }

      // スナップショット退避
      if (doSnapshot && typeof S.addSnapshot === 'function' && content.length > 0) {
        S.addSnapshot(content);
      }
    }

    return content;
  }

  /**
   * エディタに内容を書き込む。書込前に現在の内容をバックアップする。
   *
   * @param {string} text - 書き込む内容
   * @param {Object} [opts]
   * @param {boolean} [opts.backup=true] - 書込前にスナップショットを作るか
   * @returns {boolean} 書込が成功したか
   */
  function safeSetContent(text, opts) {
    opts = opts || {};
    var doBackup = opts.backup !== false;

    // 書込前の内容をバックアップ
    if (doBackup) {
      var current = getEditorContent();
      if (current && current.length > 0) {
        var S = _getStorage();
        if (S && typeof S.addSnapshot === 'function') {
          S.addSnapshot(current);
        }
      }
    }

    // ZenWriterEditor.setContent があれば使用 (WYSIWYG + textarea 同期)
    var E = _getEditor();
    if (E && typeof E.setContent === 'function') {
      E.setContent(text);
      return true;
    }

    // フォールバック: textarea 直接
    var editorEl = document.getElementById('editor');
    if (editorEl) {
      editorEl.value = text || '';
      editorEl.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }

    return false;
  }

  /**
   * ドキュメント切替の安全なラッパー。
   * chapterMode の flush + dirty チェック + スナップショット退避を一括で行う。
   *
   * @param {string} newDocId - 切替先のドキュメントID
   * @param {Object} [opts]
   * @param {boolean} [opts.confirmIfDirty=true] - 未保存時に confirm を出すか
   * @param {Function} [opts.onCancelled] - ユーザーがキャンセルした場合のコールバック
   * @returns {boolean} 切替を続行してよいか (false = キャンセルされた)
   */
  function prepareDocumentSwitch(newDocId, opts) {
    opts = opts || {};
    var confirmIfDirty = opts.confirmIfDirty !== false;

    // 1. chapterMode ならアクティブ章をフラッシュ
    flushChapterIfNeeded();

    // 2. dirty チェック
    var E = _getEditor();
    var hasDirty = (E && typeof E.isDirty === 'function') ? E.isDirty() : false;
    var S = _getStorage();
    var content = getEditorContent();

    if (hasDirty) {
      var settings = (S && typeof S.loadSettings === 'function') ? (S.loadSettings() || {}) : {};
      var autoSaveEnabled = settings.autoSave && settings.autoSave.enabled;

      if (autoSaveEnabled) {
        // 自動保存: 即座に保存
        if (S && typeof S.saveContent === 'function') {
          S.saveContent(content);
        }
      } else if (confirmIfDirty) {
        // 手動保存: 確認ダイアログ
        var msg = (window.UILabels && window.UILabels.UNSAVED_CHANGES_SWITCH) ||
          '未保存の変更があります。ファイルを切り替えますか？\n現在の内容はスナップショットとして自動退避します。';
        if (!confirm(msg)) {
          if (typeof opts.onCancelled === 'function') opts.onCancelled();
          return false;
        }
        // スナップショット退避
        if (S && typeof S.addSnapshot === 'function' && content.length > 0) {
          S.addSnapshot(content);
        }
      }
    } else {
      // dirty でなくても WYSIWYG 同期ずれ対策として必ず保存
      if (S && typeof S.saveContent === 'function' && content) {
        S.saveContent(content);
      }
    }

    return true;
  }

  /**
   * 新規ドキュメント作成前の安全なガード。
   * dirty チェック + スナップショット退避 + chapterMode flush を行う。
   *
   * @returns {boolean} 続行してよいか (false = キャンセルされた)
   */
  function prepareNewDocument() {
    // chapterMode flush
    flushChapterIfNeeded();

    var E = _getEditor();
    var hasDirty = (E && typeof E.isDirty === 'function') ? E.isDirty() : false;
    var S = _getStorage();
    var content = getEditorContent();

    if (hasDirty) {
      var msg = (window.UILabels && window.UILabels.UNSAVED_CHANGES_NEW) ||
        '未保存の変更があります。新規作成を続行しますか？\n現在の内容はスナップショットとして自動退避します。';
      if (!confirm(msg)) return false;

      if (S && typeof S.addSnapshot === 'function' && content.length > 0) {
        S.addSnapshot(content);
      }
    } else {
      // dirty でなくても保存 (WYSIWYG 同期ずれ対策)
      if (S && typeof S.saveContent === 'function' && content) {
        S.saveContent(content);
      }
    }

    return true;
  }

  // ---- Export ----

  window.ZWContentGuard = {
    getEditorContent: getEditorContent,
    flushChapterIfNeeded: flushChapterIfNeeded,
    ensureSaved: ensureSaved,
    safeSetContent: safeSetContent,
    prepareDocumentSwitch: prepareDocumentSwitch,
    prepareNewDocument: prepareNewDocument
  };
})();
