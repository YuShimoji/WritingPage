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
    // postMessage mode state
    const inflight = new Map();
    let pmReady = false;
    const targetOrigin = options.targetOrigin || '*';

    function onMessage(event){
      if (!iframe.contentWindow || event.source !== iframe.contentWindow) return;
      const data = event.data || {};
      if (data && data.type === 'ZW_EMBED_READY') {
        pmReady = true;
        if (!ready) ready = true;
        return; // waitForReady() loop will resolve on next tick
      }
      if (data && data.type === 'ZW_RESPONSE' && data.requestId) {
        const entry = inflight.get(data.requestId);
        if (entry) {
          clearTimeout(entry.t);
          inflight.delete(data.requestId);
          if (data.ok) entry.resolve(data.result);
          else entry.reject(new Error(data.error || 'ZenWriterEmbed: response error'));
        }
      }
    }
    window.addEventListener('message', onMessage);

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
              const ok = childWin && (childWin.ZenWriterAPI || (childWin.ZenWriterEditor && childWin.ZenWriterStorage));
              if (ok) { ready = true; return resolve(); }
            }
          } catch(e){
            // cross-origin access error: fallthrough to postMessage mode
          }
          // postMessage mode: 親から READY が来るのを待つ
          if (!sameOrigin || pmReady) {
            if (pmReady) { ready = true; return resolve(); }
          }
          if (Date.now() - start > timeout) return reject(new Error('ZenWriterEmbed: timeout waiting child app'));
          setTimeout(tick, 100);
        }
        tick();
      });
    }

    async function _ensure(){ if (!ready) await waitForReady(); }
    async function rpc(type, payload){
      await _ensure();
      if (sameOrigin) throw new Error('ZenWriterEmbed: rpc should not be used in same-origin mode');
      return new Promise((resolve, reject) => {
        const id = Math.random().toString(36).slice(2);
        const t = setTimeout(() => {
          inflight.delete(id);
          reject(new Error('ZenWriterEmbed: rpc timeout'));
        }, options.timeoutMs || 10000);
        inflight.set(id, { resolve, reject, t });
        iframe.contentWindow.postMessage({ type, requestId: id, payload }, targetOrigin);
      });
    }

    return {
      iframe,
      async getContent(){
        await _ensure();
        if (sameOrigin) {
          try {
            if (childWin.ZenWriterAPI && typeof childWin.ZenWriterAPI.getContent === 'function') {
              return String(childWin.ZenWriterAPI.getContent() || '');
            }
            if (childWin.ZenWriterEditor && childWin.ZenWriterEditor.editor) {
              return String(childWin.ZenWriterEditor.editor.value || '');
            }
          } catch(_){ }
        } else {
          // postMessage mode
          const res = await rpc('ZW_GET_CONTENT');
          return String(res || '');
        }
        throw new Error('ZenWriterEmbed: cross-origin mode not implemented');
      },
      async setContent(text){
        await _ensure();
        if (sameOrigin) {
          try {
            if (childWin.ZenWriterAPI && typeof childWin.ZenWriterAPI.setContent === 'function'){
              return !!childWin.ZenWriterAPI.setContent(String(text||''));
            }
            if (childWin.ZenWriterEditor && typeof childWin.ZenWriterEditor.setContent === 'function'){
              childWin.ZenWriterEditor.setContent(String(text||''));
              return true;
            }
          } catch(_){ }
        } else {
          await rpc('ZW_SET_CONTENT', { text: String(text||'') });
          return true;
        }
        throw new Error('ZenWriterEmbed: cross-origin mode not implemented');
      },
      async focus(){
        await _ensure();
        if (sameOrigin) {
          try {
            if (childWin.ZenWriterAPI && typeof childWin.ZenWriterAPI.focus === 'function') {
              return !!childWin.ZenWriterAPI.focus();
            }
            const el = childWin.document.getElementById('editor');
            if (el) { el.focus(); return true; }
          } catch(_){ }
        } else {
          await rpc('ZW_FOCUS');
          return true;
        }
        throw new Error('ZenWriterEmbed: cross-origin mode not implemented');
      },
      async takeSnapshot(){
        await _ensure();
        if (sameOrigin) {
          try {
            if (childWin.ZenWriterAPI && typeof childWin.ZenWriterAPI.takeSnapshot === 'function') {
              return !!childWin.ZenWriterAPI.takeSnapshot();
            }
            const content = childWin.ZenWriterEditor && childWin.ZenWriterEditor.editor ? (childWin.ZenWriterEditor.editor.value || '') : '';
            if (childWin.ZenWriterStorage && typeof childWin.ZenWriterStorage.addSnapshot === 'function'){
              childWin.ZenWriterStorage.addSnapshot(content);
              return true;
            }
          } catch(_){ }
        } else {
          await rpc('ZW_TAKE_SNAPSHOT');
          return true;
        }
        throw new Error('ZenWriterEmbed: cross-origin mode not implemented');
      }
    };
  }
  window.ZenWriterEmbed = { create };
  })();
