// Panels Layout Manager - Docking/Split Model
(function () {
  'use strict';

  const ZONES = {
    SIDEBAR_LEFT: 'sidebar-left',
    SIDEBAR_RIGHT: 'sidebar-right',
    FLOATING: 'floating',
    BOTTOM: 'bottom'
  };

  function getStorage() {
    try {
      return window.localStorage;
    } catch (_) {
      return null;
    }
  }

  function loadPanelLayout() {
    try {
      const s = getStorage();
      if (!s) return getDefaultLayout();
      const raw = s.getItem('zw_panel_layout');
      return raw ? JSON.parse(raw) : getDefaultLayout();
    } catch (_) {
      return getDefaultLayout();
    }
  }

  function savePanelLayout(layout) {
    try {
      const s = getStorage();
      if (s) {
        s.setItem('zw_panel_layout', JSON.stringify(layout));
      }
    } catch (e) { void e; }
  }

  function getDefaultLayout() {
    return {
      sidebar: {
        width: 300,
        collapsed: false
      },
      floating: {},  // { panelId: { left, top, width, height, visible } }
      bottom: {
        height: 200,
        panels: []
      }
    };
  }

  // フローティングパネルの状態を保存
  function savePanelState(panelId, state) {
    try {
      const layout = loadPanelLayout();
      layout.floating = layout.floating || {};
      layout.floating[panelId] = { ...layout.floating[panelId], ...state };
      savePanelLayout(layout);
    } catch (e) { void e; }
  }

  // フローティングパネルの状態を取得
  function getPanelState(panelId) {
    try {
      const layout = loadPanelLayout();
      return (layout.floating && layout.floating[panelId]) || null;
    } catch (_) {
      return null;
    }
  }

  // 画面中央の座標を計算
  function getCenteredPosition(width, height) {
    const w = width || 320;
    const h = height || 400;
    return {
      left: Math.max(50, (window.innerWidth - w) / 2),
      top: Math.max(50, (window.innerHeight - h) / 2)
    };
  }

  // パネル作成関数
  function createDockablePanel(id, title, content, options = {}) {
    const panel = document.createElement('div');
    panel.className = 'dockable-panel';
    panel.id = id;
    panel.dataset.panelId = id;

    const savedState = getPanelState(id);
    const defaultSize = { width: options.width || 320, height: options.height || 400 };
    let initialPos;

    if (savedState && savedState.left !== undefined && savedState.top !== undefined) {
      initialPos = { left: savedState.left, top: savedState.top };
    } else if (options.centered !== false) {
      initialPos = getCenteredPosition(defaultSize.width, defaultSize.height);
    } else {
      initialPos = { left: options.left || 100, top: options.top || 100 };
    }

    panel.style.left = initialPos.left + 'px';
    panel.style.top = initialPos.top + 'px';
    if (options.width) panel.style.width = options.width + 'px';
    if (options.height) panel.style.maxHeight = options.height + 'px';

    const header = document.createElement('div');
    header.className = 'panel-header';

    const titleEl = document.createElement('span');
    const panelTitle = savedState && typeof savedState.title === 'string' && savedState.title ? savedState.title : title;
    titleEl.textContent = panelTitle;
    try { titleEl.id = id + '-title'; } catch(e) { void e; }
    header.appendChild(titleEl);

    const controls = document.createElement('div');
    controls.className = 'panel-controls';

    // 折りたたみボタン
    const collapseBtn = document.createElement('button');
    collapseBtn.className = 'panel-control panel-collapse';
    collapseBtn.textContent = '−';
    collapseBtn.title = '折りたたみ/展開';
    collapseBtn.setAttribute('aria-label', 'パネルを折りたたみまたは展開');
    collapseBtn.addEventListener('click', () => togglePanelCollapse(id));
    controls.appendChild(collapseBtn);

    // 透明度調整ボタン
    const opacityBtn = document.createElement('button');
    opacityBtn.className = 'panel-control panel-opacity-toggle';
    opacityBtn.textContent = '◐';
    opacityBtn.title = '透明度調整';
    opacityBtn.setAttribute('aria-label', '透明度を調整');
    opacityBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleOpacitySlider(id);
    });
    controls.appendChild(opacityBtn);

    // ドッキングコントロール
    const dockBtn = document.createElement('button');
    dockBtn.className = 'panel-control';
    dockBtn.textContent = '⊞';
    dockBtn.title = 'ドッキング切替';
    dockBtn.setAttribute('aria-label', 'パネルをドッキングまたはフローティングに切替');
    dockBtn.addEventListener('click', () => togglePanelDocking(id));
    controls.appendChild(dockBtn);

    // 閉じるボタン
    const closeBtn = document.createElement('button');
    closeBtn.className = 'panel-control panel-close';
    closeBtn.textContent = '×';
    closeBtn.title = '閉じる';
    closeBtn.setAttribute('aria-label', 'パネルを閉じる');
    closeBtn.addEventListener('click', () => hidePanel(id));
    controls.appendChild(closeBtn);

    header.appendChild(controls);
    panel.appendChild(header);

    const body = document.createElement('div');
    body.className = 'panel-body';
    if (typeof content === 'string') {
      body.innerHTML = content;
    } else if (content instanceof Node) {
      body.appendChild(content);
    }
    panel.appendChild(body);

    // 透明度スライダー（初期非表示）
    const opacitySlider = document.createElement('div');
    opacitySlider.className = 'panel-opacity-slider';
    opacitySlider.style.display = 'none';
    const opacityInput = document.createElement('input');
    opacityInput.type = 'range';
    opacityInput.min = '20';
    opacityInput.max = '100';
    opacityInput.value = savedState && savedState.opacity !== undefined ? savedState.opacity : 100;
    opacityInput.addEventListener('input', () => {
      const val = parseInt(opacityInput.value, 10) / 100;
      panel.style.opacity = val;
      savePanelState(id, { opacity: parseInt(opacityInput.value, 10) });
    });
    opacitySlider.appendChild(opacityInput);
    header.appendChild(opacitySlider);

    // 保存された透明度を適用
    if (savedState && savedState.opacity !== undefined) {
      panel.style.opacity = savedState.opacity / 100;
    }

    // 保存された折りたたみ状態を適用
    if (savedState && savedState.collapsed) {
      body.style.display = 'none';
      collapseBtn.textContent = '+';
      panel.classList.add('collapsed');
    }

    makeDraggable(panel, header);

    function renamePanel() {
      let current = titleEl.textContent || '';
      const next = window.prompt(current, current);
      if (!next) return;
      const trimmed = String(next).trim();
      if (!trimmed) return;
      titleEl.textContent = trimmed;
      savePanelState(id, { title: trimmed });
    }

    titleEl.addEventListener('dblclick', function () {
      renamePanel();
    });

    return panel;
  }

  function makeDraggable(panel, handle) {
    let dragStartX, dragStartY, startLeft, startTop;
    let isDragging = false;

    handle.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('panel-control')) return;
      e.preventDefault();
      isDragging = false;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      const rect = panel.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;

      const move = (ev) => {
        const deltaX = ev.clientX - dragStartX;
        const deltaY = ev.clientY - dragStartY;
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
          isDragging = true;
        }
        if (isDragging) {
          panel.style.left = startLeft + deltaX + 'px';
          panel.style.top = startTop + deltaY + 'px';
          panel.style.right = 'auto';
          panel.style.bottom = 'auto';
        }
      };

      const up = () => {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
        if (isDragging) {
          // ドッキングゾーン検出
          const rect = panel.getBoundingClientRect();
          const zone = detectDropZone(rect.left + rect.width / 2, rect.top + rect.height / 2);
          if (zone) {
            dockPanelToZone(panel.id, zone);
          } else {
            // フローティングに留める
            ensureFloating(panel);
            // 位置を保存
            savePanelState(panel.id, {
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height
            });
          }
        }
      };

      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
    });

    // キーボードナビゲーション
    handle.addEventListener('keydown', (e) => {
      if (e.target.classList.contains('panel-control')) return;
      const step = e.shiftKey ? 10 : 1;
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          movePanel(panel, 0, -step);
          break;
        case 'ArrowDown':
          e.preventDefault();
          movePanel(panel, 0, step);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          movePanel(panel, -step, 0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          movePanel(panel, step, 0);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          togglePanelDocking(panel.id);
          break;
        case 'Escape':
          e.preventDefault();
          hidePanel(panel.id);
          break;
      }
    });

    // アクセシビリティ属性
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-labelledby', panel.id + '-title');
    handle.setAttribute('tabindex', '0');
    handle.setAttribute('aria-label', 'パネルをドラッグまたはキーボードで移動');
  }

  function movePanel(panel, deltaX, deltaY) {
    const rect = panel.getBoundingClientRect();
    const newLeft = Math.max(0, Math.min(window.innerWidth - rect.width, rect.left + deltaX));
    const newTop = Math.max(0, Math.min(window.innerHeight - rect.height, rect.top + deltaY));
    panel.style.left = newLeft + 'px';
    panel.style.top = newTop + 'px';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
  }

  function detectDropZone(x, y) {
    // 簡易的なゾーン検出
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      const rect = sidebar.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return ZONES.SIDEBAR_LEFT;
      }
    }

    // ボトムゾーン
    if (y > window.innerHeight - 100) {
      return ZONES.BOTTOM;
    }

    return null;
  }

  function dockPanelToZone(panelId, zone) {
    const panel = document.getElementById(panelId);
    if (!panel) return;

    // 現在の親から削除
    if (panel.parentNode) {
      panel.parentNode.removeChild(panel);
    }

    switch (zone) {
      case ZONES.SIDEBAR_LEFT: {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
          sidebar.appendChild(panel);
          panel.classList.remove('floating');
          panel.classList.add('docked');
          panel.style.left = '';
          panel.style.top = '';
          panel.style.right = '';
          panel.style.bottom = '';
        }
        break;
      }
      case ZONES.BOTTOM: {
        // ボトムパネルコンテナを作成
        let bottomContainer = document.getElementById('bottom-panels');
        if (!bottomContainer) {
          bottomContainer = document.createElement('div');
          bottomContainer.id = 'bottom-panels';
          bottomContainer.className = 'bottom-panels';
          document.body.appendChild(bottomContainer);
        }
        bottomContainer.appendChild(panel);
        panel.classList.remove('floating');
        panel.classList.add('docked', 'bottom');
        break;
      }
      default: {
        ensureFloating(panel);
      }
    }
  }

  function ensureFloating(panel) {
    let floatingContainer = document.getElementById('floating-panels');
    if (!floatingContainer) {
      floatingContainer = document.createElement('div');
      floatingContainer.id = 'floating-panels';
      floatingContainer.className = 'floating-panels';
      document.body.appendChild(floatingContainer);
    }
    if (panel.parentNode !== floatingContainer) {
      floatingContainer.appendChild(panel);
    }
    panel.classList.add('floating');
    panel.classList.remove('docked');
  }

  function togglePanelDocking(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;

    if (panel.classList.contains('floating')) {
      // ドッキング
      dockPanelToZone(panelId, ZONES.SIDEBAR_LEFT);
    } else {
      // フローティング化
      ensureFloating(panel);
    }
  }

  // パネルの折りたたみ/展開をトグル
  function togglePanelCollapse(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const body = panel.querySelector('.panel-body');
    const collapseBtn = panel.querySelector('.panel-collapse');
    if (!body) return;

    const isCollapsed = body.style.display === 'none';
    if (isCollapsed) {
      body.style.display = '';
      if (collapseBtn) collapseBtn.textContent = '−';
      panel.classList.remove('collapsed');
      savePanelState(panelId, { collapsed: false });
    } else {
      body.style.display = 'none';
      if (collapseBtn) collapseBtn.textContent = '+';
      panel.classList.add('collapsed');
      savePanelState(panelId, { collapsed: true });
    }
  }

  // 透明度スライダーの表示/非表示をトグル
  function toggleOpacitySlider(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const slider = panel.querySelector('.panel-opacity-slider');
    if (!slider) return;

    const isVisible = slider.style.display !== 'none';
    slider.style.display = isVisible ? 'none' : 'block';
  }

  function hidePanel(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.style.display = 'none';
      savePanelState(panelId, { visible: false });
    }
  }

  function showPanel(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.style.display = '';
      savePanelState(panelId, { visible: true });
    }
  }

  // パネルの表示/非表示をトグル
  function togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return false;
    const isVisible = panel.style.display !== 'none';
    if (isVisible) {
      hidePanel(panelId);
    } else {
      showPanel(panelId);
    }
    return !isVisible;
  }

  // API
  const API = {
    ZONES,
    createDockablePanel,
    dockPanelToZone,
    togglePanelDocking,
    togglePanelCollapse,
    toggleOpacitySlider,
    hidePanel,
    showPanel,
    togglePanel,
    savePanelState,
    getPanelState,
    loadLayout: loadPanelLayout,
    saveLayout: savePanelLayout
  };

  try {
    window.ZenWriterPanels = API;
  } catch (e) { void e; }

})();
