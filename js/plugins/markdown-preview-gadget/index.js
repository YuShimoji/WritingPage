(function () {
  'use strict';

  if (!window.ZWPlugin || typeof window.ZWPlugin.register !== 'function') return;

  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function withStorage(updater) {
    try {
      var settings = window.ZenWriterStorage.loadSettings();
      updater(settings);
      window.ZenWriterStorage.saveSettings(settings);
    } catch (_) { }
  }

  window.ZWPlugin.register({
    id: 'markdown-preview-gadget',
    name: 'Markdownプレビュー',
    version: '0.1.0',
    type: 'gadget',
    init: function (api) {
      api.gadgets.register('MarkdownPreview', function (root) {
        var settings = window.ZenWriterStorage.loadSettings();
        var preview = (settings && settings.preview) || {};
        root.innerHTML = '';
        root.style.display = 'grid';
        root.style.gap = '0.375rem';

        var row = el('div');
        var sync = el('input');
        sync.type = 'checkbox';
        sync.checked = !!preview.syncScroll;

        var label = el('label');
        label.textContent = 'スクロール同期';
        label.style.marginLeft = '0.375rem';
        row.appendChild(sync);
        row.appendChild(label);

        var button = el('button', 'small');
        button.type = 'button';
        button.textContent = 'プレビュー開閉';
        button.addEventListener('click', function () {
          if (window.ZenWriterEditor && typeof window.ZenWriterEditor.togglePreview === 'function') {
            window.ZenWriterEditor.togglePreview();
          }
        });

        sync.addEventListener('change', function () {
          withStorage(function (cfg) {
            cfg.preview = cfg.preview || {};
            cfg.preview.syncScroll = !!sync.checked;
          });
        });

        root.appendChild(row);
        root.appendChild(button);
      }, {
        title: 'Markdownプレビュー',
        groups: ['edit'],
        description: '編集画面の横に Markdown を並列表示し、本文とスクロール同期します。',
        kind: 'tool'
      });
    }
  });
})();
