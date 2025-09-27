(function(){
  function create(target, options){
    options = options || {};
    const sel = (typeof target === 'string') ? document.querySelector(target) : target;
    if (!sel) throw new Error('ZenWriterEmbed: target not found');
    const src = options.src || '/index.html';
    const width = options.width || '100%';
    const height = options.height || '100%';
    const sameOrigin = options.sameOrigin !== false; // default true

    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.style.border = '0';
    iframe.style.width = width;
    iframe.style.height = height;
    sel.appendChild(iframe);

    let ready = false;
    let childWin = null;

    function waitForReady(){
      return new Promise((resolve, reject) => {
        const start = Date.now();
        const timeout = options.timeoutMs || 10000;
        function tick(){
          if (!iframe.contentWindow) {
            if (Date.now() - start > timeout) return reject(new Error('ZenWriterEmbed: no contentWindow'));
            return requestAnimationFrame(tick);
          }
          childWin = iframe.contentWindow;
          try {
            if (sameOrigin) {
              const ok = childWin && childWin.ZenWriterEditor && childWin.ZenWriterStorage;
              if (ok) { ready = true; return resolve(); }
            }
          } catch(e){
            // cross-origin access error: fallthrough to postMessage mode (not implemented yet)
          }
          if (Date.now() - start > timeout) return reject(new Error('ZenWriterEmbed: timeout waiting child app'));
          setTimeout(tick, 100);
        }
        tick();
      });
    }

    async function _ensure(){ if (!ready) await waitForReady(); }

    return {
      iframe,
      async getContent(){
        await _ensure();
        if (sameOrigin) {
          try {
            if (childWin.ZenWriterEditor && childWin.ZenWriterEditor.editor) {
              return String(childWin.ZenWriterEditor.editor.value || '');
            }
          } catch(_){}
        }
        throw new Error('ZenWriterEmbed: cross-origin mode not implemented');
      },
      async setContent(text){
        await _ensure();
        if (sameOrigin) {
          try {
            if (childWin.ZenWriterEditor && typeof childWin.ZenWriterEditor.setContent === 'function'){
              childWin.ZenWriterEditor.setContent(String(text||''));
              return true;
            }
          } catch(_){}
        }
        throw new Error('ZenWriterEmbed: cross-origin mode not implemented');
      },
      async focus(){
        await _ensure();
        if (sameOrigin) {
          try {
            const el = childWin.document.getElementById('editor');
            if (el) { el.focus(); return true; }
          } catch(_){}
        }
        throw new Error('ZenWriterEmbed: cross-origin mode not implemented');
      },
      async takeSnapshot(){
        await _ensure();
        if (sameOrigin) {
          try {
            const content = childWin.ZenWriterEditor && childWin.ZenWriterEditor.editor ? (childWin.ZenWriterEditor.editor.value || '') : '';
            if (childWin.ZenWriterStorage && typeof childWin.ZenWriterStorage.addSnapshot === 'function'){
              childWin.ZenWriterStorage.addSnapshot(content);
              return true;
            }
          } catch(_){}
        }
        throw new Error('ZenWriterEmbed: cross-origin mode not implemented');
      }
    };
  }

  window.ZenWriterEmbed = { create };
})();
