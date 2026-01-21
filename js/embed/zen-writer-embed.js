(function () {
  function create(target, options) {
    options = options || {};
    const sel =
      typeof target === 'string' ? document.querySelector(target) : target;
    if (!sel) throw new Error('ZenWriterEmbed: target not found');
    let src = options.src || '/index.html';
    const width = options.width || '100%';
    const height = options.height || '100%';

    // Origin resolution & validation
    let resolvedUrl = null;
    let resolvedOrigin = '';
    try {
      // Resolve src against current location to handle relative paths correctly
      resolvedUrl = new URL(src, window.location.href);
      resolvedOrigin = resolvedUrl.origin;
    } catch (e) {
      console.warn('ZenWriterEmbed: Invalid src URL', src);
    }

    // Determine sameOrigin (user override > automatic check)
    const sameOrigin =
      typeof options.sameOrigin === 'boolean'
        ? options.sameOrigin
        : resolvedOrigin === window.location.origin;

    // Determine targetOrigin for cross-origin communication
    // (user override > resolved origin > error)
    const targetOrigin =
      options.targetOrigin || (sameOrigin ? null : resolvedOrigin);

    if (!sameOrigin && !targetOrigin) {
      throw new Error(
        'ZenWriterEmbed: cross-origin mode requires targetOrigin or valid absolute src',
      );
    }

    // Append embed_origin for child-side validation (security handshake)
    if (
      resolvedUrl &&
      !resolvedUrl.searchParams.has('embed_origin') &&
      options.appendEmbedOrigin !== false
    ) {
      resolvedUrl.searchParams.set('embed_origin', window.location.origin);
      src = resolvedUrl.toString();
    }

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
    // simple event system
    const listeners = new Map(); // name -> Set<fn>
    function emit(name, payload) {
      const set = listeners.get(name);
      if (!set) return;
      set.forEach((fn) => {
        try {
          fn(payload);
        } catch (_) { }
      });
    }

    function onMessage(event) {
      if (!iframe.contentWindow || event.source !== iframe.contentWindow)
        return;

      // Strict origin validation
      if (!sameOrigin && targetOrigin && event.origin !== targetOrigin) return;

      const data = event.data || {};
      if (data && data.type === 'ZW_EMBED_READY') {
        pmReady = true;
        if (!ready) ready = true;
        return; // waitForReady() loop will resolve on next tick
      }
      // child -> parent notifications
      if (data && data.type === 'ZW_CONTENT_CHANGED') {
        emit('contentChanged', data.payload || {});
        return;
      }
      if (data && data.type === 'ZW_SNAPSHOT_CREATED') {
        emit('snapshotCreated', data.payload || {});
        return;
      }
      if (data && data.type === 'ZW_RESPONSE' && data.requestId) {
        const entry = inflight.get(data.requestId);
        if (entry) {
          clearTimeout(entry.t);
          inflight.delete(data.requestId);
          if (data.ok) entry.resolve(data.result);
          else
            entry.reject(
              new Error(data.error || 'ZenWriterEmbed: response error'),
            );
        }
      }
    }
    window.addEventListener('message', onMessage);

    function waitForReady() {
      return new Promise((resolve, reject) => {
        const start = Date.now();
        const timeout = options.timeoutMs || 10000;
        function tick() {
          if (!iframe.contentWindow) {
            if (Date.now() - start > timeout)
              return reject(new Error('ZenWriterEmbed: no contentWindow'));
            return requestAnimationFrame(tick);
          }
          childWin = iframe.contentWindow;
          try {
            if (sameOrigin) {
              const ok =
                childWin &&
                (childWin.ZenWriterAPI ||
                  (childWin.ZenWriterEditor && childWin.ZenWriterEditor.editor));
              if (ok) {
                ready = true;
                return resolve();
              }
            }
          } catch (e) {
            // cross-origin access error: fallthrough to postMessage mode
          }
          // postMessage mode: wait for READY from child
          if (!sameOrigin && pmReady) {
            ready = true;
            return resolve();
          }
          if (Date.now() - start > timeout) {
            // Check if we might be in a same-origin situation but failed to detect
            if (!sameOrigin && !pmReady) {
              // Hint for debugging
            }
            return reject(
              new Error('ZenWriterEmbed: timeout waiting child app'),
            );
          }
          setTimeout(tick, 100);
        }
        tick();
      });
    }

    async function _ensure() {
      if (!ready) await waitForReady();
    }
    async function rpc(type, payload) {
      await _ensure();
      if (sameOrigin)
        throw new Error(
          'ZenWriterEmbed: rpc should not be used in same-origin mode',
        );
      if (!targetOrigin)
        throw new Error(
          'ZenWriterEmbed: targetOrigin is required for cross-origin mode',
        );
      const usedOrigin = targetOrigin; // validated/required above
      return new Promise((resolve, reject) => {
        const id = Math.random().toString(36).slice(2);
        const t = setTimeout(() => {
          inflight.delete(id);
          reject(new Error('ZenWriterEmbed: rpc timeout'));
        }, options.timeoutMs || 10000);
        inflight.set(id, { resolve, reject, t });
        iframe.contentWindow.postMessage(
          { type, requestId: id, payload },
          usedOrigin,
        );
      });
    }

    function accessError(action) {
      const suffix = action ? ` (${action})` : '';
      if (sameOrigin)
        return new Error(
          `ZenWriterEmbed: same-origin APIs unavailable${suffix}; ensure the embedded document exposes ZenWriterAPI`,
        );
      return new Error(
        `ZenWriterEmbed: cross-origin RPC unavailable${suffix}; ensure targetOrigin matches and child-bridge is enabled`,
      );
    }

    return {
      iframe,
      on(name, handler) {
        const key = String(name || '');
        if (!listeners.has(key)) listeners.set(key, new Set());
        listeners.get(key).add(handler);
        // return unsubscribe function for convenience
        return () => this.off(key, handler);
      },
      off(name, handler) {
        const set = listeners.get(String(name || ''));
        if (!set) return;
        set.delete(handler);
      },
      async getContent() {
        await _ensure();
        if (sameOrigin) {
          try {
            if (
              childWin.ZenWriterAPI &&
              typeof childWin.ZenWriterAPI.getContent === 'function'
            ) {
              return String(childWin.ZenWriterAPI.getContent() || '');
            }
            if (childWin.ZenWriterEditor && childWin.ZenWriterEditor.editor) {
              return String(childWin.ZenWriterEditor.editor.value || '');
            }
          } catch (_) { }
        } else {
          // postMessage mode
          const res = await rpc('ZW_GET_CONTENT');
          return String(res || '');
        }
        throw accessError('getContent');
      },
      async setContent(text) {
        await _ensure();
        if (sameOrigin) {
          try {
            if (
              childWin.ZenWriterAPI &&
              typeof childWin.ZenWriterAPI.setContent === 'function'
            ) {
              return !!childWin.ZenWriterAPI.setContent(String(text || ''));
            }
            if (
              childWin.ZenWriterEditor &&
              typeof childWin.ZenWriterEditor.setContent === 'function'
            ) {
              childWin.ZenWriterEditor.setContent(String(text || ''));
              return true;
            }
          } catch (_) { }
        } else {
          await rpc('ZW_SET_CONTENT', { text: String(text || '') });
          return true;
        }
        throw accessError('setContent');
      },
      async focus() {
        await _ensure();
        if (sameOrigin) {
          try {
            if (
              childWin.ZenWriterAPI &&
              typeof childWin.ZenWriterAPI.focus === 'function'
            ) {
              return !!childWin.ZenWriterAPI.focus();
            }
            const el = childWin.document.getElementById('editor');
            if (el) {
              el.focus();
              return true;
            }
          } catch (_) { }
        } else {
          await rpc('ZW_FOCUS');
          return true;
        }
        throw accessError('focus');
      },
      async takeSnapshot() {
        await _ensure();
        if (sameOrigin) {
          try {
            if (
              childWin.ZenWriterAPI &&
              typeof childWin.ZenWriterAPI.takeSnapshot === 'function'
            ) {
              return !!childWin.ZenWriterAPI.takeSnapshot();
            }
            const content =
              childWin.ZenWriterEditor && childWin.ZenWriterEditor.editor
                ? childWin.ZenWriterEditor.editor.value || ''
                : '';
            if (
              childWin.ZenWriterStorage &&
              typeof childWin.ZenWriterStorage.addSnapshot === 'function'
            ) {
              childWin.ZenWriterStorage.addSnapshot(content);
              return true;
            }
          } catch (_) { }
        } else {
          await rpc('ZW_TAKE_SNAPSHOT');
          return true;
        }
        throw accessError('takeSnapshot');
      },
    };
  }
  window.ZenWriterEmbed = { create };
})();
