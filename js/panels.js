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
    } catch (_) {}
  }

  function getDefaultLayout() {
    return {
      sidebar: {
        width: 300,
        collapsed: false
      },
      floating: [],
      bottom: {
        height: 200,
        panels: []
      }
    };
  }

  // パネル作成関数
  function createDockablePanel(id, title, content, options = {}) {
    const panel = document.createElement('div');
    panel.className = 'dockable-panel';
    panel.id = id;
    panel.dataset.panelId = id;

    const header = document.createElement('div');
    header.className = 'panel-header';

    const titleEl = document.createElement('span');
    titleEl.textContent = title;
    // Ensure title element has a stable id for aria-labelledby
    try { titleEl.id = id + '-title'; } catch(_) {}
    header.appendChild(titleEl);

    const controls = document.createElement('div');
    controls.className = 'panel-controls';

    // ドッキングコントロール
    const dockBtn = document.createElement('button');
    dockBtn.className = 'panel-control';
    dockBtn.textContent = '📌';
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

    // ドラッグ可能にする
    makeDraggable(panel, header);

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
          }
          savePanelLayout(loadPanelLayout());
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
      case ZONES.SIDEBAR_LEFT:
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
      case ZONES.BOTTOM:
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
      default:
        ensureFloating(panel);
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

  function hidePanel(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.style.display = 'none';
    }
  }

  function showPanel(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.style.display = 'block';
    }
  }

  // API
  const API = {
    ZONES,
    createDockablePanel,
    dockPanelToZone,
    togglePanelDocking,
    hidePanel,
    showPanel,
    loadLayout: loadPanelLayout,
    saveLayout: savePanelLayout
  };

  try {
    window.ZenWriterPanels = API;
  } catch (_) {}

})();
