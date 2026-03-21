/**
 * DockManager — SP-076 Phase 1
 * Manages sidebar left/right docking, left dock panel, resize, and layout persistence.
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
      leftPanel: { visible: false, width: DEFAULT_LEFT_WIDTH },
      rightPanel: { visible: true, width: DEFAULT_SIDEBAR_WIDTH }
    };
    this._resizing = false;
  }

  DockManager.prototype.init = function () {
    this._load();
    this._applyLayout();
    this._bindControls();
    this._initResizeHandles();
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
          }
        }
      }
    } catch (_e) { /* ignore */ }
  };

  DockManager.prototype._save = function () {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._layout));
    } catch (_e) { /* ignore */ }
  };

  // --- Layout Application ---

  DockManager.prototype._applyLayout = function () {
    var html = document.documentElement;
    var mode = html.getAttribute('data-ui-mode') || 'normal';

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

    // Update move button label
    this._updateMoveButton();
  };

  DockManager.prototype._updateMoveButton = function () {
    var btn = document.getElementById('dock-move-sidebar');
    if (!btn) return;
    var span = btn.querySelector('span');
    if (span) {
      span.textContent = this._layout.sidebarDock === 'left' ? '\u53F3\u306B\u79FB\u52D5' : '\u5DE6\u306B\u79FB\u52D5';
    }
  };

  // --- Public API ---

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

    function onPointerDown(e) {
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

      handle.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e) {
      if (!self._resizing) return;
      var delta = e.clientX - startX;
      var newWidth;

      if (side === 'left') {
        newWidth = clamp(startWidth + delta, MIN_WIDTH, getMaxWidth());
        document.documentElement.style.setProperty('--dock-left-width', newWidth + 'px');
      } else {
        // Sidebar: if docked right, drag left = increase width
        var dockSide = self._layout.sidebarDock;
        if (dockSide === 'right') {
          newWidth = clamp(startWidth - delta, MIN_WIDTH, getMaxWidth());
        } else {
          newWidth = clamp(startWidth + delta, MIN_WIDTH, getMaxWidth());
        }
        document.documentElement.style.setProperty('--sidebar-width', newWidth + 'px');
      }
    }

    function onPointerUp() {
      if (!self._resizing) return;
      self._resizing = false;
      handle.classList.remove('dock-resize-handle--active');

      // Save final width
      if (side === 'left') {
        var panel = document.getElementById('dock-panel-left');
        if (panel) self.setDockWidth('left', panel.offsetWidth);
      }
    }

    handle.addEventListener('pointerdown', onPointerDown);
    handle.addEventListener('pointermove', onPointerMove);
    handle.addEventListener('pointerup', onPointerUp);
    handle.addEventListener('pointercancel', onPointerUp);
  };

  // --- Export ---

  root.DockManager = DockManager;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DockManager;
  }
})(typeof window !== 'undefined' ? window : globalThis);
