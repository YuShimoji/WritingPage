/**
 * gn-engine.js - Graphic Novel ステージ再生エンジン
 *
 * GNStage: フルスクリーンオーバーレイで GNScene を順次再生する。
 * body 直下に #gn-stage を動的生成し、z-index: 9000 で表示する。
 */
(function () {
  'use strict';

  var GNCore = window.GNCore;
  var GNAnimators = null; // lazy reference (後で読み込まれるため)

  function emit(eventName, detail) {
    window.dispatchEvent(new CustomEvent(eventName, { detail: detail || {} }));
  }

  // ============================
  // GNStage
  // ============================
  function GNStage() {
    this._el = null;
    this._sceneContainer = null;
    this._controlBar = null;
    this._scenes = [];
    this._currentIndex = -1;
    this._state = 'idle'; // 'idle' | 'playing' | 'paused'
    this._timeline = null;
    this._activeBlocks = []; // { block, state, animator }
    this._boundKeyHandler = this._onKeyDown.bind(this);
    this._boundClickHandler = this._onStageClick.bind(this);
  }

  /**
   * ステージDOMを生成してbody直下に追加
   */
  GNStage.prototype.mount = function () {
    if (this._el) return;

    GNAnimators = window.GNAnimators;

    var el = document.createElement('div');
    el.id = 'gn-stage';
    el.className = 'gn-stage';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Graphic Novel Stage');

    // シーンコンテナ
    var sceneContainer = document.createElement('div');
    sceneContainer.className = 'gn-scene-container';
    el.appendChild(sceneContainer);

    // 閉じるボタン
    var closeBtn = document.createElement('button');
    closeBtn.className = 'gn-close-btn';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '\u00D7';
    closeBtn.addEventListener('click', this.stop.bind(this));
    el.appendChild(closeBtn);

    // コントロールバー
    var controlBar = document.createElement('div');
    controlBar.className = 'gn-control-bar';

    var prevBtn = document.createElement('button');
    prevBtn.className = 'gn-ctrl-btn';
    prevBtn.textContent = '\u25C0';
    prevBtn.setAttribute('aria-label', 'Previous scene');
    prevBtn.addEventListener('click', this.prevScene.bind(this));

    var pauseBtn = document.createElement('button');
    pauseBtn.className = 'gn-ctrl-btn gn-ctrl-pause';
    pauseBtn.textContent = '\u275A\u275A';
    pauseBtn.setAttribute('aria-label', 'Pause');
    var self = this;
    pauseBtn.addEventListener('click', function () {
      if (self._state === 'playing') {
        self.pause();
        pauseBtn.textContent = '\u25B6';
        pauseBtn.setAttribute('aria-label', 'Play');
      } else if (self._state === 'paused') {
        self.resume();
        pauseBtn.textContent = '\u275A\u275A';
        pauseBtn.setAttribute('aria-label', 'Pause');
      }
    });

    var nextBtn = document.createElement('button');
    nextBtn.className = 'gn-ctrl-btn';
    nextBtn.textContent = '\u25B6';
    nextBtn.setAttribute('aria-label', 'Next scene');
    nextBtn.addEventListener('click', this.nextScene.bind(this));

    var sceneLabel = document.createElement('span');
    sceneLabel.className = 'gn-scene-label';
    this._sceneLabel = sceneLabel;

    controlBar.appendChild(prevBtn);
    controlBar.appendChild(pauseBtn);
    controlBar.appendChild(nextBtn);
    controlBar.appendChild(sceneLabel);

    el.appendChild(controlBar);

    document.body.appendChild(el);
    this._el = el;
    this._sceneContainer = sceneContainer;
    this._controlBar = controlBar;

    // キーボードイベント
    document.addEventListener('keydown', this._boundKeyHandler);
    // クリックでシーン進行
    sceneContainer.addEventListener('click', this._boundClickHandler);
  };

  /**
   * ステージDOMを除去
   */
  GNStage.prototype.unmount = function () {
    this._destroyActiveBlocks();
    if (this._timeline) {
      this._timeline.stop();
      this._timeline = null;
    }
    document.removeEventListener('keydown', this._boundKeyHandler);
    if (this._el) {
      this._el.remove();
      this._el = null;
      this._sceneContainer = null;
      this._controlBar = null;
      this._sceneLabel = null;
    }
    this._state = 'idle';
    this._currentIndex = -1;
  };

  /**
   * シーン配列をセット
   */
  GNStage.prototype.loadScenes = function (scenes) {
    this._scenes = [];
    if (Array.isArray(scenes)) {
      for (var i = 0; i < scenes.length; i++) {
        this._scenes.push(GNCore.Scene.create(scenes[i]));
      }
    }
    return this;
  };

  /**
   * 再生開始
   */
  GNStage.prototype.play = function () {
    if (this._scenes.length === 0) return;
    this.mount();
    this._state = 'playing';
    this._currentIndex = -1;
    this.nextScene();
    emit('ZWGraphicNovel:play', { sceneCount: this._scenes.length });
  };

  /**
   * 一時停止
   */
  GNStage.prototype.pause = function () {
    if (this._state !== 'playing') return;
    this._state = 'paused';
    if (this._timeline) this._timeline.pause();
  };

  /**
   * 再開
   */
  GNStage.prototype.resume = function () {
    if (this._state !== 'paused') return;
    this._state = 'playing';
    if (this._timeline) this._timeline.resume();
  };

  /**
   * 停止してアンマウント
   */
  GNStage.prototype.stop = function () {
    this.unmount();
    emit('ZWGraphicNovel:stop');
  };

  /**
   * 次のシーンへ
   */
  GNStage.prototype.nextScene = function () {
    if (this._currentIndex < this._scenes.length - 1) {
      this.goToScene(this._currentIndex + 1);
    } else {
      // 最後のシーンの後は停止
      this.stop();
    }
  };

  /**
   * 前のシーンへ
   */
  GNStage.prototype.prevScene = function () {
    if (this._currentIndex > 0) {
      this.goToScene(this._currentIndex - 1);
    }
  };

  /**
   * 指定シーンへジャンプ
   */
  GNStage.prototype.goToScene = function (index) {
    if (index < 0 || index >= this._scenes.length) return;
    var scene = this._scenes[index];
    var prevScene = this._currentIndex >= 0 ? this._scenes[this._currentIndex] : null;
    this._currentIndex = index;

    this._updateSceneLabel();

    if (prevScene) {
      this._transitionTo(scene, scene.transition);
    } else {
      this._renderScene(scene);
    }

    emit('ZWGraphicNovel:sceneChange', { index: index, scene: scene });
  };

  // ============================
  // Internal
  // ============================

  GNStage.prototype._updateSceneLabel = function () {
    if (!this._sceneLabel) return;
    var scene = this._scenes[this._currentIndex];
    var label = (this._currentIndex + 1) + '/' + this._scenes.length;
    if (scene && scene.name) label = scene.name + ' (' + label + ')';
    this._sceneLabel.textContent = label;
  };

  GNStage.prototype._renderScene = function (scene) {
    this._destroyActiveBlocks();
    if (this._timeline) this._timeline.stop();

    // 背景適用
    this._applyBackground(scene.background);

    // シーンコンテナをクリア
    this._sceneContainer.innerHTML = '';

    // タイムライン作成
    var timeline = new GNCore.Timeline();
    this._timeline = timeline;

    var activeBlocks = this._activeBlocks;
    var sceneContainer = this._sceneContainer;
    var characters = GNCore.Storage.loadCharacters();

    // ブロックをdelay順にスケジュール
    var blocks = scene.blocks.slice().sort(function (a, b) { return a.delay - b.delay; });

    for (var i = 0; i < blocks.length; i++) {
      (function (block) {
        timeline.schedule(block.delay, function () {
          var animatorName = block.animator || 'dialogue';
          var animatorDef = GNAnimators ? GNAnimators.get(animatorName) : null;
          if (!animatorDef) return;

          // キャラクター情報を注入
          if (block.characterId) {
            for (var c = 0; c < characters.length; c++) {
              if (characters[c].id === block.characterId) {
                block._character = characters[c];
                break;
              }
            }
          }

          var state = animatorDef.create(block, sceneContainer);
          if (state) {
            state._animatorDef = animatorDef;
            state._block = block;
            activeBlocks.push(state);
          }
        });
      })(blocks[i]);
    }

    // 毎フレームでアクティブブロックのupdateを呼ぶ
    timeline.onTick(function (elapsed) {
      for (var j = 0; j < activeBlocks.length; j++) {
        var s = activeBlocks[j];
        if (s._animatorDef && s._animatorDef.update) {
          s._animatorDef.update(s, elapsed);
        }
      }
    });

    // auto-advance: timer
    if (scene.autoAdvance === 'timer' && scene.duration > 0) {
      var stage = this;
      timeline.schedule(scene.duration, function () {
        stage.nextScene();
      });
    }

    timeline.start();
    this._state = 'playing';
  };

  GNStage.prototype._applyBackground = function (bg) {
    if (!this._el) return;
    var style = this._el.style;
    style.backgroundColor = bg.color || '#0d1117';

    if (bg.gradient) {
      style.backgroundImage = bg.gradient;
    } else if (bg.image) {
      style.backgroundImage = 'url(' + bg.image + ')';
      style.backgroundSize = 'cover';
      style.backgroundPosition = 'center';
    } else {
      style.backgroundImage = 'none';
    }

    if (bg.blur && bg.blur > 0) {
      // blur は backdrop-filter を使う
      this._sceneContainer.style.backdropFilter = 'blur(' + bg.blur + 'px)';
    } else {
      this._sceneContainer.style.backdropFilter = 'none';
    }
  };

  GNStage.prototype._transitionTo = function (scene, transition) {
    var type = transition && transition.type || 'fade';
    var duration = transition && transition.duration || 600;
    var self = this;

    if (type === 'cut') {
      self._renderScene(scene);
      return;
    }

    if (type === 'slide') {
      // slide: 現在のシーンを左にスライドアウトし、新シーンを右からスライドイン
      if (self._sceneContainer) {
        var halfDur = duration + 'ms';
        self._sceneContainer.style.transition = 'transform ' + halfDur + ' ease-in-out, opacity ' + halfDur + ' ease';
        self._sceneContainer.style.transform = 'translateX(-100%)';
        self._sceneContainer.style.opacity = '0';

        setTimeout(function () {
          self._sceneContainer.style.transition = 'none';
          self._sceneContainer.style.transform = 'translateX(100%)';
          self._renderScene(scene);

          // force reflow
          void self._sceneContainer.offsetWidth;

          self._sceneContainer.style.transition = 'transform ' + halfDur + ' ease-in-out, opacity ' + halfDur + ' ease';
          self._sceneContainer.style.transform = 'translateX(0)';
          self._sceneContainer.style.opacity = '1';

          setTimeout(function () {
            if (self._sceneContainer) {
              self._sceneContainer.style.transition = '';
            }
          }, duration);
        }, duration);
      }
      return;
    }

    // fade transition (default)
    if (self._sceneContainer) {
      self._sceneContainer.style.transition = 'opacity ' + duration + 'ms ease';
      self._sceneContainer.style.opacity = '0';

      setTimeout(function () {
        self._renderScene(scene);
        if (self._sceneContainer) {
          self._sceneContainer.style.opacity = '1';
          // transition解除
          setTimeout(function () {
            if (self._sceneContainer) {
              self._sceneContainer.style.transition = '';
            }
          }, duration);
        }
      }, duration);
    }
  };

  GNStage.prototype._destroyActiveBlocks = function () {
    for (var i = 0; i < this._activeBlocks.length; i++) {
      var s = this._activeBlocks[i];
      if (s._animatorDef && s._animatorDef.destroy) {
        s._animatorDef.destroy(s);
      }
    }
    this._activeBlocks = [];
  };

  GNStage.prototype._onKeyDown = function (e) {
    if (this._state === 'idle') return;

    switch (e.key) {
    case 'Escape':
      e.preventDefault();
      this.stop();
      break;
    case 'ArrowRight':
    case ' ':
      e.preventDefault();
      this.nextScene();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      this.prevScene();
      break;
    case 'p':
      e.preventDefault();
      if (this._state === 'playing') this.pause();
      else if (this._state === 'paused') this.resume();
      break;
    }
  };

  GNStage.prototype._onStageClick = function () {
    var scene = this._scenes[this._currentIndex];
    if (scene && scene.autoAdvance === 'click') {
      this.nextScene();
    }
  };

  // ============================
  // Export (singleton)
  // ============================
  window.GNEngine = new GNStage();
})();
