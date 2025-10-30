(function () {
  'use strict';

  var focusTargetId = '';

  function getStorage() {
    try {
      return window.localStorage;
    } catch (_) {
      return null;
    }

  function bringToFront(id) {
    if (!id) return;
    var docId = getDocId();
    var arr = load(docId);
    var maxZ = getMaxZ(arr);
    var changed = false;
    for (var i = 0; i < arr.length; i++) {
      var it = arr[i];
      if (it && it.id === id) {
        arr[i] = Object.assign({}, it, { z: maxZ + 1 });
        changed = true;
        break;
      }
    }
    if (!changed) return;
    save(docId, arr);
    renderOverlay();
    notifyChange({ docId: docId, id: id, action: 'z' });
  }

  function setFolder(id, folder) {
    update(id, { folder: typeof folder === 'string' ? folder : '' });
  }

  function duplicate(id) {
    if (!id) return;
    var docId = getDocId();
    var arr = load(docId);
    var src = null;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] && arr[i].id === id) { src = arr[i]; break; }
    }
    if (!src) return;
    var maxZ = getMaxZ(arr);
    var copy = Object.assign({}, src, {
      id: uid(),
      left: (src.left || 0) + 16,
      top: (src.top || 0) + 16,
      z: maxZ + 1,
      hidden: false,
      alt: (src.alt || '') + ' copy',
    });
    arr.push(copy);
    save(docId, arr);
    renderOverlay();
    notifyChange({ docId: docId, id: copy.id, action: 'duplicate', from: id });
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

  function getMaxZ(arr) {
    var max = 0;
    var a = Array.isArray(arr) ? arr : [];
    for (var i = 0; i < a.length; i++) {
      var z = parseInt((a[i] && a[i].z) || 0, 10) || 0;
      if (z > max) max = z;
    }
    return max;
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

  function updateSelectionStyles(overlay, targetId) {
    try {
      if (!overlay) return;
      var nodes = overlay.querySelectorAll('.editor-overlay__image');
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        var isActive =
          (node.getAttribute('data-id') || '') === (targetId || '');
        if (isActive) {
          node.classList.add('selected');
        } else {
          node.classList.remove('selected');
        }
      }
    } catch (_) {}
  }

  function notifyChange(detail) {
    try {
      var info = detail && typeof detail === 'object' ? detail : {};
      if (!info.docId) info.docId = getDocId();
      window.dispatchEvent(
        new CustomEvent('ZWImagesChanged', {
          detail: info,
        }),
      );
    } catch (_) {}
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
        if (it.hidden) continue;
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
        try { wrap.style.zIndex = String(it.z || (i + 1)); } catch (_) {}
        if ((it.id || '') === focusTargetId) {
          wrap.classList.add('selected');
        }

        var img = document.createElement('img');
        img.alt = it.alt || '';
        img.src = it.src;
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';
        wrap.appendChild(img);

        // リサイズハンドル
        var resizeHandle = document.createElement('div');
        resizeHandle.className = 'overlay-handle';
        wrap.appendChild(resizeHandle);

        var toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'overlay-toggle';
        toggleBtn.title = '非表示にする';
        toggleBtn.textContent = '×';
        toggleBtn.addEventListener('click', (function (id) {
          return function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            toggleVisibility(id, true);
          };
        })(it.id));
        wrap.appendChild(toggleBtn);

        overlay.appendChild(wrap);

        // ドラッグ移動（リサイズハンドル・トグルボタンでは開始しない）
        (function (w, id, handle, toggle, ov) {
          var dragStartX, dragStartY, startLeft, startTop;
          w.addEventListener('mousedown', function (ev) {
            if (ev.button && ev.button !== 0) return;
            if (handle && (ev.target === handle || handle.contains(ev.target)))
              return;
            if (toggle && (ev.target === toggle || toggle.contains(ev.target)))
              return;
            ev.preventDefault();
            focusTargetId = id;
            updateSelectionStyles(ov, focusTargetId);
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
              update(id, {
                left: parseFloat(w.style.left || '0') || 0,
                top: parseFloat(w.style.top || '0') || 0,
              });
            };
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
          });
        })(wrap, it.id, resizeHandle, toggleBtn, overlay);

        // リサイズ
        (function (w, id, handle, ov) {
          var resizeStartX, resizeStartY, startWidth;
          if (!handle) return;
          handle.addEventListener('mousedown', function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            focusTargetId = id;
            updateSelectionStyles(ov, focusTargetId);
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
              update(id, {
                width: Math.max(50, parseFloat(w.style.width || '240') || 240),
              });
            };
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
          });
        })(wrap, it.id, resizeHandle, overlay);
      }
      updateSelectionStyles(overlay, focusTargetId);
    } catch (e) {
      /* noop */
    }
  }

  function addFromDataURL(dataURL, opt) {
    var docId = getDocId();
    var listArr = load(docId);
    var maxZ = getMaxZ(listArr);
    listArr.push({
      id: uid(),
      srcType: 'dataUrl',
      src: dataURL,
      alt: (opt && opt.alt) || '',
      width: (opt && opt.width) || 240,
      left: (opt && opt.left) || 16,
      top: (opt && opt.top) || 16,
      alignment: (opt && opt.alignment) || 'left',
      folder: (opt && opt.folder) || '',
      z: maxZ + 1,
      hidden: false,
    });
    save(docId, listArr);
    renderOverlay();
    notifyChange({ docId: docId, action: 'add' });
  }

  function addFromUrl(url, opt) {
    var docId = getDocId();
    var list = load(docId);
    var maxZ = getMaxZ(list);
    list.push({
      id: uid(),
      srcType: 'url',
      src: url,
      alt: (opt && opt.alt) || '',
      width: (opt && opt.width) || 240,
      left: (opt && opt.left) || 16,
      top: (opt && opt.top) || 16,
      alignment: (opt && opt.alignment) || 'left',
      folder: (opt && opt.folder) || '',
      z: maxZ + 1,
      hidden: false,
    });
    save(docId, list);
    renderOverlay();
    notifyChange({ docId: docId, action: 'add' });
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
    if (!id) return;
    var docId = getDocId();
    var original = load(docId);
    var listArr = original.filter(function (it) {
      return it && it.id !== id;
    });
    if (listArr.length === original.length) return;
    save(docId, listArr);
    if (focusTargetId === id) focusTargetId = '';
    renderOverlay();
    notifyChange({ docId: docId, id: id, action: 'remove' });
  }

  function update(id, patch) {
    if (!id) return;
    var docId = getDocId();
    var listArr = load(docId);
    var changed = false;
    for (var i = 0; i < listArr.length; i++) {
      var it = listArr[i];
      if (it && it.id === id) {
        listArr[i] = Object.assign({}, it, patch || {});
        changed = true;
        break;
      }
    }
    if (!changed) return;
    save(docId, listArr);
    renderOverlay();
    notifyChange({ docId: docId, id: id, action: 'update' });
  }

  function toggleVisibility(id, nextHidden) {
    if (!id) return;
    var docId = getDocId();
    var listArr = load(docId);
    var changed = false;
    var desired = false;
    for (var i = 0; i < listArr.length; i++) {
      var it = listArr[i];
      if (it && it.id === id) {
        var current = !!it.hidden;
        desired =
          typeof nextHidden === 'boolean' ? !!nextHidden : !current;
        if (current !== desired) {
          listArr[i] = Object.assign({}, it, { hidden: desired });
          changed = true;
        }
        break;
      }
    }
    if (!changed) {
      desired = !!desired;
      return;
    }
    if (desired) {
      if (focusTargetId === id) focusTargetId = '';
    } else {
      focusTargetId = id;
    }
    save(docId, listArr);
    renderOverlay();
    notifyChange({ docId: docId, id: id, action: 'toggle', hidden: desired });
  }

  function focusImage(id) {
    focusTargetId = id || '';
    renderOverlay();
    notifyChange({ docId: getDocId(), id: focusTargetId, action: 'focus' });
  }

  function renameImage(id, alt) {
    if (!id) return;
    update(id, { alt: typeof alt === 'string' ? alt : '' });
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
      // キー操作: Delete/Backspace で選択中画像を削除（入力欄は除外）
      document.addEventListener(
        'keydown',
        function (ev) {
          try {
            if (!focusTargetId) return;
            if (ev.key !== 'Delete' && ev.key !== 'Backspace') return;
            var t = ev.target || null;
            var tag = (t && t.tagName ? t.tagName : '').toLowerCase();
            if (tag === 'input' || tag === 'textarea') return;
            if (t && t.isContentEditable) return;
            remove(focusTargetId);
            ev.preventDefault();
            ev.stopPropagation();
          } catch (_) {}
        },
        false,
      );
      // 文書切替（独自イベント）に追従する余地
      try {
        window.addEventListener('ZWDocumentsChanged', renderOverlay);
        window.addEventListener('ZWImagesChanged', renderOverlay);
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
    focus: focusImage,
    getFocus: function () {
      return focusTargetId;
    },
    toggleVisibility: toggleVisibility,
    rename: renameImage,
    setFolder: setFolder,
    bringToFront: bringToFront,
    duplicate: duplicate,
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
