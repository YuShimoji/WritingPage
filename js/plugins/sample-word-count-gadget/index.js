(function () {
  'use strict';

  if (!window.ZWPlugin || typeof window.ZWPlugin.register !== 'function') return;

  window.ZWPlugin.register({
    id: 'sample-word-count-gadget',
    name: '文字数Modサンプル',
    version: '0.1.0',
    type: 'gadget',
    init: function (api) {
      api.gadgets.register('SampleWordCountMod', function (root) {
        root.innerHTML = '';
        root.style.display = 'grid';
        root.style.gap = '0.5rem';

        var value = document.createElement('div');
        value.className = 'sample-word-count-mod__value';

        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'small';
        button.textContent = '文字数を更新';

        function readText() {
          var editor = document.getElementById('editor');
          var wysiwyg = document.getElementById('wysiwyg-editor');
          if (wysiwyg && !wysiwyg.hidden && wysiwyg.textContent) return wysiwyg.textContent;
          return editor ? (editor.value || '') : '';
        }

        function update() {
          var text = readText();
          value.textContent = '文字数: ' + String((text || '').replace(/\s/g, '').length);
        }

        button.addEventListener('click', update);
        root.appendChild(value);
        root.appendChild(button);
        update();
      }, {
        title: '文字数Modサンプル',
        groups: ['assist'],
        description: 'ローカルModから追加されたサンプルガジェット。',
        defaultCollapsed: true,
        kind: 'tool'
      });
    }
  });
})();
