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
  const turnList = form.querySelector('#play-diary-turns');
  const blankTurn = turnList.firstElementChild.cloneNode(true);
  const roleLabels = { unknown: 'ゲーム内の台詞', npc: '登場人物', player: 'プレイヤー' };
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

  // In the normal editor all episodes can be edited on one page. The Reader,
  // JSON backup and reopening use the individual chapter records.
  function syncChapterBodies(text) {
    const root = document.documentElement;
    if (root.dataset.uiMode === 'focus' || root.dataset.zwChapterEditorSync === 'slice') return;
    const store = window.ZWChapterStore;
    const id = window.ZenWriterStorage.getCurrentDocId();
    if (!id || !store?.isChapterMode(id)) return;
    const chapters = store.getChaptersForDoc(id);
    const hasScene = source => source?.includes(marker) || window.ZWMdItBody.hasReadingBlocks(source);
    if (!chapters.length || (!hasScene(text) && !chapters.some(ch => hasScene(ch.content)))) return;
    if (chapters.length === 1 && chapters[0].name === '本文') {
      if (chapters[0].content !== text) store.updateChapterContent(chapters[0].id, text);
      return;
    }
    // Match the existing chapter boundaries, including repeated episode titles.
    // Subheadings in an episode stay in its body and visibility stays on its ID.
    const key = (level, title) => '#'.repeat(level) + ' ' + title;
    const titles = chapters.map(ch => key(ch.level || 2, (ch.name || '').trim()));
    const knownTitles = new Set(titles);
    const parse = window.ZWChapterModel.parseChapters;
    const parsed = parse(text);
    let headings = parsed.filter(h => knownTitles.has(key(h.level, h.title)));
    if (headings.length !== chapters.length || !headings.every((h, i) => key(h.level, h.title) === titles[i])) {
      // A writer can rename an episode inline, or reuse its title in a subheading.
      // Align the existing heading structure before changing a stored name.
      let cursor = 0;
      headings = [];
      for (const ch of chapters) {
        const heading = parsed[cursor++];
        if (heading?.level !== (ch.level || 2)) return;
        headings.push(heading);
        for (const nested of parse(ch.content || '')) {
          const other = parsed[cursor++];
          if (other?.level !== nested.level || other.title !== nested.title) return;
        }
      }
      if (cursor !== parsed.length) return;
    }
    if (text.slice(0, headings[0].startOffset).trim()) return;
    chapters.forEach((ch, i) => {
      const body = text.slice(headings[i].headingEnd, headings[i + 1]?.startOffset).replace(/^\n+|\n+$/g, '');
      if (headings[i].title !== (ch.name || '').trim()) store.renameChapter(ch.id, headings[i].title);
      if (body !== (ch.content || '')) store.updateChapterContent(ch.id, body);
    });
  }

  function caption(label) {
    const el = document.createElement('div');
    el.className = 'play-diary-caption';
    const role = document.createElement('span');
    role.textContent = label;
    role.contentEditable = 'false';
    el.append(role);
    return el;
  }

  function projectDialogue(quote, scene) {
    const dialogue = document.createElement('div');
    dialogue.className = 'play-diary-dialogue';
    while (quote.firstElementChild) {
      const first = quote.firstElementChild;
      const match = first.tagName === 'P' && /^\[!SPEAKER:(npc|player|unknown)\](?: (.*))?$/u.exec(first.textContent);
      const speech = match ? first.nextElementSibling : first;
      if (speech?.tagName !== 'BLOCKQUOTE') break;
      const role = match ? match[1] : 'unknown';
      const turn = document.createElement('div');
      turn.className = 'play-diary-turn';
      turn.dataset.speaker = role;
      const label = caption(roleLabels[role]);
      if (match) {
        label.dataset.speaker = role;
        if (match[2]) {
          const name = document.createElement('strong');
          name.textContent = match[2];
          label.append(name);
        }
        first.remove();
      }
      turn.append(label, speech);
      dialogue.append(turn);
      // The original format has one unlabelled quotation; anything after it is the author's note.
      if (!match) break;
    }
    if (dialogue.childElementCount) scene.append(dialogue);
  }

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
      projectDialogue(quote, scene);
      if (quote.childElementCount) {
        const note = document.createElement('div');
        note.className = 'play-diary-note';
        note.append(caption('筆者の記録'), ...quote.childNodes);
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
    turnList.replaceChildren(blankTurn.cloneNode(true));
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

  function speakerMarker(role, name) {
    return '[!SPEAKER:' + role + ']' + (name ? ' ' + literal(name).replace(/\s*\n\s*/g, ' ') : '');
  }

  function serializeCaption(node) {
    const role = node.dataset.speaker;
    return role ? '\n\n' + speakerMarker(role, node.querySelector('strong')?.textContent.trim()) + '\n\n' : '';
  }

  function dialogueParts() {
    const parts = [];
    for (const turn of turnList.children) {
      const inputs = turn.elements;
      const name = inputs.speaker.value.trim();
      const speech = literal(inputs.speech.value);
      const translation = literal(inputs.translation.value);
      if (!speech && !translation) {
        if (name || inputs.role.value !== 'unknown') {
          inputs.speech.focus();
          throw new Error(turn.querySelector('legend').textContent + 'の台詞または和訳を入力してください。');
        }
        continue;
      }
      const paragraphs = [speech, translation && translation.split(/\n\s*\n/).map(p => '*' + p + '*').join('\n\n')];
      parts.push(speakerMarker(inputs.role.value, name), quote(paragraphs.filter(Boolean).join('\n\n')));
    }
    return parts;
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

  fields.addTurn.addEventListener('click', () => {
    const turn = blankTurn.cloneNode(true);
    turn.querySelector('legend').textContent = '発言 ' + (turnList.childElementCount + 1);
    turn.elements.removeTurn.hidden = false;
    turnList.append(turn);
    turn.elements.role.focus();
  });
  turnList.addEventListener('click', event => {
    if (event.target.name !== 'removeTurn') return;
    const turn = event.target.closest('fieldset');
    const focusTarget = turn.nextElementSibling?.elements.role || fields.addTurn;
    turn.remove();
    Array.from(turnList.children).forEach((item, i) => { item.querySelector('legend').textContent = '発言 ' + (i + 1); });
    focusTarget.focus();
  });
  fields.picture.addEventListener('change', () => {
    fields.alt.parentElement.hidden = !fields.picture.files.length;
  });
  fields.cancel.addEventListener('click', close);
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled) return;
    const file = fields.picture.files[0];
    const narrative = literal(fields.narrative.value);
    const day = literal(fields.day.value);
    const description = fields.alt.value.trim();
    error.hidden = true;
    const attempt = generation;
    submit.disabled = true;
    try {
      const dialogue = dialogueParts();
      if (!dialogue.length && !narrative && !file) {
        throw new Error('台詞・和訳・画像・日記本文のいずれかを入力してください。');
      }
      const parts = [marker + (day ? ' ' + day : ''), ...dialogue];
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

  const readingDialog = document.getElementById('reading-block-dialog');
  const readingForm = readingDialog.querySelector('form');
  const readingFields = readingForm.elements;

  function openReadingBlock(type) {
    if (!canInsert() || readingDialog.open) return;
    if (!position) rememberPosition();
    const spoiler = type === 'SPOILER';
    readingForm.reset();
    readingForm.dataset.type = type;
    readingDialog.querySelector('h2').textContent = spoiler ? '伏せ書きを挿入' : '場面字幕を挿入';
    readingDialog.querySelector('#reading-block-label').textContent = spoiler ? '開く前に見せる見出し' : '場面字幕';
    readingDialog.querySelector('#reading-block-body-label').textContent = spoiler ? '開くと読める本文' : '副題（任意）';
    readingFields.body.required = spoiler;
    readingDialog.showModal();
  }

  readingForm.addEventListener('submit', event => {
    event.preventDefault();
    const title = literal(readingFields.titleText.value);
    const body = literal(readingFields.body.value);
    if (!title || (readingFields.body.required && !body)) {
      const invalid = title ? readingFields.body : readingFields.titleText;
      invalid.setCustomValidity('文字を入力してください。');
      invalid.reportValidity();
      invalid.setCustomValidity('');
      return;
    }
    readingDialog.close();
    insert(quote('[!' + readingForm.dataset.type + '] ' + title + (body ? '\n\n' + body : '')));
    position = null;
  });
  function cancelReadingBlock() {
    readingDialog.close();
    position?.root.focus();
    position = null;
  }
  readingFields.cancel.addEventListener('click', cancelReadingBlock);
  readingDialog.addEventListener('cancel', event => {
    event.preventDefault();
    cancelReadingBlock();
  });

  window.ZWPlayDiary = { project, serialize, serializeCaption, syncChapterBodies, canInsert, rememberPosition, open, openReadingBlock };
})();
