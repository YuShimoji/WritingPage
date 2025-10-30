// エディタ管理クラス
class EditorManager {
  constructor() {
    this.editor = document.getElementById('editor');
    this.wordCountElement = document.querySelector('.word-count');
    this.goalProgressEl = document.getElementById('goal-progress');
    this.goalProgressBarEl = this.goalProgressEl
      ? this.goalProgressEl.querySelector('.goal-progress__bar')
      : null;
    // 自動スナップショット用の状態
    this._lastSnapTs = 0;
    this._lastSnapLen = 0;
    const _s = window.ZenWriterStorage.loadSettings();
    this.SNAPSHOT_MIN_INTERVAL =
      _s && _s.snapshot && typeof _s.snapshot.intervalMs === 'number'
        ? _s.snapshot.intervalMs
        : 120000;
    this.SNAPSHOT_MIN_DELTA =
      _s && _s.snapshot && typeof _s.snapshot.deltaChars === 'number'
        ? _s.snapshot.deltaChars
        : 300;
    // 目標達成の一時フラグ（再達成の過剰通知を抑止）
    this._goalReachedNotified = false;
    this.dropIndicatorClass = 'drop-ready';
    this.editorOverlay = document.getElementById('editor-overlay');
    this.editorMirror = document.getElementById('editor-mirror');
    this.previewPanel = document.getElementById('editor-preview');
    this.previewPanelBody = document.getElementById('editor-preview-body');
    this.previewPanelToggle = document.getElementById('editor-preview-toggle');
    this._overlayRenderFrame = null;
    this._lastOverlayEntries = [];
    this._cachedEditorMetrics = null;
    this._typewriterRaf = null;
    this.setupEventListeners();
    this.setupImageHandlers();
    this.setupPreviewPanel();
    this.setupOverlaySupport();
    this.loadContent();
    this.updateWordCount();
    this.renderImagePreview();
    this.maybeTypewriterScroll('init');
    if (this.previewPanelBody) {
      this.previewPanelBody.addEventListener('click', (e) =>
        this.handlePreviewLink(e),
      );
    }
  }

  /**
   * イベントリスナーを設定
   */
  setupEventListeners() {
    // コンテンツ変更時の自動保存
    this.editor.addEventListener('input', () => {
      this.saveContent();
      this.updateWordCount();
      this.maybeAutoSnapshot();
      this.renderImagePreview();
      this.maybeTypewriterScroll('input');
    });

    // タブキーでインデント + タイプライターモードのスクロール制御
    this.editor.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        this.insertTextAtCursor('\t');
      }
      // Markdown: 自動リスト継続（Enter）
      if (e.key === 'Enter') {
        try {
          const pos = this.editor.selectionStart;
          const text = this.editor.value || '';
          const lineStart = text.lastIndexOf('\n', Math.max(0, pos - 1)) + 1;
          const line = text.slice(lineStart, pos);
          const bullet = line.match(/^\s*([*-]\s+)/);
          const ordered = line.match(/^\s*(\d+)\.\s+/);
          if (bullet || ordered) {
            e.preventDefault();
            const contentAfterMarker = line.replace(/^\s*([*-]|\d+\.)\s+/, '');
            if (contentAfterMarker.trim() === '') {
              // 空の行でEnterならリスト終了
              this.insertTextAtCursor('\n');
            } else {
              const prefix = bullet
                ? bullet[1]
                : `${parseInt(ordered[1], 10) + 1}. `;
              this.insertTextAtCursor(`\n${prefix}`);
            }
            // タイプライタースクロール（改行）
            setTimeout(() => this.maybeTypewriterScroll('newline'), 0);
            return;
          }
        } catch (_) {}
      }
      if (
        e.key === 'Enter' ||
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' ||
        e.key === 'PageUp' ||
        e.key === 'PageDown' ||
        e.key === 'Home' ||
        e.key === 'End'
      ) {
        const t = e.key === 'Enter' ? 'newline' : 'nav';
        setTimeout(() => this.maybeTypewriterScroll(t), 0);
      }
    });

    this.editor.addEventListener('click', () => {
      this.maybeTypewriterScroll('click');
    });

    // 保存ショートカット (Ctrl+S or Cmd+S)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.saveContent();
        this.showNotification('保存しました');
      }

      // フォントサイズ調整ショートカット
      if (e.ctrlKey || e.metaKey) {
        // Markdown ショートカット: 太字/斜体/リンク
        if (e.key === 'b' || e.key === 'B') {
          e.preventDefault();
          this.applyMarkdownShortcut('bold');
          return;
        }
        if (e.key === 'i' || e.key === 'I') {
          e.preventDefault();
          this.applyMarkdownShortcut('italic');
          return;
        }
        if (e.key === 'k' || e.key === 'K') {
          e.preventDefault();
          this.applyMarkdownShortcut('link');
          return;
        }
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          this.adjustGlobalFontSize(1);
        } else if (e.key === '-') {
          e.preventDefault();
          this.adjustGlobalFontSize(-1);
        } else if (e.key === '0') {
          e.preventDefault();
          const defaults = window.ZenWriterStorage.DEFAULT_SETTINGS;
          this.setGlobalFontSize(defaults.fontSize);
        }
      }
    });
  }

  /**
   * カーソル位置にテキストを挿入
   * @param {string} text - 挿入するテキスト
   */
  insertTextAtCursor(text, options = {}) {
    const start =
      options && typeof options.start === 'number'
        ? options.start
        : this.editor.selectionStart;
    const end =
      options && typeof options.end === 'number'
        ? options.end
        : this.editor.selectionEnd;
    const before = this.editor.value.substring(0, start);
    const after = this.editor.value.substring(end, this.editor.value.length);

    this.editor.value = before + text + after;
    const newPos = start + text.length;
    this.editor.selectionStart = newPos;
    this.editor.selectionEnd = newPos;
    this.editor.focus();

    this.saveContent();
    this.updateWordCount();
  }

  setupImageHandlers() {
    if (!this.editor) return;
    this.editor.addEventListener('paste', (e) => this.handlePasteEvent(e));
    this.editor.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.editor.addEventListener('dragenter', (e) => this.handleDragOver(e));
    this.editor.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    this.editor.addEventListener('drop', (e) => this.handleDropEvent(e));
  }

  setupPreviewPanel() {
    if (!this.previewPanel || !this.previewPanelToggle) return;
    this.previewPanelToggle.addEventListener('click', () => {
      const collapsed = this.previewPanel.classList.toggle(
        'editor-preview--collapsed',
      );
      this.previewPanelToggle.textContent = collapsed
        ? '展開する'
        : '折りたたむ';
    });
  }

  setupOverlaySupport() {
    if (!this.editor || !this.editorOverlay || !this.editorMirror) return;
    const schedule = () => this.scheduleOverlayRefresh();
    this.editor.addEventListener('scroll', schedule);
    window.addEventListener('resize', schedule);
    this._overlayScheduleHandler = schedule;
  }

  handlePasteEvent(event) {
    const items = event.clipboardData && event.clipboardData.items;
    if (!items || !items.length) return;
    const imageFiles = Array.from(items)
      .filter(
        (item) =>
          item.kind === 'file' && item.type && item.type.startsWith('image/'),
      )
      .map((item) => item.getAsFile())
      .filter(Boolean);
    if (!imageFiles.length) return;
    event.preventDefault();
    this.insertImagesSequentially(imageFiles);
  }

  handleDragOver(event) {
    if (!event.dataTransfer) return;
    if (Array.from(event.dataTransfer.types || []).includes('Files')) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      this.editor.classList.add(this.dropIndicatorClass);
    }
  }

  handleDragLeave(event) {
    if (event.relatedTarget === this.editor) return;
    this.editor.classList.remove(this.dropIndicatorClass);
  }

  handleDropEvent(event) {
    if (!event.dataTransfer) return;
    const files = Array.from(event.dataTransfer.files || []).filter(
      (file) => file.type && file.type.startsWith('image/'),
    );
    if (!files.length) {
      this.editor.classList.remove(this.dropIndicatorClass);
      return;
    }
    event.preventDefault();
    this.editor.classList.remove(this.dropIndicatorClass);
    this.editor.focus();
    this.insertImagesSequentially(files);
  }

  insertImagesSequentially(files, index = 0) {
    if (!files || index >= files.length) return;
    this.insertImageFile(files[index])
      .catch(() => {
        this.showNotification('画像の挿入に失敗しました');
      })
      .finally(() => {
        this.insertImagesSequentially(files, index + 1);
      });
  }

  insertImageFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve();
        return;
      }
      const reader = new FileReader();
      const selection = {
        start: this.editor.selectionStart,
        end: this.editor.selectionEnd,
      };
      reader.onload = () => {
        try {
          const dataUrl = reader.result;
          const markdown = this.buildAssetAwareMarkdown({
            dataUrl,
            file,
            selectionStart: selection.start,
          });
          this.insertTextAtCursor(markdown, selection);
          if (typeof this.showNotification === 'function') {
            this.showNotification('画像を挿入しました', 1500);
          }
          this.renderImagePreview();
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

  buildAssetAwareMarkdown({ dataUrl, file, selectionStart }) {
    const before = this.editor.value.substring(0, selectionStart || 0);
    const prefix = before && !/\n$/.test(before) ? '\n\n' : '';
    const suffix = '\n\n';
    const alt = this.deriveAltText(file && file.name);
    let link = dataUrl;
    if (
      window.ZenWriterStorage &&
      typeof window.ZenWriterStorage.saveAssetFromDataUrl === 'function'
    ) {
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

  deriveAltText(fileName) {
    const base = fileName ? String(fileName).replace(/\.[^.]+$/, '') : 'image';
    const sanitized = base.replace(/[_`*\[\]{}()#!|<>]/g, ' ').trim();
    return sanitized || 'image';
  }

  convertLegacyImageEmbeds(content) {
    if (!content || content.indexOf('data:image') === -1) {
      return content;
    }
    if (
      !window.ZenWriterStorage ||
      typeof window.ZenWriterStorage.saveAssetFromDataUrl !== 'function'
    ) {
      return content;
    }
    const pattern = /!\[([^\]]*)\]\((data:image\/[^)]+)\)/g;
    let changed = false;
    const replaced = content.replace(pattern, (match, alt, dataUrl) => {
      const asset = window.ZenWriterStorage.saveAssetFromDataUrl(dataUrl, {
        name: alt || 'image',
      });
      if (!asset || !asset.id) {
        return match;
      }
      changed = true;
      const safeAlt = (alt || '').trim();
      return `![${safeAlt}](asset://${asset.id})`;
    });
    if (changed) {
      this.updateStorageContentAfterMigration(replaced);
      return replaced;
    }
    return content;
  }

  renderImagePreview() {
    if (!this.previewPanelBody) return;
    const content = this.editor.value || '';
    const regex = /!\[[^\]]*\]\(asset:\/\/([^\s)]+)\)/g;
    const matches = Array.from(content.matchAll(regex));
    this.previewPanelBody.innerHTML = '';

    // --- Markdown live preview (minimal) ---
    const md = this.buildMarkdownPreview(content);
    if (md) this.previewPanelBody.appendChild(md);

    // --- Images preview ---
    if (!matches.length) {
      const hint = document.createElement('div');
      hint.className = 'preview-empty-hint';
      hint.textContent =
        '画像はまだ挿入されていません。画像を貼り付けるとここに一覧表示されます。';
      this.previewPanelBody.appendChild(hint);
      if (this.editorOverlay) this.editorOverlay.innerHTML = '';
      this._lastOverlayEntries = [];
      return;
    }

    const storage = window.ZenWriterStorage;
    const assets =
      storage && typeof storage.loadAssets === 'function'
        ? storage.loadAssets()
        : {};

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
        matchStart:
          typeof match.index === 'number'
            ? match.index
            : content.indexOf(match[0]),
        matchLength: match[0].length,
      });
      const card = this.createPreviewCard({
        assetId,
        asset,
        matchIndex: index,
      });
      if (card) list.appendChild(card);
    });

    if (!list.childElementCount) {
      const warn = document.createElement('div');
      warn.className = 'preview-warning';
      warn.textContent =
        'アセット情報が見つからない画像があります。必要であれば再読み込みしてください。';
      this.previewPanelBody.appendChild(warn);
      if (this.editorOverlay) this.editorOverlay.innerHTML = '';
      this._lastOverlayEntries = [];
      return;
    }

    this.previewPanelBody.appendChild(list);

    if (storage && typeof storage.updateAssetMeta === 'function') {
      orderedEntries.forEach((entry, order) => {
        if (
          typeof entry.asset.order !== 'number' ||
          entry.asset.order !== order
        ) {
          storage.updateAssetMeta(entry.assetId, { order });
        }
      });
    }

    this._lastOverlayEntries = orderedEntries;
    this.renderOverlayImages(orderedEntries, content);
  }

  // 拡張Markdownプレビュー: コードブロック、目次、スクロール同期（最小実装版）
  buildMarkdownPreview(content) {
    try {
      const container = document.createElement('div');
      container.className = 'md-preview';
      const maxLen = 20000; // パフォーマンス保護
      let src = String(content || '').slice(0, maxLen);
      // 画像はここでは除去（下の画像プレビューで扱う）
      src = src.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
      // エスケープ
      let html = this.escapeHtml(src);
      // コードブロック処理（``` または ~~~）
      html = html.replace(/```([\s\S]*?)```|~~~([\s\S]*?)~~~/g, (match, p1, p2) => {
        const code = (p1 || p2 || '').trim();
        if (!code) return '<pre><code></code></pre>';
        return `<pre><code>${this.escapeHtml(code)}</code></pre>`;
      });
      // 目次生成（見出しから）
      const headings = [];
      html = html.replace(/<h(\d)>([^<]+)<\/h\d>/gi, (match, level, title) => {
        const id = 'toc-' + headings.length;
        headings.push({ level: parseInt(level), title, id });
        return `<h${level} id="${id}">${title}</h${level}>`;
      });
      // 行ごとに処理
      html = html
        // 見出し # ～ ###
        .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
        .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
        .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
        // 太字/斜体
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // リンク
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        // 行頭の箇条書き
        .replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>');
      // 箇条書きのliをulでラップ（簡易）
      html = html.replace(/(?:<li>[^<]+</li>\n?)+/g, (m) => {
        const items = m.trim().replace(/\n/g, '');
        return `<ul>${items}</ul>`;
      });
      // 段落化（既にh*/ul/li/pre の行は対象外）
      html = html
        .split(/\n{2,}/)
        .map((blk) => {
          const t = blk.trim();
          if (!t) return '';
          if (/^<(h\d|ul|li|pre|blockquote)/.test(t)) return t;
          return `<p>${t.replace(/\n/g, '<br>')}</p>`;
        })
        .join('\n');
      container.innerHTML = html;
      // 目次を追加（見出しがある場合のみ）
      if (headings.length > 0) {
        const toc = document.createElement('div');
        toc.className = 'md-toc';
        toc.style.marginBottom = '1rem';
        toc.style.padding = '0.5rem';
        toc.style.backgroundColor = '#f5f5f5';
        toc.style.borderRadius = '4px';
        toc.innerHTML = '<h4 style="margin: 0 0 0.5rem 0; font-size: 0.9rem;">目次</h4>';
        const tocList = document.createElement('ul');
        tocList.style.margin = '0';
        tocList.style.paddingLeft = '1rem';
        headings.forEach(h => {
          const li = document.createElement('li');
          li.style.marginBottom = '0.25rem';
          li.style.listStyle = 'none';
          li.style.paddingLeft = ((h.level - 1) * 1) + 'rem';
          const link = document.createElement('a');
          link.href = '#' + h.id;
          link.textContent = h.title;
          link.style.fontSize = '0.85rem';
          link.style.color = '#007acc';
          link.style.textDecoration = 'none';
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const el = document.getElementById(h.id);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          });
          li.appendChild(link);
          tocList.appendChild(li);
        });
        toc.appendChild(tocList);
        container.insertBefore(toc, container.firstChild);
      }
      return container;
    } catch (_) {
      return null;
    }
  }

  createPreviewCard({ assetId, asset, matchIndex }) {
    const card = document.createElement('article');
    card.className = 'preview-image-card';
    card.dataset.assetId = assetId;
    if (asset.hidden) card.classList.add('hidden');

    const toolbar = document.createElement('div');
    toolbar.className = 'preview-image-card__toolbar';

    const title = document.createElement('span');
    title.textContent = asset.name || `画像 ${matchIndex + 1}`;
    toolbar.appendChild(title);

    const actions = document.createElement('div');
    actions.className = 'preview-action-bar';

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'small';
    toggleBtn.textContent = asset.hidden ? '表示する' : '隠す';
    toggleBtn.addEventListener('click', () => {
      this.persistAssetMeta(assetId, { hidden: !asset.hidden });
    });
    actions.appendChild(toggleBtn);

    const openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'small';
    openBtn.textContent = '別タブで開く';
    openBtn.addEventListener('click', () => {
      const w = window.open(asset.dataUrl, '_blank', 'noopener');
      if (w) w.focus();
    });
    actions.appendChild(openBtn);

    toolbar.appendChild(actions);
    card.appendChild(toolbar);

    const body = document.createElement('div');
    body.className = 'preview-image-card__body';

    const img = document.createElement('img');
    img.src = asset.dataUrl;
    img.alt = asset.name || '';
    img.style.width = `${asset.widthPercent || 60}%`;
    this.applyAlignmentToImage(img, asset.alignment);
>    if (asset.hidden) {
      img.style.opacity = '0.25';
    } else {
      img.style.opacity = asset.opacity !== undefined ? asset.opacity : 1.0;
    }
    img.style.filter = asset.filter || 'none';
    body.appendChild(img);

    const controls = document.createElement('div');
    controls.className = 'preview-image-options';

    const widthRange = document.createElement('input');
    widthRange.type = 'range';
    widthRange.min = '10';
    widthRange.max = '100';
    widthRange.step = '1';
    widthRange.value = String(asset.widthPercent || 60);

    const widthLabel = document.createElement('span');
    widthLabel.textContent = `幅: ${asset.widthPercent || 60}%`;

    widthRange.addEventListener('input', () => {
      const next = parseInt(widthRange.value, 10) || 60;
      widthLabel.textContent = `幅: ${next}%`;
      img.style.width = `${next}%`;
    });
    widthRange.addEventListener('change', () => {
      const next = parseInt(widthRange.value, 10) || 60;
      this.persistAssetMeta(assetId, { widthPercent: next });
    });

    const alignSelect = document.createElement('select');
    const alignOptions = [
      { value: 'auto', label: '自動' },
      { value: 'left', label: '左寄せ' },
      { value: 'center', label: '中央' },
      { value: 'right', label: '右寄せ' },
    ];
    alignOptions.forEach((opt) => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      alignSelect.appendChild(option);
    });
    alignSelect.value = asset.alignment || 'auto';
    alignSelect.addEventListener('change', () => {
      this.persistAssetMeta(assetId, { alignment: alignSelect.value });
    });

    controls.appendChild(widthRange);
    controls.appendChild(widthLabel);
    controls.appendChild(alignSelect);

    // プリセットセレクト
    const presetSelect = document.createElement('select');
    presetSelect.style.width = '100%';
    presetSelect.style.marginTop = '0.5rem';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'プリセットを選択';
    presetSelect.appendChild(defaultOption);
    Object.keys(this.imagePresets).forEach(key => {
      const preset = this.imagePresets[key];
      const option = document.createElement('option');
      option.value = key;
      option.textContent = `${preset.name} (${preset.description})`;
      presetSelect.appendChild(option);
    });
    presetSelect.addEventListener('change', () => {
      const presetKey = presetSelect.value;
      if (presetKey && this.imagePresets[presetKey]) {
        const preset = this.imagePresets[presetKey];
        // プリセット適用
        widthRange.value = preset.widthPercent;
        widthLabel.textContent = `幅: ${preset.widthPercent}%`;
        img.style.width = `${preset.widthPercent}%`;
        alignSelect.value = preset.alignment;
        img.style.opacity = preset.opacity;
        img.style.filter = preset.filter;
        this.persistAssetMeta(assetId, {
          widthPercent: preset.widthPercent,
          alignment: preset.alignment,
          opacity: preset.opacity,
          filter: preset.filter
        });
      }
    });
    controls.appendChild(presetSelect);

    // 不透明度コントロール
    const opacityRow = document.createElement('div');
    opacityRow.style.display = 'flex';
    opacityRow.style.alignItems = 'center';
    opacityRow.style.marginTop = '0.5rem';
    opacityRow.style.gap = '0.5rem';

    const opacityLabel = document.createElement('span');
    opacityLabel.textContent = '不透明度:';
    opacityLabel.style.fontSize = '0.85rem';

    const opacityRange = document.createElement('input');
    opacityRange.type = 'range';
    opacityRange.min = '0';
    opacityRange.max = '1';
    opacityRange.step = '0.1';
    opacityRange.value = asset.opacity !== undefined ? asset.opacity : 1.0;
    opacityRange.style.flex = '1';

    const opacityValue = document.createElement('span');
    opacityValue.textContent = `${Math.round((asset.opacity !== undefined ? asset.opacity : 1.0) * 100)}%`;
    opacityValue.style.fontSize = '0.85rem';
    opacityValue.style.minWidth = '3rem';
    opacityValue.style.textAlign = 'right';

    opacityRange.addEventListener('input', () => {
      const val = parseFloat(opacityRange.value);
      opacityValue.textContent = `${Math.round(val * 100)}%`;
      img.style.opacity = asset.hidden ? 0.25 : val;
    });
    opacityRange.addEventListener('change', () => {
      const val = parseFloat(opacityRange.value);
      this.persistAssetMeta(assetId, { opacity: val });
    });

    opacityRow.appendChild(opacityLabel);
    opacityRow.appendChild(opacityRange);
    opacityRow.appendChild(opacityValue);
    controls.appendChild(opacityRow);

    // フィルターコントロール
    const filterRow = document.createElement('div');
    filterRow.style.display = 'flex';
    filterRow.style.alignItems = 'center';
    filterRow.style.marginTop = '0.5rem';
    filterRow.style.gap = '0.5rem';

    const filterLabel = document.createElement('span');
    filterLabel.textContent = 'フィルター:';
    filterLabel.style.fontSize = '0.85rem';

    const filterSelect = document.createElement('select');
    filterSelect.style.flex = '1';
    const filterOptions = [
      { value: 'none', label: 'なし' },
      { value: 'blur', label: 'ぼかし' },
      { value: 'brightness', label: '明るさ' },
      { value: 'contrast', label: 'コントラスト' },
      { value: 'saturate', label: '彩度' }
    ];
    filterOptions.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      filterSelect.appendChild(option);
    });

    const filterValue = document.createElement('input');
    filterValue.type = 'number';
    filterValue.min = '0';
    filterValue.max = '5';
    filterValue.step = '0.1';
    filterValue.style.width = '4rem';
    filterValue.style.fontSize = '0.85rem';
    filterValue.value = '1.0';

    // 現在のフィルターを解析
    const currentFilter = asset.filter || 'none';
    if (currentFilter !== 'none') {
      const match = currentFilter.match(/(blur|brightness|contrast|saturate)\(([^)]+)\)/);
      if (match) {
        filterSelect.value = match[1];
        const val = parseFloat(match[2]);
        filterValue.value = isNaN(val) ? '1.0' : val.toString();
      }
    }

    const updateFilter = () => {
      const type = filterSelect.value;
      const val = parseFloat(filterValue.value) || 1.0;
      let filterStr = 'none';
      if (type !== 'none') {
        if (type === 'blur') {
          filterStr = `blur(${val}px)`;
        } else {
          filterStr = `${type}(${val})`;
        }
      }
      img.style.filter = filterStr;
      this.persistAssetMeta(assetId, { filter: filterStr });
    };

    filterSelect.addEventListener('change', updateFilter);
    filterValue.addEventListener('input', updateFilter);

    filterRow.appendChild(filterLabel);
    filterRow.appendChild(filterSelect);
    filterRow.appendChild(filterValue);
    controls.appendChild(filterRow);

    // 状態保存・復元
    const stateRow = document.createElement('div');
    stateRow.style.display = 'flex';
    stateRow.style.gap = '0.5rem';
    stateRow.style.marginTop = '0.5rem';

    const saveStateBtn = document.createElement('button');
    saveStateBtn.type = 'button';
    saveStateBtn.className = 'small';
    saveStateBtn.textContent = '状態保存';
    saveStateBtn.title = '現在の画像状態を保存';
    saveStateBtn.addEventListener('click', () => {
      const state = {
        widthPercent: asset.widthPercent || 60,
        alignment: asset.alignment || 'auto',
        offsetY: asset.offsetY || 0,
        opacity: asset.opacity !== undefined ? asset.opacity : 1.0,
        filter: asset.filter || 'none',
        hidden: asset.hidden || false
      };
      // ローカルストレージに保存
      const key = `zw_image_state_${assetId}`;
      try {
        localStorage.setItem(key, JSON.stringify(state));
        this.showNotification('画像状態を保存しました');
      } catch (e) {
        console.error('状態保存エラー:', e);
      }
    });

    const restoreStateBtn = document.createElement('button');
    restoreStateBtn.type = 'button';
    restoreStateBtn.className = 'small';
    restoreStateBtn.textContent = '状態復元';
    restoreStateBtn.title = '保存した画像状態を復元';
    restoreStateBtn.addEventListener('click', () => {
      const key = `zw_image_state_${assetId}`;
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          const state = JSON.parse(saved);
          this.persistAssetMeta(assetId, state);
          this.showNotification('画像状態を復元しました');
        } else {
          this.showNotification('保存された状態が見つかりません');
        }
      } catch (e) {
        console.error('状態復元エラー:', e);
      }
    });

    stateRow.appendChild(saveStateBtn);
    stateRow.appendChild(restoreStateBtn);
    controls.appendChild(stateRow);

    body.appendChild(controls);
    card.appendChild(body);

    const meta = document.createElement('div');
    meta.className = 'preview-image-meta';
    const typeLabel = asset.type || 'image';
    meta.innerHTML = `<span>ID: ${assetId}</span><span>${typeLabel}</span>`;
    card.appendChild(meta);

    if (asset.hidden) {
      const badge = document.createElement('div');
      badge.className = 'preview-warning';
      badge.style.padding = '0 0.75rem 0.75rem';
      badge.textContent =
        '非表示状態です。表示する場合は「表示する」をクリックしてください。';
      card.appendChild(badge);
    }

    return card;
  }

  scheduleOverlayRefresh() {
    if (this._overlayRenderFrame) {
      cancelAnimationFrame(this._overlayRenderFrame);
    }
    this._overlayRenderFrame = requestAnimationFrame(() => {
      this._overlayRenderFrame = null;
      if (!this._lastOverlayEntries || !this._lastOverlayEntries.length) {
        if (this.editorOverlay) this.editorOverlay.innerHTML = '';
        return;
      }
      this.renderOverlayImages(
        this._lastOverlayEntries,
        this.editor.value || '',
      );
    });
  }

  renderOverlayImages(entries, content) {
    if (!this.editorOverlay || !this.editorMirror) return;
    this.editorOverlay.innerHTML = '';
    if (!entries || !entries.length) return;

    this.editorMirror.innerHTML = this.buildMirrorHtml(content);
    const style = window.getComputedStyle(this.editor);
    const padding = {
      top: parseFloat(style.paddingTop) || 0,
      right: parseFloat(style.paddingRight) || 0,
      bottom: parseFloat(style.paddingBottom) || 0,
      left: parseFloat(style.paddingLeft) || 0,
    };
    const usableWidth = this.editor.clientWidth - padding.left - padding.right;

    entries.forEach((entry) => {
      const asset = entry.asset;
      if (!asset || !asset.dataUrl) return;
      const anchor = this.editorMirror.querySelector(
        `span[data-asset-id="${entry.assetId}"]`,
      );
      if (!anchor) return;

      const overlay = document.createElement('div');
      overlay.className = 'editor-overlay__image';
      overlay.dataset.assetId = entry.assetId;
      overlay.dataset.alignment = asset.alignment || 'auto';
      if (asset.hidden) overlay.classList.add('hidden');

      const widthPercent = Math.min(
        100,
        Math.max(10, asset.widthPercent || 60),
      );
      const widthPx = Math.max(
        40,
        Math.round(usableWidth * (widthPercent / 100)),
      );

      // 画像を左寄せに固定（エディタ拡大時の上書きを防ぐ）
      let left = padding.left;

      const top =
        anchor.offsetTop - this.editor.scrollTop + (asset.offsetY || 0);

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
      toggle.textContent = asset.hidden ? '👁' : '🙈';
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.persistAssetMeta(entry.assetId, { hidden: !asset.hidden });
      });
      overlay.appendChild(toggle);

      const handle = document.createElement('div');
      handle.className = 'overlay-handle';
      handle.textContent = '↔';
      overlay.appendChild(handle);

      this.attachOverlayInteractions({
        overlay,
        assetId: entry.assetId,
        handle,
      });

      this.editorOverlay.appendChild(overlay);
    });
  }

  attachOverlayInteractions({ overlay, assetId, handle }) {
    overlay.style.pointerEvents = 'auto';
    overlay.style.cursor = 'move';

    overlay.addEventListener('pointerdown', (event) => {
      if (
        event.target === handle ||
        event.target.classList.contains('overlay-toggle')
      ) {
        return;
      }
      if (overlay.classList.contains('hidden')) return;
      event.preventDefault();
      this.startOverlayDrag({ overlay, assetId, event });
    });

    handle.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.startOverlayResize({ overlay, assetId, event });
    });
  }

  startOverlayDrag({ overlay, assetId, event }) {
    const pointerId = event.pointerId;
    overlay.setPointerCapture(pointerId);
    const startY = event.clientY;
    const startTop = parseFloat(overlay.style.top) || 0;

    const move = (ev) => {
      const deltaY = ev.clientY - startY;
      overlay.style.top = `${startTop + deltaY}px`;
    };

    const up = (ev) => {
      overlay.removeEventListener('pointermove', move);
      overlay.removeEventListener('pointerup', up);
      try {
        overlay.releasePointerCapture(pointerId);
      } catch (_) {}
      const finalTop = parseFloat(overlay.style.top) || startTop;
      const delta = Math.round(finalTop - startTop);
      const asset = this.getAsset(assetId);
      const base =
        asset && typeof asset.offsetY === 'number' ? asset.offsetY : 0;
      this.persistAssetMeta(assetId, { offsetY: base + delta });
    };

    overlay.addEventListener('pointermove', move);
    overlay.addEventListener('pointerup', up);
  }

  startOverlayResize({ overlay, assetId, event }) {
    const pointerId = event.pointerId;
    overlay.setPointerCapture(pointerId);
    const startX = event.clientX;
    const startWidth = parseFloat(overlay.style.width) || 0;
    const style = window.getComputedStyle(this.editor);
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const paddingRight = parseFloat(style.paddingRight) || 0;
    const usableWidth = this.editor.clientWidth - paddingLeft - paddingRight;

    const move = (ev) => {
      const delta = ev.clientX - startX;
      const next = Math.max(40, startWidth + delta);
      overlay.style.width = `${next}px`;
    };

    const up = (ev) => {
      overlay.removeEventListener('pointermove', move);
      overlay.removeEventListener('pointerup', up);
      try {
        overlay.releasePointerCapture(pointerId);
      } catch (_) {}
      const finalWidth = parseFloat(overlay.style.width) || startWidth;
      const percent = Math.max(
        10,
        Math.min(100, Math.round((finalWidth / usableWidth) * 100)),
      );
      this.persistAssetMeta(assetId, { widthPercent: percent });
    };

    overlay.addEventListener('pointermove', move);
    overlay.addEventListener('pointerup', up);
  }

  buildMirrorHtml(content) {
    if (!content) return '';
    const regex = /!\[[^\]]*\]\(asset:\/\/([^\s)]+)\)/g;
    let lastIndex = 0;
    let html = '';
    let match;
    while ((match = regex.exec(content)) !== null) {
      const before = content.slice(lastIndex, match.index);
      html += this.escapeHtml(before).replace(/\n/g, '<br>');
      html += `<span class="mirror-asset" data-asset-id="${match[1]}">&#8203;</span>`;
      lastIndex = match.index + match[0].length;
    }
    html += this.escapeHtml(content.slice(lastIndex)).replace(/\n/g, '<br>');
    return html;
  }

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      '\'': '&#39;',
    };
    return (text || '').replace(/[&<>"']/g, (ch) => map[ch] || ch);
  }

  persistAssetMeta(assetId, patch) {
    if (
      !window.ZenWriterStorage ||
      typeof window.ZenWriterStorage.updateAssetMeta !== 'function'
    ) {
      return;
    }
    window.ZenWriterStorage.updateAssetMeta(assetId, patch || {});
    this.renderImagePreview();
  }

  getAsset(assetId) {
    if (
      !window.ZenWriterStorage ||
      typeof window.ZenWriterStorage.loadAssets !== 'function'
    )
      return null;
    const assets = window.ZenWriterStorage.loadAssets();
    return assets ? assets[assetId] : null;
  }

  applyAlignmentToImage(img, alignment) {
    if (!img) return;
    img.style.display = 'block';
    if (!alignment || alignment === 'auto') {
      img.style.margin = '';
      return;
    }
    if (alignment === 'left') {
      img.style.margin = '0 auto 0 0';
    } else if (alignment === 'center') {
      img.style.margin = '0 auto';
    } else if (alignment === 'right') {
      img.style.margin = '0 0 0 auto';
    }
  }

  updateStorageContentAfterMigration(content) {
    try {
      window.ZenWriterStorage.saveContent(content);
    } catch (_) {}
    try {
      if (
        window.ZenWriterStorage.getCurrentDocId &&
        window.ZenWriterStorage.updateDocumentContent
      ) {
        const currentId = window.ZenWriterStorage.getCurrentDocId();
        if (currentId) {
          window.ZenWriterStorage.updateDocumentContent(currentId, content);
        }
      }
    } catch (_) {}
  }

  /**
   * コンテンツをローカルストレージに保存
   */
  saveContent() {
    window.ZenWriterStorage.saveContent(this.editor.value);
  }

  maybeAutoSnapshot() {
    if (!window.ZenWriterStorage || !window.ZenWriterStorage.addSnapshot)
      return;
    const now = Date.now();
    const len = (this.editor.value || '').length;
    if (this._lastSnapTs === 0) {
      // 初回基準
      this._lastSnapTs = now;
      this._lastSnapLen = len;
      return;
    }
    const dt = now - this._lastSnapTs;
    const dlen = Math.abs(len - this._lastSnapLen);
    if (dt >= this.SNAPSHOT_MIN_INTERVAL && dlen >= this.SNAPSHOT_MIN_DELTA) {
      const s = window.ZenWriterStorage.loadSettings();
      const keep =
        s && s.snapshot && typeof s.snapshot.retention === 'number'
          ? Math.max(1, s.snapshot.retention)
          : 10;
      window.ZenWriterStorage.addSnapshot(this.editor.value, keep);
      this._lastSnapTs = now;
      this._lastSnapLen = len;
      if (typeof this.showNotification === 'function') {
        this.showNotification('自動バックアップを保存しました');
      }
    }
  }

  /**
   * ローカルストレージからコンテンツを読み込み
   */
  loadContent() {
    const savedContent = window.ZenWriterStorage.loadContent();
    const processed = this.convertLegacyImageEmbeds(savedContent || '');
    this.editor.value = processed || '';
    this.renderImagePreview();
  }

  /**
   * エディタ内容を置き換える（読み込み時など）
   * @param {string} text
   */
  setContent(text) {
    this.editor.value = text || '';
    this.saveContent();
    this.updateWordCount();
    this.renderImagePreview();
  }

  /**
   * 新しいドキュメントを作成
   */
  newDocument() {
    if (confirm('現在の内容を破棄して新規ドキュメントを作成しますか？')) {
      this.editor.value = '';
      this.saveContent();
      this.updateWordCount();
    }
  }

  /**
   * テキストとしてエクスポート
   */
  exportAsText() {
    const content = this.editor.value || ' ';
    const base = this.getCurrentDocBaseName();
    const filename = `${base}_${this.getFormattedDate()}.txt`;
    window.ZenWriterStorage.exportText(content, filename, 'text/plain');
  }

  /**
   * Markdownとしてエクスポート
   */
  exportAsMarkdown() {
    const content = this.editor.value || ' ';
    const base = this.getCurrentDocBaseName();
    const filename = `${base}_${this.getFormattedDate()}.md`;
    window.ZenWriterStorage.exportText(content, filename, 'text/markdown');
  }

  /**
   * 現在日時をフォーマット
   * @returns {string} フォーマットされた日時文字列 (YYYYMMDD_HHMMSS)
   */
  getFormattedDate() {
    const now = new Date();
    const pad = (num) => num.toString().padStart(2, '0');

    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());

    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  }

  /**
   * 現在選択中ドキュメントのファイル名ベースを取得（無効文字は置換）
   * @returns {string}
   */
  getCurrentDocBaseName() {
    try {
      if (!window.ZenWriterStorage || !window.ZenWriterStorage.getCurrentDocId)
        return 'zenwriter';
      const id = window.ZenWriterStorage.getCurrentDocId();
      const docs = window.ZenWriterStorage.loadDocuments
        ? window.ZenWriterStorage.loadDocuments() || []
        : [];
      const doc = docs.find((d) => d && d.id === id);
      const name = doc && doc.name ? String(doc.name) : 'zenwriter';
      return this.sanitizeForFilename(name.trim() || 'zenwriter');
    } catch (_) {
      return 'zenwriter';
    }
  }

  /**
   * ファイル名に使えない文字を安全なものに置換
   * @param {string} s
   * @returns {string}
   */
  sanitizeForFilename(s) {
    // Windows禁止文字 \ / : * ? " < > | と制御文字を置換し、連続空白を圧縮
    return (
      s
        .replace(/[\\/:*?"<>|]/g, '_')
        .replace(/[\x00-\x1F\x7F]/g, '_')
        .replace(/\s+/g, ' ')
        .slice(0, 60) || // 長すぎる名前を抑制
      'zenwriter'
    );
  }

  /**
   * 文字数を更新
   */
  updateWordCount() {
    const text = this.editor.value;
    const charCount = text ? text.replace(/\r?\n/g, '').length : 0;
    const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    // 執筆目標の進捗（任意）
    const s = window.ZenWriterStorage.loadSettings();
    const goal = (s && s.goal) || {};
    let suffix = '';
    if (goal && (parseInt(goal.target, 10) || 0) > 0) {
      const target = Math.max(0, parseInt(goal.target, 10) || 0);
      const ratio = target > 0 ? Math.min(1, charCount / target) : 0;
      const pct = Math.floor(ratio * 100);
      suffix += ` | 目標 ${target} (${pct}%)`;
      // 進捗バーの表示と更新
      if (this.goalProgressEl && this.goalProgressBarEl) {
        this.goalProgressEl.style.display = 'inline-flex';
        this.goalProgressEl.setAttribute('aria-hidden', 'false');
        const w = Math.max(0, Math.min(100, pct));
        this.goalProgressBarEl.style.width = `${w}%`;
      }
      // 締切日がある場合は残日数を併記
      if (goal.deadline) {
        const today = new Date();
        const dl = new Date(`${goal.deadline}T00:00:00`);
        const msPerDay = 24 * 60 * 60 * 1000;
        const days = Math.ceil((dl - today) / msPerDay);
        if (!isNaN(days)) {
          if (days >= 0) suffix += ` | 残り${days}日`;
          else suffix += ` | 期限超過${Math.abs(days)}日`;
        }
      }
      // 目標達成時の通知（初回のみ）
      if (charCount >= target) {
        if (!this._goalReachedNotified) {
          this._goalReachedNotified = true;
          if (typeof this.showNotification === 'function') {
            this.showNotification('目標達成！お疲れさまです 🎉');
          }
          if (
            window.ZenWriterHUD &&
            typeof window.ZenWriterHUD.publish === 'function'
          ) {
            window.ZenWriterHUD.publish('目標達成！', 1500);
          }
        }
      } else {
        // 目標未達に戻った場合はフラグをリセット
        this._goalReachedNotified = false;
      }
    } else {
      // 目標未設定時はフラグをリセット
      this._goalReachedNotified = false;
      // 進捗バーを隠す
      if (this.goalProgressEl) {
        this.goalProgressEl.style.display = 'none';
        this.goalProgressEl.setAttribute('aria-hidden', 'true');
      }
    }

    this.wordCountElement.textContent = `${charCount} 文字 / ${wordCount} 語${suffix}`;
    // ミニHUDに一時表示（ツールバー非表示時のみ）
    if (window.ZenWriterHUD) {
      const toolbarHidden =
        document.body.classList.contains('toolbar-hidden') ||
        document.documentElement.getAttribute('data-toolbar-hidden') === 'true';
      if (toolbarHidden && typeof window.ZenWriterHUD.publish === 'function') {
        // HUD 設定の既定時間に従う（durationを渡さない）
        window.ZenWriterHUD.publish(`${charCount} 文字 / ${wordCount} 語`);
      } else if (
        !toolbarHidden &&
        typeof window.ZenWriterHUD.hide === 'function'
      ) {
        window.ZenWriterHUD.hide();
      }
    }
  }

  /**
   * 通知を表示
   * @param {string} message - 表示するメッセージ
   * @param {number} duration - 表示時間 (ミリ秒)
   */
  showNotification(message, duration = 2000) {
    // 既存の通知を削除
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    // 通知要素を作成
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

    // スタイルを適用
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '4px';
    notification.style.zIndex = '1000';
    notification.style.transition = 'opacity 0.3s';

    // ドキュメントに追加
    document.body.appendChild(notification);

    // アニメーション用に少し遅らせる
    setTimeout(() => {
      notification.style.opacity = '1';
    }, 10);

    // 指定時間後に削除
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, duration);
  }

  /**
   * 現在の設定に対してフォントサイズを増減
   * @param {number} delta 正または負の増分
   */
  adjustGlobalFontSize(delta) {
    const settings = window.ZenWriterStorage.loadSettings();
    const next = this.clampFontSize((settings.fontSize || 16) + delta);
    this.setGlobalFontSize(next);
  }

  /**
   * フォントサイズを指定値に設定し、関連UIを同期
   * @param {number} sizePx
   */
  setGlobalFontSize(sizePx) {
    const settings = window.ZenWriterStorage.loadSettings();
    const next = this.clampFontSize(sizePx);
    window.ZenWriterTheme.applyFontSettings(
      settings.fontFamily,
      next,
      settings.lineHeight,
    );
    // UI同期（存在する場合）
    const sidebarRange = document.getElementById('font-size');
    const sidebarValue = document.getElementById('font-size-value');
    if (sidebarRange) sidebarRange.value = next;
    if (sidebarValue) sidebarValue.textContent = next;
    const panelRange = document.getElementById('global-font-size');
    const panelNumber = document.getElementById('global-font-size-number');
    if (panelRange) panelRange.value = next;
    if (panelNumber) panelNumber.value = next;
  }

  clampFontSize(px) {
    return Math.min(48, Math.max(12, Math.round(px)));
  }

  /**
   * 検索パネルを表示/非表示
   */
  toggleSearchPanel() {
    const panel = document.getElementById('search-panel');
    if (!panel) return;
    const isVisible = panel.style.display !== 'none';
    if (isVisible) {
      this.hideSearchPanel();
    } else {
      this.showSearchPanel();
    }
  }

  showSearchPanel() {
    const panel = document.getElementById('search-panel');
    if (!panel) return;
    panel.style.display = 'block';
    const input = document.getElementById('search-input');
    if (input) {
      input.focus();
      // 選択範囲があればそれを検索語に
      const selected = this.editor.value.substring(
        this.editor.selectionStart,
        this.editor.selectionEnd,
      );
      if (selected) {
        input.value = selected;
      }
    }
    this.updateSearchMatches();
  }

  hideSearchPanel() {
    const panel = document.getElementById('search-panel');
    if (panel) {
      panel.style.display = 'none';
    }
    this.clearSearchHighlights();
  }

  /**
   * 検索条件に基づいてマッチを取得
   */
  getSearchRegex() {
    const input = document.getElementById('search-input');
    const caseSensitive = document.getElementById(
      'search-case-sensitive',
    )?.checked;
    const useRegex = document.getElementById('search-regex')?.checked;
    const query = input?.value || '';

    if (!query) return null;

    let flags = 'g';
    if (!caseSensitive) flags += 'i';

    try {
      return useRegex
        ? new RegExp(query, flags)
        : new RegExp(this.escapeRegex(query), flags);
    } catch (e) {
      return null;
    }
  }

  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * マッチを検索してハイライト
   */
  updateSearchMatches() {
    this.clearSearchHighlights();
    const regex = this.getSearchRegex();
    if (!regex) {
      this.updateMatchCount(0);
      return;
    }

    const text = this.editor.value;
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
      });
    }

    this.currentMatches = matches;
    this.currentMatchIndex = -1;
    this.updateMatchCount(matches.length);
    this.highlightMatches(matches);
  }

  /**
   * マッチ数を更新
   */
  updateMatchCount(count) {
    const countEl = document.getElementById('match-count');
    if (countEl) {
      if (count === 0) {
        countEl.textContent = '一致するテキストが見つかりません';
      } else {
        countEl.textContent = `${count} 件一致しました`;
      }
    }
  }

  /**
   * マッチをハイライト
   */
  highlightMatches(matches) {
    const overlay = this.editorOverlay;
    if (!overlay) return;

    matches.forEach((match, index) => {
      const highlight = document.createElement('div');
      highlight.className = 'search-highlight';
      highlight.dataset.matchIndex = index;

      const rect = this.getTextPosition(match.start, match.end);
      if (rect) {
        highlight.style.left = rect.left + 'px';
        highlight.style.top = rect.top + 'px';
        highlight.style.width = rect.width + 'px';
        highlight.style.height = rect.height + 'px';
        overlay.appendChild(highlight);
      }
    });
  }

  /**
   * テキスト位置を取得
   */
  getTextPosition(start, end) {
    const mirror = this.editorMirror;
    if (!mirror) return null;

    const text = this.editor.value;
    const before = text.substring(0, start);
    const match = text.substring(start, end);
    const after = text.substring(end);

    mirror.innerHTML =
      this.escapeHtml(before) +
      '<span class="search-match">' +
      this.escapeHtml(match) +
      '</span>' +
      this.escapeHtml(after);
    mirror.innerHTML = mirror.innerHTML.replace(/\n/g, '<br>');

    const matchEl = mirror.querySelector('.search-match');
    if (matchEl) {
      const rect = matchEl.getBoundingClientRect();
      const editorRect = this.editor.getBoundingClientRect();
      return {
        left: rect.left - editorRect.left,
        top: rect.top - editorRect.top,
        width: rect.width,
        height: rect.height,
      };
    }
    return null;
  }

  /**
   * ハイライトをクリア
   */
  clearSearchHighlights() {
    const highlights =
      this.editorOverlay?.querySelectorAll('.search-highlight');
    if (highlights) {
      highlights.forEach((h) => h.remove());
    }
  }

  /**
   * 次/前のマッチに移動
   */
  navigateMatch(direction) {
    if (!this.currentMatches || this.currentMatches.length === 0) return;

    if (direction > 0) {
      this.currentMatchIndex =
        (this.currentMatchIndex + 1) % this.currentMatches.length;
    } else {
      this.currentMatchIndex =
        this.currentMatchIndex <= 0
          ? this.currentMatches.length - 1
          : this.currentMatchIndex - 1;
    }

    const match = this.currentMatches[this.currentMatchIndex];
    this.selectMatch(match);
  }

  /**
   * マッチを選択
   */
  selectMatch(match) {
    this.editor.selectionStart = match.start;
    this.editor.selectionEnd = match.end;
    this.editor.focus();
    this.scrollToMatch(match);
  }

  /**
   * マッチにスクロール
   */
  scrollToMatch(match) {
    // 簡易的なスクロール実装
    const lineHeight =
      parseFloat(getComputedStyle(this.editor).lineHeight) || 20;
    const lines =
      this.editor.value.substring(0, match.start).split('\n').length - 1;
    const y = lines * lineHeight;
    this.editor.scrollTop = Math.max(0, y - this.editor.clientHeight / 2);
  }

  /**
   * 単一置換
   */
  replaceSingle() {
    const replaceInput = document.getElementById('replace-input');
    const replaceText = replaceInput?.value || '';

    if (!this.currentMatches || this.currentMatchIndex < 0) return;

    const match = this.currentMatches[this.currentMatchIndex];
    const before = this.editor.value.substring(0, match.start);
    const after = this.editor.value.substring(match.end);

    this.editor.value = before + replaceText + after;
    this.saveContent();
    this.updateWordCount();

    // マッチ位置を調整
    const newEnd = match.start + replaceText.length;
    this.currentMatches.splice(this.currentMatchIndex, 1);

    // 残りのマッチ位置を調整
    for (let i = this.currentMatchIndex; i < this.currentMatches.length; i++) {
      this.currentMatches[i].start += replaceText.length - match.text.length;
      this.currentMatches[i].end += replaceText.length - match.text.length;
    }

    if (this.currentMatches.length === 0) {
      this.currentMatchIndex = -1;
    } else {
      this.currentMatchIndex = Math.min(
        this.currentMatchIndex,
        this.currentMatches.length - 1,
      );
    }

    this.updateMatchCount(this.currentMatches.length);
    this.updateSearchMatches();

    // エディタの選択を更新
    if (this.currentMatchIndex >= 0) {
      const newMatch = this.currentMatches[this.currentMatchIndex];
      this.selectMatch(newMatch);
    }
  }

  /**
   * すべて置換
   */
  replaceAll() {
    const replaceInput = document.getElementById('replace-input');
    const replaceText = replaceInput?.value || '';
    const regex = this.getSearchRegex();

    if (!regex || !this.currentMatches) return;

    let result = this.editor.value;
    let offset = 0;

    this.currentMatches.forEach((match) => {
      const before = result.substring(0, match.start + offset);
      const after = result.substring(match.end + offset);
      result = before + replaceText + after;
      offset += replaceText.length - match.text.length;
    });

    this.editor.value = result;
    this.saveContent();
    this.updateWordCount();
    this.updateSearchMatches();
    this.showNotification('すべて置換しました');
  }
}

/**
 * タイプライターモード: カーソルを一定高さに維持するスクロール
 * @param {('init'|'input'|'newline'|'nav'|'click')} trigger
 */
EditorManager.prototype.maybeTypewriterScroll = function (trigger) {
  try {
    const s = window.ZenWriterStorage.loadSettings();
    const cfg = s && s.typewriter ? s.typewriter : null;
    if (!cfg || !cfg.enabled) return;
    const editor = this.editor;
    if (!editor) return;
    // 精度向上: mirrorベースでキャレットYを取得（失敗時は従来推定にフォールバック）
    let caretY = this.getCaretTopViaMirror();
    if (typeof caretY !== 'number' || isNaN(caretY)) {
      const line = this.getCaretLineIndex();
      const lh = this.getComputedLineHeight();
      caretY = line * lh;
    }
    const anchorRatio = Math.min(0.95, Math.max(0.05, cfg.anchorRatio || 0.5));
    const viewport = editor.clientHeight;
    const targetAnchorY = anchorRatio * viewport;
    let targetScroll = caretY - targetAnchorY;
    const maxScroll = Math.max(0, editor.scrollHeight - viewport);
    targetScroll = Math.max(0, Math.min(maxScroll, targetScroll));

    const stick = Math.min(1, Math.max(0, cfg.stickiness ?? 0.9));
    const base = trigger === 'newline' ? stick : Math.max(0.2, stick * 0.7);

    const animate = () => {
      const cur = editor.scrollTop;
      const diff = targetScroll - cur;
      if (Math.abs(diff) < 0.5) {
        editor.scrollTop = targetScroll;
        this._typewriterRaf = null;
        return;
      }
      editor.scrollTop = cur + diff * base;
      this._typewriterRaf = requestAnimationFrame(animate);
    };

    if (this._typewriterRaf) cancelAnimationFrame(this._typewriterRaf);
    this._typewriterRaf = requestAnimationFrame(animate);
  } catch (_) {}
};

EditorManager.prototype.getComputedLineHeight = function () {
  const lh = parseFloat(getComputedStyle(this.editor).lineHeight);
  if (!isNaN(lh) && lh > 0) return lh;
  return 20;
};

EditorManager.prototype.getCaretLineIndex = function () {
  try {
    const pos = this.editor.selectionStart || 0;
    const text = this.editor.value || '';
    let lines = 0;
    for (let i = 0; i < pos; i += 1) {
      if (text.charCodeAt(i) === 10) lines += 1; // '\n'
    }
    return lines;
  } catch (_) {
    return 0;
  }
};

// ミラーを用いて実測のキャレットY座標（内容先頭からのpx）を取得
EditorManager.prototype.getCaretTopViaMirror = function () {
  try {
    const ed = this.editor;
    if (!ed) return NaN;
    const style = window.getComputedStyle(ed);
    // ミラー要素を生成
    const mirror = document.createElement('div');
    mirror.style.position = 'absolute';
    mirror.style.visibility = 'hidden';
    mirror.style.whiteSpace = 'pre-wrap';
    mirror.style.wordWrap = 'break-word';
    mirror.style.overflowWrap = 'break-word';
    mirror.style.boxSizing = style.boxSizing || 'border-box';
    mirror.style.fontFamily = style.fontFamily;
    mirror.style.fontSize = style.fontSize;
    mirror.style.lineHeight = style.lineHeight;
    mirror.style.letterSpacing = style.letterSpacing;
    mirror.style.paddingTop = style.paddingTop;
    mirror.style.paddingRight = style.paddingRight;
    mirror.style.paddingBottom = style.paddingBottom;
    mirror.style.paddingLeft = style.paddingLeft;
    mirror.style.border = style.border;
    mirror.style.width = ed.clientWidth + 'px';
    mirror.style.left = '-9999px';
    mirror.style.top = '0';

    const before = (ed.value || '').slice(0, ed.selectionStart || 0);
    const after = (ed.value || '').slice(ed.selectionStart || 0);
    // テキストノード + アンカー
    const textBefore = document.createTextNode(before);
    const anchor = document.createElement('span');
    anchor.textContent = '\u200b'; // zero-width
    const textAfter = document.createTextNode(after);
    mirror.appendChild(textBefore);
    mirror.appendChild(anchor);
    mirror.appendChild(textAfter);
    document.body.appendChild(mirror);
    // アンカーのtop（padding含む）を取得
    const rect = anchor.getBoundingClientRect();
    const baseRect = mirror.getBoundingClientRect();
    const top = rect.top - baseRect.top; // mirror内の相対位置
    document.body.removeChild(mirror);
    return Math.max(0, top);
  } catch (_) {
    return NaN;
  }
};

// Markdownショートカット適用
EditorManager.prototype.applyMarkdownShortcut = function (kind) {
  try {
    const ed = this.editor;
    const start = ed.selectionStart;
    const end = ed.selectionEnd;
    const val = ed.value || '';
    const sel = val.slice(start, end);
    let prefix = '';
    let suffix = '';
    if (kind === 'bold') {
      prefix = '**';
      suffix = '**';
    } else if (kind === 'italic') {
      prefix = '*';
      suffix = '*';
    } else if (kind === 'link') {
      prefix = '[';
      suffix = '](url)';
    }
    const before = val.slice(0, start);
    const after = val.slice(end);
    ed.value = before + prefix + sel + suffix + after;
    // キャレット位置を選択テキスト末尾（リンクはurl内を選択）へ
    if (kind === 'link') {
      const urlStart = before.length + prefix.length + sel.length + 2; // ](
      const urlEnd = urlStart + 3; // 'url'
      ed.selectionStart = urlStart;
      ed.selectionEnd = urlEnd;
    } else {
      const newPos = before.length + prefix.length + sel.length + suffix.length;
      ed.selectionStart = newPos;
      ed.selectionEnd = newPos;
    }
    ed.focus();
    this.saveContent();
    this.updateWordCount();
  } catch (_) {}
};

// スクロール同期設定
EditorManager.prototype.setSyncScroll = function (enabled) {
  this._syncScrollEnabled = !!enabled;
  this.renderImagePreview(); // プレビューを更新
};

// エディタスクロール時の同期処理
EditorManager.prototype.onEditorScroll = function () {
  if (!this._syncScrollEnabled || !this.previewPanelBody) return;
  const editor = this.editor;
  if (!editor) return;
  const scrollRatio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
  const preview = this.previewPanelBody;
  const targetScroll = scrollRatio * (preview.scrollHeight - preview.clientHeight);
  preview.scrollTop = targetScroll;
};

// 画像プリセット定義（VNスタイル）
EditorManager.prototype.imagePresets = {
  'vn-portrait': {
    name: 'VN肖像',
    widthPercent: 30,
    alignment: 'center',
    opacity: 1.0,
    filter: 'none',
    description: 'キャラクター肖像用'
  },
  'vn-background': {
    name: 'VN背景',
    widthPercent: 100,
    alignment: 'center',
    opacity: 0.8,
    filter: 'blur(1px)',
    description: '背景画像用'
  },
  'vn-illustration': {
    name: 'VN挿絵',
    widthPercent: 70,
    alignment: 'center',
    opacity: 1.0,
    filter: 'none',
    description: '本文挿絵用'
  },
  'vn-textbox': {
    name: 'VNテキストボックス',
    widthPercent: 80,
    alignment: 'center',
    opacity: 0.9,
    filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
    description: 'テキストボックス用'
  }
};
