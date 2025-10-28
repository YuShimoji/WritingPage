// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
  // グローバルオブジェクトが存在するか確認
  if (
    !window.ZenWriterStorage ||
    !window.ZenWriterTheme ||
    !window.ZenWriterEditor
  ) {
    console.error('必要なスクリプトが読み込まれていません');
    return;
  }

  // ------- 複数ドキュメント管理 -------
  function ensureInitialDocument() {
    if (!window.ZenWriterStorage) return;
    const docs = window.ZenWriterStorage.loadDocuments();
    let cur = window.ZenWriterStorage.getCurrentDocId();
    if (!docs || docs.length === 0) {
      // 既存の単一CONTENTを初回ドキュメントとして取り込む
      const initial = window.ZenWriterStorage.loadContent() || '';
      const created = window.ZenWriterStorage.createDocument(
        'ドキュメント1',
        initial,
      );
      window.ZenWriterStorage.setCurrentDocId(created.id);
      // エディタへ同期
      if (
        window.ZenWriterEditor &&
        typeof window.ZenWriterEditor.setContent === 'function'
      ) {
        window.ZenWriterEditor.setContent(initial);
      }
      updateDocumentTitle();
    } else {
      // カレントが無ければ先頭に設定
      if (!cur || !docs.some((d) => d && d.id === cur)) {
        const first = docs[0];
        window.ZenWriterStorage.setCurrentDocId(first.id);
        if (
          window.ZenWriterEditor &&
          typeof window.ZenWriterEditor.setContent === 'function'
        ) {
          window.ZenWriterEditor.setContent(first.content || '');
        }
        updateDocumentTitle();
      }
    }
  }

  // タイトル更新（ドキュメント名 - Zen Writer）
  function updateDocumentTitle() {
    try {
      const docs = window.ZenWriterStorage.loadDocuments() || [];
      const cur = window.ZenWriterStorage.getCurrentDocId();
      const doc = docs.find((d) => d && d.id === cur);
      const name = doc && doc.name ? doc.name : '';
      document.title = name
        ? `${name} - Zen Writer`
        : 'Zen Writer - 小説執筆ツール';
    } catch (_) {
      document.title = 'Zen Writer - 小説執筆ツール';
    }
  }

  // 印刷処理
  function printDocument() {
    const pv = document.getElementById('print-view');
    if (!pv || !editor) return;
    const text = editor.value || '';
    pv.innerHTML = '';
    const norm = text.replace(/\r\n/g, '\n');
    const blocks = norm.split(/\n{2,}/);
    blocks.forEach((seg) => {
      const p = document.createElement('p');
      p.textContent = seg;
      pv.appendChild(p);
    });
    window.print();
  }

  // 要素を取得
  const toggleSidebarBtn = document.getElementById('toggle-sidebar');
  const closeSidebarBtn = document.getElementById('close-sidebar');
  const sidebar = document.querySelector('.sidebar');
  const toggleToolbarBtn = document.getElementById('toggle-toolbar');
  const toolbar = document.querySelector('.toolbar');
  const fullscreenBtn = document.getElementById('fullscreen');
  const themePresets = document.querySelectorAll('.theme-preset');
  const bgColorInput = document.getElementById('bg-color');
  const textColorInput = document.getElementById('text-color');
  const fontFamilySelect = document.getElementById('font-family');
  const fontSizeInput = document.getElementById('font-size');
  const fontSizeValue = document.getElementById('font-size-value');
  const lineHeightInput = document.getElementById('line-height');
  const lineHeightValue = document.getElementById('line-height-value');
  const editor = document.getElementById('editor');
  const showToolbarBtn = document.getElementById('show-toolbar');
  const editorContainer = document.querySelector('.editor-container');
  const resetColorsBtn = document.getElementById('reset-colors');
  const toolsFab = document.getElementById('fab-tools');
  const fontPanel = document.getElementById('floating-font-panel');
  const closeFontPanelBtn = document.getElementById('close-font-panel');
  const globalFontRange = document.getElementById('global-font-size');
  const globalFontNumber = document.getElementById('global-font-size-number');
  // HUD 設定UI
  // スナップショットUI
  // 執筆目標
  const goalTargetInput = document.getElementById('goal-target');
  const goalDeadlineInput = document.getElementById('goal-deadline');
  // プラグインパネル
  const pluginsPanel = document.getElementById('plugins-panel');
  const sidebarTabs = document.querySelectorAll('.sidebar-tab');
  const sidebarGroups = document.querySelectorAll('.sidebar-group');

  function formatTs(ts) {
    const d = new Date(ts);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }

  // プラグインを描画
  function renderPlugins() {
    if (!pluginsPanel || !window.ZenWriterPlugins) return;
    try {
      const list = window.ZenWriterPlugins.list
        ? window.ZenWriterPlugins.list() || []
        : [];
      pluginsPanel.innerHTML = '';
      if (!list.length) {
        // メッセージを表示しない
        return;
      }
      list.forEach((p) => {
        const group = document.createElement('div');
        group.className = 'plugin-group';
        group.style.display = 'flex';
        group.style.flexDirection = 'column';
        group.style.gap = '6px';

        const title = document.createElement('div');
        title.className = 'plugin-title';
        title.textContent = p.name || p.id;
        title.style.fontWeight = 'bold';
        group.appendChild(title);

        const actionsWrap = document.createElement('div');
        actionsWrap.className = 'plugin-actions';
        actionsWrap.style.display = 'flex';
        actionsWrap.style.flexWrap = 'wrap';
        actionsWrap.style.gap = '6px';
        (p.actions || []).forEach((a) => {
          const btn = document.createElement('button');
          btn.className = 'small';
          btn.textContent = a.label || a.id;
          btn.addEventListener('click', () => {
            try {
              if (a && typeof a.run === 'function') a.run();
            } catch (e) {
              console.error(e);
            }
          });
          actionsWrap.appendChild(btn);
        });
        group.appendChild(actionsWrap);
        pluginsPanel.appendChild(group);
      });
    } catch (e) {
      console.error('プラグイン描画エラー:', e);
    }
  }

  // サイドバーの表示/非表示を切り替え
  function toggleSidebar() {
    sidebar.classList.toggle('open');
  }

  // ツールバー表示/非表示の適用（保存・レイアウト反映を含む）
  function setToolbarVisibility(show) {
    if (!toolbar) return;
    // インライン style ではなく、ルート属性 + クラスで一元制御
    // これにより computedStyle の不整合や一時的な二重描画を回避
    if (showToolbarBtn)
      showToolbarBtn.style.display = show ? 'none' : 'inline-flex';
    document.body.classList.toggle('toolbar-hidden', !show);
    if (!show) {
      document.documentElement.setAttribute('data-toolbar-hidden', 'true');
    } else {
      document.documentElement.removeAttribute('data-toolbar-hidden');
    }
  }

  // ツールバーの表示/非表示を切り替え（状態保存）
  let lastToolbarToggle = 0;
  function toggleToolbar() {
    const now = Date.now();
    if (now - lastToolbarToggle < 150) return; // debounce 二重発火防止
    lastToolbarToggle = now;
    // ルート属性（early-boot と setToolbarVisibility が管理）に基づき判定
    const rootHidden =
      document.documentElement.getAttribute('data-toolbar-hidden') === 'true';
    const willShow = !!rootHidden;
    setToolbarVisibility(willShow);
    // 状態保存
    const s = window.ZenWriterStorage.loadSettings();
    s.toolbarVisible = willShow;
    window.ZenWriterStorage.saveSettings(s);
    // ツールバーを表示にしたらHUDを隠す
    if (
      willShow &&
      window.ZenWriterHUD &&
      typeof window.ZenWriterHUD.hide === 'function'
    ) {
      window.ZenWriterHUD.hide();
    }
  }

  // フルスクリーン切り替え
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('フルスクリーンエラー:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  // 設定をUIに反映
  function applySettingsToUI() {
    const settings = window.ZenWriterStorage.loadSettings();

    // テーマプリセットを選択
    document.querySelectorAll('.theme-preset').forEach((btn) => {
      if (btn.dataset.theme === settings.theme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // カラーピッカーを設定
    if (bgColorInput) bgColorInput.value = settings.bgColor;
    if (textColorInput) textColorInput.value = settings.textColor;

    // フォント設定を設定
    if (fontFamilySelect) fontFamilySelect.value = settings.fontFamily;
    if (fontSizeInput) {
      fontSizeInput.value = settings.fontSize;
      fontSizeValue.textContent = settings.fontSize;
    }
    if (lineHeightInput) {
      lineHeightInput.value = settings.lineHeight;
      lineHeightValue.textContent = settings.lineHeight;
    }
    // ツールバー表示状態
    if (typeof settings.toolbarVisible !== 'undefined') {
      setToolbarVisibility(!!settings.toolbarVisible);
    }

    // 執筆目標の初期反映
    const goal = settings.goal || {};
    if (goalTargetInput)
      goalTargetInput.value =
        typeof goal.target === 'number'
          ? goal.target
          : parseInt(goal.target, 10) || 0;
    if (goalDeadlineInput) goalDeadlineInput.value = goal.deadline || '';
  }

  function activateSidebarGroup(groupId) {
    if (!groupId) return;
    sidebarTabs.forEach((tab) => {
      const isActive = tab.dataset.group === groupId;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    sidebarGroups.forEach((section) => {
      const isActive = section.dataset.group === groupId;
      section.classList.toggle('active', isActive);
      section.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });
    if (
      window.ZWGadgets &&
      typeof window.ZWGadgets.setActiveGroup === 'function'
    ) {
      window.ZWGadgets.setActiveGroup(groupId);
    }
  }

  // イベントリスナーを設定
  if (toggleSidebarBtn)
    toggleSidebarBtn.addEventListener('click', toggleSidebar);
  if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', toggleSidebar);
  if (toggleToolbarBtn)
    toggleToolbarBtn.addEventListener('click', toggleToolbar);
  if (showToolbarBtn) showToolbarBtn.addEventListener('click', toggleToolbar);
  if (fullscreenBtn) fullscreenBtn.addEventListener('click', toggleFullscreen);
  if (sidebarTabs && sidebarTabs.length) {
    sidebarTabs.forEach((tab) => {
      tab.addEventListener('click', () =>
        activateSidebarGroup(tab.dataset.group),
      );
    });
  }
  // キーボードショートカット: Alt+W でツールバー表示切替
  document.addEventListener('keydown', (e) => {
    const targetTag =
      e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
    const inFormControl = ['input', 'select', 'textarea', 'button'].includes(
      targetTag,
    );
    if (!inFormControl && e.altKey && (e.key === 'w' || e.key === 'W')) {
      if (e.repeat) return; // 長押しの自動リピートで連続トグルしない
      e.preventDefault();
      toggleToolbar();
      return;
    }
    if (!inFormControl && e.altKey && ['1', '2', '3'].includes(e.key)) {
      e.preventDefault();
      const map = { 1: 'structure', 2: 'typography', 3: 'assist' };
      const gid = map[e.key];
      if (gid) activateSidebarGroup(gid);
    }
    // Ctrl+F で検索パネルを開く
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      if (
        window.ZenWriterEditor &&
        typeof window.ZenWriterEditor.toggleSearchPanel === 'function'
      ) {
        window.ZenWriterEditor.toggleSearchPanel();
      }
    }
  });

  // ドキュメント操作
  // 初期: ドキュメント管理セットアップ
  ensureInitialDocument();
  updateDocumentTitle();
  renderPlugins();

  // テーマ設定
  themePresets.forEach((btn) => {
    btn.addEventListener('click', () => {
      window.ZenWriterTheme.applyTheme(btn.dataset.theme);
      // テーマプリセット選択時はカスタムカラー上書きを解除
      window.ZenWriterTheme.clearCustomColors();
      applySettingsToUI();
    });
  });

  // カラーピッカー
  if (bgColorInput) {
    bgColorInput.addEventListener('input', (e) => {
      const text = textColorInput ? textColorInput.value : '#333333';
      window.ZenWriterTheme.applyCustomColors(e.target.value, text, true);
    });
  }

  if (textColorInput) {
    textColorInput.addEventListener('input', (e) => {
      const bg = bgColorInput ? bgColorInput.value : '#ffffff';
      window.ZenWriterTheme.applyCustomColors(bg, e.target.value, true);
    });
  }

  // カスタム色リセット
  if (resetColorsBtn) {
    resetColorsBtn.addEventListener('click', () => {
      window.ZenWriterTheme.clearCustomColors();
      applySettingsToUI();
    });
  }

  // フローティングツール（フォントパネル）
  function toggleFontPanel(forceShow = null) {
    if (!fontPanel) return;
    const willShow =
      forceShow !== null ? !!forceShow : fontPanel.style.display === 'none';
    fontPanel.style.display = willShow ? 'block' : 'none';
    if (willShow) {
      // 現在設定をUIへ反映
      const s = window.ZenWriterStorage.loadSettings();
      if (globalFontRange) globalFontRange.value = s.fontSize;
      if (globalFontNumber) globalFontNumber.value = s.fontSize;
    }
  }
  if (toolsFab) toolsFab.addEventListener('click', () => toggleFontPanel());
  if (closeFontPanelBtn)
    closeFontPanelBtn.addEventListener('click', () => toggleFontPanel(false));

  // フォントパネルのコントロール
  function updateGlobalFontFrom(value) {
    const size = parseFloat(value);
    if (!isNaN(size)) {
      window.ZenWriterEditor.setGlobalFontSize(size);
    }
  }
  if (globalFontRange) {
    globalFontRange.addEventListener('input', (e) => {
      updateGlobalFontFrom(e.target.value);
    });
  }
  if (globalFontNumber) {
    globalFontNumber.addEventListener('input', (e) => {
      updateGlobalFontFrom(e.target.value);
    });
  }

  // スナップショット: 今すぐ保存
  // 削除済み

  // フォント設定
  if (fontFamilySelect) {
    fontFamilySelect.addEventListener('change', (e) => {
      window.ZenWriterTheme.applyFontSettings(
        e.target.value,
        parseFloat(fontSizeInput.value),
        parseFloat(lineHeightInput.value),
      );
    });
  }

  if (fontSizeInput) {
    fontSizeInput.addEventListener('input', (e) => {
      fontSizeValue.textContent = e.target.value;
      window.ZenWriterTheme.applyFontSettings(
        fontFamilySelect.value,
        parseFloat(e.target.value),
        parseFloat(lineHeightInput.value),
      );
    });
  }

  if (lineHeightInput) {
    lineHeightInput.addEventListener('input', (e) => {
      lineHeightValue.textContent = e.target.value;
      window.ZenWriterTheme.applyFontSettings(
        fontFamilySelect.value,
        parseFloat(fontSizeInput.value),
        parseFloat(e.target.value),
      );
    });
  }

  // ------- 執筆目標（goal） -------
  function saveGoalPatch(patch) {
    const s = window.ZenWriterStorage.loadSettings();
    s.goal = { ...(s.goal || {}), ...patch };
    window.ZenWriterStorage.saveSettings(s);
    // 文字数表示を更新
    if (
      window.ZenWriterEditor &&
      typeof window.ZenWriterEditor.updateWordCount === 'function'
    ) {
      window.ZenWriterEditor.updateWordCount();
    }
  }
  if (goalTargetInput) {
    const clampTarget = (v) => Math.max(0, parseInt(v, 10) || 0);
    goalTargetInput.addEventListener('input', (e) =>
      saveGoalPatch({ target: clampTarget(e.target.value) }),
    );
    goalTargetInput.addEventListener('change', (e) =>
      saveGoalPatch({ target: clampTarget(e.target.value) }),
    );
  }
  if (goalDeadlineInput) {
    goalDeadlineInput.addEventListener('change', (e) =>
      saveGoalPatch({ deadline: e.target.value || '' || null }),
    );
  }

  // エディタにフォーカス（エディタ領域をクリックしたときのみ）
  if (editor && editorContainer) {
    editorContainer.addEventListener('click', () => {
      editor.focus();
    });

    // 初期フォーカス
    setTimeout(() => {
      editor.focus();
    }, 100);
  }

  // 設定をUIに反映
  applySettingsToUI();
  // バックアップ一覧
  // renderSnapshots();

  // 検索パネルのイベントリスナー
  const searchPanel = document.getElementById('search-panel');
  const closeSearchPanelBtn = document.getElementById('close-search-panel');
  const searchInput = document.getElementById('search-input');
  const replaceInput = document.getElementById('replace-input');
  const replaceSingleBtn = document.getElementById('replace-single');
  const replaceAllBtn = document.getElementById('replace-all');
  const searchPrevBtn = document.getElementById('search-prev');
  const searchNextBtn = document.getElementById('search-next');

  if (closeSearchPanelBtn) {
    closeSearchPanelBtn.addEventListener('click', () => {
      if (
        window.ZenWriterEditor &&
        typeof window.ZenWriterEditor.hideSearchPanel === 'function'
      ) {
        window.ZenWriterEditor.hideSearchPanel();
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      if (
        window.ZenWriterEditor &&
        typeof window.ZenWriterEditor.updateSearchMatches === 'function'
      ) {
        window.ZenWriterEditor.updateSearchMatches();
      }
    });
  }

  if (replaceSingleBtn) {
    replaceSingleBtn.addEventListener('click', () => {
      if (
        window.ZenWriterEditor &&
        typeof window.ZenWriterEditor.replaceSingle === 'function'
      ) {
        window.ZenWriterEditor.replaceSingle();
      }
    });
  }

  if (replaceAllBtn) {
    replaceAllBtn.addEventListener('click', () => {
      if (
        window.ZenWriterEditor &&
        typeof window.ZenWriterEditor.replaceAll === 'function'
      ) {
        window.ZenWriterEditor.replaceAll();
      }
    });
  }

  if (searchPrevBtn) {
    searchPrevBtn.addEventListener('click', () => {
      if (
        window.ZenWriterEditor &&
        typeof window.ZenWriterEditor.navigateMatch === 'function'
      ) {
        window.ZenWriterEditor.navigateMatch(-1);
      }
    });
  }

  if (searchNextBtn) {
    searchNextBtn.addEventListener('click', () => {
      if (
        window.ZenWriterEditor &&
        typeof window.ZenWriterEditor.navigateMatch === 'function'
      ) {
        window.ZenWriterEditor.navigateMatch(1);
      }
    });
  }

  // 検索オプションの変更時にも再検索
  ['search-case-sensitive', 'search-regex'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => {
        if (
          window.ZenWriterEditor &&
          typeof window.ZenWriterEditor.updateSearchMatches === 'function'
        ) {
          window.ZenWriterEditor.updateSearchMatches();
        }
      });
    }
  });

  // 初期状態の整合性
  // applySettingsToUI() と head内の early-boot で反映済みのため、ここでの上書きは行わない

  // ===== 埋め込み/外部制御用 安定APIブリッジ =====
  if (!window.ZenWriterAPI) {
    window.ZenWriterAPI = {
      /** 現在の本文を取得 */
      getContent() {
        const el = document.getElementById('editor');
        return el ? String(el.value || '') : '';
      },
      /** 本文を設定（保存とUI更新も実施） */
      setContent(text) {
        if (
          window.ZenWriterEditor &&
          typeof window.ZenWriterEditor.setContent === 'function'
        ) {
          window.ZenWriterEditor.setContent(String(text || ''));
          return true;
        }
        const el = document.getElementById('editor');
        if (el) {
          el.value = String(text || '');
          if (
            window.ZenWriterStorage &&
            typeof window.ZenWriterStorage.saveContent === 'function'
          ) {
            window.ZenWriterStorage.saveContent(el.value);
          }
          return true;
        }
        return false;
      },
      /** エディタにフォーカスを移動 */
      focus() {
        const el = document.getElementById('editor');
        if (el) {
          el.focus();
          return true;
        }
        return false;
      },
      /** 現在の本文でスナップショットを追加 */
      takeSnapshot() {
        const el = document.getElementById('editor');
        const content = el ? el.value || '' : '';
        if (
          window.ZenWriterStorage &&
          typeof window.ZenWriterStorage.addSnapshot === 'function'
        ) {
          window.ZenWriterStorage.addSnapshot(content);
          return true;
        }
        return false;
      },
    };
  }
});
