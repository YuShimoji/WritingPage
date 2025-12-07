(function () {
  function handlePasteEvent(manager, event) {
    const items = event.clipboardData && event.clipboardData.items;
    if (!items || !items.length) return;
    const imageFiles = Array.from(items)
      .filter((item) => item.kind === 'file' && item.type && item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter(Boolean);
    if (!imageFiles.length) return;
    event.preventDefault();
    insertImagesSequentially(manager, imageFiles, 0);
  }

  function handleDragOver(manager, event) {
    if (!event.dataTransfer) return;
    if (Array.from(event.dataTransfer.types || []).includes('Files')) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      if (manager && manager.editor && manager.dropIndicatorClass) {
        manager.editor.classList.add(manager.dropIndicatorClass);
      }
    }
  }

  function handleDragLeave(manager, event) {
    if (!manager || !manager.editor) return;
    if (event.relatedTarget === manager.editor) return;
    manager.editor.classList.remove(manager.dropIndicatorClass);
  }

  function handleDropEvent(manager, event) {
    if (!manager || !manager.editor || !event.dataTransfer) return;
    const files = Array.from(event.dataTransfer.files || []).filter(
      (file) => file.type && file.type.startsWith('image/'),
    );
    if (!files.length) {
      manager.editor.classList.remove(manager.dropIndicatorClass);
      return;
    }
    event.preventDefault();
    manager.editor.classList.remove(manager.dropIndicatorClass);
    manager.editor.focus();
    insertImagesSequentially(manager, files, 0);
  }

  function insertImagesSequentially(manager, files, index) {
    if (!manager || !files || index >= files.length) return;
    insertImageFile(manager, files[index])
      .catch(() => {
        if (typeof manager.showNotification === 'function') {
          manager.showNotification('画像の挿入に失敗しました');
        }
      })
      .finally(() => {
        insertImagesSequentially(manager, files, index + 1);
      });
  }

  function insertImageFile(manager, file) {
    return new Promise((resolve, reject) => {
      if (!manager || !manager.editor) {
        resolve();
        return;
      }
      if (!file) {
        resolve();
        return;
      }
      const reader = new FileReader();
      const selection = {
        start: manager.editor.selectionStart,
        end: manager.editor.selectionEnd,
      };
      reader.onload = () => {
        try {
          const dataUrl = reader.result;
          const markdown = buildAssetAwareMarkdown(manager, {
            dataUrl,
            file,
            selectionStart: selection.start,
          });
          manager.insertTextAtCursor(markdown, selection);
          if (typeof manager.showNotification === 'function') {
            manager.showNotification('画像を挿入しました', 1500);
          }
          renderImagePreview(manager);
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      try {
        reader.readAsDataURL(file);
      } catch (err) {
        reject(err);
      }
    });
  }

  function buildAssetAwareMarkdown(manager, { dataUrl, file, selectionStart }) {
    const editor = manager && manager.editor;
    const before = editor ? editor.value.substring(0, selectionStart || 0) : '';
    const prefix = before && !/\n$/.test(before) ? '\n\n' : '';
    const suffix = '\n\n';
    const alt = deriveAltText(file && file.name);
    let link = dataUrl;
    if (window.ZenWriterStorage && typeof window.ZenWriterStorage.saveAssetFromDataUrl === 'function') {
      const asset = window.ZenWriterStorage.saveAssetFromDataUrl(dataUrl, {
        name: alt,
        fileName: file && file.name,
        type: file && file.type,
        size: file && file.size,
      });
      if (asset && asset.id) {
        link = `asset://${asset.id}`;
      }
    }
    return `${prefix}![${alt}](${link})${suffix}`;
  }

  function deriveAltText(fileName) {
    const base = fileName ? String(fileName).replace(/\.[^.]+$/, '') : 'image';
    const sanitized = base.replace(/[_`*\[\]{}()#!|<>]/g, ' ').trim();
    return sanitized || 'image';
  }

  function convertLegacyImageEmbeds(manager, content) {
    if (!content || content.indexOf('data:image') === -1) {
      return content;
    }
    if (!window.ZenWriterStorage || typeof window.ZenWriterStorage.saveAssetFromDataUrl !== 'function') {
      return content;
    }
    const pattern = /!\[([^\]]*)\]\((data:image\/[^)]+)\)/g;
    let changed = false;
    const replaced = content.replace(pattern, (match, alt, dataUrl) => {
      const asset = window.ZenWriterStorage.saveAssetFromDataUrl(dataUrl, { name: alt || 'image' });
      if (!asset || !asset.id) {
        return match;
      }
      changed = true;
      const safeAlt = (alt || '').trim();
      return `![${safeAlt}](asset://${asset.id})`;
    });
    if (changed && manager && typeof manager.updateStorageContentAfterMigration === 'function') {
      manager.updateStorageContentAfterMigration(replaced);
      return replaced;
    }
    return content;
  }

  function renderImagePreview(manager) {
    if (!manager || !manager.imagesPreviewPanel) return;
    const editor = manager.editor;
    const content = (editor && editor.value) || '';
    const regex = /!\[[^\]]*\]\(asset:\/\/([^\s)]+)\)/g;
    const matches = Array.from(content.matchAll(regex));
    manager.imagesPreviewPanel.innerHTML = '';

    if (!matches.length) {
      const hint = document.createElement('div');
      hint.className = 'preview-empty-hint';
      hint.textContent = '画像はまだ挿入されていません。画像を貼り付けるとここに一覧表示されます。';
      manager.imagesPreviewPanel.appendChild(hint);
      if (manager.editorOverlay) manager.editorOverlay.innerHTML = '';
      manager._lastOverlayEntries = [];
      return;
    }

    const storage = window.ZenWriterStorage;
    const assets = storage && typeof storage.loadAssets === 'function' ? storage.loadAssets() : {};

    const list = document.createElement('div');
    list.className = 'editor-preview__items';

    const orderedEntries = [];
    matches.forEach((match, index) => {
      const assetId = match[1];
      const asset = assets[assetId];
      if (!asset || !asset.dataUrl) return;
      orderedEntries.push({
        assetId,
        asset,
        matchIndex: index,
        matchStart: typeof match.index === 'number' ? match.index : content.indexOf(match[0]),
        matchLength: match[0].length,
      });
      if (manager.createPreviewCard) {
        const card = manager.createPreviewCard({ assetId, asset, matchIndex: index });
        if (card) list.appendChild(card);
      }
    });

    if (!list.childElementCount) {
      const warn = document.createElement('div');
      warn.className = 'preview-warning';
      warn.textContent = 'アセット情報が見つからない画像があります。必要であれば再読み込みしてください。';
      manager.imagesPreviewPanel.appendChild(warn);
      if (manager.editorOverlay) manager.editorOverlay.innerHTML = '';
      manager._lastOverlayEntries = [];
      return;
    }

    manager.imagesPreviewPanel.appendChild(list);

    if (storage && typeof storage.updateAssetMeta === 'function') {
      orderedEntries.forEach((entry, order) => {
        if (typeof entry.asset.order !== 'number' || entry.asset.order !== order) {
          storage.updateAssetMeta(entry.assetId, { order });
        }
      });
    }

    manager._lastOverlayEntries = orderedEntries;
    if (typeof manager.renderOverlayImages === 'function') {
      manager.renderOverlayImages(orderedEntries, content);
    }
  }

  window.editorImages_handlePasteEvent = handlePasteEvent;
  window.editorImages_handleDragOver = handleDragOver;
  window.editorImages_handleDragLeave = handleDragLeave;
  window.editorImages_handleDropEvent = handleDropEvent;
  window.editorImages_insertImagesSequentially = insertImagesSequentially;
  window.editorImages_insertImageFile = insertImageFile;
  window.editorImages_buildAssetAwareMarkdown = buildAssetAwareMarkdown;
  window.editorImages_deriveAltText = deriveAltText;
  window.editorImages_convertLegacyImageEmbeds = convertLegacyImageEmbeds;
  window.editorImages_renderImagePreview = renderImagePreview;
})();
