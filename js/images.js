(function () {
  'use strict';

  function getStorage() {
    try {
      return window.localStorage;
    } catch (_) {
      return null;
    }
  }
  function getDocId() {
    try {
      if (
        window.ZenWriterStorage &&
        typeof window.ZenWriterStorage.getCurrentDocId === 'function'
      )
        return window.ZenWriterStorage.getCurrentDocId() || 'default';
    } catch (_) {}
    return 'default';
  }
  function key(docId) {
    return 'zw_images:' + (docId || 'default');
  }
  function load(docId) {
    try {
      var s = getStorage();
      if (!s) return [];
      var raw = s.getItem(key(docId));
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  }
  function list(docId) {
    return load(docId || getDocId());
  }
  function save(docId, arr) {
    try {
      var s = getStorage();
      if (!s) return;
      s.setItem(key(docId), JSON.stringify(Array.isArray(arr) ? arr : []));
    } catch (_) {}
  }
  function uid() {
    return 'img_' + Math.random().toString(36).slice(2);
  }

  function ensureOverlay() {
    var el = document.getElementById('editor-overlay');
    if (!el) {
      // フォールバック: エディタキャンバス内に生成
      var canvas = document.querySelector('.editor-canvas');
      if (canvas) {
        el = document.createElement('div');
        el.id = 'editor-overlay';
        el.className = 'editor-overlay';
        canvas.appendChild(el);
      }
    }
    return el;
  }

  function renderOverlay() {
    try {
      var docId = getDocId();
      var images = load(docId);
      var overlay = ensureOverlay();
      if (!overlay) return;
      // 一旦全クリア
      overlay.innerHTML = '';
      for (var i = 0; i < images.length; i++) {
        var it = images[i];
        if (!it || !it.src) continue;
        var wrap = document.createElement('div');
        wrap.className = 'editor-overlay__image';
        wrap.setAttribute('data-id', it.id || '');
        wrap.setAttribute('data-alignment', it.alignment || 'left');
        wrap.style.top = (it.top || 0) + 'px';
        wrap.style.left = (it.left || 0) + 'px';
        wrap.style.width = (it.width || 240) + 'px';
        wrap.style.height = 'auto';
        wrap.style.position = 'absolute';
        wrap.style.cursor = 'move';
        wrap.style.border = '2px solid rgba(0,0,0,0.2)';
        wrap.style.borderRadius = '4px';
        wrap.style.background = 'rgba(255,255,255,0.8)';

        var img = document.createElement('img');
        img.alt = it.alt || '';
        img.src = it.src;
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';
        wrap.appendChild(img);

        // リサイズハンドル
        var resizeHandle = document.createElement('div');
        resizeHandle.style.position = 'absolute';
        resizeHandle.style.bottom = '0';
        resizeHandle.style.right = '0';
        resizeHandle.style.width = '16px';
        resizeHandle.style.height = '16px';
        resizeHandle.style.background = 'rgba(0,0,0,0.5)';
        resizeHandle.style.cursor = 'nw-resize';
        resizeHandle.style.borderRadius = '2px';
        wrap.appendChild(resizeHandle);

        overlay.appendChild(wrap);

        // ドラッグ移動
        (function (w, id) {
          var dragStartX, dragStartY, startLeft, startTop;
          w.addEventListener('mousedown', function (ev) {
            if (ev.target === resizeHandle) return; // リサイズ時は無視
            ev.preventDefault();
            dragStartX = ev.clientX;
            dragStartY = ev.clientY;
            startLeft = parseFloat(w.style.left || '0');
            startTop = parseFloat(w.style.top || '0');
            var move = function (ev2) {
              var dx = ev2.clientX - dragStartX;
              var dy = ev2.clientY - dragStartY;
              w.style.left = startLeft + dx + 'px';
              w.style.top = startTop + dy + 'px';
            };
            var up = function () {
              document.removeEventListener('mousemove', move);
              document.removeEventListener('mouseup', up);
              // 保存
              var rect = w.getBoundingClientRect();
              update(id, {
                left: parseFloat(w.style.left || '0'),
                top: parseFloat(w.style.top || '0'),
              });
            };
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
          });
        })(wrap, it.id);

        // リサイズ
        (function (w, id) {
          var resizeStartX, resizeStartY, startWidth;
          resizeHandle.addEventListener('mousedown', function (ev) {
            ev.preventDefault();
            resizeStartX = ev.clientX;
            resizeStartY = ev.clientY;
            startWidth = parseFloat(w.style.width || '240');
            var move = function (ev2) {
              var dx = ev2.clientX - resizeStartX;
              var newWidth = Math.max(50, startWidth + dx);
              w.style.width = newWidth + 'px';
            };
            var up = function () {
              document.removeEventListener('mousemove', move);
              document.removeEventListener('mouseup', up);
              // 保存
              update(id, { width: parseFloat(w.style.width || '240') });
            };
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
          });
        })(wrap, it.id);
      }
    } catch (e) {
      /* noop */
    }
  }

  function addFromDataURL(dataURL, opt) {
    var docId = getDocId();
    var listArr = load(docId);
    listArr.push({
      id: uid(),
      srcType: 'dataUrl',
      src: dataURL,
      alt: (opt && opt.alt) || '',
      width: (opt && opt.width) || 240,
      left: (opt && opt.left) || 16,
      top: (opt && opt.top) || 16,
      alignment: (opt && opt.alignment) || 'left',
    });
    save(docId, listArr);
    renderOverlay();
  }

  function addFromUrl(url, opt) {
    var docId = getDocId();
    var list = load(docId);
    list.push({
      id: uid(),
      srcType: 'url',
      src: url,
      alt: (opt && opt.alt) || '',
      width: (opt && opt.width) || 240,
      left: (opt && opt.left) || 16,
      top: (opt && opt.top) || 16,
      alignment: (opt && opt.alignment) || 'left',
    });
    save(docId, list);
    renderOverlay();
  }

  function addFromFile(file) {
    try {
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (e) {
        try {
          addFromDataURL(String(e.target.result || ''));
        } catch (_) {}
      };
      reader.readAsDataURL(file);
    } catch (_) {}
  }

  function remove(id) {
    var docId = getDocId();
    var listArr = load(docId).filter(function (it) {
      return it && it.id !== id;
    });
    save(docId, listArr);
    renderOverlay();
  }

  function update(id, patch) {
    var docId = getDocId();
    var listArr = load(docId).map(function (it) {
      if (it && it.id === id) {
        return Object.assign({}, it, patch || {});
      }
      return it;
    });
    save(docId, listArr);
    renderOverlay();
  }

  function handlePaste(ev) {
    try {
      var items = ev.clipboardData && ev.clipboardData.items;
      if (!items) return;
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        if (it && it.type && it.type.indexOf('image') === 0) {
          var f = it.getAsFile();
          if (f) {
            addFromFile(f);
            ev.preventDefault();
            return;
          }
        }
      }
    } catch (_) {}
  }
  function handleDrop(ev) {
    try {
      ev.preventDefault();
      var files = ev.dataTransfer && ev.dataTransfer.files;
      if (files && files.length) {
        addFromFile(files[0]);
        return;
      }
      var url =
        ev.dataTransfer &&
        ev.dataTransfer.getData &&
        ev.dataTransfer.getData('text/uri-list');
      if (url) {
        addFromUrl(url);
        return;
      }
    } catch (_) {}
  }
  function handleDragOver(ev) {
    try {
      ev.preventDefault();
    } catch (_) {}
  }

  function init() {
    try {
      renderOverlay();
      window.addEventListener('paste', handlePaste, false);
      document.addEventListener('drop', handleDrop, false);
      document.addEventListener('dragover', handleDragOver, false);
      // 文書切替（独自イベント）に追従する余地
      try {
        window.addEventListener('ZWDocumentsChanged', renderOverlay);
      } catch (_) {}
    } catch (_) {}
  }

  var API = {
    init: init,
    render: renderOverlay,
    addFromFile: addFromFile,
    addFromUrl: addFromUrl,
    remove: remove,
    update: update,
    list: list,
    _load: function (docId) {
      return load(docId || getDocId());
    },
    _save: function (docId, arr) {
      save(docId || getDocId(), arr);
    },
  };

  try {
    window.ZenWriterImages = API;
  } catch (_) {}
  // 自動初期化
  try {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  } catch (_) {}
})();
