/**
 * gn-core.js - Graphic Novel データモデル
 *
 * GNTextBlock, GNScene, GNCharacter のファクトリと GNTimeline を提供する。
 * 全てのデータは plain object で扱い、class は使わない (既存コードに合わせる)。
 */
(function () {
  'use strict';

  var _idCounter = 0;
  function generateId(prefix) {
    _idCounter += 1;
    return (prefix || 'gn') + '-' + Date.now().toString(36) + '-' + _idCounter;
  }

  // ============================
  // GNTextBlock
  // ============================
  var GNTextBlock = {
    /**
     * テキストブロックを作成する
     * @param {Object} opts
     * @returns {Object} GNTextBlock
     */
    create: function (opts) {
      opts = opts || {};
      return {
        id: opts.id || generateId('block'),
        text: opts.text || '',
        animator: opts.animator || 'dialogue',
        position: Object.assign({ x: 'center', y: 'center' }, opts.position),
        style: Object.assign({
          fontSize: null,
          fontFamily: null,
          color: null,
          opacity: 1
        }, opts.style),
        delay: opts.delay || 0,
        duration: opts.duration || 0,
        speed: opts.speed != null ? opts.speed : 1.0,
        animatorOptions: Object.assign({}, opts.animatorOptions),
        characterId: opts.characterId || null,
        anchorTo: opts.anchorTo || null,
        directives: Array.isArray(opts.directives) ? opts.directives.slice() : []
      };
    }
  };

  // ============================
  // GNScene
  // ============================
  var GNScene = {
    /**
     * シーンを作成する
     * @param {Object} opts
     * @returns {Object} GNScene
     */
    create: function (opts) {
      opts = opts || {};
      var blocks = [];
      if (Array.isArray(opts.blocks)) {
        for (var i = 0; i < opts.blocks.length; i++) {
          blocks.push(GNTextBlock.create(opts.blocks[i]));
        }
      }
      return {
        id: opts.id || generateId('scene'),
        name: opts.name || '',
        preset: opts.preset || null,
        blocks: blocks,
        background: Object.assign({
          color: '#0d1117',
          image: null,
          gradient: null,
          opacity: 1,
          blur: 0
        }, opts.background),
        transition: Object.assign({
          type: 'fade',
          duration: 600
        }, opts.transition),
        duration: opts.duration || 0,
        autoAdvance: opts.autoAdvance || 'click'
      };
    }
  };

  // ============================
  // GNCharacter
  // ============================
  var GNCharacter = {
    /**
     * キャラクターを作成する
     * @param {Object} opts
     * @returns {Object} GNCharacter
     */
    create: function (opts) {
      opts = opts || {};
      return {
        id: opts.id || generateId('char'),
        name: opts.name || '',
        icon: opts.icon || null,
        color: opts.color || '#4a90e2',
        position: opts.position || 'left'
      };
    }
  };

  // ============================
  // GNTimeline
  // ============================
  function GNTimeline() {
    this._entries = [];
    this._startTime = 0;
    this._elapsed = 0;
    this._rafId = null;
    this._paused = false;
    this._running = false;
    this._onTick = null; // external tick callback
  }

  GNTimeline.prototype.schedule = function (timeMs, callback) {
    this._entries.push({ time: timeMs, callback: callback, done: false });
    // 時刻順にソート
    this._entries.sort(function (a, b) { return a.time - b.time; });
    return this;
  };

  GNTimeline.prototype.onTick = function (fn) {
    this._onTick = fn;
    return this;
  };

  GNTimeline.prototype.start = function () {
    if (this._running) return;
    this._running = true;
    this._paused = false;
    this._elapsed = 0;
    this._startTime = performance.now();
    // reset entries
    for (var i = 0; i < this._entries.length; i++) {
      this._entries[i].done = false;
    }
    this._loop();
  };

  GNTimeline.prototype.pause = function () {
    if (!this._running || this._paused) return;
    this._paused = true;
    this._elapsed += performance.now() - this._startTime;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  };

  GNTimeline.prototype.resume = function () {
    if (!this._running || !this._paused) return;
    this._paused = false;
    this._startTime = performance.now();
    this._loop();
  };

  GNTimeline.prototype.stop = function () {
    this._running = false;
    this._paused = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this._entries = [];
    this._elapsed = 0;
  };

  GNTimeline.prototype.getElapsed = function () {
    if (this._paused || !this._running) return this._elapsed;
    return this._elapsed + (performance.now() - this._startTime);
  };

  GNTimeline.prototype._loop = function () {
    var self = this;
    function tick() {
      if (!self._running || self._paused) return;
      var elapsed = self.getElapsed();

      // scheduled callbacks
      for (var i = 0; i < self._entries.length; i++) {
        var entry = self._entries[i];
        if (!entry.done && elapsed >= entry.time) {
          entry.done = true;
          entry.callback(elapsed);
        }
      }

      // external tick
      if (self._onTick) {
        self._onTick(elapsed);
      }

      self._rafId = requestAnimationFrame(tick);
    }
    self._rafId = requestAnimationFrame(tick);
  };

  // ============================
  // GNStorage helper
  // ============================
  var STORAGE_KEY_SCENES = 'zenWriter_graphicNovel:scenes';
  var STORAGE_KEY_CHARACTERS = 'zenWriter_graphicNovel:characters';

  var GNStorage = {
    loadScenes: function () {
      try {
        var raw = localStorage.getItem(STORAGE_KEY_SCENES);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    },
    saveScenes: function (scenes) {
      try {
        localStorage.setItem(STORAGE_KEY_SCENES, JSON.stringify(scenes));
      } catch (e) { /* ignore */ }
    },
    loadCharacters: function () {
      try {
        var raw = localStorage.getItem(STORAGE_KEY_CHARACTERS);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    },
    saveCharacters: function (characters) {
      try {
        localStorage.setItem(STORAGE_KEY_CHARACTERS, JSON.stringify(characters));
      } catch (e) { /* ignore */ }
    }
  };

  // ============================
  // Export
  // ============================
  window.GNCore = {
    TextBlock: GNTextBlock,
    Scene: GNScene,
    Character: GNCharacter,
    Timeline: GNTimeline,
    Storage: GNStorage,
    generateId: generateId
  };
})();
