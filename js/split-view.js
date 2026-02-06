// 分割ビュー管理クラス
(function () {
  'use strict';

  /**
   * SplitViewManager - 分割ビュー機能を管理
   * 編集/プレビュー、章間比較、スナップショット差分の3つのモードをサポート
   */
  class SplitViewManager {
    constructor() {
      this.container = null;
      this.leftPanel = null;
      this.rightPanel = null;
      this.resizeHandle = null;
      this.mode = 'none'; // 'none' | 'edit-preview' | 'chapter-compare' | 'snapshot-diff'
      this.isResizing = false;
      this.splitRatio = 0.5; // デフォルトは50:50
      this.editorManager = window.ZenWriterEditor;
      this.storage = window.ZenWriterStorage;
      
      // 章間比較用の状態
      this.chapterCompareState = {
        leftChapter: null,
        rightChapter: null
      };
      
      // スナップショット差分用の状態
      this.snapshotDiffState = {
        leftSnapshot: null,
        rightSnapshot: null
      };

      this.init();
    }

    /**
     * 初期化
     */
    init() {
      // DOM要素の取得
      this.container = document.getElementById('split-view-container');
      if (!this.container) {
        // コンテナが存在しない場合は作成
        this.createContainer();
      }
      
      this.leftPanel = document.getElementById('split-view-left');
      this.rightPanel = document.getElementById('split-view-right');
      this.resizeHandle = document.getElementById('split-view-resize-handle');

      // イベントリスナーの設定
      this.setupEventListeners();
      
      // 初期状態は非表示
      this.hide();
    }

    /**
     * 分割ビューコンテナを作成（HTMLに存在しない場合のフォールバック）
     */
    createContainer() {
      const editorContainer = document.querySelector('.editor-container');
      if (!editorContainer) return;

      const container = document.createElement('div');
      container.id = 'split-view-container';
      container.className = 'split-view-container';
      container.style.display = 'none';

      const left = document.createElement('div');
      left.id = 'split-view-left';
      left.className = 'split-view-panel split-view-panel--left';

      const resizeHandle = document.createElement('div');
      resizeHandle.id = 'split-view-resize-handle';
      resizeHandle.className = 'split-view-resize-handle';
      resizeHandle.setAttribute('role', 'separator');
      resizeHandle.setAttribute('aria-label', 'リサイズハンドル');
      resizeHandle.setAttribute('aria-orientation', 'vertical');

      const right = document.createElement('div');
      right.id = 'split-view-right';
      right.className = 'split-view-panel split-view-panel--right';

      container.appendChild(left);
      container.appendChild(resizeHandle);
      container.appendChild(right);

      // エディタコンテナの前に挿入
      editorContainer.parentNode.insertBefore(container, editorContainer);

      this.container = container;
      this.leftPanel = left;
      this.rightPanel = right;
      this.resizeHandle = resizeHandle;
    }

    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
      if (!this.resizeHandle) return;

      // リサイズ開始
      this.resizeHandle.addEventListener('mousedown', (e) => {
        this.startResize(e);
      });

      // リサイズ中
      document.addEventListener('mousemove', (e) => {
        if (this.isResizing) {
          this.handleResize(e);
        }
      });

      // リサイズ終了
      document.addEventListener('mouseup', () => {
        if (this.isResizing) {
          this.endResize();
        }
      });

      // タッチイベント（モバイル対応）
      this.resizeHandle.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.startResize(e.touches[0]);
      });

      document.addEventListener('touchmove', (e) => {
        if (this.isResizing) {
          e.preventDefault();
          this.handleResize(e.touches[0]);
        }
      });

      document.addEventListener('touchend', () => {
        if (this.isResizing) {
          this.endResize();
        }
      });
    }

    /**
     * リサイズ開始
     */
    startResize(_e) {
      this.isResizing = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    /**
     * リサイズ処理
     */
    handleResize(e) {
      if (!this.container || !this.isResizing) return;

      const rect = this.container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = Math.max(0.2, Math.min(0.8, x / rect.width));
      
      this.splitRatio = ratio;
      this.updateLayout();
    }

    /**
     * リサイズ終了
     */
    endResize() {
      this.isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    /**
     * レイアウトを更新
     */
    updateLayout() {
      if (!this.leftPanel || !this.rightPanel) return;

      const leftPercent = (this.splitRatio * 100).toFixed(2);
      const rightPercent = ((1 - this.splitRatio) * 100).toFixed(2);

      this.leftPanel.style.width = `${leftPercent}%`;
      this.rightPanel.style.width = `${rightPercent}%`;
    }

    /**
     * 編集/プレビューモードを有効化
     */
    showEditPreview() {
      this.mode = 'edit-preview';
      this.show();
      this.renderEditPreview();
    }

    /**
     * 編集/プレビューをレンダリング
     */
    renderEditPreview() {
      if (!this.leftPanel || !this.rightPanel) return;

      // 左パネル: エディタ（実際のエディタを移動）
      this.leftPanel.innerHTML = '';
      const editorWrapper = document.createElement('div');
      editorWrapper.className = 'split-view-editor-wrapper';
      const editor = document.getElementById('editor');
      if (editor && editor.parentNode) {
        // エディタを左パネルに移動
        editorWrapper.appendChild(editor);
      }
      this.leftPanel.appendChild(editorWrapper);

      // 右パネル: プレビュー（実際のプレビューパネルを移動）
      this.rightPanel.innerHTML = '';
      const previewWrapper = document.createElement('div');
      previewWrapper.className = 'split-view-preview-wrapper';
      const previewPanel = document.getElementById('markdown-preview-panel');
      if (previewPanel && previewPanel.parentNode) {
        // プレビューパネルを右パネルに移動
        previewWrapper.appendChild(previewPanel);
      }
      this.rightPanel.appendChild(previewWrapper);

      // プレビューを更新
      if (this.editorManager && typeof this.editorManager.renderMarkdownPreview === 'function') {
        this.editorManager.renderMarkdownPreview();
      }

      this.updateLayout();
    }

    /**
     * 章間比較モードを有効化
     */
    showChapterCompare() {
      this.mode = 'chapter-compare';
      this.show();
      this.renderChapterCompare();
    }

    /**
     * 章間比較をレンダリング
     */
    renderChapterCompare() {
      if (!this.leftPanel || !this.rightPanel || !this.editorManager) return;

      const content = this.editorManager.editor ? this.editorManager.editor.value : '';
      const chapters = this.extractChapters(content);

      if (chapters.length < 2) {
        this.showError('章間比較には2つ以上の章が必要です。');
        this.hide();
        return;
      }

      // 章選択UI
      this.renderChapterSelectors(chapters);
    }

    /**
     * 章を抽出
     * @param {string} content - テキストコンテンツ
     * @returns {Array} 章の配列 [{ title, content, start, end }]
     */
    extractChapters(content) {
      const chapters = [];
      const lines = content.split('\n');
      let currentChapter = null;
      let currentContent = [];
      let currentStart = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Markdown見出し（# で始まる行）を検出
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        
        if (headingMatch) {
          // 前の章を保存
          if (currentChapter) {
            chapters.push({
              title: currentChapter.title,
              content: currentContent.join('\n'),
              start: currentStart,
              end: i - 1,
              level: currentChapter.level
            });
          }

          // 新しい章を開始
          currentChapter = {
            title: headingMatch[2].trim(),
            level: headingMatch[1].length
          };
          currentContent = [line];
          currentStart = i;
        } else if (currentChapter) {
          currentContent.push(line);
        }
      }

      // 最後の章を保存
      if (currentChapter) {
        chapters.push({
          title: currentChapter.title,
          content: currentContent.join('\n'),
          start: currentStart,
          end: lines.length - 1,
          level: currentChapter.level
        });
      }

      return chapters;
    }

    /**
     * 章選択UIをレンダリング
     */
    renderChapterSelectors(chapters) {
      if (!this.leftPanel || !this.rightPanel) return;

      // 左パネル: 章選択と表示
      this.leftPanel.innerHTML = '';
      const leftSelect = document.createElement('select');
      leftSelect.className = 'split-view-chapter-select';
      leftSelect.innerHTML = '<option value="">章を選択...</option>';
      chapters.forEach((ch, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = `${ch.title} (${ch.level}レベル)`;
        leftSelect.appendChild(opt);
      });
      leftSelect.addEventListener('change', (e) => {
        const idx = parseInt(e.target.value, 10);
        if (!isNaN(idx) && chapters[idx]) {
          this.chapterCompareState.leftChapter = chapters[idx];
          this.renderChapterContent('left', chapters[idx]);
        }
      });
      this.leftPanel.appendChild(leftSelect);

      const leftContent = document.createElement('div');
      leftContent.className = 'split-view-chapter-content';
      leftContent.id = 'split-view-left-content';
      this.leftPanel.appendChild(leftContent);

      // 右パネル: 章選択と表示
      this.rightPanel.innerHTML = '';
      const rightSelect = document.createElement('select');
      rightSelect.className = 'split-view-chapter-select';
      rightSelect.innerHTML = '<option value="">章を選択...</option>';
      chapters.forEach((ch, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = `${ch.title} (${ch.level}レベル)`;
        rightSelect.appendChild(opt);
      });
      rightSelect.addEventListener('change', (e) => {
        const idx = parseInt(e.target.value, 10);
        if (!isNaN(idx) && chapters[idx]) {
          this.chapterCompareState.rightChapter = chapters[idx];
          this.renderChapterContent('right', chapters[idx]);
        }
      });
      this.rightPanel.appendChild(rightSelect);

      const rightContent = document.createElement('div');
      rightContent.className = 'split-view-chapter-content';
      rightContent.id = 'split-view-right-content';
      this.rightPanel.appendChild(rightContent);

      this.updateLayout();
    }

    /**
     * 章の内容をレンダリング
     */
    renderChapterContent(side, chapter) {
      const contentId = `split-view-${side}-content`;
      const contentEl = document.getElementById(contentId);
      if (!contentEl || !chapter) return;

      // MarkdownをHTMLに変換
      let html = '';
      if (window.markdownit && this.editorManager && this.editorManager._markdownRenderer) {
        html = this.editorManager._markdownRenderer.render(chapter.content);
      } else {
        // フォールバック: エスケープして改行を<br>に変換
        html = chapter.content
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>');
      }

      contentEl.innerHTML = html;
    }

    /**
     * スナップショット差分モードを有効化
     */
    showSnapshotDiff() {
      this.mode = 'snapshot-diff';
      this.show();
      this.renderSnapshotDiff();
    }

    /**
     * スナップショット差分をレンダリング
     */
    renderSnapshotDiff() {
      if (!this.leftPanel || !this.rightPanel || !this.storage) return;

      const snapshots = this.storage.loadSnapshots ? this.storage.loadSnapshots() : [];
      
      if (snapshots.length < 2) {
        this.showError('スナップショット差分には2つ以上のスナップショットが必要です。');
        this.hide();
        return;
      }

      // スナップショット選択UI
      this.renderSnapshotSelectors(snapshots);
    }

    /**
     * スナップショット選択UIをレンダリング
     */
    renderSnapshotSelectors(snapshots) {
      if (!this.leftPanel || !this.rightPanel) return;

      // 左パネル: スナップショット選択と表示
      this.leftPanel.innerHTML = '';
      const leftSelect = document.createElement('select');
      leftSelect.className = 'split-view-snapshot-select';
      leftSelect.innerHTML = '<option value="">スナップショットを選択...</option>';
      snapshots.forEach((snap, idx) => {
        const opt = document.createElement('option');
        const date = new Date(snap.ts);
        opt.value = idx;
        opt.textContent = `${date.toLocaleString('ja-JP')} (${snap.len}文字)`;
        leftSelect.appendChild(opt);
      });
      leftSelect.addEventListener('change', (e) => {
        const idx = parseInt(e.target.value, 10);
        if (!isNaN(idx) && snapshots[idx]) {
          this.snapshotDiffState.leftSnapshot = snapshots[idx];
          this.renderSnapshotContent('left', snapshots[idx]);
          this.updateDiff();
        }
      });
      this.leftPanel.appendChild(leftSelect);

      const leftContent = document.createElement('div');
      leftContent.className = 'split-view-snapshot-content';
      leftContent.id = 'split-view-left-snapshot';
      this.leftPanel.appendChild(leftContent);

      // 右パネル: スナップショット選択と表示
      this.rightPanel.innerHTML = '';
      const rightSelect = document.createElement('select');
      rightSelect.className = 'split-view-chapter-select';
      rightSelect.innerHTML = '<option value="">章を選択...</option>';
      snapshots.forEach((snap, idx) => {
        const opt = document.createElement('option');
        const date = new Date(snap.ts);
        opt.value = idx;
        opt.textContent = `${date.toLocaleString('ja-JP')} (${snap.len}文字)`;
        rightSelect.appendChild(opt);
      });
      rightSelect.addEventListener('change', (e) => {
        const idx = parseInt(e.target.value, 10);
        if (!isNaN(idx) && snapshots[idx]) {
          this.snapshotDiffState.rightSnapshot = snapshots[idx];
          this.renderSnapshotContent('right', snapshots[idx]);
          this.updateDiff();
        }
      });
      this.rightPanel.appendChild(rightSelect);

      const rightContent = document.createElement('div');
      rightContent.className = 'split-view-snapshot-content';
      rightContent.id = 'split-view-right-snapshot';
      this.rightPanel.appendChild(rightContent);

      this.updateLayout();
    }

    /**
     * スナップショットの内容をレンダリング
     */
    renderSnapshotContent(side, snapshot) {
      const contentId = `split-view-${side}-snapshot`;
      const contentEl = document.getElementById(contentId);
      if (!contentEl || !snapshot) return;

      // MarkdownをHTMLに変換
      let html = '';
      if (window.markdownit && this.editorManager && this.editorManager._markdownRenderer) {
        html = this.editorManager._markdownRenderer.render(snapshot.content);
      } else {
        // フォールバック: エスケープして改行を<br>に変換
        html = snapshot.content
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>');
      }

      contentEl.innerHTML = html;
    }

    /**
     * 差分を更新
     */
    updateDiff() {
      const left = this.snapshotDiffState.leftSnapshot;
      const right = this.snapshotDiffState.rightSnapshot;

      if (!left || !right) return;

      // 簡易的な差分表示（段落単位）
      const leftParagraphs = left.content.split(/\n{2,}/);
      const rightParagraphs = right.content.split(/\n{2,}/);

      // 差分を計算してハイライト
      this.highlightDiff('left', leftParagraphs, rightParagraphs);
      this.highlightDiff('right', rightParagraphs, leftParagraphs);
    }

    /**
     * 差分をハイライト
     */
    highlightDiff(side, paragraphs, otherParagraphs) {
      const contentId = `split-view-${side}-snapshot`;
      const contentEl = document.getElementById(contentId);
      if (!contentEl) return;

      const html = paragraphs.map((para, _idx) => {
        const exists = otherParagraphs.includes(para);
        const className = exists ? '' : 'split-view-diff-added';
        return `<div class="${className}">${this.escapeHtml(para)}</div>`;
      }).join('');

      contentEl.innerHTML = html;
    }

    /**
     * HTMLエスケープ
     */
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    /**
     * エラーメッセージを表示
     */
    showError(message) {
      if (this.editorManager && typeof this.editorManager.showNotification === 'function') {
        this.editorManager.showNotification(message, 3000);
      } else {
        alert(message);
      }
    }

    /**
     * 分割ビューを表示
     */
    show() {
      if (!this.container) return;
      this.container.style.display = 'flex';
      // 通常のエディタを非表示
      const editorContainer = document.querySelector('.editor-container');
      if (editorContainer) {
        editorContainer.style.display = 'none';
      }
    }

    /**
     * 分割ビューを非表示
     */
    hide() {
      if (!this.container) return;
      
      // エディタとプレビューパネルを元の位置に戻す
      const editor = document.getElementById('editor');
      const previewPanel = document.getElementById('markdown-preview-panel');
      const editorContainer = document.querySelector('.editor-container');
      
      if (editor && editorContainer) {
        // エディタが左パネル内にある場合は元の位置に戻す
        const leftPanel = this.leftPanel;
        if (leftPanel && leftPanel.contains(editor)) {
          editorContainer.insertBefore(editor, editorContainer.firstChild);
        }
      }
      
      if (previewPanel) {
        // プレビューパネルが右パネル内にある場合は元の位置に戻す
        const rightPanel = this.rightPanel;
        const previewBody = document.getElementById('editor-preview-body');
        if (rightPanel && rightPanel.contains(previewPanel) && previewBody) {
          previewBody.insertBefore(previewPanel, previewBody.firstChild);
        }
      }
      
      this.container.style.display = 'none';
      // 通常のエディタを表示
      if (editorContainer) {
        editorContainer.style.display = '';
      }
      this.mode = 'none';
    }

    /**
     * モードを切り替え
     */
    toggle(mode) {
      if (this.mode === mode) {
        this.hide();
      } else {
        switch (mode) {
          case 'edit-preview':
            this.showEditPreview();
            break;
          case 'chapter-compare':
            this.showChapterCompare();
            break;
          case 'snapshot-diff':
            this.showSnapshotDiff();
            break;
          default:
            this.hide();
        }
      }
    }
  }

  // グローバルに公開
  window.SplitViewManager = SplitViewManager;
  
  // DOMContentLoaded時にインスタンス化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ZenWriterSplitView = new SplitViewManager();
    });
  } else {
    window.ZenWriterSplitView = new SplitViewManager();
  }
})();
