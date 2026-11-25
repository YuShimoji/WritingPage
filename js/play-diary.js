/* A diary scene is a Markdown quote marked [!PLAY-DIARY]. Its nested quote
 * holds game dialogue; the remaining paragraphs hold the player's account. */
(function () {
  'use strict';

  const marker = '[!PLAY-DIARY]';
  const dialog = document.getElementById('play-diary-dialog');
  const form = dialog.querySelector('form');
  const fields = form.elements;
  const error = form.querySelector('[role="alert"]');
  const submit = form.querySelector('[type="submit"]');
  let position = null;
  let generation = 0;
  const editingUrls = new Map();

  // Rich-text undo stores HTML snapshots. Keep one short URL per screenshot
  // in this window so a keystroke doesn't copy megabytes into every snapshot.
  function editingSource(asset) {
    if (editingUrls.has(asset.id)) return editingUrls.get(asset.id);
    const comma = asset.dataUrl.indexOf(',');
    if (!asset.dataUrl.slice(0, comma).endsWith(';base64')) return asset.dataUrl;
    try {
      const binary = atob(asset.dataUrl.slice(comma + 1));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: asset.dataUrl.slice(5, asset.dataUrl.indexOf(';')) });
      const url = URL.createObjectURL(blob);
      editingUrls.set(asset.id, url);
      return url;
    } catch (_) { return asset.dataUrl; }
  }

  function resolveImages(fragment, editing) {
    for (const image of fragment.querySelectorAll('img[src^="asset://"], img[data-zw-asset]:not([src])')) {
      const id = image.dataset.zwAsset || image.getAttribute('src').slice('asset://'.length);
      const asset = window.ZenWriterStorage.getAsset(id);
      if (asset && /^data:image\//i.test(asset.dataUrl)) {
        image.setAttribute('src', editing ? editingSource(asset) : asset.dataUrl);
        if (editing) image.dataset.zwAsset = id;
        else image.removeAttribute('data-zw-asset');
      } else {
        image.removeAttribute('src');
        image.dataset.zwAsset = id;
      }
    }
  }

  window.addEventListener('ZenWriterAssetsReady', () => {
    resolveImages(document.getElementById('wysiwyg-editor'), true);
    resolveImages(document.getElementById('reader-preview'), false);
    resolveImages(document.getElementById('markdown-preview-panel'), false);
  });

  function project(html, editing) {
    if (!html.includes(marker) && !html.includes('asset://')) return html;
    const template = document.createElement('template');
    template.innerHTML = html;
    const fragment = template.content;
    for (const quote of fragment.querySelectorAll('blockquote')) {
      const label = quote.firstElementChild;
      if (!label || label.tagName !== 'P' || label.firstChild?.nodeType !== Node.TEXT_NODE) continue;
      if (label.textContent !== marker && !label.textContent.startsWith(marker + ' ')) continue;
      const day = label.textContent.slice(marker.length).trim();
      label.remove();
      const scene = document.createElement('section');
      scene.className = 'play-diary-scene';
      if (day) {
        const date = document.createElement('header');
        date.className = 'play-diary-day';
        date.textContent = day;
        scene.append(date);
      }
      const speech = quote.firstElementChild;
      if (speech && speech.tagName === 'BLOCKQUOTE') scene.append(speech);
      if (quote.childElementCount) {
        const note = document.createElement('div');
        note.className = 'play-diary-note';
        note.append(...quote.childNodes);
        scene.append(note);
      }
      quote.replaceWith(scene);
    }
    resolveImages(fragment, editing);
    return template.innerHTML;
  }

  function canInsert() {
    const manager = window.ZenWriterEditor;
    return !!manager && !manager.editorClassicLayer?.classList.contains('editor-classic-layer--previewing')
      && !window.ZWReaderPreview?.isOpen();
  }

  function rememberPosition() {
    if (!canInsert()) { position = null; return; }
    const manager = window.ZenWriterEditor;
    const rich = manager.richTextEditor;
    if (rich?.isWysiwygMode) {
      const root = rich.wysiwygEditor;
      let block = window.getSelection()?.focusNode;
      while (block && block.parentNode !== root) block = block.parentNode;
      position = { root, block };
    } else {
      const root = manager.editor;
      // A blank line ends a Markdown paragraph, including a marked blockquote.
      const offset = root.selectionEnd;
      const rest = root.value.slice(offset);
      const boundary = rest.search(/\n[ \t]*\n/);
      position = { root, offset: boundary < 0 ? root.value.length : offset + boundary };
    }
  }

  function open() {
    if (!canInsert() || dialog.open) return;
    if (!position) rememberPosition();
    form.reset();
    error.hidden = true;
    fields.alt.parentElement.hidden = true;
    submit.disabled = false;
    dialog.showModal();
  }

  function close() {
    generation++;
    dialog.close();
    position?.root.focus();
    position = null;
  }

  function quote(text) {
    return text.split('\n').map(line => ('> ' + line).trimEnd()).join('\n');
  }

  // Form fields are literal game text. Keep Markdown syntax available in the editor.
  function literal(text) {
    return text.trim().replace(/[&<>\\*_~#\x60{}[\]|!]/g, ch => '&#' + ch.charCodeAt(0) + ';')
      .replace(/^(\s*)([-+]|[0-9]+[.)])(?=\s)/gm, (_match, indent, prefix) =>
        indent + prefix.slice(0, -1) + '\\' + prefix.slice(-1));
  }

  function readImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  function serialize(content, node) {
    const day = node.querySelector(':scope > .play-diary-day')?.textContent;
    const heading = marker + (day ? ' ' + literal(day).replace(/\s*\n\s*/g, ' ') : '');
    return '\n\n' + quote(heading + '\n\n' + content.trim()) + '\n\n';
  }

  function insert(markdown) {
    const manager = window.ZenWriterEditor;
    const { root, block, offset } = position;
    if (root === manager.editor) {
      root.focus();
      root.setSelectionRange(offset, offset);
      const source = (offset ? '\n\n' : '') + markdown + '\n\n';
      // Native edit participates in the textarea undo stack and autosave input event.
      if (!document.execCommand('insertText', false, source)) {
        root.setRangeText(source, offset, offset, 'end');
        root.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return;
    }
    const rich = manager.richTextEditor;
    rich._captureUndoSnapshot();
    const template = document.createElement('template');
    template.innerHTML = rich.markdownToHtml(markdown);
    const next = document.createElement('p');
    next.append(document.createElement('br'));
    template.content.append(next);
    root.insertBefore(template.content, block?.parentNode === root ? block.nextSibling : null);
    root.focus();
    window.getSelection().collapse(next, 0);
    root.dispatchEvent(new Event('input', { bubbles: true }));
    rich._captureUndoSnapshot();
  }

  fields.picture.addEventListener('change', () => {
    fields.alt.parentElement.hidden = !fields.picture.files.length;
  });
  fields.cancel.addEventListener('click', close);
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled) return;
    const file = fields.picture.files[0];
    const speech = literal(fields.speech.value);
    const translation = literal(fields.translation.value);
    const narrative = literal(fields.narrative.value);
    const day = literal(fields.day.value);
    const description = fields.alt.value.trim();
    error.hidden = true;
    const attempt = generation;
    submit.disabled = true;
    try {
      if (!speech && !translation && !narrative && !file) {
        throw new Error('台詞・和訳・画像・日記本文のいずれかを入力してください。');
      }
      const parts = [marker + (day ? ' ' + day : '')];
      const dialogue = [speech, translation && translation.split(/\n\s*\n/).map(p => '*' + p + '*').join('\n\n')].filter(Boolean);
      if (dialogue.length) parts.push(quote(dialogue.join('\n\n')));
      if (file) {
        if (!/^image\/(?:png|jpeg|gif|webp)$/i.test(file.type)) throw new Error('PNG・JPEG・GIF・WebP の画像を選んでください。');
        const dataUrl = await readImage(file);
        if (attempt !== generation || !dialog.open) return;
        const alt = description || window.editorImages_deriveAltText(file.name);
        const asset = await window.ZenWriterStorage.storeScreenshot(dataUrl, { fileName: file.name, name: alt, type: file.type, size: file.size });
        if (attempt !== generation || !dialog.open) return;
        if (!asset) throw new Error('画像を保存できませんでした。');
        if (!editingUrls.has(asset.id)) editingUrls.set(asset.id, URL.createObjectURL(file));
        parts.push('![' + literal(alt) + '](asset://' + asset.id + ')');
      }
      if (narrative) parts.push(narrative);
      const markdown = quote(parts.join('\n\n'));
      dialog.close();
      insert(markdown);
      position = null;
    } catch (err) {
      if (!dialog.open && position) dialog.showModal();
      error.textContent = err.message || '場面を挿入できませんでした。';
      error.hidden = false;
    } finally {
      if (generation === attempt) submit.disabled = false;
    }
  });

  window.ZWPlayDiary = { project, serialize, canInsert, rememberPosition, open };
})();
