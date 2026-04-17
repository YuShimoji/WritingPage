/**
 * DockManager — SP-076 Phase 1-4
 * Manages sidebar left/right docking, left dock panel, resize, layout persistence,
 * tab grouping, floating panels, and layout presets.
 */
(function (root) {
  'use strict';

  var STORAGE_KEY = 'zenwriter-dock-layout';
  var MIN_WIDTH = 180;
  var DEFAULT_LEFT_WIDTH = 280;
  var DEFAULT_SIDEBAR_WIDTH = 320;

  function getMaxWidth() {
    return Math.floor(window.innerWidth * 0.5);
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  /**
   * @param {object} sidebarManager - SidebarManager instance
   */
  function DockManager(sidebarManager) {
    this._sm = sidebarManager;
    this._layout = {
      sidebarDock: 'left',
      leftPanel: { visible: false, width: DEFAULT_LEFT_WIDTH, tabs: [], activeTab: 0 },
      rightPanel: { visible: true, width: DEFAULT_SIDEBAR_WIDTH }
    };
    this._resizing = false;
    this._tabDrag = null;
  }

  DockManager.prototype.init = function () {
    this._load();
    this._applyLayout();
    this._bindControls();
    this._initResizeHandles();
    this._renderTabs('left');
  };

  // --- Persistence ---

  DockManager.prototype._load = function () {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (parsed.sidebarDock === 'left' || parsed.sidebarDock === 'right') {
            this._layout.sidebarDock = parsed.sidebarDock;
          }
          if (parsed.leftPanel && typeof parsed.leftPanel === 'object') {
            this._layout.leftPanel.visible = !!parsed.leftPanel.visible;
            if (typeof parsed.leftPanel.width === 'number') {
              this._layout.leftPanel.width = clamp(parsed.leftPanel.width, MIN_WIDTH, getMaxWidth());
            }
            if (Array.isArray(parsed.leftPanel.tabs)) {
              this._layout.leftPanel.tabs = parsed.leftPanel.tabs.filter(function (t) {
                return t && typeof t.id === 'string' && typeof t.title === 'string';
              });
            }
            if (typeof parsed.leftPanel.activeTab === 'number') {
              this._layout.leftPanel.activeTab = parsed.leftPanel.activeTab;
            }
          }
          if (parsed.rightPanel && typeof parsed.rightPanel === 'object') {
            if (typeof parsed.rightPanel.width === 'number') {
              this._layout.rightPanel.width = clamp(parsed.rightPanel.width, MIN_WIDTH, getMaxWidth());
            }
          }
        }
      }
    } catch (_e) { /* ignore */ }

    // Clamp activeTab
    var lp = this._layout.leftPanel;
    if (lp.tabs.length === 0) {
      lp.activeTab = 0;
    } else if (lp.activeTab >= lp.tabs.length) {
      lp.activeTab = lp.tabs.length - 1;
    }
  };

  DockManager.prototype._save = function () {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._layout));
    } catch (_e) { /* ignore */ }
  };

  // --- Layout Application ---

  DockManager.prototype._applyLayout = function () {
    var html = document.documentElement;
    var mode = html.getAttribute('data-ui-mode') || 'focus';

    // Sidebar dock position
    html.setAttribute('data-dock-sidebar', this._layout.sidebarDock);

    // Left panel
    if (mode === 'normal' && this._layout.leftPanel.visible) {
      html.setAttribute('data-dock-left-open', 'true');
    } else {
      html.removeAttribute('data-dock-left-open');
    }

    // CSS variables
    html.style.setProperty('--dock-left-width', this._layout.leftPanel.width + 'px');
    html.style.setProperty('--sidebar-width', this._layout.rightPanel.width + 'px');

    // Update move button label
    this._updateMoveButton();

    // Update header title based on active tab
    this._updatePanelTitle('left');
  };

  DockManager.prototype._updateMoveButton = function () {
    var btn = document.getElementById('dock-move-sidebar');
    if (!btn) return;
    var span = btn.querySelector('span');
    if (span) {
      span.textContent = this._layout.sidebarDock === 'left' ? '\u53F3\u306B\u79FB\u52D5' : '\u5DE6\u306B\u79FB\u52D5';
    }
  };

  DockManager.prototype._updatePanelTitle = function (side) {
    if (side !== 'left') return;
    var titleEl = document.querySelector('.dock-panel-left__title');
    if (!titleEl) return;
    var tabs = this._layout.leftPanel.tabs;
    var active = this._layout.leftPanel.activeTab;
    if (tabs.length > 0 && tabs[active]) {
      titleEl.textContent = tabs[active].title;
    } else {
      titleEl.textContent = '\u30D1\u30CD\u30EB';
    }
  };

  // --- Tab Management (Phase 2) ---

  /**
   * Add a tab to the left dock panel.
   * @param {string} id - Unique gadget/panel identifier
   * @param {string} title - Display title
   * @param {HTMLElement|function} [contentOrFactory] - Content element or factory function
   * @returns {number} Index of the added tab
   */
  DockManager.prototype.addTab = function (id, title, contentOrFactory) {
    var lp = this._layout.leftPanel;

    // Prevent duplicate tabs
    for (var i = 0; i < lp.tabs.length; i++) {
      if (lp.tabs[i].id === id) {
        lp.activeTab = i;
        this._renderTabs('left');
        this._showActiveTabContent('left');
        this._save();
        return i;
      }
    }

    var tab = { id: id, title: title };
    lp.tabs.push(tab);
    lp.activeTab = lp.tabs.length - 1;

    // Store content factory/element
    if (contentOrFactory) {
      this._setTabContent(id, contentOrFactory);
    }

    // Auto-open panel when first tab added
    if (!lp.visible) {
      lp.visible = true;
    }

    this._applyLayout();
    this._renderTabs('left');
    this._showActiveTabContent('left');
    this._save();
    return lp.tabs.length - 1;
  };

  /**
   * Remove a tab by index or id.
   * @param {number|string} indexOrId
   */
  DockManager.prototype.removeTab = function (indexOrId) {
    var lp = this._layout.leftPanel;
    var idx = typeof indexOrId === 'number' ? indexOrId : -1;
    if (typeof indexOrId === 'string') {
      for (var i = 0; i < lp.tabs.length; i++) {
        if (lp.tabs[i].id === indexOrId) { idx = i; break; }
      }
    }
    if (idx < 0 || idx >= lp.tabs.length) return;

    // Remove content panel
    var tabId = lp.tabs[idx].id;
    var contentContainer = document.getElementById('dock-left-content');
    if (contentContainer) {
      var panel = contentContainer.querySelector('[data-dock-tab-id="' + tabId + '"]');
      if (panel) panel.remove();
    }

    lp.tabs.splice(idx, 1);

    // Adjust active tab
    if (lp.tabs.length === 0) {
      lp.activeTab = 0;
    } else if (lp.activeTab >= lp.tabs.length) {
      lp.activeTab = lp.tabs.length - 1;
    }

    this._renderTabs('left');
    this._showActiveTabContent('left');
    this._applyLayout();
    this._save();
  };

  /**
   * Set the active tab by index or id.
   * @param {number|string} indexOrId
   */
  DockManager.prototype.setActiveTab = function (indexOrId) {
    var lp = this._layout.leftPanel;
    var idx = typeof indexOrId === 'number' ? indexOrId : -1;
    if (typeof indexOrId === 'string') {
      for (var i = 0; i < lp.tabs.length; i++) {
        if (lp.tabs[i].id === indexOrId) { idx = i; break; }
      }
    }
    if (idx < 0 || idx >= lp.tabs.length) return;
    lp.activeTab = idx;
    this._renderTabs('left');
    this._showActiveTabContent('left');
    this._updatePanelTitle('left');
    this._save();
  };

  /**
   * Reorder tabs: move tab from fromIdx to toIdx.
   */
  DockManager.prototype.reorderTabs = function (fromIdx, toIdx) {
    var lp = this._layout.leftPanel;
    if (fromIdx < 0 || fromIdx >= lp.tabs.length) return;
    if (toIdx < 0 || toIdx >= lp.tabs.length) return;
    if (fromIdx === toIdx) return;

    var tab = lp.tabs.splice(fromIdx, 1)[0];
    lp.tabs.splice(toIdx, 0, tab);

    // Adjust active tab to follow the moved tab or stay on same content
    if (lp.activeTab === fromIdx) {
      lp.activeTab = toIdx;
    } else if (fromIdx < lp.activeTab && toIdx >= lp.activeTab) {
      lp.activeTab--;
    } else if (fromIdx > lp.activeTab && toIdx <= lp.activeTab) {
      lp.activeTab++;
    }

    this._renderTabs('left');
    this._save();
  };

  /**
   * Get tabs for a given side.
   * @returns {Array} copy of tabs array
   */
  DockManager.prototype.getTabs = function () {
    return this._layout.leftPanel.tabs.slice();
  };

  /**
   * Get active tab index.
   * @returns {number}
   */
  DockManager.prototype.getActiveTabIndex = function () {
    return this._layout.leftPanel.activeTab;
  };

  // --- Tab Content ---

  DockManager.prototype._setTabContent = function (id, contentOrFactory) {
    var contentContainer = document.getElementById('dock-left-content');
    if (!contentContainer) return;

    // Check if panel already exists
    var existing = contentContainer.querySelector('[data-dock-tab-id="' + id + '"]');
    if (existing) return;

    var panel = document.createElement('div');
    panel.className = 'dock-tab-panel';
    panel.setAttribute('data-dock-tab-id', id);
    panel.setAttribute('role', 'tabpanel');

    if (typeof contentOrFactory === 'function') {
      contentOrFactory(panel);
    } else if (contentOrFactory instanceof HTMLElement) {
      panel.appendChild(contentOrFactory);
    }

    contentContainer.appendChild(panel);
  };

  DockManager.prototype._showActiveTabContent = function (side) {
    if (side !== 'left') return;
    var contentContainer = document.getElementById('dock-left-content');
    if (!contentContainer) return;

    var lp = this._layout.leftPanel;
    var panels = contentContainer.querySelectorAll('.dock-tab-panel');
    var activeId = (lp.tabs[lp.activeTab] || {}).id;

    for (var i = 0; i < panels.length; i++) {
      var isActive = panels[i].getAttribute('data-dock-tab-id') === activeId;
      panels[i].setAttribute('data-active', isActive ? 'true' : 'false');
    }

    // If no tabs, show legacy content (backward compat: direct children that are not tab panels)
    var hasTabPanels = panels.length > 0;
    var children = contentContainer.children;
    for (var j = 0; j < children.length; j++) {
      if (!children[j].classList.contains('dock-tab-panel')) {
        children[j].style.display = hasTabPanels && lp.tabs.length > 0 ? 'none' : '';
      }
    }
  };

  // --- Tab Rendering ---

  DockManager.prototype._renderTabs = function (side) {
    if (side !== 'left') return;
    var tabBar = document.getElementById('dock-left-tab-bar');
    if (!tabBar) return;

    var lp = this._layout.leftPanel;
    tabBar.setAttribute('data-tab-count', String(lp.tabs.length));

    // Clear existing
    tabBar.innerHTML = '';

    var self = this;
    lp.tabs.forEach(function (tab, idx) {
      var btn = document.createElement('button');
      btn.className = 'dock-tab';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', idx === lp.activeTab ? 'true' : 'false');
      btn.setAttribute('data-tab-index', String(idx));
      btn.setAttribute('data-tab-id', tab.id);
      btn.setAttribute('draggable', 'true');

      var label = document.createElement('span');
      label.textContent = tab.title;
      btn.appendChild(label);

      var closeBtn = document.createElement('button');
      closeBtn.className = 'dock-tab__close';
      closeBtn.setAttribute('aria-label', '\u9589\u3058\u308B');
      closeBtn.textContent = '\u00D7';
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        self.removeTab(idx);
      });
      btn.appendChild(closeBtn);

      btn.addEventListener('click', function () {
        self.setActiveTab(idx);
      });

      // Drag events for reorder
      self._bindTabDrag(btn, idx, tabBar);

      tabBar.appendChild(btn);
    });
  };

  // --- Tab Drag Reorder ---

  DockManager.prototype._bindTabDrag = function (tabEl, idx, tabBar) {
    var self = this;

    tabEl.addEventListener('dragstart', function (e) {
      self._tabDrag = { fromIdx: idx, side: 'left' };
      tabEl.classList.add('dock-tab--dragging');
      tabBar.classList.add('dock-tab-bar--drag-over');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(idx));
    });

    tabEl.addEventListener('dragend', function () {
      tabEl.classList.remove('dock-tab--dragging');
      tabBar.classList.remove('dock-tab-bar--drag-over');
      self._tabDrag = null;
      // Remove any drop indicators
      var indicators = tabBar.querySelectorAll('.dock-tab-drop-indicator');
      for (var i = 0; i < indicators.length; i++) indicators[i].remove();
    });

    tabEl.addEventListener('dragover', function (e) {
      if (!self._tabDrag) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    tabEl.addEventListener('drop', function (e) {
      if (!self._tabDrag) return;
      e.preventDefault();
      var fromIdx = self._tabDrag.fromIdx;
      var toIdx = idx;
      if (fromIdx !== toIdx) {
        self.reorderTabs(fromIdx, toIdx);
      }
      tabBar.classList.remove('dock-tab-bar--drag-over');
      self._tabDrag = null;
    });
  };

  // --- Public API (Phase 1 compat) ---

  DockManager.prototype.moveSidebarTo = function (side) {
    if (side !== 'left' && side !== 'right') return;
    if (this._layout.sidebarDock === side) return;

    // Close sidebar before moving
    if (this._sm && typeof this._sm.forceSidebarState === 'function') {
      this._sm.forceSidebarState(false);
    }

    this._layout.sidebarDock = side;

    // Brief delay to let close animation complete
    var self = this;
    setTimeout(function () {
      self._applyLayout();
      self._save();
    }, 50);
  };

  DockManager.prototype.toggleSidebarDock = function () {
    this.moveSidebarTo(this._layout.sidebarDock === 'left' ? 'right' : 'left');
  };

  DockManager.prototype.setLeftPanelVisible = function (visible) {
    this._layout.leftPanel.visible = !!visible;
    this._applyLayout();
    this._save();
  };

  DockManager.prototype.toggleLeftPanel = function () {
    this.setLeftPanelVisible(!this._layout.leftPanel.visible);
  };

  DockManager.prototype.setDockWidth = function (side, width) {
    var w = clamp(width, MIN_WIDTH, getMaxWidth());
    if (side === 'left') {
      this._layout.leftPanel.width = w;
      document.documentElement.style.setProperty('--dock-left-width', w + 'px');
    } else if (side === 'sidebar') {
      this._layout.rightPanel.width = w;
      document.documentElement.style.setProperty('--sidebar-width', w + 'px');
    }
    this._save();
  };

  DockManager.prototype._onUIModeChanged = function (mode) {
    if (mode === 'normal') {
      this._applyLayout();
    } else {
      document.documentElement.removeAttribute('data-dock-left-open');
    }
  };

  // --- Controls Binding ---

  DockManager.prototype._bindControls = function () {
    var self = this;

    // Move sidebar button
    var moveBtn = document.getElementById('dock-move-sidebar');
    if (moveBtn) {
      moveBtn.addEventListener('click', function () {
        self.toggleSidebarDock();
      });
    }

    // Toggle left panel button
    var toggleBtn = document.getElementById('dock-toggle-left');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        self.toggleLeftPanel();
      });
    }

    // Close left panel button
    var closeBtn = document.getElementById('dock-left-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        self.setLeftPanelVisible(false);
      });
    }
  };

  // --- Resize Handles ---

  DockManager.prototype._initResizeHandles = function () {
    var self = this;
    var leftHandle = document.getElementById('dock-left-resize-handle');
    if (leftHandle) {
      this._setupResize(leftHandle, 'left');
    }

    // Listen for sidebar resize handle (added dynamically or in HTML)
    var sidebarHandle = document.getElementById('dock-sidebar-resize-handle');
    if (sidebarHandle) {
      this._setupResize(sidebarHandle, 'sidebar');
    }

    // Prevent text selection during resize
    document.addEventListener('selectstart', function (e) {
      if (self._resizing) e.preventDefault();
    });
  };

  DockManager.prototype._setupResize = function (handle, side) {
    var self = this;
    var startX = 0;
    var startWidth = 0;

    function onPointerMove(e) {
      if (!self._resizing) return;
      var delta = e.clientX - startX;
      var newWidth;

      if (side === 'left') {
        newWidth = clamp(startWidth + delta, MIN_WIDTH, getMaxWidth());
        document.documentElement.style.setProperty('--dock-left-width', newWidth + 'px');
      } else {
        var dockSide = self._layout.sidebarDock;
        if (dockSide === 'right') {
          newWidth = clamp(startWidth - delta, MIN_WIDTH, getMaxWidth());
        } else {
          newWidth = clamp(startWidth + delta, MIN_WIDTH, getMaxWidth());
        }
        document.documentElement.style.setProperty('--sidebar-width', newWidth + 'px');
        // app.js が設定復元時にインライン width を設定するため、同時に更新する
        var sb = document.getElementById('sidebar');
        if (sb) sb.style.width = newWidth + 'px';
      }
    }

    function onPointerUp() {
      if (!self._resizing) return;
      self._resizing = false;
      handle.classList.remove('dock-resize-handle--active');
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);

      // Save final width
      if (side === 'left') {
        var panel = document.getElementById('dock-panel-left');
        if (panel) self.setDockWidth('left', panel.offsetWidth);
      } else {
        var sidebar = document.getElementById('sidebar');
        if (sidebar) {
          var finalWidth = sidebar.offsetWidth;
          self.setDockWidth('sidebar', finalWidth);
          // app.js の設定復元と整合させるため ui.sidebarWidth も保存
          try {
            var s = window.ZenWriterStorage.loadSettings();
            if (s && s.ui) {
              s.ui.sidebarWidth = finalWidth;
              window.ZenWriterStorage.saveSettings(s);
            }
          } catch (_e) { /* ignore */ }
        }
      }
    }

    handle.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      self._resizing = true;
      handle.classList.add('dock-resize-handle--active');

      if (side === 'left') {
        var panel = document.getElementById('dock-panel-left');
        startWidth = panel ? panel.offsetWidth : DEFAULT_LEFT_WIDTH;
      } else {
        var sidebar = document.getElementById('sidebar');
        startWidth = sidebar ? sidebar.offsetWidth : DEFAULT_SIDEBAR_WIDTH;
      }
      startX = e.clientX;

      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
    });
  };

  // --- Floating Panels (Phase 3) ---

  var FLOAT_MIN_W = 200;
  var FLOAT_MIN_H = 150;
  var FLOAT_DEFAULT_W = 320;
  var FLOAT_DEFAULT_H = 400;
  var SNAP_THRESHOLD = 40;

  /**
   * Undock a tab from the left dock and create a floating panel.
   * @param {number|string} indexOrId - Tab index or id
   * @param {object} [pos] - Optional {x, y, width, height}
   * @returns {HTMLElement|null} The floating panel element
   */
  DockManager.prototype.floatTab = function (indexOrId, pos) {
    var lp = this._layout.leftPanel;
    var idx = typeof indexOrId === 'number' ? indexOrId : -1;
    if (typeof indexOrId === 'string') {
      for (var i = 0; i < lp.tabs.length; i++) {
        if (lp.tabs[i].id === indexOrId) { idx = i; break; }
      }
    }
    if (idx < 0 || idx >= lp.tabs.length) return null;

    var tab = lp.tabs[idx];
    var tabId = tab.id;
    var tabTitle = tab.title;

    // Get content element before removing tab
    var contentContainer = document.getElementById('dock-left-content');
    var contentPanel = contentContainer
      ? contentContainer.querySelector('[data-dock-tab-id="' + tabId + '"]')
      : null;

    // Remove from dock tabs
    lp.tabs.splice(idx, 1);
    if (lp.tabs.length === 0) {
      lp.activeTab = 0;
      lp.visible = false; // Auto-hide empty panel
    } else if (lp.activeTab >= lp.tabs.length) {
      lp.activeTab = lp.tabs.length - 1;
    }

    // Build floating state
    var floatState = {
      id: tabId,
      title: tabTitle,
      x: (pos && typeof pos.x === 'number') ? pos.x : Math.round(window.innerWidth / 2 - FLOAT_DEFAULT_W / 2),
      y: (pos && typeof pos.y === 'number') ? pos.y : Math.round(window.innerHeight / 2 - FLOAT_DEFAULT_H / 2),
      width: (pos && typeof pos.width === 'number') ? pos.width : FLOAT_DEFAULT_W,
      height: (pos && typeof pos.height === 'number') ? pos.height : FLOAT_DEFAULT_H
    };

    if (!this._layout.floating) this._layout.floating = [];
    this._layout.floating.push(floatState);

    // Create DOM element
    var el = this._createFloatingElement(floatState, contentPanel);

    this._renderTabs('left');
    this._showActiveTabContent('left');
    this._applyLayout();
    this._save();
    return el;
  };

  /**
   * Snap a floating panel back to the left dock.
   * @param {string} id - Panel id
   * @returns {number} Tab index, or -1 if not found
   */
  DockManager.prototype.snapToDock = function (id) {
    if (!this._layout.floating) return -1;
    var floatIdx = -1;
    for (var i = 0; i < this._layout.floating.length; i++) {
      if (this._layout.floating[i].id === id) { floatIdx = i; break; }
    }
    if (floatIdx < 0) return -1;

    var floatState = this._layout.floating[floatIdx];

    // Get content from floating panel before removing
    var floatEl = document.querySelector('.dock-floating[data-float-id="' + id + '"]');
    var contentEl = floatEl ? floatEl.querySelector('.dock-floating__content') : null;
    var childNodes = [];
    if (contentEl) {
      while (contentEl.firstChild) {
        childNodes.push(contentEl.removeChild(contentEl.firstChild));
      }
    }

    // Remove floating state + DOM
    this._layout.floating.splice(floatIdx, 1);
    if (floatEl) floatEl.remove();

    // Remove snap zones
    this._removeSnapZones();

    // Add back as dock tab
    var lp = this._layout.leftPanel;
    lp.tabs.push({ id: floatState.id, title: floatState.title });
    lp.activeTab = lp.tabs.length - 1;

    // Restore content
    if (childNodes.length > 0) {
      this._setTabContent(floatState.id, function (panel) {
        childNodes.forEach(function (node) { panel.appendChild(node); });
      });
    }

    if (!lp.visible) lp.visible = true;

    this._renderTabs('left');
    this._showActiveTabContent('left');
    this._applyLayout();
    this._save();
    return lp.tabs.length - 1;
  };

  /**
   * Get floating panels state.
   * @returns {Array}
   */
  DockManager.prototype.getFloating = function () {
    return (this._layout.floating || []).slice();
  };

  /**
   * Close a floating panel (remove without re-docking).
   * @param {string} id
   */
  DockManager.prototype.closeFloating = function (id) {
    if (!this._layout.floating) return;
    for (var i = 0; i < this._layout.floating.length; i++) {
      if (this._layout.floating[i].id === id) {
        this._layout.floating.splice(i, 1);
        break;
      }
    }
    var el = document.querySelector('.dock-floating[data-float-id="' + id + '"]');
    if (el) el.remove();
    this._save();
  };

  // --- Floating DOM Creation ---

  DockManager.prototype._createFloatingElement = function (state, existingContent) {
    var self = this;
    var el = document.createElement('div');
    el.className = 'dock-floating';
    el.setAttribute('data-float-id', state.id);
    el.style.left = state.x + 'px';
    el.style.top = state.y + 'px';
    el.style.width = state.width + 'px';
    el.style.height = state.height + 'px';

    // Header
    var header = document.createElement('div');
    header.className = 'dock-floating__header';

    var title = document.createElement('span');
    title.className = 'dock-floating__title';
    title.textContent = state.title;
    header.appendChild(title);

    var actions = document.createElement('div');
    actions.className = 'dock-floating__actions';

    // Dock button
    var dockBtn = document.createElement('button');
    dockBtn.className = 'dock-floating__btn';
    dockBtn.setAttribute('aria-label', '\u30C9\u30C3\u30AF\u306B\u623B\u3059');
    dockBtn.textContent = '\u25A3';
    dockBtn.addEventListener('click', function () {
      self.snapToDock(state.id);
    });
    actions.appendChild(dockBtn);

    // Close button
    var closeBtn = document.createElement('button');
    closeBtn.className = 'dock-floating__btn';
    closeBtn.setAttribute('aria-label', '\u9589\u3058\u308B');
    closeBtn.textContent = '\u00D7';
    closeBtn.addEventListener('click', function () {
      self.closeFloating(state.id);
    });
    actions.appendChild(closeBtn);

    header.appendChild(actions);
    el.appendChild(header);

    // Content
    var content = document.createElement('div');
    content.className = 'dock-floating__content';
    if (existingContent) {
      // Move content from dock tab panel
      while (existingContent.firstChild) {
        content.appendChild(existingContent.firstChild);
      }
      existingContent.remove();
    }
    el.appendChild(content);

    // Resize handle
    var resizeHandle = document.createElement('div');
    resizeHandle.className = 'dock-floating__resize';
    el.appendChild(resizeHandle);

    document.body.appendChild(el);

    // Bind drag + resize
    this._bindFloatingDrag(el, header, state);
    this._bindFloatingResize(el, resizeHandle, state);

    return el;
  };

  // --- Floating Drag ---

  DockManager.prototype._bindFloatingDrag = function (el, header, state) {
    var self = this;
    var startX = 0;
    var startY = 0;
    var startLeft = 0;
    var startTop = 0;
    var _dragging = false;

    header.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.dock-floating__btn')) return;
      e.preventDefault();
      _dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = el.offsetLeft;
      startTop = el.offsetTop;
      header.setPointerCapture(e.pointerId);
      self._showSnapZones();
    });

    header.addEventListener('pointermove', function (e) {
      if (!_dragging) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      var newLeft = startLeft + dx;
      var newTop = startTop + dy;

      // Clamp to viewport
      newLeft = Math.max(0, Math.min(window.innerWidth - 50, newLeft));
      newTop = Math.max(0, Math.min(window.innerHeight - 50, newTop));

      el.style.left = newLeft + 'px';
      el.style.top = newTop + 'px';

      // Check snap zones
      self._updateSnapHighlight(e.clientX, e.clientY);
    });

    header.addEventListener('pointerup', function (e) {
      if (!_dragging) return;
      _dragging = false;

      // Check if dropped in snap zone
      var snapped = self._checkSnap(e.clientX);
      if (snapped) {
        self.snapToDock(state.id);
      } else {
        // Save position
        state.x = el.offsetLeft;
        state.y = el.offsetTop;
        self._save();
      }
      self._removeSnapZones();
    });

    header.addEventListener('pointercancel', function () {
      _dragging = false;
      self._removeSnapZones();
    });
  };

  // --- Floating Resize ---

  DockManager.prototype._bindFloatingResize = function (el, handle, state) {
    var self = this;
    var startX = 0;
    var startY = 0;
    var startW = 0;
    var startH = 0;
    var _resizing = false;

    handle.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      _resizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startW = el.offsetWidth;
      startH = el.offsetHeight;
      handle.setPointerCapture(e.pointerId);
    });

    handle.addEventListener('pointermove', function (e) {
      if (!_resizing) return;
      var newW = Math.max(FLOAT_MIN_W, startW + (e.clientX - startX));
      var newH = Math.max(FLOAT_MIN_H, startH + (e.clientY - startY));
      el.style.width = newW + 'px';
      el.style.height = newH + 'px';
    });

    handle.addEventListener('pointerup', function () {
      if (!_resizing) return;
      _resizing = false;
      state.width = el.offsetWidth;
      state.height = el.offsetHeight;
      self._save();
    });

    handle.addEventListener('pointercancel', function () {
      _resizing = false;
    });
  };

  // --- Snap Zones ---

  DockManager.prototype._showSnapZones = function () {
    if (document.querySelector('.dock-snap-zone')) return;
    var leftZone = document.createElement('div');
    leftZone.className = 'dock-snap-zone dock-snap-zone--left';
    document.body.appendChild(leftZone);
  };

  DockManager.prototype._updateSnapHighlight = function (clientX) {
    var leftZone = document.querySelector('.dock-snap-zone--left');
    if (leftZone) {
      if (clientX < SNAP_THRESHOLD) {
        leftZone.classList.add('dock-snap-zone--active');
      } else {
        leftZone.classList.remove('dock-snap-zone--active');
      }
    }
  };

  DockManager.prototype._checkSnap = function (clientX) {
    return clientX < SNAP_THRESHOLD;
  };

  DockManager.prototype._removeSnapZones = function () {
    var zones = document.querySelectorAll('.dock-snap-zone');
    for (var i = 0; i < zones.length; i++) zones[i].remove();
  };

  // --- Floating Restore on Load ---

  DockManager.prototype._restoreFloating = function () {
    if (!this._layout.floating || this._layout.floating.length === 0) return;
    var self = this;
    this._layout.floating.forEach(function (state) {
      self._createFloatingElement(state, null);
    });
  };

  // Extend init to restore floating panels
  var _origInit = DockManager.prototype.init;
  DockManager.prototype.init = function () {
    _origInit.call(this);
    // Load floating state
    if (!this._layout.floating) this._layout.floating = [];
    this._restoreFloating();
  };

  // Extend _load to parse floating state
  var _origLoad = DockManager.prototype._load;
  DockManager.prototype._load = function () {
    _origLoad.call(this);
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.floating)) {
          this._layout.floating = parsed.floating.filter(function (f) {
            return f && typeof f.id === 'string' && typeof f.title === 'string';
          });
        }
      }
    } catch (_e) { /* ignore */ }
    if (!this._layout.floating) this._layout.floating = [];
  };

  // Extend _onUIModeChanged to hide/show floating panels
  var _origModeChanged = DockManager.prototype._onUIModeChanged;
  DockManager.prototype._onUIModeChanged = function (mode) {
    _origModeChanged.call(this, mode);
    var floats = document.querySelectorAll('.dock-floating');
    for (var i = 0; i < floats.length; i++) {
      floats[i].style.display = mode === 'normal' ? '' : 'none';
    }
  };

  // --- Layout Presets (Phase 4) ---

  /**
   * Capture current dock layout state (excluding floating panels).
   * Used by loadout system to save layout alongside gadget configuration.
   * @returns {object} { sidebarDock, leftPanel: { visible, width, tabs, activeTab }, rightPanel: { width } }
   */
  DockManager.prototype.captureLayout = function () {
    var lp = this._layout.leftPanel;
    return {
      sidebarDock: this._layout.sidebarDock,
      leftPanel: {
        visible: lp.visible,
        width: lp.width,
        tabs: lp.tabs.map(function (t) { return { id: t.id, title: t.title }; }),
        activeTab: lp.activeTab
      },
      rightPanel: {
        width: this._layout.rightPanel.width
      }
    };
  };

  /**
   * Apply a dock layout from a loadout preset.
   * Restores sidebar position, left panel visibility/width/tabs, and right panel width.
   * Floating panels are intentionally not affected.
   * @param {object} layout - Layout object from captureLayout()
   */
  DockManager.prototype.applyLayout = function (layout) {
    if (!layout || typeof layout !== 'object') return;

    // Sidebar dock position
    if (layout.sidebarDock === 'left' || layout.sidebarDock === 'right') {
      if (this._layout.sidebarDock !== layout.sidebarDock) {
        this._layout.sidebarDock = layout.sidebarDock;
      }
    }

    // Left panel
    if (layout.leftPanel && typeof layout.leftPanel === 'object') {
      var lp = this._layout.leftPanel;
      lp.visible = !!layout.leftPanel.visible;
      if (typeof layout.leftPanel.width === 'number') {
        lp.width = clamp(layout.leftPanel.width, MIN_WIDTH, getMaxWidth());
      }
      if (Array.isArray(layout.leftPanel.tabs)) {
        lp.tabs = layout.leftPanel.tabs.filter(function (t) {
          return t && typeof t.id === 'string' && typeof t.title === 'string';
        });
      }
      if (typeof layout.leftPanel.activeTab === 'number') {
        lp.activeTab = lp.tabs.length > 0
          ? Math.min(layout.leftPanel.activeTab, lp.tabs.length - 1)
          : 0;
      }
    }

    // Right panel width
    if (layout.rightPanel && typeof layout.rightPanel === 'object') {
      if (typeof layout.rightPanel.width === 'number') {
        this._layout.rightPanel.width = clamp(layout.rightPanel.width, MIN_WIDTH, getMaxWidth());
      }
    }

    this._applyLayout();
    this._renderTabs('left');
    this._showActiveTabContent('left');
    this._save();
  };

  // --- Export ---

  root.DockManager = DockManager;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DockManager;
  }
})(typeof window !== 'undefined' ? window : globalThis);
