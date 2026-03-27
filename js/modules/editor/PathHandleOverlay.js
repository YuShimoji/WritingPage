/**
 * PathHandleOverlay (SP-073 Phase 2)
 * WYSIWYG上でパステキストのベジェ制御点をドラッグ編集するオーバーレイUI。
 *
 * 責務:
 * - SVGパスコマンド (M/Q/C/A) のパース・シリアライズ
 * - 制御点ハンドル(SVG circle)の描画・ドラッグ
 * - ドラッグ結果を data-path 属性と DSL に反映
 */
(function (root) {
  'use strict';

  // ---- SVG Path Command Parser ----

  // コマンド文字 + 後続数値列を分割
  var CMD_RE = /([MmLlHhVvQqTtCcSsAaZz])([^MmLlHhVvQqTtCcSsAaZz]*)/g;
  var NUM_RE = /-?\d+\.?\d*(?:e[+-]?\d+)?/gi;

  function parseNumbers(str) {
    var m = String(str || '').match(NUM_RE);
    return m ? m.map(Number) : [];
  }

  /**
   * パス文字列 → コマンド配列
   * 各要素: { cmd: 'M', args: [x, y], absolute: true }
   */
  function parsePath(d) {
    var commands = [];
    var match;
    CMD_RE.lastIndex = 0;
    while ((match = CMD_RE.exec(d)) !== null) {
      var letter = match[1];
      var nums = parseNumbers(match[2]);
      commands.push({
        cmd: letter.toUpperCase(),
        args: nums,
        absolute: letter === letter.toUpperCase()
      });
    }
    return commands;
  }

  /**
   * コマンド配列 → パス文字列
   */
  function serializePath(commands) {
    return commands.map(function (c) {
      var letter = c.absolute ? c.cmd : c.cmd.toLowerCase();
      if (c.cmd === 'Z') return letter;
      return letter + ' ' + c.args.map(function (n) {
        return Math.round(n * 100) / 100;
      }).join(' ');
    }).join(' ');
  }

  /**
   * コマンド配列から編集可能な制御点を抽出。
   * 戻り値: [{ x, y, type: 'endpoint'|'control', cmdIndex, argIndex }]
   * argIndex はコマンドの args 配列中の X 座標インデックス (Y = argIndex+1)
   */
  function extractPoints(commands) {
    var points = [];
    for (var i = 0; i < commands.length; i++) {
      var c = commands[i];
      switch (c.cmd) {
        case 'M':
        case 'L':
          points.push({ x: c.args[0], y: c.args[1], type: 'endpoint', cmdIndex: i, argIndex: 0 });
          break;
        case 'Q': // x1,y1 x,y
          points.push({ x: c.args[0], y: c.args[1], type: 'control', cmdIndex: i, argIndex: 0 });
          points.push({ x: c.args[2], y: c.args[3], type: 'endpoint', cmdIndex: i, argIndex: 2 });
          break;
        case 'C': // x1,y1 x2,y2 x,y
          points.push({ x: c.args[0], y: c.args[1], type: 'control', cmdIndex: i, argIndex: 0 });
          points.push({ x: c.args[2], y: c.args[3], type: 'control', cmdIndex: i, argIndex: 2 });
          points.push({ x: c.args[4], y: c.args[5], type: 'endpoint', cmdIndex: i, argIndex: 4 });
          break;
        case 'S': // x2,y2 x,y
          points.push({ x: c.args[0], y: c.args[1], type: 'control', cmdIndex: i, argIndex: 0 });
          points.push({ x: c.args[2], y: c.args[3], type: 'endpoint', cmdIndex: i, argIndex: 2 });
          break;
        case 'T': // x,y
          points.push({ x: c.args[0], y: c.args[1], type: 'endpoint', cmdIndex: i, argIndex: 0 });
          break;
        case 'A': // rx ry rotation large-arc sweep x y
          // 終点のみ編集可能
          points.push({ x: c.args[5], y: c.args[6], type: 'endpoint', cmdIndex: i, argIndex: 5 });
          break;
        // H, V は単軸 — Phase 2 では非対応（稀）
      }
    }
    return points;
  }

  /**
   * 制御点の移動をコマンド配列に反映
   */
  function applyPointMove(commands, point, newX, newY) {
    var c = commands[point.cmdIndex];
    if (!c) return;
    c.args[point.argIndex] = newX;
    c.args[point.argIndex + 1] = newY;
  }

  // ---- ガイドライン生成 ----

  /**
   * 制御点と端点を結ぶガイドラインのペアを生成
   * 戻り値: [{ x1, y1, x2, y2 }]
   */
  function buildGuideLines(commands, points) {
    var lines = [];
    // 直前の端点を追跡
    var lastEndpoint = null;
    for (var i = 0; i < points.length; i++) {
      var pt = points[i];
      if (pt.type === 'endpoint') {
        lastEndpoint = pt;
      } else if (pt.type === 'control' && lastEndpoint) {
        lines.push({ x1: lastEndpoint.x, y1: lastEndpoint.y, x2: pt.x, y2: pt.y });
      }
    }
    // 制御点 → 次の端点
    for (var j = 0; j < points.length; j++) {
      if (points[j].type === 'control') {
        // 同一コマンド内の次の端点を探す
        for (var k = j + 1; k < points.length; k++) {
          if (points[k].cmdIndex !== points[j].cmdIndex) break;
          if (points[k].type === 'endpoint') {
            lines.push({ x1: points[j].x, y1: points[j].y, x2: points[k].x, y2: points[k].y });
            break;
          }
        }
      }
    }
    return lines;
  }

  // ---- SVG Namespace ----
  var SVG_NS = 'http://www.w3.org/2000/svg';

  // ---- Overlay Class ----

  function PathHandleOverlay() {
    this._activeTarget = null;   // 現在選択中の .zw-pathtext 要素
    this._overlayG = null;       // SVG <g> ハンドルグループ
    this._commands = [];
    this._points = [];
    this._dragging = null;
    this._onPointerMove = this._handlePointerMove.bind(this);
    this._onPointerUp = this._handlePointerUp.bind(this);
  }

  PathHandleOverlay.prototype.attach = function (pathtextDiv) {
    if (this._activeTarget === pathtextDiv) return;
    this.detach();

    var svg = pathtextDiv.querySelector('.zw-pathtext__svg');
    if (!svg) return;

    var pathD = pathtextDiv.getAttribute('data-path') || '';
    if (!pathD) return;

    this._activeTarget = pathtextDiv;
    this._commands = parsePath(pathD);
    this._points = extractPoints(this._commands);

    // オーバーレイ <g> を SVG 末尾に追加
    var g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'zw-pathtext-handles');
    svg.appendChild(g);
    this._overlayG = g;

    this._render();

    pathtextDiv.classList.add('zw-pathtext--editing');
  };

  PathHandleOverlay.prototype.detach = function () {
    if (this._overlayG && this._overlayG.parentNode) {
      this._overlayG.parentNode.removeChild(this._overlayG);
    }
    if (this._activeTarget) {
      this._activeTarget.classList.remove('zw-pathtext--editing');
    }
    this._activeTarget = null;
    this._overlayG = null;
    this._commands = [];
    this._points = [];
    this._dragging = null;
  };

  PathHandleOverlay.prototype.isAttached = function () {
    return !!this._activeTarget;
  };

  PathHandleOverlay.prototype.getTarget = function () {
    return this._activeTarget;
  };

  PathHandleOverlay.prototype._render = function () {
    if (!this._overlayG) return;
    // クリア
    while (this._overlayG.firstChild) this._overlayG.removeChild(this._overlayG.firstChild);

    var self = this;

    // ガイドライン描画
    var lines = buildGuideLines(this._commands, this._points);
    lines.forEach(function (ln) {
      var line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', ln.x1);
      line.setAttribute('y1', ln.y1);
      line.setAttribute('x2', ln.x2);
      line.setAttribute('y2', ln.y2);
      line.setAttribute('class', 'zw-pathtext-handle__guide');
      self._overlayG.appendChild(line);
    });

    // ハンドル描画
    this._points.forEach(function (pt, idx) {
      var circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('cx', pt.x);
      circle.setAttribute('cy', pt.y);
      circle.setAttribute('r', '6');
      circle.setAttribute('class', pt.type === 'endpoint'
        ? 'zw-pathtext-handle zw-pathtext-handle--endpoint'
        : 'zw-pathtext-handle zw-pathtext-handle--control');
      circle.setAttribute('data-point-index', idx);
      circle.style.cursor = 'grab';

      circle.addEventListener('pointerdown', function (e) {
        self._startDrag(e, idx);
      });

      self._overlayG.appendChild(circle);
    });
  };

  PathHandleOverlay.prototype._startDrag = function (e, pointIndex) {
    e.preventDefault();
    e.stopPropagation();

    var svg = this._activeTarget ? this._activeTarget.querySelector('.zw-pathtext__svg') : null;
    if (!svg) return;

    this._dragging = {
      pointIndex: pointIndex,
      svg: svg,
      ctm: svg.getScreenCTM()
    };

    var circle = e.target;
    if (circle.setPointerCapture) {
      circle.setPointerCapture(e.pointerId);
    }
    circle.style.cursor = 'grabbing';

    circle.addEventListener('pointermove', this._onPointerMove);
    circle.addEventListener('pointerup', this._onPointerUp);
  };

  PathHandleOverlay.prototype._handlePointerMove = function (e) {
    if (!this._dragging) return;
    e.preventDefault();

    var ctm = this._dragging.ctm;
    if (!ctm) return;

    // スクリーン座標 → SVG座標
    var svgX = (e.clientX - ctm.e) / ctm.a;
    var svgY = (e.clientY - ctm.f) / ctm.d;

    var pt = this._points[this._dragging.pointIndex];
    if (!pt) return;

    pt.x = svgX;
    pt.y = svgY;
    applyPointMove(this._commands, pt, svgX, svgY);

    this._updatePath();
    this._render();
  };

  PathHandleOverlay.prototype._handlePointerUp = function (e) {
    if (!this._dragging) return;

    var circle = e.target;
    circle.style.cursor = 'grab';
    circle.removeEventListener('pointermove', this._onPointerMove);
    circle.removeEventListener('pointerup', this._onPointerUp);

    if (circle.releasePointerCapture) {
      circle.releasePointerCapture(e.pointerId);
    }

    this._dragging = null;

    // DSL属性を最終更新
    this._syncDataPath();
  };

  /**
   * SVG内のパス要素を現在のコマンドで更新 (リアルタイムフィードバック)
   */
  PathHandleOverlay.prototype._updatePath = function () {
    if (!this._activeTarget) return;
    var svg = this._activeTarget.querySelector('.zw-pathtext__svg');
    if (!svg) return;

    var newD = serializePath(this._commands);

    // defs 内の path
    var defPath = svg.querySelector('defs path');
    if (defPath) defPath.setAttribute('d', newD);

    // use 要素があれば href 先は defs path なので自動更新
    // viewBox も再計算
    this._recalcViewBox(svg, newD);
  };

  /**
   * data-path 属性を最終的なパス文字列で更新
   */
  PathHandleOverlay.prototype._syncDataPath = function () {
    if (!this._activeTarget) return;
    var newD = serializePath(this._commands);
    this._activeTarget.setAttribute('data-path', newD);

    // onChangeコールバック
    if (typeof this._onChange === 'function') {
      this._onChange(this._activeTarget, newD);
    }
  };

  PathHandleOverlay.prototype._recalcViewBox = function (svg, pathD) {
    var nums = pathD.match(/-?\d+\.?\d*/g);
    if (!nums || nums.length < 2) return;
    var xs = [], ys = [];
    for (var i = 0; i < nums.length; i++) {
      (i % 2 === 0 ? xs : ys).push(parseFloat(nums[i]));
    }
    var pad = 20;
    var minX = Math.min.apply(null, xs) - pad;
    var minY = Math.min.apply(null, ys) - pad;
    var w = Math.max.apply(null, xs) - Math.min.apply(null, xs) + pad * 2;
    var h = Math.max.apply(null, ys) - Math.min.apply(null, ys) + pad * 2;
    svg.setAttribute('viewBox', minX + ' ' + minY + ' ' + w + ' ' + h);
  };

  /**
   * 変更通知コールバック設定
   * cb(pathtextDiv, newPathD)
   */
  PathHandleOverlay.prototype.onChange = function (cb) {
    this._onChange = cb;
  };

  // ---- Freehand Drawing Algorithms (Phase 4) ----

  /** 点と線分の垂直距離 */
  function perpendicularDist(pt, a, b) {
    var dx = b.x - a.x, dy = b.y - a.y;
    var lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.sqrt((pt.x - a.x) * (pt.x - a.x) + (pt.y - a.y) * (pt.y - a.y));
    var t = Math.max(0, Math.min(1, ((pt.x - a.x) * dx + (pt.y - a.y) * dy) / lenSq));
    var px = a.x + t * dx, py = a.y + t * dy;
    return Math.sqrt((pt.x - px) * (pt.x - px) + (pt.y - py) * (pt.y - py));
  }

  /** Ramer-Douglas-Peucker ポリライン簡略化 */
  function simplifyRDP(points, epsilon) {
    if (points.length <= 2) return points.slice();
    var dmax = 0, index = 0;
    var end = points.length - 1;
    for (var i = 1; i < end; i++) {
      var d = perpendicularDist(points[i], points[0], points[end]);
      if (d > dmax) { dmax = d; index = i; }
    }
    if (dmax > epsilon) {
      var left = simplifyRDP(points.slice(0, index + 1), epsilon);
      var right = simplifyRDP(points.slice(index), epsilon);
      return left.slice(0, -1).concat(right);
    }
    return [points[0], points[end]];
  }

  function roundN(n) { return Math.round(n * 100) / 100; }

  /** 簡略化された点列を Catmull-Rom→Cubic Bezier に変換 */
  function fitBezierCurve(points) {
    if (points.length < 2) return '';
    if (points.length === 2) {
      return 'M ' + roundN(points[0].x) + ' ' + roundN(points[0].y) +
             ' L ' + roundN(points[1].x) + ' ' + roundN(points[1].y);
    }
    var d = 'M ' + roundN(points[0].x) + ' ' + roundN(points[0].y);
    for (var i = 0; i < points.length - 1; i++) {
      var p0 = points[Math.max(0, i - 1)];
      var p1 = points[i];
      var p2 = points[i + 1];
      var p3 = points[Math.min(points.length - 1, i + 2)];
      var cp1x = p1.x + (p2.x - p0.x) / 6;
      var cp1y = p1.y + (p2.y - p0.y) / 6;
      var cp2x = p2.x - (p3.x - p1.x) / 6;
      var cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ' C ' + roundN(cp1x) + ' ' + roundN(cp1y) +
           ' ' + roundN(cp2x) + ' ' + roundN(cp2y) +
           ' ' + roundN(p2.x) + ' ' + roundN(p2.y);
    }
    return d;
  }

  // ---- Drawing Mode (Phase 4) ----

  PathHandleOverlay.prototype.enterDrawingMode = function () {
    if (!this._activeTarget) return;
    this._drawingMode = true;
    this._drawingPoints = [];

    var svg = this._activeTarget.querySelector('.zw-pathtext__svg');
    if (!svg) return;

    // ハンドルを一時非表示
    if (this._overlayG) this._overlayG.style.display = 'none';

    // 描画用ポリライン
    this._drawingPolyline = document.createElementNS(SVG_NS, 'polyline');
    this._drawingPolyline.setAttribute('class', 'zw-pathtext-drawing');
    svg.appendChild(this._drawingPolyline);

    this._activeTarget.style.cursor = 'crosshair';
    this._drawSvg = svg;

    this._boundDrawStart = this._handleDrawStart.bind(this);
    this._boundDrawMove = this._handleDrawMove.bind(this);
    this._boundDrawEnd = this._handleDrawEnd.bind(this);
    this._boundDrawKey = this._handleDrawKeydown.bind(this);

    svg.addEventListener('pointerdown', this._boundDrawStart);
    document.addEventListener('keydown', this._boundDrawKey, true);
  };

  PathHandleOverlay.prototype.exitDrawingMode = function (apply) {
    this._drawingMode = false;

    if (this._drawingPolyline && this._drawingPolyline.parentNode) {
      this._drawingPolyline.parentNode.removeChild(this._drawingPolyline);
    }
    this._drawingPolyline = null;

    if (this._activeTarget) this._activeTarget.style.cursor = '';

    if (this._drawSvg) {
      this._drawSvg.removeEventListener('pointerdown', this._boundDrawStart);
      this._drawSvg.removeEventListener('pointermove', this._boundDrawMove);
      this._drawSvg.removeEventListener('pointerup', this._boundDrawEnd);
    }
    document.removeEventListener('keydown', this._boundDrawKey, true);

    if (this._overlayG) this._overlayG.style.display = '';

    if (apply && this._drawingPoints.length >= 2) {
      var simplified = simplifyRDP(this._drawingPoints, 3);
      var pathD = fitBezierCurve(simplified);
      this._commands = parsePath(pathD);
      this._points = extractPoints(this._commands);
      this._updatePath();
      this._render();
      this._syncDataPath();
    }

    this._drawingPoints = [];
    this._drawSvg = null;
    this._drawingCtm = null;
  };

  PathHandleOverlay.prototype.isDrawing = function () {
    return !!this._drawingMode;
  };

  PathHandleOverlay.prototype._handleDrawStart = function (e) {
    if (!this._drawingMode) return;
    e.preventDefault();
    e.stopPropagation();
    var svg = this._drawSvg;
    if (!svg) return;

    var ctm = svg.getScreenCTM();
    if (!ctm) return;
    this._drawingCtm = ctm;

    var x = (e.clientX - ctm.e) / ctm.a;
    var y = (e.clientY - ctm.f) / ctm.d;
    this._drawingPoints = [{ x: x, y: y }];
    this._drawingPolyline.setAttribute('points', x + ',' + y);

    svg.setPointerCapture(e.pointerId);
    svg.addEventListener('pointermove', this._boundDrawMove);
    svg.addEventListener('pointerup', this._boundDrawEnd);
  };

  PathHandleOverlay.prototype._handleDrawMove = function (e) {
    if (!this._drawingMode || !this._drawingCtm) return;
    e.preventDefault();
    var ctm = this._drawingCtm;
    var x = (e.clientX - ctm.e) / ctm.a;
    var y = (e.clientY - ctm.f) / ctm.d;
    this._drawingPoints.push({ x: x, y: y });

    var pts = this._drawingPoints.map(function (p) { return roundN(p.x) + ',' + roundN(p.y); }).join(' ');
    this._drawingPolyline.setAttribute('points', pts);
  };

  PathHandleOverlay.prototype._handleDrawEnd = function (e) {
    if (!this._drawingMode) return;
    var svg = this._drawSvg;
    if (svg) {
      svg.releasePointerCapture(e.pointerId);
      svg.removeEventListener('pointermove', this._boundDrawMove);
      svg.removeEventListener('pointerup', this._boundDrawEnd);
    }
    this._drawingCtm = null;

    if (this._drawingPoints.length >= 2) {
      this.exitDrawingMode(true);
    }
  };

  PathHandleOverlay.prototype._handleDrawKeydown = function (e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this.exitDrawingMode(false);
    }
  };

  // ---- Preset Path Generators (Phase 3) ----

  var PRESETS = {
    /** 直線 */
    line: function (w) {
      w = w || 300;
      return 'M 0 50 L ' + w + ' 50';
    },
    /** 上向きカーブ (二次ベジェ) */
    curve: function (w) {
      w = w || 300;
      var h = 80;
      return 'M 0 ' + h + ' Q ' + (w / 2) + ' 0 ' + w + ' ' + h;
    },
    /** S字カーブ (三次ベジェ) */
    sCurve: function (w) {
      w = w || 300;
      return 'M 0 80 C ' + Math.round(w * 0.33) + ' 0 ' + Math.round(w * 0.66) + ' 100 ' + w + ' 20';
    },
    /** 円弧 (上半円) */
    arc: function (w) {
      w = w || 300;
      var r = w / 2;
      return 'M 0 ' + r + ' A ' + r + ' ' + r + ' 0 0 1 ' + w + ' ' + r;
    },
    /** 波線 (2周期) */
    wave: function (w) {
      w = w || 300;
      var q = Math.round(w / 4);
      var h = 40;
      return 'M 0 50 Q ' + q + ' ' + (50 - h) + ' ' + (q * 2) + ' 50 Q ' + (q * 3) + ' ' + (50 + h) + ' ' + w + ' 50';
    },
    /** 下向きカーブ */
    curveDown: function (w) {
      w = w || 300;
      return 'M 0 20 Q ' + (w / 2) + ' 100 ' + w + ' 20';
    },
    /** 階段 (L字) */
    step: function (w) {
      w = w || 300;
      return 'M 0 80 L ' + Math.round(w / 2) + ' 80 L ' + Math.round(w / 2) + ' 20 L ' + w + ' 20';
    }
  };

  /** プリセット名の一覧 */
  var PRESET_NAMES = Object.keys(PRESETS);

  /** プリセット表示ラベル */
  var PRESET_LABELS = {
    line: '直線',
    curve: '上カーブ',
    sCurve: 'S字カーブ',
    arc: '円弧',
    wave: '波線',
    curveDown: '下カーブ',
    step: '階段'
  };

  /**
   * プリセット名からパス文字列を生成
   * @param {string} name プリセット名
   * @param {number} [width] パス幅 (デフォルト 300)
   * @returns {string|null} パス文字列 or null
   */
  function generatePresetPath(name, width) {
    var fn = PRESETS[name];
    return fn ? fn(width || 300) : null;
  }

  // ---- Public API ----
  var api = {
    parsePath: parsePath,
    serializePath: serializePath,
    extractPoints: extractPoints,
    applyPointMove: applyPointMove,
    PathHandleOverlay: PathHandleOverlay,
    PRESET_NAMES: PRESET_NAMES,
    PRESET_LABELS: PRESET_LABELS,
    generatePresetPath: generatePresetPath,
    // Phase 4
    simplifyRDP: simplifyRDP,
    fitBezierCurve: fitBezierCurve
  };

  root.PathHandleOverlay = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
