/**
 * gn-animators.js - Graphic Novel アニメータレジストリ + 4種アニメータ
 *
 * プラグイン方式で create/update/destroy インターフェースを持つアニメータを登録する。
 * dialogue / tree / wordcloud / anchored の4種を提供。
 */
(function () {
  'use strict';

  var GNAnimators = {
    _registry: {},

    /**
     * アニメータを登録する
     * @param {string} name
     * @param {Object} animator - { create, update, destroy }
     */
    register: function (name, animator) {
      this._registry[name] = animator;
    },

    /**
     * アニメータを取得する
     * @param {string} name
     * @returns {Object|null}
     */
    get: function (name) {
      return this._registry[name] || null;
    },

    /**
     * 登録済みアニメータ名一覧
     * @returns {string[]}
     */
    list: function () {
      return Object.keys(this._registry);
    }
  };

  // ============================
  // DialogueRenderer
  // ============================
  var DialogueRenderer = {
    _renderers: {},

    /**
     * サブレンダラーを登録
     * @param {string} name
     * @param {Object} renderer - { create, update, destroy }
     */
    registerRenderer: function (name, renderer) {
      this._renderers[name] = renderer;
    },

    /**
     * サブレンダラーを取得
     * @param {string} name
     * @returns {Object|null}
     */
    getRenderer: function (name) {
      return this._renderers[name] || null;
    },

    create: function (block, container) {
      var rendererName = (block.animatorOptions && block.animatorOptions.renderer) || 'window';
      var renderer = this._renderers[rendererName];
      if (!renderer) {
        // fallback: window
        renderer = this._renderers.window;
      }
      if (!renderer) return null;

      var character = block._character || null;
      var state = renderer.create(block, character, container);
      if (state) {
        state._renderer = renderer;
        state._rendererName = rendererName;
      }
      return state;
    },

    update: function (state, elapsed) {
      if (state._renderer && state._renderer.update) {
        state._renderer.update(state, elapsed);
      }
    },

    destroy: function (state) {
      if (state._renderer && state._renderer.destroy) {
        state._renderer.destroy(state);
      }
    }
  };

  // DialogueRenderer をアニメータとして登録
  GNAnimators.register('dialogue', DialogueRenderer);

  // ============================
  // TreeAnimator
  // ============================
  // テキストを文節/文で分割し、SVGラインで接続しながら樹状に成長表示する。

  function _splitTextToSegments(text) {
    // 句点・読点・改行で分割し、空を除去
    var raw = text.split(/([。！？\n]+)/);
    var segments = [];
    for (var i = 0; i < raw.length; i++) {
      var s = raw[i].trim();
      if (s) segments.push(s);
    }
    if (segments.length === 0 && text.trim()) segments.push(text.trim());
    return segments;
  }

  var TreeAnimator = {
    create: function (block, container) {
      var opts = block.animatorOptions || {};
      var direction = opts.direction || 'bottom-up';
      var branchAngle = opts.branchAngle || 25;
      var nodeSpacing = opts.nodeSpacing || 70;
      var speed = block.speed != null ? block.speed : 1.0;

      var segments = _splitTextToSegments(block.text || '');
      if (segments.length === 0) return null;

      // コンテナ
      var treeEl = document.createElement('div');
      treeEl.className = 'gn-tree';
      treeEl.style.position = 'absolute';
      treeEl.style.inset = '0';

      // SVG for lines
      var svgNS = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('class', 'gn-tree-svg');
      svg.style.position = 'absolute';
      svg.style.inset = '0';
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.pointerEvents = 'none';
      treeEl.appendChild(svg);

      // ノードをツリー構造で配置計算
      var centerX = container.offsetWidth ? container.offsetWidth / 2 : 400;
      var startY = direction === 'bottom-up'
        ? (container.offsetHeight || 600) - 60
        : 60;
      var yStep = direction === 'bottom-up' ? -nodeSpacing : nodeSpacing;

      var nodes = [];
      var lines = [];

      for (var i = 0; i < segments.length; i++) {
        // 交互に左右に分岐
        var depth = i;
        var angle = (depth % 2 === 0 ? -1 : 1) * branchAngle * (Math.ceil(depth / 2));
        var rad = angle * Math.PI / 180;
        var x = centerX + Math.sin(rad) * (depth * 30);
        var y = startY + yStep * i;

        var nodeEl = document.createElement('div');
        nodeEl.className = 'gn-tree-node';
        nodeEl.textContent = segments[i];
        nodeEl.style.position = 'absolute';
        nodeEl.style.left = x + 'px';
        nodeEl.style.top = y + 'px';
        nodeEl.style.transform = 'translate(-50%, -50%)';
        nodeEl.style.opacity = '0';

        if (block.style && block.style.color) {
          nodeEl.style.color = block.style.color;
        }

        treeEl.appendChild(nodeEl);
        nodes.push({ el: nodeEl, x: x, y: y, revealed: false });

        // SVG line to parent
        if (i > 0) {
          var parent = nodes[i - 1];
          var line = document.createElementNS(svgNS, 'line');
          line.setAttribute('x1', parent.x);
          line.setAttribute('y1', parent.y);
          line.setAttribute('x2', x);
          line.setAttribute('y2', y);
          line.setAttribute('class', 'gn-tree-line');
          line.style.opacity = '0';

          // stroke-dasharray for drawing animation
          var len = Math.sqrt(Math.pow(x - parent.x, 2) + Math.pow(y - parent.y, 2));
          line.setAttribute('stroke-dasharray', len);
          line.setAttribute('stroke-dashoffset', len);

          svg.appendChild(line);
          lines.push({ el: line, length: len, revealed: false, fromNode: i - 1, toNode: i });
        }
      }

      container.appendChild(treeEl);

      return {
        el: treeEl,
        svg: svg,
        nodes: nodes,
        lines: lines,
        revealInterval: 600 / speed, // ms per node
        startTime: null
      };
    },

    update: function (state, elapsed) {
      if (state.startTime === null) state.startTime = elapsed;
      var dt = elapsed - state.startTime;

      for (var i = 0; i < state.nodes.length; i++) {
        var nodeTime = i * state.revealInterval;
        var lineTime = nodeTime + state.revealInterval * 0.3;

        // Reveal line first (drawing animation)
        if (i > 0 && i - 1 < state.lines.length) {
          var lineState = state.lines[i - 1];
          if (!lineState.revealed && dt >= lineTime - state.revealInterval * 0.5) {
            lineState.revealed = true;
            lineState.el.style.opacity = '1';
            lineState.el.style.transition = 'stroke-dashoffset ' + (state.revealInterval * 0.6) + 'ms ease-out';
            lineState.el.setAttribute('stroke-dashoffset', '0');
          }
        }

        // Reveal node
        var node = state.nodes[i];
        if (!node.revealed && dt >= nodeTime) {
          node.revealed = true;
          node.el.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
          node.el.style.opacity = '1';
        }
      }
    },

    destroy: function (state) {
      if (state.el && state.el.parentNode) {
        state.el.parentNode.removeChild(state.el);
      }
    }
  };

  GNAnimators.register('tree', TreeAnimator);

  // ============================
  // WordCloudAnimator
  // ============================
  // テキストをトークナイズし、ランダムな位置・サイズ・角度で出現させて流動させる。

  function _tokenize(text, mode) {
    if (mode === 'word') {
      return text.split(/\s+/).filter(function (w) { return w.length > 0; });
    }
    // sentence (default): 句点・読点区切り
    var parts = text.split(/([。、！？\n,.!?]+)/);
    var tokens = [];
    for (var i = 0; i < parts.length; i++) {
      var t = parts[i].trim();
      if (t) tokens.push(t);
    }
    if (tokens.length === 0 && text.trim()) tokens.push(text.trim());
    return tokens;
  }

  var WordCloudAnimator = {
    create: function (block, container) {
      var opts = block.animatorOptions || {};
      var tokenMode = opts.tokenize || 'sentence';
      var sizeRange = opts.sizeRange || [14, 42];
      var flowSpeed = (opts.flowSpeed != null ? opts.flowSpeed : 0.5) * (block.speed || 1.0);
      var staggerMs = opts.staggerMs || 300;
      var fadeInDuration = opts.fadeInDuration || 600;

      var tokens = _tokenize(block.text || '', tokenMode);
      if (tokens.length === 0) return null;

      var cloudEl = document.createElement('div');
      cloudEl.className = 'gn-wordcloud';
      cloudEl.style.position = 'absolute';
      cloudEl.style.inset = '0';
      cloudEl.style.overflow = 'hidden';

      var w = container.offsetWidth || 800;
      var h = container.offsetHeight || 500;

      var items = [];
      for (var i = 0; i < tokens.length; i++) {
        var el = document.createElement('span');
        el.className = 'gn-wordcloud-token';
        el.textContent = tokens[i];

        var size = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
        var x = Math.random() * (w - 100);
        var y = Math.random() * (h - 50);
        var rotation = (Math.random() - 0.5) * 30; // -15 ~ +15 deg
        var vx = (Math.random() - 0.5) * flowSpeed * 0.8;
        var vy = (Math.random() - 0.5) * flowSpeed * 0.4;

        el.style.position = 'absolute';
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.fontSize = size + 'px';
        el.style.transform = 'rotate(' + rotation + 'deg)';
        el.style.opacity = '0';

        if (block.style && block.style.color) {
          el.style.color = block.style.color;
        }

        cloudEl.appendChild(el);
        items.push({
          el: el, x: x, y: y, vx: vx, vy: vy,
          size: size, rotation: rotation,
          revealAt: i * staggerMs,
          revealed: false, fadeInDuration: fadeInDuration
        });
      }

      container.appendChild(cloudEl);

      return {
        el: cloudEl,
        items: items,
        containerW: w,
        containerH: h,
        startTime: null,
        lastUpdate: null
      };
    },

    update: function (state, elapsed) {
      if (state.startTime === null) {
        state.startTime = elapsed;
        state.lastUpdate = elapsed;
      }

      var dt = elapsed - state.startTime;
      var frameDt = (elapsed - state.lastUpdate) / 1000; // seconds
      state.lastUpdate = elapsed;

      for (var i = 0; i < state.items.length; i++) {
        var item = state.items[i];

        // stagger reveal
        if (!item.revealed && dt >= item.revealAt) {
          item.revealed = true;
          item.el.style.transition = 'opacity ' + item.fadeInDuration + 'ms ease-out';
          item.el.style.opacity = '1';
        }

        if (!item.revealed) continue;

        // move
        item.x += item.vx * frameDt * 60;
        item.y += item.vy * frameDt * 60;

        // wrap around
        if (item.x < -100) item.x = state.containerW;
        if (item.x > state.containerW + 50) item.x = -80;
        if (item.y < -50) item.y = state.containerH;
        if (item.y > state.containerH + 30) item.y = -30;

        item.el.style.left = item.x + 'px';
        item.el.style.top = item.y + 'px';
      }
    },

    destroy: function (state) {
      if (state.el && state.el.parentNode) {
        state.el.parentNode.removeChild(state.el);
      }
    }
  };

  GNAnimators.register('wordcloud', WordCloudAnimator);

  // ============================
  // AnchoredTextRenderer
  // ============================
  // 指定位置に固定表示するテキスト。背景画像紐づけ、パネルスタイル対応。

  var AnchoredTextRenderer = {
    create: function (block, container) {
      var opts = block.animatorOptions || {};
      var textEffect = opts.textEffect || 'fade';
      var panelStyle = opts.panelStyle || 'glass'; // 'glass' | 'solid' | 'none'

      var el = document.createElement('div');
      el.className = 'gn-anchored';

      // position
      var pos = block.position || {};
      if (pos.x != null) {
        el.style.left = typeof pos.x === 'number' ? pos.x + 'px' : pos.x;
      } else {
        el.style.left = '50%';
      }
      if (pos.y != null) {
        el.style.top = typeof pos.y === 'number' ? pos.y + 'px' : pos.y;
      } else {
        el.style.top = '50%';
      }
      el.style.transform = 'translate(-50%, -50%)';

      // panel style
      if (panelStyle === 'glass') {
        el.classList.add('gn-anchored--glass');
      } else if (panelStyle === 'solid') {
        el.classList.add('gn-anchored--solid');
      }
      // 'none': no extra class

      // style overrides
      if (block.style) {
        if (block.style.fontSize) el.style.fontSize = block.style.fontSize;
        if (block.style.color) el.style.color = block.style.color;
        if (block.style.opacity != null) el.dataset.targetOpacity = block.style.opacity;
      }

      var textEl = document.createElement('div');
      textEl.className = 'gn-anchored-text';
      el.appendChild(textEl);

      container.appendChild(el);

      // initial hidden state
      el.style.opacity = '0';

      var speed = block.speed != null ? block.speed : 1.0;

      return {
        el: el,
        textEl: textEl,
        text: block.text || '',
        textEffect: textEffect,
        speed: speed,
        startTime: null,
        phase: 'waiting', // 'waiting' | 'animating' | 'complete'
        charIndex: 0
      };
    },

    update: function (state, elapsed) {
      if (state.phase === 'complete') return;

      if (state.startTime === null) {
        state.startTime = elapsed;
      }

      var dt = elapsed - state.startTime;
      var targetOpacity = state.el.dataset.targetOpacity
        ? parseFloat(state.el.dataset.targetOpacity) : 1;

      if (state.phase === 'waiting') {
        state.phase = 'animating';

        if (state.textEffect === 'fade') {
          state.el.style.transition = 'opacity 0.8s ease-out';
          state.el.style.opacity = String(targetOpacity);
          state.textEl.textContent = state.text;
          // mark complete after fade
          state.phase = 'complete';
        } else if (state.textEffect === 'typewriter') {
          state.el.style.opacity = String(targetOpacity);
          state.charsPerSecond = 18 * state.speed;
        } else if (state.textEffect === 'slide') {
          state.el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
          state.el.style.opacity = String(targetOpacity);
          state.el.style.transform = 'translate(-50%, -50%)';
          state.textEl.textContent = state.text;
          state.phase = 'complete';
        } else {
          // fallback: instant
          state.el.style.opacity = String(targetOpacity);
          state.textEl.textContent = state.text;
          state.phase = 'complete';
        }
      }

      // typewriter update
      if (state.textEffect === 'typewriter' && state.phase === 'animating') {
        var charDt = dt / 1000;
        var target = Math.floor(charDt * state.charsPerSecond);
        if (target > state.text.length) target = state.text.length;

        if (target !== state.charIndex) {
          state.charIndex = target;
          state.textEl.textContent = state.text.substring(0, target);
          if (target >= state.text.length) {
            state.textEl.textContent = state.text;
            state.phase = 'complete';
          }
        }
      }
    },

    destroy: function (state) {
      if (state.el && state.el.parentNode) {
        state.el.parentNode.removeChild(state.el);
      }
    }
  };

  GNAnimators.register('anchored', AnchoredTextRenderer);

  // ============================
  // Export
  // ============================
  window.GNAnimators = GNAnimators;
  window.GNDialogueRenderer = DialogueRenderer;
})();
