(function(){
  if (!window.ZenWriterPlugins) return;

  function applyDecoration(type){
    const ed = window.ZenWriterEditor;
    if (!ed || typeof ed.applyDecoration !== 'function') return;
    ed.applyDecoration(type);
  }

  window.ZenWriterPlugins.register({
    id: 'text-decoration',
    name: '文字装飾',
    actions: [
      { id: 'bold', label: '太字', run: () => applyDecoration('bold') },
      { id: 'italic', label: '斜体', run: () => applyDecoration('italic') },
      { id: 'strikethrough', label: '取り消し線', run: () => applyDecoration('strikethrough') },
      { id: 'code', label: 'コード', run: () => applyDecoration('code') },
      { id: 'link', label: 'リンク', run: () => applyDecoration('link') }
    ]
  });
})();
