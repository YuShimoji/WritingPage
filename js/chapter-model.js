/**
 * chapter-model.js — SP-071 Phase 1 チャプターデータモデル
 *
 * 見出しベースのドキュメントからチャプター構造を自動検出する。
 * Phase 1 では保存形式を変更せず、既存テキスト上の見出し操作として
 * 追加・リネーム・移動・削除を実現する。
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'zenwriter-chapter-config';

  // ---- Chapter ----

  /**
   * @typedef {Object} Chapter
   * @property {string}  id
   * @property {string}  title
   * @property {number}  level        -- heading level (1-6)
   * @property {number}  order        -- display order in sibling list
   * @property {number}  startOffset  -- char offset in document text
   * @property {number}  endOffset    -- exclusive end offset
   * @property {number}  headingEnd   -- end offset of the heading line (incl. newline)
   * @property {string}  visibility   -- 'visible' | 'draft' | 'hidden'
   */

  // ---- Parsing ----

  /**
   * テキストから見出しを検出してチャプター配列を返す。
   * @param {string} text
   * @returns {Chapter[]}
   */
  function parseChapters(text) {
    if (!text) return [];
    var lines = text.split('\n');
    var chapters = [];
    var offset = 0;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var m = line.match(/^(#{1,6})\s+(.+)$/);
      if (m) {
        var headingEnd = offset + line.length + 1; // +1 for \n
        chapters.push({
          id: 'ch-' + offset,
          title: m[2].trim(),
          level: m[1].length,
          order: chapters.length,
          startOffset: offset,
          endOffset: -1, // filled in second pass
          headingEnd: Math.min(headingEnd, text.length + 1),
          visibility: 'visible'
        });
      }
      offset += line.length + 1; // +1 for \n
    }

    // 各チャプターの endOffset を設定（次チャプターの startOffset or ドキュメント末尾）
    for (var j = 0; j < chapters.length; j++) {
      chapters[j].endOffset = (j + 1 < chapters.length)
        ? chapters[j + 1].startOffset
        : text.length;
    }

    return chapters;
  }

  /**
   * チャプターの本文テキストを取得（見出し行を除く）
   * @param {string} text -- document text
   * @param {Chapter} chapter
   * @returns {string}
   */
  function getChapterBody(text, chapter) {
    return text.substring(chapter.headingEnd, chapter.endOffset);
  }

  /**
   * チャプター全体のテキストを取得（見出し行含む）
   * @param {string} text
   * @param {Chapter} chapter
   * @returns {string}
   */
  function getChapterBlock(text, chapter) {
    return text.substring(chapter.startOffset, chapter.endOffset);
  }

  // ---- Mutations ----

  /**
   * 新しい章を追加する。afterChapterId の章の後に挿入。
   * null の場合はドキュメント末尾に追加。
   * @param {string} text
   * @param {Chapter[]} chapters
   * @param {string|null} afterChapterId
   * @param {string} title
   * @param {number} [level=2]
   * @returns {{ text: string, insertedId: string }}
   */
  function addChapter(text, chapters, afterChapterId, title, level) {
    level = level || 2;
    var prefix = '';
    for (var i = 0; i < level; i++) prefix += '#';
    var heading = '\n\n' + prefix + ' ' + title + '\n\n';
    var insertPos;

    if (afterChapterId && chapters.length > 0) {
      var afterIdx = findIndex(chapters, afterChapterId);
      if (afterIdx >= 0) {
        insertPos = chapters[afterIdx].endOffset;
      } else {
        insertPos = text.length;
      }
    } else {
      insertPos = text.length;
    }

    // 先頭に追加する場合は先行改行を減らす
    if (insertPos === 0) {
      heading = prefix + ' ' + title + '\n\n';
    }

    var newText = text.substring(0, insertPos) + heading + text.substring(insertPos);
    var insertedId = 'ch-' + insertPos;
    return { text: newText, insertedId: insertedId };
  }

  /**
   * 章をリネームする。
   * @param {string} text
   * @param {Chapter} chapter
   * @param {string} newTitle
   * @returns {string} -- updated text
   */
  function renameChapter(text, chapter, newTitle) {
    var prefix = '';
    for (var i = 0; i < chapter.level; i++) prefix += '#';
    var oldLine = text.substring(chapter.startOffset, chapter.headingEnd);
    var newLine = prefix + ' ' + newTitle;
    // headingEnd には改行が含まれる場合がある
    if (oldLine.endsWith('\n')) {
      newLine += '\n';
    }
    return text.substring(0, chapter.startOffset) + newLine + text.substring(chapter.headingEnd);
  }

  /**
   * 章を削除する。見出し行のみ削除し、本文は前の章に吸収。
   * @param {string} text
   * @param {Chapter} chapter
   * @param {boolean} [deleteContent=false] -- true なら本文も削除
   * @returns {string}
   */
  function deleteChapter(text, chapter, deleteContent) {
    if (deleteContent) {
      // 章全体（見出し+本文）を削除
      var before = text.substring(0, chapter.startOffset);
      var after = text.substring(chapter.endOffset);
      // 余分な空行を整理
      return trimJunction(before, after);
    } else {
      // 見出し行だけ削除、本文は残す
      var before2 = text.substring(0, chapter.startOffset);
      var after2 = text.substring(chapter.headingEnd);
      return trimJunction(before2, after2);
    }
  }

  /**
   * 章を direction 方向に移動する。
   * @param {string} text
   * @param {Chapter[]} chapters
   * @param {string} chapterId
   * @param {'up'|'down'} direction
   * @returns {string|null} -- updated text, or null if cannot move
   */
  function moveChapter(text, chapters, chapterId, direction) {
    var idx = findIndex(chapters, chapterId);
    if (idx < 0) return null;

    var swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= chapters.length) return null;

    var chA = chapters[idx];
    var chB = chapters[swapIdx];

    // 上方向: A と B を入れ替え（B が先、A が後）
    var first = direction === 'up' ? chB : chA;
    var second = direction === 'up' ? chA : chB;

    var blockFirst = getChapterBlock(text, first);
    var blockSecond = getChapterBlock(text, second);

    var before = text.substring(0, first.startOffset);
    var after = text.substring(second.endOffset);

    return before + blockSecond + blockFirst + after;
  }

  /**
   * 章をドラッグ&ドロップで任意位置に移動する。
   * @param {string} text
   * @param {Chapter[]} chapters
   * @param {string} sourceId -- 移動元チャプターID
   * @param {number} targetIndex -- 移動先のインデックス（この位置の前に挿入）
   * @returns {string|null}
   */
  function reorderChapter(text, chapters, sourceId, targetIndex) {
    var srcIdx = findIndex(chapters, sourceId);
    if (srcIdx < 0) return null;
    if (targetIndex === srcIdx || targetIndex === srcIdx + 1) return null; // 移動なし

    var srcChapter = chapters[srcIdx];
    var block = getChapterBlock(text, srcChapter);

    // まずソースを除去
    var withoutSrc = text.substring(0, srcChapter.startOffset) + text.substring(srcChapter.endOffset);

    // 挿入位置を再計算（ソース除去後のオフセット）
    var insertPos;
    if (targetIndex >= chapters.length) {
      // 末尾
      insertPos = withoutSrc.length;
    } else {
      var targetChapter = chapters[targetIndex];
      var targetOffset = targetChapter.startOffset;
      // ソースがターゲットより前にあった場合、除去分だけオフセットがずれる
      if (srcIdx < targetIndex) {
        targetOffset -= (srcChapter.endOffset - srcChapter.startOffset);
      }
      insertPos = targetOffset;
    }

    // 挿入位置の前後に適切な改行を確保
    var sep = '';
    if (insertPos > 0 && withoutSrc[insertPos - 1] !== '\n') {
      sep = '\n';
    }
    var blockTrimmed = block.replace(/^\n+/, '').replace(/\n+$/, '');

    return withoutSrc.substring(0, insertPos) + sep + blockTrimmed + '\n\n' + withoutSrc.substring(insertPos);
  }

  /**
   * 章を複製する（現在の章の直後に同じ内容で挿入）
   * @param {string} text
   * @param {Chapter} chapter
   * @returns {string}
   */
  function duplicateChapter(text, chapter) {
    var block = getChapterBlock(text, chapter);
    var insertPos = chapter.endOffset;
    return text.substring(0, insertPos) + '\n' + block + text.substring(insertPos);
  }

  // ---- Config persistence ----

  /**
   * チャプター設定を保存（visibility 等のメタ情報）
   * @param {Object} config
   */
  function saveConfig(config) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.warn('chapter-model: failed to save config', e);
    }
  }

  /**
   * チャプター設定を読み込み
   * @returns {Object|null}
   */
  function loadConfig() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  // ---- Helpers ----

  function findIndex(chapters, id) {
    for (var i = 0; i < chapters.length; i++) {
      if (chapters[i].id === id) return i;
    }
    return -1;
  }

  /**
   * 接合部の余分な空行を整理する
   */
  function trimJunction(before, after) {
    var result = before.replace(/\n{3,}$/, '\n\n') + after.replace(/^\n{3,}/, '\n\n');
    return result;
  }

  /**
   * カーソル位置からアクティブなチャプターを特定する
   * @param {Chapter[]} chapters
   * @param {number} cursorPos
   * @returns {number} -- chapter index, or -1
   */
  function getActiveChapterIndex(chapters, cursorPos) {
    var activeIdx = -1;
    for (var i = 0; i < chapters.length; i++) {
      if (chapters[i].startOffset <= cursorPos) {
        activeIdx = i;
      }
    }
    return activeIdx;
  }

  // ---- Public API ----

  window.ZWChapterModel = {
    parseChapters: parseChapters,
    getChapterBody: getChapterBody,
    getChapterBlock: getChapterBlock,
    addChapter: addChapter,
    renameChapter: renameChapter,
    deleteChapter: deleteChapter,
    moveChapter: moveChapter,
    reorderChapter: reorderChapter,
    duplicateChapter: duplicateChapter,
    getActiveChapterIndex: getActiveChapterIndex,
    saveConfig: saveConfig,
    loadConfig: loadConfig
  };
})();
