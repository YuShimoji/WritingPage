/**
 * CanvasViewportController
 * Phase 1: single-node pan/zoom controller for Canvas Mode(beta)
 */
(function () {
  'use strict';

  class CanvasViewportController {
    constructor(options = {}) {
      this.containerEl = options.containerEl || null;
      this.targetEl = options.targetEl || null;
      this.hudEl = options.hudEl || null;
      this.syncTargets = Array.isArray(options.syncTargets)
        ? options.syncTargets.filter((el) => !!el && el !== this.targetEl)
        : [];
      this.onChange = typeof options.onChange === 'function' ? options.onChange : null;

      const initial = options.initialState || {};
      this.state = {
        panX: typeof initial.panX === 'number' ? initial.panX : 0,
        panY: typeof initial.panY === 'number' ? initial.panY : 0,
        zoom: typeof initial.zoom === 'number' ? initial.zoom : 1
      };

      this.minZoom = typeof options.minZoom === 'number' ? options.minZoom : 0.25;
      this.maxZoom = typeof options.maxZoom === 'number' ? options.maxZoom : 4;
      this.zoomStep = typeof options.zoomStep === 'number' ? options.zoomStep : 0.1;
      this.enabled = false;
      this._raf = 0;
      this._isPanning = false;
      this._spacePressed = false;
      this._panPointerId = null;
      this._lastPoint = null;

      this._bindEvents();
      this._scheduleRender();
    }

    _bindEvents() {
      if (!this.containerEl) return;

      this._onPointerDown = (e) => {
        if (!this.enabled) return;
        if (!this._canStartPan(e)) return;
        this._isPanning = true;
        this._panPointerId = e.pointerId;
        this._lastPoint = { x: e.clientX, y: e.clientY };
        this.containerEl.classList.add('canvas-pan-active');
        try { this.containerEl.setPointerCapture(e.pointerId); } catch (_) { }
        e.preventDefault();
      };

      this._onPointerMove = (e) => {
        if (!this.enabled || !this._isPanning || e.pointerId !== this._panPointerId) return;
        if (!this._lastPoint) {
          this._lastPoint = { x: e.clientX, y: e.clientY };
          return;
        }
        const dx = e.clientX - this._lastPoint.x;
        const dy = e.clientY - this._lastPoint.y;
        this._lastPoint = { x: e.clientX, y: e.clientY };
        this.setPan(this.state.panX + dx, this.state.panY + dy);
        e.preventDefault();
      };

      this._onPointerUp = (e) => {
        if (e.pointerId !== this._panPointerId) return;
        this._isPanning = false;
        this._panPointerId = null;
        this._lastPoint = null;
        this.containerEl.classList.remove('canvas-pan-active');
        try { this.containerEl.releasePointerCapture(e.pointerId); } catch (_) { }
      };

      this._onWheel = (e) => {
        if (!this.enabled) return;
        if (!(e.ctrlKey || e.metaKey)) return;
        const delta = e.deltaY > 0 ? -this.zoomStep : this.zoomStep;
        const nextZoom = this._clampZoom(this.state.zoom + delta);
        this.setZoom(nextZoom, { clientX: e.clientX, clientY: e.clientY });
        e.preventDefault();
      };

      this._onKeyDown = (e) => {
        if (e.code === 'Space') {
          this._spacePressed = true;
          if (this.enabled) this.containerEl.classList.add('canvas-pan-ready');
        }
      };

      this._onKeyUp = (e) => {
        if (e.code === 'Space') {
          this._spacePressed = false;
          this.containerEl.classList.remove('canvas-pan-ready');
        }
      };

      this.containerEl.addEventListener('pointerdown', this._onPointerDown);
      this.containerEl.addEventListener('pointermove', this._onPointerMove);
      this.containerEl.addEventListener('pointerup', this._onPointerUp);
      this.containerEl.addEventListener('pointercancel', this._onPointerUp);
      this.containerEl.addEventListener('wheel', this._onWheel, { passive: false });
      window.addEventListener('keydown', this._onKeyDown);
      window.addEventListener('keyup', this._onKeyUp);
    }

    _canStartPan(e) {
      const isMiddleButton = e.button === 1;
      const isSpaceDrag = e.button === 0 && this._spacePressed;
      if (!(isMiddleButton || isSpaceDrag)) return false;

      const target = e.target;
      if (!target) return true;
      const interactive = target.closest('button, a, input, select, [contenteditable="true"]');
      if (interactive && !isMiddleButton) return false;
      return true;
    }

    _clampZoom(zoom) {
      return Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    }

    _scheduleRender() {
      if (this._raf) return;
      this._raf = requestAnimationFrame(() => {
        this._raf = 0;
        this._render();
      });
    }

    _render() {
      const { panX, panY, zoom } = this.state;
      const transform = `translate(${Math.round(panX)}px, ${Math.round(panY)}px) scale(${zoom})`;
      if (this.targetEl) {
        this.targetEl.style.transform = transform;
      }
      if (this.syncTargets && this.syncTargets.length) {
        this.syncTargets.forEach((el) => {
          if (!el) return;
          el.style.transform = transform;
        });
      }

      const zoomLabel = this.hudEl ? this.hudEl.querySelector('#canvas-zoom-label') : null;
      if (zoomLabel) zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
    }

    _emitChange() {
      if (!this.onChange) return;
      this.onChange({ ...this.state });
    }

    setEnabled(enabled) {
      this.enabled = !!enabled;
      if (!this.containerEl) return;
      this.containerEl.classList.toggle('canvas-mode-enabled', this.enabled);
      if (!this.enabled) {
        this._isPanning = false;
        this.containerEl.classList.remove('canvas-pan-active', 'canvas-pan-ready');
        if (this.targetEl) this.targetEl.style.transform = '';
        if (this.syncTargets && this.syncTargets.length) {
          this.syncTargets.forEach((el) => {
            if (el) el.style.transform = '';
          });
        }
        const zoomLabel = this.hudEl ? this.hudEl.querySelector('#canvas-zoom-label') : null;
        if (zoomLabel) zoomLabel.textContent = '100%';
      } else {
        this._scheduleRender();
      }
    }

    setPan(x, y) {
      const nextX = Number.isFinite(x) ? x : this.state.panX;
      const nextY = Number.isFinite(y) ? y : this.state.panY;
      this.state.panX = nextX;
      this.state.panY = nextY;
      this._scheduleRender();
      this._emitChange();
    }

    setZoom(zoom, anchor) {
      const nextZoom = this._clampZoom(zoom);
      const prevZoom = this.state.zoom;
      if (anchor && this.containerEl && prevZoom > 0 && nextZoom > 0) {
        const rect = this.containerEl.getBoundingClientRect();
        const px = anchor.clientX - rect.left;
        const py = anchor.clientY - rect.top;
        const worldX = (px - this.state.panX) / prevZoom;
        const worldY = (py - this.state.panY) / prevZoom;
        this.state.panX = px - worldX * nextZoom;
        this.state.panY = py - worldY * nextZoom;
      }
      this.state.zoom = nextZoom;
      this._scheduleRender();
      this._emitChange();
    }

    zoomBy(delta, anchor) {
      this.setZoom(this.state.zoom + delta, anchor);
    }

    resetView() {
      this.state.panX = 0;
      this.state.panY = 0;
      this.state.zoom = 1;
      this._scheduleRender();
      this._emitChange();
    }

    getState() {
      return { ...this.state };
    }
  }

  window.CanvasViewportController = CanvasViewportController;
})();
