/**
 * Tags and Smart Folders Gadget: タグ軸とスマートフォルダの表示
 * 
 * ツリーペインにタグ軸、保存された検索、仮想フォルダを表示するガジェット
 */
(function () {
  'use strict';

  var utils = window.ZWGadgetsUtils;
  var ZWGadgets = window.ZWGadgets;
  if (!utils || !ZWGadgets) return;

  ZWGadgets.register('TagsAndSmartFolders', function (el, api) {
    try {
      var STORAGE = window.ZenWriterStorage;
      var Tags = window.ZenWriterTags;
      var SmartFolders = window.ZenWriterSmartFolders;
      
      if (!STORAGE || !Tags || !SmartFolders) {
        el.textContent = 'タグ/スマートフォルダ機能を利用できません。';
        return;
      }

      var wrap = document.createElement('div');
      wrap.className = 'gadget-tags-smart-folders';
      wrap.style.display = 'flex';
      wrap.style.flexDirection = 'column';
      wrap.style.gap = '0.5rem';

      // ツールバー
      var toolbar = document.createElement('div');
      toolbar.style.display = 'flex';
      toolbar.style.gap = '0.375rem';
      toolbar.style.flexWrap = 'wrap';
      toolbar.style.alignItems = 'center';

      var viewMode = document.createElement('select');
      viewMode.className = 'small';
      var opt1 = document.createElement('option');
      opt1.value = 'tags';
      opt1.textContent = 'タグ軸';
      var opt2 = document.createElement('option');
      opt2.value = 'folders';
      opt2.textContent = 'スマートフォルダ';
      viewMode.appendChild(opt1);
      viewMode.appendChild(opt2);
      viewMode.value = api.get('tagsViewMode', 'tags') || 'tags';

      var btnNewFolder = document.createElement('button');
      btnNewFolder.className = 'small';
      btnNewFolder.textContent = '新規フォルダ';
      btnNewFolder.style.display = viewMode.value === 'folders' ? 'block' : 'none';

      toolbar.appendChild(viewMode);
      toolbar.appendChild(btnNewFolder);

      // ツリービューコンテナ
      var treeContainer = document.createElement('div');
      treeContainer.className = 'tags-smart-folders-tree';
      treeContainer.style.border = '1px solid var(--border-color)';
      treeContainer.style.borderRadius = '4px';
      treeContainer.style.padding = '0.375rem';
      treeContainer.style.maxHeight = '400px';
      treeContainer.style.overflowY = 'auto';

      var state = {
        currentView: viewMode.value,
        selectedTag: null,
        selectedFolder: null,
        expandedTags: new Set(),
        expandedFolders: new Set()
      };

      function renderTree() {
        treeContainer.innerHTML = '';
        
        if (state.currentView === 'tags') {
          renderTagsTree();
        } else {
          renderFoldersTree();
        }
      }

      function renderTagsTree() {
        var allTags = Tags.getAllTags();
        var tagCounts = Tags.getTagCounts();
        
        if (!allTags.length) {
          var empty = document.createElement('div');
          empty.style.padding = '0.5rem';
          empty.style.opacity = '0.7';
          empty.textContent = 'タグがありません';
          treeContainer.appendChild(empty);
          return;
        }

        allTags.forEach(function (tag) {
          var count = tagCounts[tag] || 0;
          var item = createTreeItem('tag', tag, count, function () {
            state.selectedTag = tag;
            state.selectedFolder = null;
            renderTree();
            dispatchSelectionChange();
          });
          treeContainer.appendChild(item);
        });
      }

      function renderFoldersTree() {
        var folders = SmartFolders.loadSmartFolders();
        
        folders.forEach(function (folder) {
          var pages = SmartFolders.getPagesForSmartFolder(folder.id);
          var count = pages.length;
          var item = createTreeItem('folder', folder.name, count, function () {
            state.selectedFolder = folder.id;
            state.selectedTag = null;
            renderTree();
            dispatchSelectionChange();
          }, folder.id === state.selectedFolder);
          treeContainer.appendChild(item);
        });
      }

      function createTreeItem(type, label, count, onClick, isSelected) {
        var item = document.createElement('div');
        item.className = 'tree-item tree-item-' + type;
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.justifyContent = 'space-between';
        item.style.padding = '0.25rem 0.375rem';
        item.style.cursor = 'pointer';
        item.style.borderRadius = '4px';
        item.style.marginBottom = '0.125rem';
        
        if (isSelected) {
          item.style.background = 'var(--focus-color)';
          item.style.color = 'var(--success-fg, #fff)';
        } else {
          item.style.background = 'transparent';
          item.addEventListener('mouseenter', function () {
            if (!isSelected) item.style.background = 'var(--toolbar-bg)';
          });
          item.addEventListener('mouseleave', function () {
            if (!isSelected) item.style.background = 'transparent';
          });
        }

        var left = document.createElement('div');
        left.style.display = 'flex';
        left.style.alignItems = 'center';
        left.style.gap = '0.375rem';
        left.style.flex = '1';

        var icon = document.createElement('span');
        icon.textContent = type === 'tag' ? '#' : '📁';
        icon.style.fontSize = '0.9em';

        var labelEl = document.createElement('span');
        labelEl.textContent = label;
        labelEl.style.flex = '1';

        left.appendChild(icon);
        left.appendChild(labelEl);

        var countEl = document.createElement('span');
        countEl.textContent = '(' + count + ')';
        countEl.style.fontSize = '0.85em';
        countEl.style.opacity = '0.7';

        item.appendChild(left);
        item.appendChild(countEl);

        item.addEventListener('click', onClick);

        return item;
      }

      function dispatchSelectionChange() {
        try {
          var event = new CustomEvent('ZWTagsSmartFoldersSelectionChanged', {
            detail: {
              tag: state.selectedTag,
              folder: state.selectedFolder,
              view: state.currentView
            }
          });
          window.dispatchEvent(event);
        } catch (e) {
          console.error('イベント発火エラー:', e);
        }
      }

      function getSelectedPages() {
        if (state.selectedTag) {
          return Tags.getPagesByTags([state.selectedTag], false);
        } else if (state.selectedFolder) {
          return SmartFolders.getPagesForSmartFolder(state.selectedFolder);
        }
        return [];
      }

      // 新規フォルダ作成
      btnNewFolder.addEventListener('click', function () {
        var name = prompt('スマートフォルダ名を入力:');
        if (!name || !name.trim()) return;

        var queryType = prompt('検索タイプを選択:\n1: タグ検索\n2: テキスト検索\n3: タグなし', '1');
        var query = null;

        if (queryType === '1') {
          var tagsInput = prompt('タグをカンマ区切りで入力:');
          if (tagsInput) {
            var tags = Tags.parseTags ? Tags.parseTags(tagsInput) : tagsInput.split(',').map(function(t) { return t.trim(); }).filter(Boolean);
            var matchAll = confirm('すべてのタグが一致する必要がありますか？');
            query = { tags: tags, matchAll: matchAll };
          }
        } else if (queryType === '2') {
          var text = prompt('検索テキストを入力:');
          if (text) {
            query = { text: text.trim() };
          }
        } else if (queryType === '3') {
          query = { hasTags: false };
        }

        if (query) {
          SmartFolders.createSmartFolder({
            name: name.trim(),
            type: 'query',
            query: query
          });
          renderTree();
        }
      });

      // ビューモード変更
      viewMode.addEventListener('change', function () {
        state.currentView = viewMode.value;
        api.set('tagsViewMode', state.currentView);
        btnNewFolder.style.display = state.currentView === 'folders' ? 'block' : 'none';
        state.selectedTag = null;
        state.selectedFolder = null;
        renderTree();
      });

      wrap.appendChild(toolbar);
      wrap.appendChild(treeContainer);
      el.appendChild(wrap);

      renderTree();

      // 公開API
      api.getSelectedPages = getSelectedPages;
      api.getSelection = function () {
        return {
          tag: state.selectedTag,
          folder: state.selectedFolder,
          view: state.currentView
        };
      };
    } catch (e) {
      console.error('TagsAndSmartFolders gadget failed:', e);
      el.textContent = 'タグ/スマートフォルダガジェットの初期化に失敗しました。';
    }
  }, { 
    groups: ['structure'],
    title: 'タグ/スマートフォルダ',
    description: 'タグでページを分類し、スマートフォルダで自動フィルタリング。'
  });
})();
