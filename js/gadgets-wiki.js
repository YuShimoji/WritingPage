(function () {
  'use strict';

  // Depends on gadgets-utils.js and gadgets-core.js
  var utils = window.ZWGadgetsUtils;
  var ZWGadgetsCore = window.ZWGadgetsCore;
  if (!utils || !ZWGadgetsCore) return;

  var ZWGadgetsInstance = new ZWGadgetsCore();

  // StoryWiki gadget (個別ファイル化)
  ZWGadgetsInstance.register('StoryWiki', function (el) {
    try {
      var storage = window.ZenWriterStorage;
      if (!storage || !storage.listWikiPages) {
        el.textContent = (window.UILabels && window.UILabels.STORAGE_UNAVAILABLE) || 'ストレージが利用できません。';
        return;
      }

      var wrap = document.createElement('div');
      wrap.className = 'gadget-wiki';
      wrap.style.display = 'flex';
      wrap.style.flexDirection = 'column';
      wrap.style.gap = '8px';

      // 検索入力
      var searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.placeholder = (window.UILabels && window.UILabels.WIKI_SEARCH_PLACEHOLDER) || 'Wikiページを検索...';
      searchInput.style.width = '100%';
      searchInput.style.padding = '4px';
      searchInput.style.border = '1px solid var(--border-color)';
      searchInput.style.borderRadius = '4px';

      // 新規作成ボタン
      var createBtn = document.createElement('button');
      createBtn.type = 'button';
      createBtn.className = 'small';
      createBtn.textContent = (window.UILabels && window.UILabels.BTN_NEW_WIKI_PAGE) || '+ 新規Wikiページ';
      createBtn.addEventListener('click', function () {
        var title = prompt((window.UILabels && window.UILabels.WIKI_TITLE_PROMPT) || 'Wikiページのタイトルを入力:');
        if (title && title.trim()) {
          var page = storage.createWikiPage(title.trim());
          if (page) renderList();
        }
      });

      // Wikiリスト
      var listContainer = document.createElement('div');
      listContainer.className = 'wiki-list';
      listContainer.style.maxHeight = '300px';
      listContainer.style.overflowY = 'auto';

      var renderList = function () {
        listContainer.innerHTML = '';
        var query = searchInput.value.trim();
        var pages = query ? storage.searchWikiPages(query) : storage.listWikiPages();
        if (!pages || !pages.length) {
          var placeholder = document.createElement('div');
          placeholder.style.opacity = '0.7';
          placeholder.textContent = query ? ((window.UILabels && window.UILabels.WIKI_NO_RESULTS) || '検索結果が見つかりません。') : ((window.UILabels && window.UILabels.WIKI_EMPTY) || 'Wikiページはまだありません。新規作成してください。');
          listContainer.appendChild(placeholder);
          return;
        }

        pages.forEach(function (page) {
          var item = document.createElement('div');
          item.className = 'wiki-item';
          item.style.display = 'flex';
          item.style.alignItems = 'center';
          item.style.justifyContent = 'space-between';
          item.style.padding = '6px';
          item.style.border = '1px solid var(--border-color)';
          item.style.borderRadius = '4px';
          item.style.marginBottom = '4px';
          item.style.background = 'var(--bg-color)';

          var title = document.createElement('span');
          title.textContent = page.title;
          title.style.flex = '1';
          title.style.cursor = 'pointer';
          title.style.fontWeight = '500';
          title.addEventListener('click', function () {
            showPageEditor(page.id);
          });

          var actions = document.createElement('div');
          actions.style.display = 'flex';
          actions.style.gap = '4px';

          var editBtn = document.createElement('button');
          editBtn.type = 'button';
          editBtn.className = 'small';
          editBtn.textContent = (window.UILabels && window.UILabels.BTN_EDIT) || '編集';
          editBtn.addEventListener('click', function () {
            showPageEditor(page.id);
          });

          var deleteBtn = document.createElement('button');
          deleteBtn.type = 'button';
          deleteBtn.className = 'small';
          deleteBtn.textContent = (window.UILabels && window.UILabels.BTN_DELETE) || '削除';
          deleteBtn.addEventListener('click', function () {
            if (confirm((window.UILabels && window.UILabels.WIKI_DELETE_CONFIRM) || 'このWikiページを削除しますか？')) {
              storage.deleteWikiPage(page.id);
              renderList();
            }
          });

          actions.appendChild(editBtn);
          actions.appendChild(deleteBtn);
          item.appendChild(title);
          item.appendChild(actions);
          listContainer.appendChild(item);
        });
      };

      var showPageEditor = function (pageId) {
        var page = storage.getWikiPage(pageId);
        if (!page) return;

        var titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.value = page.title;
        titleInput.style.width = '100%';
        titleInput.style.padding = '4px';
        titleInput.style.border = '1px solid var(--border-color)';
        titleInput.style.borderRadius = '4px';

        var contentTextarea = document.createElement('textarea');
        contentTextarea.value = page.content;
        contentTextarea.style.width = '100%';
        contentTextarea.style.height = '200px';
        contentTextarea.style.padding = '4px';
        contentTextarea.style.border = '1px solid var(--border-color)';
        contentTextarea.style.borderRadius = '4px';
        contentTextarea.style.fontFamily = 'monospace';
        contentTextarea.style.resize = 'vertical';

        var tagsInput = document.createElement('input');
        tagsInput.type = 'text';
        tagsInput.value = (page.tags || []).join(', ');
        tagsInput.placeholder = (window.UILabels && window.UILabels.WIKI_TAGS_PLACEHOLDER) || 'タグ（カンマ区切り）';
        tagsInput.style.width = '100%';
        tagsInput.style.padding = '4px';
        tagsInput.style.border = '1px solid var(--border-color)';
        tagsInput.style.borderRadius = '4px';

        var saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'small';
        saveBtn.textContent = (window.UILabels && window.UILabels.BTN_SAVE) || '保存';
        saveBtn.addEventListener('click', function () {
          var updates = {
            title: titleInput.value.trim() || '無題',
            content: contentTextarea.value,
            tags: tagsInput.value.split(',').map(t => t.trim()).filter(Boolean)
          };
          storage.updateWikiPage(pageId, updates);
          renderList();
          document.body.removeChild(editorDialog);
        });

        var cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'small';
        cancelBtn.textContent = (window.UILabels && window.UILabels.BTN_CANCEL) || 'キャンセル';
        cancelBtn.addEventListener('click', function () {
          document.body.removeChild(editorDialog);
        });

        var editorDialog = document.createElement('div');
        editorDialog.style.position = 'fixed';
        editorDialog.style.top = '50%';
        editorDialog.style.left = '50%';
        editorDialog.style.transform = 'translate(-50%, -50%)';
        editorDialog.style.background = 'var(--bg-color)';
        editorDialog.style.border = '1px solid var(--border-color)';
        editorDialog.style.borderRadius = '8px';
        editorDialog.style.padding = '16px';
        editorDialog.style.zIndex = '10000';
        editorDialog.style.width = '80%';
        editorDialog.style.maxWidth = '600px';
        editorDialog.style.maxHeight = '80vh';
        editorDialog.style.overflow = 'auto';
        editorDialog.style.display = 'flex';
        editorDialog.style.flexDirection = 'column';
        editorDialog.style.gap = '8px';

        editorDialog.appendChild(document.createTextNode((window.UILabels && window.UILabels.WIKI_LABEL_TITLE) || 'タイトル:'));
        editorDialog.appendChild(titleInput);
        editorDialog.appendChild(document.createTextNode((window.UILabels && window.UILabels.WIKI_LABEL_CONTENT) || '内容:'));
        editorDialog.appendChild(contentTextarea);
        editorDialog.appendChild(document.createTextNode((window.UILabels && window.UILabels.WIKI_LABEL_TAGS) || 'タグ:'));
        editorDialog.appendChild(tagsInput);

        var btns = document.createElement('div');
        btns.style.display = 'flex';
        btns.style.gap = '8px';
        btns.appendChild(saveBtn);
        btns.appendChild(cancelBtn);
        editorDialog.appendChild(btns);

        document.body.appendChild(editorDialog);
      };

      searchInput.addEventListener('input', function () {
        renderList();
      });

      wrap.appendChild(searchInput);
      wrap.appendChild(createBtn);
      wrap.appendChild(listContainer);
      el.appendChild(wrap);

      renderList();
    } catch (e) {
      console.error('StoryWiki gadget failed:', e);
      el.textContent = (window.UILabels && window.UILabels.WIKI_INIT_FAILED) || 'Wikiガジェットの初期化に失敗しました。';
    }
  }, { groups: ['wiki'], title: (window.UILabels && window.UILabels.GADGET_WIKI_TITLE) || '物語Wiki' });

})();
