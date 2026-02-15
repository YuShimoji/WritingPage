(function () {
  'use strict';

  // Depends on gadgets-utils.js and gadgets-core.js
  var utils = window.ZWGadgetsUtils;
  var ZWGadgets = window.ZWGadgets;
  if (!utils || !ZWGadgets) return;

  // ChoiceTools gadget (個別ファイル化)
  ZWGadgets.register('ChoiceTools', function (el) {
    try {
      var ed = window.ZenWriterEditor;
      var wrap = document.createElement('div'); wrap.style.display = 'flex'; wrap.style.flexWrap = 'wrap'; wrap.style.gap = '6px';
      function makeBtn(text, handler) { var b = document.createElement('button'); b.type = 'button'; b.className = 'small'; b.textContent = text; b.addEventListener('click', handler); return b; }
      function insertChoice() {
        if (!ed || typeof ed.insertTextAtCursor !== 'function') return;
        var tpl = ['', '[choice title="' + ((window.UILabels && window.UILabels.CHOICE_BLOCK_TITLE) || '選択肢') + '"]', '- [> ' + ((window.UILabels && window.UILabels.CHOICE_OPTION_1) || '選択肢1') + '](#label1)', '- [> ' + ((window.UILabels && window.UILabels.CHOICE_OPTION_2) || '選択肢2') + '](#label2)', '[/choice]', ''].join('\n');
        ed.insertTextAtCursor(tpl);
        if (ed.showNotification) ed.showNotification((window.UILabels && window.UILabels.CHOICE_INSERTED) || '選択肢ブロックを挿入しました');
      }
      function insertLabel() {
        if (!ed || typeof ed.insertTextAtCursor !== 'function') return;
        var name = prompt((window.UILabels && window.UILabels.LABEL_ID_PROMPT) || 'ラベルIDを入力', 'label1');
        if (name === null) return;
        var tpl = ['', '[label id="' + String((name || 'label1').trim()) + '"]', '', '[/label]', ''].join('\n');
        ed.insertTextAtCursor(tpl);
        if (ed.showNotification) ed.showNotification((window.UILabels && window.UILabels.LABEL_INSERTED) || 'ラベルを挿入しました');
      }
      function insertJump() {
        if (!ed || typeof ed.insertTextAtCursor !== 'function') return;
        var to = prompt((window.UILabels && window.UILabels.JUMP_ID_PROMPT) || 'ジャンプ先ラベルIDを入力', 'label1');
        if (to === null) return;
        var tpl = '\n[jump to="' + String((to || 'label1').trim()) + '"]\n';
        ed.insertTextAtCursor(tpl);
        if (ed.showNotification) ed.showNotification((window.UILabels && window.UILabels.JUMP_INSERTED) || 'ジャンプを挿入しました');
      }
      wrap.appendChild(makeBtn((window.UILabels && window.UILabels.BTN_CHOICE_BLOCK) || '選択肢ブロック', insertChoice));
      wrap.appendChild(makeBtn((window.UILabels && window.UILabels.BTN_LABEL) || 'ラベル', insertLabel));
      wrap.appendChild(makeBtn((window.UILabels && window.UILabels.BTN_JUMP) || 'ジャンプ', insertJump));
      el.appendChild(wrap);
    } catch (e) { try { el.textContent = (window.UILabels && window.UILabels.CHOICE_TOOL_INIT_FAILED) || '選択肢ツールの初期化に失敗しました。'; } catch (_) { } }
  }, { groups: ['settings'], title: (window.UILabels && window.UILabels.GADGET_CHOICE_TITLE) || '選択肢' });

})();
