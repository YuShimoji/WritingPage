(function () {
  if (!window.ZenWriterPlugins) return;

  function insertChoiceBlock() {
    const ed = window.ZenWriterEditor;
    if (!ed || typeof ed.insertTextAtCursor !== 'function') return;
    const tpl = [
      '',
      '[choice title="選択肢"]',
      '- [> 選択肢1](#label1)',
      '- [> 選択肢2](#label2)',
      '[/choice]',
      '',
    ].join('\n');
    ed.insertTextAtCursor(tpl);
    if (typeof ed.showNotification === 'function')
      ed.showNotification('選択肢ブロックを挿入しました');
  }

  function insertLabel() {
    const ed = window.ZenWriterEditor;
    if (!ed || typeof ed.insertTextAtCursor !== 'function') return;
    const name = prompt('ラベルIDを入力', 'label1');
    if (name === null) return;
    const tpl = [
      '',
      `[label id="${(name || 'label1').trim()}"]`,
      '',
      '[/label]',
      '',
    ].join('\n');
    ed.insertTextAtCursor(tpl);
    if (typeof ed.showNotification === 'function')
      ed.showNotification('ラベルを挿入しました');
  }

  function insertJump() {
    const ed = window.ZenWriterEditor;
    if (!ed || typeof ed.insertTextAtCursor !== 'function') return;
    const to = prompt('ジャンプ先ラベルIDを入力', 'label1');
    if (to === null) return;
    const tpl = `\n[jump to="${(to || 'label1').trim()}"]\n`;
    ed.insertTextAtCursor(tpl);
    if (typeof ed.showNotification === 'function')
      ed.showNotification('ジャンプを挿入しました');
  }

  window.ZenWriterPlugins.register({
    id: 'choice',
    name: '選択肢',
    actions: [
      { id: 'insert-choice', label: '選択肢ブロック', run: insertChoiceBlock },
      { id: 'insert-label', label: 'ラベル', run: insertLabel },
      { id: 'insert-jump', label: 'ジャンプ', run: insertJump },
    ],
  });
})();
