/**
 * chapter-store.js — SP-071 Phase 2 チャプターストア
 *
 * 章を独立した保存単位として管理する。
 * 既存の documents ストア (type: 'chapter') に保存し、
 * ZenWriterStorage の _docsCache / IDB フラッシュ機構を再利用する。
 *
 * 依存: storage.js (ZenWriterStorage)
 * 被依存: chapter-model.js, chapter-list.js
 */
(function () {
  'use strict';

  var STORAGE = null; // ZenWriterStorage (lazy init)

  function ensureStorage() {
    if (!STORAGE) STORAGE = window.ZenWriterStorage;
    return !!STORAGE;
  }

  // ---- Helpers ----

  function uid() {
    return 'ch_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  }

  /**
   * documents 配列から章レコードを取得
   */
  function getAllChaptersRaw() {
    if (!ensureStorage()) return [];
    var docs = STORAGE.loadDocuments();
    var result = [];
    for (var i = 0; i < docs.length; i++) {
      if (docs[i] && docs[i].type === 'chapter') {
        result.push(docs[i]);
      }
    }
    return result;
  }

  /**
   * ドキュメントレコードを取得
   */
  function getDocRecord(docId) {
    if (!ensureStorage()) return null;
    var docs = STORAGE.loadDocuments();
    for (var i = 0; i < docs.length; i++) {
      if (docs[i] && docs[i].id === docId) return docs[i];
    }
    return null;
  }

  // ---- Query ----

  /**
   * ドキュメントが chapterMode かどうか
   */
  function isChapterMode(docId) {
    var doc = getDocRecord(docId);
    return !!(doc && doc.chapterMode);
  }

  /**
   * 指定ドキュメントの章一覧を order 順で返す
   */
  function getChaptersForDoc(docId) {
    var all = getAllChaptersRaw();
    var result = [];
    for (var i = 0; i < all.length; i++) {
      if (all[i].parentId === docId) {
        result.push(all[i]);
      }
    }
    result.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    return result;
  }

  /**
   * 章レコードを ID で取得
   */
  function getChapter(chapterId) {
    if (!ensureStorage()) return null;
    var docs = STORAGE.loadDocuments();
    for (var i = 0; i < docs.length; i++) {
      if (docs[i] && docs[i].id === chapterId && docs[i].type === 'chapter') {
        return docs[i];
      }
    }
    return null;
  }

  // ---- Mutations ----

  /**
   * 新しい章を作成
   * @param {string} docId - 所属ドキュメントID
   * @param {string} title - 章タイトル
   * @param {string} [content=''] - 章本文
   * @param {string|null} [afterChapterId=null] - この章の後に挿入。null なら末尾
   * @param {number} [level=2] - 見出しレベル
   * @returns {Object} 作成された章レコード
   */
  function createChapter(docId, title, content, afterChapterId, level) {
    if (!ensureStorage()) return null;

    var chapters = getChaptersForDoc(docId);
    var order = 0;

    if (afterChapterId) {
      for (var i = 0; i < chapters.length; i++) {
        if (chapters[i].id === afterChapterId) {
          order = (chapters[i].order || 0) + 1;
          // 後続の章の order を +1 シフト
          for (var j = i + 1; j < chapters.length; j++) {
            chapters[j].order = (chapters[j].order || 0) + 1;
            chapters[j].updatedAt = Date.now();
          }
          break;
        }
      }
    } else {
      // 末尾: 最大 order + 1
      for (var k = 0; k < chapters.length; k++) {
        if ((chapters[k].order || 0) >= order) {
          order = (chapters[k].order || 0) + 1;
        }
      }
    }

    var chapter = {
      id: uid(),
      type: 'chapter',
      parentId: docId,
      name: String(title || '新しい章'),
      content: String(content || ''),
      order: order,
      level: level || 2,
      visibility: 'visible',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    var docs = STORAGE.loadDocuments();
    docs.push(chapter);
    STORAGE.saveDocuments(docs);
    return chapter;
  }

  /**
   * 章の本文を更新
   */
  function updateChapterContent(chapterId, content) {
    if (!ensureStorage()) return false;
    var docs = STORAGE.loadDocuments();
    for (var i = 0; i < docs.length; i++) {
      if (docs[i] && docs[i].id === chapterId && docs[i].type === 'chapter') {
        docs[i].content = String(content || '');
        docs[i].updatedAt = Date.now();
        STORAGE.saveDocuments(docs);
        return true;
      }
    }
    return false;
  }

  /**
   * 章をリネーム
   */
  function renameChapter(chapterId, newTitle) {
    if (!ensureStorage()) return false;
    var docs = STORAGE.loadDocuments();
    for (var i = 0; i < docs.length; i++) {
      if (docs[i] && docs[i].id === chapterId && docs[i].type === 'chapter') {
        docs[i].name = String(newTitle || '');
        docs[i].updatedAt = Date.now();
        STORAGE.saveDocuments(docs);
        return true;
      }
    }
    return false;
  }

  /**
   * 章のメタデータを更新（visibility 等）
   * @param {string} chapterId
   * @param {Object} patch - { visibility, level, ... }
   */
  function updateChapterMeta(chapterId, patch) {
    if (!ensureStorage()) return false;
    var docs = STORAGE.loadDocuments();
    for (var i = 0; i < docs.length; i++) {
      if (docs[i] && docs[i].id === chapterId && docs[i].type === 'chapter') {
        var allowed = ['visibility', 'level', 'metadata'];
        for (var k = 0; k < allowed.length; k++) {
          if (patch.hasOwnProperty(allowed[k])) {
            docs[i][allowed[k]] = patch[allowed[k]];
          }
        }
        docs[i].updatedAt = Date.now();
        STORAGE.saveDocuments(docs);
        return true;
      }
    }
    return false;
  }

  /**
   * 章を削除
   */
  function deleteChapter(chapterId) {
    if (!ensureStorage()) return false;
    var docs = STORAGE.loadDocuments();
    var idx = -1;
    for (var i = 0; i < docs.length; i++) {
      if (docs[i] && docs[i].id === chapterId && docs[i].type === 'chapter') {
        idx = i;
        break;
      }
    }
    if (idx < 0) return false;

    // IDB からも削除
    if (window.ZenWriterIDB && window.ZenWriterIDB.isAvailable()) {
      window.ZenWriterIDB.deleteDoc(chapterId).catch(function (e) {
        console.warn('[ChapterStore] IDB delete error:', e);
      });
    }

    docs.splice(idx, 1);
    STORAGE.saveDocuments(docs);
    return true;
  }

  /**
   * 章の order を再設定
   * @param {string} docId
   * @param {string[]} orderedIds - 新しい順序の章ID配列
   */
  function reorderChapters(docId, orderedIds) {
    if (!ensureStorage()) return false;
    var docs = STORAGE.loadDocuments();
    var now = Date.now();
    for (var i = 0; i < orderedIds.length; i++) {
      for (var j = 0; j < docs.length; j++) {
        if (docs[j] && docs[j].id === orderedIds[i] && docs[j].type === 'chapter') {
          docs[j].order = i;
          docs[j].updatedAt = now;
          break;
        }
      }
    }
    STORAGE.saveDocuments(docs);
    return true;
  }

  // ---- Assembly / Splitting ----

  /**
   * 全章を結合して全文テキストを生成
   */
  function assembleFullText(docId) {
    var chapters = getChaptersForDoc(docId);
    if (chapters.length === 0) return '';

    // 自動生成の単一章 ("本文") の場合、ヘッダーを付加しない
    if (chapters.length === 1 && chapters[0].name === '\u672C\u6587') {
      return chapters[0].content || '';
    }

    var parts = [];
    for (var i = 0; i < chapters.length; i++) {
      var ch = chapters[i];
      var prefix = '';
      for (var h = 0; h < (ch.level || 2); h++) prefix += '#';
      var heading = prefix + ' ' + (ch.name || '');
      var body = ch.content || '';
      // 見出し + 本文
      parts.push(heading + '\n\n' + body);
    }
    return parts.join('\n\n');
  }

  /**
   * 全文テキストを見出しで分解して各章の content を更新
   * 既存の章レコードがあれば更新、なければ新規作成
   */
  function splitIntoChapters(docId, fullText) {
    if (!ensureStorage()) return;
    var Model = window.ZWChapterModel;
    if (!Model) return;

    /** assemble 由来の見出し直後／章境界の余分な改行を除き、章レコード content と整合させる */
    function trimChapterSliceBody(body) {
      return String(body || '').replace(/^\n+/, '').replace(/\n+$/, '');
    }

    var parsed = Model.parseChapters(fullText);
    var existing = getChaptersForDoc(docId);
    var docs = STORAGE.loadDocuments();
    var now = Date.now();

    if (parsed.length === 0) {
      // 見出しなし: 全文を1章として扱う
      if (existing.length === 0) {
        var ch = {
          id: uid(),
          type: 'chapter',
          parentId: docId,
          name: '本文',
          content: trimChapterSliceBody(fullText),
          order: 0,
          level: 2,
          visibility: 'visible',
          createdAt: now,
          updatedAt: now
        };
        docs.push(ch);
      } else {
        // 最初の章に全文を入れ、残りを削除
        for (var d = 0; d < docs.length; d++) {
          if (docs[d] && docs[d].id === existing[0].id) {
            docs[d].content = trimChapterSliceBody(fullText);
            docs[d].updatedAt = now;
            break;
          }
        }
        for (var r = 1; r < existing.length; r++) {
          removeDocById(docs, existing[r].id);
        }
      }
      STORAGE.saveDocuments(docs);
      return;
    }

    // 見出しベースの分解: parsed と existing をマッチング
    // 簡易方式: order 順に対応付け。数が異なる場合は作成/削除
    for (var i = 0; i < parsed.length; i++) {
      var p = parsed[i];
      var body = trimChapterSliceBody(Model.getChapterBody(fullText, p));

      if (i < existing.length) {
        // 既存章を更新
        for (var j = 0; j < docs.length; j++) {
          if (docs[j] && docs[j].id === existing[i].id) {
            docs[j].name = p.title;
            docs[j].content = body;
            docs[j].level = p.level;
            docs[j].order = i;
            docs[j].updatedAt = now;
            break;
          }
        }
      } else {
        // 新規章
        docs.push({
          id: uid(),
          type: 'chapter',
          parentId: docId,
          name: p.title,
          content: body,
          order: i,
          level: p.level,
          visibility: 'visible',
          createdAt: now,
          updatedAt: now
        });
      }
    }

    // parsed より既存章が多い場合、余分を削除
    for (var k = parsed.length; k < existing.length; k++) {
      removeDocById(docs, existing[k].id);
    }

    STORAGE.saveDocuments(docs);
  }

  function removeDocById(docs, id) {
    for (var i = docs.length - 1; i >= 0; i--) {
      if (docs[i] && docs[i].id === id) {
        // IDB からも削除
        if (window.ZenWriterIDB && window.ZenWriterIDB.isAvailable()) {
          window.ZenWriterIDB.deleteDoc(id).catch(function () {});
        }
        docs.splice(i, 1);
        return;
      }
    }
  }

  // ---- Migration (legacy, removed) ----
  // migrateToChapterMode / revertChapterMode は SP-081 で削除
  // chapterMode が唯一のモード

  // ---- Public API ----

  window.ZWChapterStore = {
    // Query
    isChapterMode: isChapterMode,
    getChaptersForDoc: getChaptersForDoc,
    getChapter: getChapter,

    // Mutations
    createChapter: createChapter,
    updateChapterContent: updateChapterContent,
    updateChapterMeta: updateChapterMeta,
    renameChapter: renameChapter,
    deleteChapter: deleteChapter,
    reorderChapters: reorderChapters,

    // Assembly / Splitting
    assembleFullText: assembleFullText,
    splitIntoChapters: splitIntoChapters,

    // ensureChapterMode: 新規ドキュメントは常に chapterMode
    ensureChapterMode: function (docId) {
      if (!ensureStorage()) return false;
      var doc = getDocRecord(docId);
      if (!doc) return false;
      if (doc.chapterMode) return true;
      // 自動変換: chapterMode フラグを設定
      var docs = STORAGE.loadDocuments();
      for (var i = 0; i < docs.length; i++) {
        if (docs[i] && docs[i].id === docId) {
          docs[i].chapterMode = true;
          docs[i].updatedAt = Date.now();
          break;
        }
      }
      STORAGE.saveDocuments(docs);
      // 既存コンテンツがあれば章に分割
      var fullText = doc.content || '';
      if (fullText) {
        splitIntoChapters(docId, fullText);
      }
      return true;
    }
  };
})();
