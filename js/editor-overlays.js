(function () {
  function replaceOverlayButtonsWithIcons(manager) {
    if (!manager || !manager.editorOverlay || !window.WritingIcons) return;
    const toggles = manager.editorOverlay.querySelectorAll('.overlay-toggle');
    toggles.forEach((toggle) => {
      const isHidden = toggle.textContent.includes('表示');
      toggle.innerHTML = '';
      const icon = window.WritingIcons.createIcon(
        isHidden ? 'eyeOff' : 'eye',
        { size: 16, label: isHidden ? '表示する' : '隠す' },
      );
      toggle.appendChild(icon);
    });
  }

  function scheduleOverlayRefresh(manager) {
    if (!manager) return;
    if (manager._overlayRenderFrame) {
      cancelAnimationFrame(manager._overlayRenderFrame);
    }
    manager._overlayRenderFrame = requestAnimationFrame(() => {
      manager._overlayRenderFrame = null;
      const entries = Array.isArray(manager._lastOverlayEntries)
        ? manager._lastOverlayEntries
        : [];
      renderOverlayImages(manager, entries, (manager.editor && manager.editor.value) || '');
    });
  }

  function renderOverlayImages(manager, entries, content) {
    if (!manager || !manager.editorOverlay || !manager.editorMirror || !manager.editor) return;

    manager.editorOverlay.innerHTML = '';
    const _entries = Array.isArray(entries) ? entries : [];

    manager.editorMirror.innerHTML = buildMirrorHtml(manager, content);
    const style = window.getComputedStyle(manager.editor);
    const padding = {
      top: parseFloat(style.paddingTop) || 0,
      right: parseFloat(style.paddingRight) || 0,
      bottom: parseFloat(style.paddingBottom) || 0,
      left: parseFloat(style.paddingLeft) || 0,
    };
    const usableWidth = manager.editor.clientWidth - padding.left - padding.right;

    _entries.forEach((entry) => {
      const asset = entry.asset;
      if (!asset || !asset.dataUrl) return;
      const anchor = manager.editorMirror.querySelector(
        `span[data-asset-id="${entry.assetId}"]`,
      );
      if (!anchor) return;

      const overlay = document.createElement('div');
      overlay.className = 'editor-overlay__image';
      overlay.dataset.assetId = entry.assetId;
      overlay.dataset.alignment = asset.alignment || 'auto';
      if (asset.hidden) overlay.classList.add('hidden');

      const widthPercent = Math.min(100, Math.max(10, asset.widthPercent || 60));
      const widthPx = Math.max(40, Math.round(usableWidth * (widthPercent / 100)));

      const left = padding.left;
      const top = anchor.offsetTop - manager.editor.scrollTop + (asset.offsetY || 0);

      overlay.style.left = `${left}px`;
      overlay.style.top = `${top}px`;
      overlay.style.width = `${widthPx}px`;

      const img = document.createElement('img');
      img.src = asset.dataUrl;
      img.alt = asset.name || '';
      overlay.appendChild(img);

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'overlay-toggle';
      toggle.title = asset.hidden ? '表示する' : '隠す';
      toggle.textContent = asset.hidden ? '表示' : '隠す';
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof manager.persistAssetMeta === 'function') {
          manager.persistAssetMeta(entry.assetId, { hidden: !asset.hidden });
        }
      });
      overlay.appendChild(toggle);

      const handle = document.createElement('div');
      handle.className = 'overlay-handle';
      handle.textContent = '↔';
      overlay.appendChild(handle);

      attachOverlayInteractions(manager, { overlay, assetId: entry.assetId, handle });

      manager.editorOverlay.appendChild(overlay);
    });

    replaceOverlayButtonsWithIcons(manager);

    const stamps = Array.isArray(manager.inlineStamps) ? manager.inlineStamps : [];
    stamps.forEach((st) => {
      if (!manager.getTextPosition) return;
      const rect = manager.getTextPosition(
        Math.max(0, st.start),
        Math.max(st.start, st.end),
      );
      if (!rect) return;
      const el = document.createElement('div');
      el.className = 'editor-overlay__stamp inline-stamp';
      el.textContent = `文字数: ${st.count}`;
      el.style.left = `${rect.left + rect.width + 8}px`;
      el.style.top = `${rect.top}px`;
      manager.editorOverlay.appendChild(el);
    });
  }

  function attachOverlayInteractions(manager, args) {
    const overlay = args && args.overlay;
    const assetId = args && args.assetId;
    const handle = args && args.handle;
    if (!overlay || !handle || !manager) return;

    overlay.style.pointerEvents = 'auto';
    overlay.style.cursor = 'move';

    overlay.addEventListener('pointerdown', (event) => {
      if (event.target === handle || event.target.classList.contains('overlay-toggle')) {
        return;
      }
      if (overlay.classList.contains('hidden')) return;
      event.preventDefault();
      startOverlayDrag(manager, { overlay, assetId, event });
    });

    handle.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (overlay.classList.contains('hidden')) return;
      startOverlayResize(manager, { overlay, assetId, event });
    });
  }

  function startOverlayDrag(manager, args) {
    const overlay = args && args.overlay;
    const assetId = args && args.assetId;
    const event = args && args.event;
    if (!overlay || !manager || !event) return;

    const pointerId = event.pointerId;
    overlay.setPointerCapture(pointerId);
    const startY = event.clientY;
    const startTop = parseFloat(overlay.style.top) || 0;

    const move = (ev) => {
      const deltaY = ev.clientY - startY;
      overlay.style.top = `${startTop + deltaY}px`;
    };

    const end = (_ev) => {
      overlay.removeEventListener('pointermove', move);
      overlay.removeEventListener('pointerup', end);
      try {
        overlay.releasePointerCapture(pointerId);
      } catch (_) {}
      const finalTop = parseFloat(overlay.style.top) || startTop;
      const delta = Math.round(finalTop - startTop);
      const asset = manager.getAsset ? manager.getAsset(assetId) : null;
      const base = asset && typeof asset.offsetY === 'number' ? asset.offsetY : 0;
      if (typeof manager.persistAssetMeta === 'function') {
        manager.persistAssetMeta(assetId, { offsetY: base + delta });
      }
    };

    overlay.addEventListener('pointermove', move);
    overlay.addEventListener('pointerup', end);
  }

  function startOverlayResize(manager, args) {
    const overlay = args && args.overlay;
    const assetId = args && args.assetId;
    const event = args && args.event;
    if (!overlay || !manager || !manager.editor || !event) return;

    const pointerId = event.pointerId;
    overlay.setPointerCapture(pointerId);
    const startX = event.clientX;
    const startWidth = parseFloat(overlay.style.width) || 0;
    const style = window.getComputedStyle(manager.editor);
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const paddingRight = parseFloat(style.paddingRight) || 0;
    const usableWidth = manager.editor.clientWidth - paddingLeft - paddingRight;

    const move = (ev) => {
      const delta = ev.clientX - startX;
      const next = Math.max(40, startWidth + delta);
      overlay.style.width = `${next}px`;
    };

    const end = (_ev) => {
      overlay.removeEventListener('pointermove', move);
      overlay.removeEventListener('pointerup', end);
      try {
        overlay.releasePointerCapture(pointerId);
      } catch (_) {}
      const finalWidth = parseFloat(overlay.style.width) || startWidth;
      const percent = Math.max(10, Math.min(100, Math.round((finalWidth / usableWidth) * 100)));
      if (typeof manager.persistAssetMeta === 'function') {
        manager.persistAssetMeta(assetId, { widthPercent: percent });
      }
    };

    overlay.addEventListener('pointermove', move);
    overlay.addEventListener('pointerup', end);
  }

  function buildMirrorHtml(manager, content) {
    if (!content) return '';
    const regex = /!\[[^\]]*\]\(asset:\/\/([^\s)]+)\)/g;
    let lastIndex = 0;
    let html = '';
    let match;
    while ((match = regex.exec(content)) !== null) {
      const before = content.slice(lastIndex, match.index);
      const escaped = manager.escapeHtml ? manager.escapeHtml(before) : before;
      const withAnim = manager.processTextAnimations
        ? manager.processTextAnimations(escaped)
        : escaped;
      const withDecor = manager.processFontDecorations
        ? manager.processFontDecorations(withAnim)
        : withAnim;
      html += withDecor.replace(/\n/g, '<br>');
      html += `<span class="mirror-asset" data-asset-id="${match[1]}">&#8203;</span>`;
      lastIndex = match.index + match[0].length;
    }
    const tail = content.slice(lastIndex);
    const tailEscaped = manager.escapeHtml ? manager.escapeHtml(tail) : tail;
    const tailAnim = manager.processTextAnimations
      ? manager.processTextAnimations(tailEscaped)
      : tailEscaped;
    const tailDecor = manager.processFontDecorations
      ? manager.processFontDecorations(tailAnim)
      : tailAnim;
    html += tailDecor.replace(/\n/g, '<br>');
    return html;
  }

  window.editorOverlays_replaceOverlayButtonsWithIcons = replaceOverlayButtonsWithIcons;
  window.editorOverlays_scheduleOverlayRefresh = scheduleOverlayRefresh;
  window.editorOverlays_renderOverlayImages = renderOverlayImages;
  window.editorOverlays_attachOverlayInteractions = attachOverlayInteractions;
  window.editorOverlays_startOverlayDrag = startOverlayDrag;
  window.editorOverlays_startOverlayResize = startOverlayResize;
  window.editorOverlays_buildMirrorHtml = buildMirrorHtml;
})();
