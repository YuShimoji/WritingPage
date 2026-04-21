(function () {
  'use strict';

  var STORAGE_KEY = 'zenwriter-floating-memo-lab';
  var AUTO_OPEN_QUERY = /(?:^|[?&])memoLab=1(?:&|$)/;
  var DEFAULT_MEMO_COUNT = 8;
  var FOREGROUND_Z = 240;
  var DRAG_Z = 320;
  var PAPER_STRIP_COUNT = 5;
  var TOUCH_SLOP_PX = 8;
  // Only guard the same touch hand-off; fast re-taps should enter edit immediately.
  var TOUCH_FOCUS_LOCK_MS = 16;
  var KEYBOARD_MARGIN_PX = 16;
  var EDGE_ORDER = ['top', 'right', 'bottom', 'left'];
  var EDGE_OPPOSITES = {
    top: 'bottom',
    right: 'left',
    bottom: 'top',
    left: 'right'
  };

  var DEFAULT_MEMOS = [
    {
      id: 'memo-01',
      title: '導入メモ',
      body: '主人公が最初に躊躇する理由をもう少し具体化する。\n- 失敗談\n- いま抱えている生活上の重さ\n- それでも動いてしまう小さなきっかけ'
    },
    {
      id: 'memo-02',
      title: '対話の温度',
      body: '二人の会話は説明ではなく、少しだけ噛み合わない感じで進める。\n沈黙の行を一つ混ぜてもよさそう。'
    },
    {
      id: 'memo-03',
      title: '象徴',
      body: '窓 / 湿った紙 / 朝の白い光。\n反復しても重くなりすぎないよう、出し方を散らす。'
    },
    {
      id: 'memo-04',
      title: '場面転換',
      body: '切り替え時に説明を増やしすぎない。\n視点が拾う一つの感覚から次の段に入る。'
    },
    {
      id: 'memo-05',
      title: '余白',
      body: '全部を言い切らない。\n読者が補える余白を残したまま、次の行動へ押し出す。'
    },
    {
      id: 'memo-06',
      title: '伏線',
      body: '後半で回収する小物はここで自然に見せる。\n目立たせず、でも忘れない位置に置く。'
    },
    {
      id: 'memo-07',
      title: '速度調整',
      body: '感情が強い段落の直後に短い文を入れて、読む呼吸を作る。'
    },
    {
      id: 'memo-08',
      title: '結び',
      body: '締めは断定より余韻。\n最後の一文だけ、少し視界が開ける感じに寄せる。'
    }
  ];

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lerp(from, to, amount) {
    return from + (to - from) * amount;
  }

  function frameEase(amount, dtMs) {
    return 1 - Math.pow(1 - amount, dtMs / 16);
  }

  function hashString(input) {
    var hash = 2166136261;
    for (var i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function createSeededRandom(seed) {
    var state = seed >>> 0;
    return function () {
      state += 0x6D2B79F5;
      var t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function seededRange(random, min, max) {
    return min + random() * (max - min);
  }

  function matchesAutoOpenQuery() {
    return AUTO_OPEN_QUERY.test(location.search || '');
  }

  function parseMemoCount() {
    try {
      var params = new URLSearchParams(location.search || '');
      var parsed = parseInt(params.get('memoCount') || '', 10);
      if (!isNaN(parsed)) return clamp(parsed, 4, 16);
    } catch (_) { /* noop */ }
    return DEFAULT_MEMO_COUNT;
  }

  function loadBodies() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function saveBodies(memos) {
    try {
      var payload = {};
      for (var i = 0; i < memos.length; i++) {
        payload[memos[i].id] = memos[i].body;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (_) { /* noop */ }
  }

  function createPaperMotion() {
    return {
      bendX: 0,
      bendY: 0,
      flutterAmp: 0,
      flutterFreq: 0,
      flutterPhase: 0,
      flutterDamping: 480,
      flutterValue: 0,
      axisX: 0,
      axisY: 0
    };
  }

  function FloatingMemoField() {
    this.overlay = null;
    this.viewport = null;
    this.scene = null;
    this.closeButton = null;
    this.memos = [];
    this.isOpen = false;
    this.frameId = 0;
    this.lastFrameMs = 0;
    this.sceneRect = null;
    this.sceneWidth = 0;
    this.sceneHeight = 0;
    this.sceneHalfWidth = 0;
    this.sceneHalfHeight = 0;
    this.topStack = 16;
    this.persistTimer = 0;
    this.reduceMotion = false;
    this.motionQuery = null;
    this.visualViewport = null;
    this.keyboardInset = 0;
    this.tick = this.tick.bind(this);
    this.onVisibilityChange = this.onVisibilityChange.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onPointerDownBackdrop = this.onPointerDownBackdrop.bind(this);
    this.onVisualViewportChange = this.onVisualViewportChange.bind(this);
  }

  FloatingMemoField.prototype.init = function () {
    if (this.overlay) return;

    this.overlay = document.getElementById('memo-field-lab');
    this.viewport = document.getElementById('memo-field-lab-viewport');
    this.scene = document.getElementById('memo-field-lab-scene');
    this.closeButton = document.getElementById('memo-field-lab-close');

    if (!this.overlay || !this.viewport || !this.scene) return;

    this.motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    this.reduceMotion = !!(this.motionQuery && this.motionQuery.matches);
    this.visualViewport = window.visualViewport || null;

    if (this.motionQuery) {
      var self = this;
      var listener = function (event) {
        self.handleMotionPreferenceChange(event);
      };
      if (typeof this.motionQuery.addEventListener === 'function') {
        this.motionQuery.addEventListener('change', listener);
      } else if (typeof this.motionQuery.addListener === 'function') {
        this.motionQuery.addListener(listener);
      }
    }

    this.scene.setAttribute('aria-hidden', 'false');
    this.scene.innerHTML = '';
    this.memos = this.createMemos(parseMemoCount());
    this.updateSceneMetrics();
    this.seedMemoTransforms();

    if (this.memos[0]) {
      this.setForegroundMemo(this.memos[0], { keepFocus: false, anchorCenter: true });
    }

    this.syncMemoInteractivity();

    if (this.closeButton) {
      this.closeButton.addEventListener('click', this.close.bind(this));
    }

    this.overlay.addEventListener('pointerdown', this.onPointerDownBackdrop);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    window.addEventListener('resize', this.onResize);
    document.addEventListener('keydown', this.onKeyDown, true);
    if (this.visualViewport && typeof this.visualViewport.addEventListener === 'function') {
      this.visualViewport.addEventListener('resize', this.onVisualViewportChange);
      this.visualViewport.addEventListener('scroll', this.onVisualViewportChange);
    }

    if (matchesAutoOpenQuery()) {
      this.open();
    }
  };

  FloatingMemoField.prototype.handleMotionPreferenceChange = function (event) {
    this.reduceMotion = !!(event && event.matches);
    for (var i = 0; i < this.memos.length; i++) {
      if (this.reduceMotion) {
        this.memos[i].paperMotion.flutterAmp = 0;
        this.memos[i].paperMotion.flutterValue = 0;
      }
      this.renderPaperMotion(this.memos[i]);
    }
  };

  FloatingMemoField.prototype.createMemos = function (count) {
    var storedBodies = loadBodies();
    var memos = [];

    for (var i = 0; i < count; i++) {
      var base = DEFAULT_MEMOS[i % DEFAULT_MEMOS.length];
      var memoId = base.id + '-' + String(i + 1);
      var memo = this.buildMemoState(base, i, count, memoId, storedBodies[memoId] || storedBodies[base.id]);
      this.configureFlowState(memo, 0, true);
      this.scene.appendChild(memo.element);
      memos.push(memo);
    }

    return memos;
  };

  FloatingMemoField.prototype.buildMemoState = function (base, index, count, memoId, storedBody) {
    var memo = {
      id: memoId,
      title: base.title,
      body: typeof storedBody === 'string' ? storedBody : base.body,
      index: index,
      count: count,
      state: 'floating',
      width: 280,
      height: 232,
      x: 0,
      y: 0,
      z: 56,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      flow: null,
      ambient: null,
      spawnGeneration: 0,
      respawnAt: 0,
      hasEnteredViewport: false,
      hasTransform: false,
      releaseSpeed: 0,
      focusAnchorX: 0,
      focusAnchorY: 0,
      stackOrder: index + 1,
      projectedDepth: 0,
      dragOriginState: 'floating',
      dragOffsetX: 0,
      dragOffsetY: 0,
      dragDistance: 0,
      gestureMode: 'idle',
      gesturePointerType: '',
      tapStartX: 0,
      tapStartY: 0,
      tapMoved: false,
      touchFocusLockUntil: 0,
      touchPromotedAt: 0,
      pendingBlurMode: '',
      pointerId: null,
      dragMoved: false,
      dragStartClientX: 0,
      dragStartClientY: 0,
      lastPointerX: 0,
      lastPointerY: 0,
      lastPointerTs: 0,
      paperMotion: createPaperMotion(),
      element: null,
      shell: null,
      content: null,
      hitLayer: null,
      strips: [],
      dragHeader: null,
      dragHandle: null,
      textarea: null,
      _moveHandler: null,
      _upHandler: null,
      _windowUpHandler: null
    };

    memo.element = document.createElement('article');
    memo.element.className = 'memo-field-lab__memo';
    memo.element.setAttribute('data-memo-id', memo.id);
    memo.element.setAttribute('data-memo-state', memo.state);
    memo.element.setAttribute('data-paper-flutter', 'false');
    memo.element.style.marginLeft = (-memo.width / 2) + 'px';
    memo.element.style.marginTop = (-memo.height / 2) + 'px';

    var stripsMarkup = [];
    for (var i = 0; i < PAPER_STRIP_COUNT; i++) {
      stripsMarkup.push('<span class="memo-field-lab__memo-strip" aria-hidden="true"></span>');
    }

    memo.element.innerHTML = [
      '<div class="memo-field-lab__memo-shell">',
      '  <div class="memo-field-lab__memo-strips" aria-hidden="true">' + stripsMarkup.join('') + '</div>',
      '  <div class="memo-field-lab__memo-content">',
      '    <header class="memo-field-lab__memo-header" data-memo-drag-region="true">',
      '      <div class="memo-field-lab__memo-meta">',
      '        <span class="memo-field-lab__memo-title"></span>',
      '        <span class="memo-field-lab__memo-state"></span>',
      '      </div>',
      '      <button type="button" class="memo-field-lab__memo-grab" data-memo-drag-handle aria-label="メモをドラッグして前面に出す">drag</button>',
      '    </header>',
      '    <div class="memo-field-lab__memo-body">',
      '      <textarea class="memo-field-lab__memo-text" spellcheck="false"></textarea>',
      '    </div>',
      '  </div>',
      '  <div class="memo-field-lab__memo-hit" data-memo-hit-layer="true" aria-hidden="true"></div>',
      '</div>'
    ].join('');

    memo.shell = memo.element.querySelector('.memo-field-lab__memo-shell');
    memo.content = memo.element.querySelector('.memo-field-lab__memo-content');
    memo.hitLayer = memo.element.querySelector('[data-memo-hit-layer]');
    memo.dragHeader = memo.element.querySelector('[data-memo-drag-region]');
    memo.dragHandle = memo.element.querySelector('[data-memo-drag-handle]');
    memo.textarea = memo.element.querySelector('.memo-field-lab__memo-text');
    memo.strips = Array.prototype.slice.call(memo.element.querySelectorAll('.memo-field-lab__memo-strip'));

    memo.element.querySelector('.memo-field-lab__memo-title').textContent = memo.title;
    memo.textarea.value = memo.body;

    this.bindMemoEvents(memo);

    return memo;
  };

  FloatingMemoField.prototype.configureFlowState = function (memo, generation, isInitial) {
    var seed = hashString(memo.id + '|spawn|' + generation + '|' + (isInitial ? 'initial' : 'respawn'));
    var random = createSeededRandom(seed);
    var entryEdge = EDGE_ORDER[(memo.index + generation) % EDGE_ORDER.length];
    var laneCount = Math.max(1, Math.ceil(memo.count / EDGE_ORDER.length));
    var laneIndex = Math.floor(memo.index / EDGE_ORDER.length);
    var laneRatio = laneCount === 1 ? 0.5 : laneIndex / (laneCount - 1);
    var initialLaneOffset = lerp(-0.62, 0.62, laneRatio);
    var initialProgress = clamp(0.16 + (memo.index % EDGE_ORDER.length) * 0.07 + laneIndex * 0.24, 0.14, 0.7);

    memo.spawnGeneration = generation;
    memo.flow = {
      entryEdge: entryEdge,
      exitEdge: EDGE_OPPOSITES[entryEdge],
      flowProgress: isInitial ? initialProgress : seededRange(random, -0.16, -0.08),
      flowSpeed: seededRange(random, 0.036, 0.058),
      laneOffset: isInitial ? initialLaneOffset : seededRange(random, -0.82, 0.82),
      crossShift: isInitial ? seededRange(random, -0.08, 0.08) : seededRange(random, -0.18, 0.18)
    };
    memo.ambient = {
      baseZ: seededRange(random, 28, 108),
      zAmp: seededRange(random, 8, 22),
      zSpeed: seededRange(random, 0.55, 0.92),
      bobAmpX: seededRange(random, 8, 22),
      bobAmpY: seededRange(random, 8, 20),
      bobSpeedX: seededRange(random, 0.48, 0.92),
      bobSpeedY: seededRange(random, 0.44, 0.82),
      rotBaseX: seededRange(random, -4.4, 4.4),
      rotBaseY: seededRange(random, -6.2, 6.2),
      rotBaseZ: seededRange(random, -2.2, 2.2),
      rotAmpX: seededRange(random, 0.6, 1.5),
      rotAmpY: seededRange(random, 0.8, 1.9),
      rotAmpZ: seededRange(random, 0.4, 1.2),
      phaseX: seededRange(random, 0, Math.PI * 2),
      phaseY: seededRange(random, 0, Math.PI * 2),
      phaseZ: seededRange(random, 0, Math.PI * 2)
    };
    memo.hasEnteredViewport = false;
    memo.respawnAt = 0;
    memo.releaseSpeed = 0;
    memo.paperMotion = createPaperMotion();
    memo.vx = 0;
    memo.vy = 0;
    memo.vz = 0;
    memo.hasTransform = false;
    memo.element.setAttribute('data-entry-edge', memo.flow.entryEdge);
    memo.element.setAttribute('data-spawn-generation', String(generation));
  };

  FloatingMemoField.prototype.seedMemoTransforms = function () {
    var nowMs = performance.now();
    for (var i = 0; i < this.memos.length; i++) {
      if (!this.memos[i].hasTransform) {
        this.placeMemoAtFlowTarget(this.memos[i], nowMs / 1000);
      }
      this.renderMemo(this.memos[i]);
    }
  };

  FloatingMemoField.prototype.placeMemoAtFlowTarget = function (memo, timeSec) {
    var target = this.getFlowTarget(memo, timeSec);
    memo.x = target.x;
    memo.y = target.y;
    memo.z = target.z;
    memo.rotX = target.rotX;
    memo.rotY = target.rotY;
    memo.rotZ = target.rotZ;
    memo.hasTransform = true;
    this.renderPaperMotion(memo);
  };

  FloatingMemoField.prototype.bindMemoEvents = function (memo) {
    var self = this;

    memo.element.addEventListener('pointerdown', function (event) {
      if (!self.isOpen) return;
      if (memo.state === 'respawning') return;
      if (event.pointerType === 'touch' && event.isPrimary === false) return;
      if (event.pointerType === 'touch' && self.hasActivePointerGesture(memo)) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      var isTextareaTarget = event.target === memo.textarea || !!event.target.closest('.memo-field-lab__memo-text');
      var canDragForeground = !!(event.target.closest('[data-memo-drag-region]') ||
        event.target.closest('[data-memo-drag-handle]') ||
        (!isTextareaTarget && !event.target.closest('.memo-field-lab__memo-body')));

      if (memo.state === 'foreground') {
        if (!canDragForeground) return;
        self.beginDrag(memo, event);
        return;
      }

      if (isTextareaTarget) {
        event.preventDefault();
      }
      self.beginDrag(memo, event);
    });

    memo.textarea.addEventListener('pointerdown', function (event) {
      if (event.pointerType !== 'touch') return;
      if (performance.now() < memo.touchFocusLockUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
    });

    memo.textarea.addEventListener('focus', function () {
      self.updateKeyboardInset();
      if (memo.state !== 'foreground') {
        self.setForegroundMemo(memo, { keepFocus: false });
      }
      self.ensureLoop();
    });

    memo.textarea.addEventListener('blur', function () {
      window.setTimeout(function () {
        var blurMode = memo.pendingBlurMode;
        memo.pendingBlurMode = '';
        self.updateKeyboardInset();
        if (blurMode === 'keep') {
          self.syncMemoInteractivity();
          return;
        }
        if (!memo.element.contains(document.activeElement) && memo.state === 'foreground') {
          self.startReturn(memo);
        }
      }, 0);
    });

    memo.textarea.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        memo.textarea.blur();
        self.startReturn(memo);
      }
    });

    memo.textarea.addEventListener('input', function () {
      memo.body = memo.textarea.value;
      self.queuePersist();
    });
  };

  FloatingMemoField.prototype.queuePersist = function () {
    var self = this;
    if (this.persistTimer) {
      window.clearTimeout(this.persistTimer);
    }
    this.persistTimer = window.setTimeout(function () {
      saveBodies(self.memos);
      self.persistTimer = 0;
    }, 180);
  };

  FloatingMemoField.prototype.onPointerDownBackdrop = function (event) {
    if (!this.isOpen) return;
    if (event.target === this.viewport || event.target === this.scene || event.target === this.overlay) {
      this.releaseForegroundMemos();
    }
  };

  FloatingMemoField.prototype.onVisibilityChange = function () {
    if (document.hidden) {
      this.stopLoop();
      return;
    }
    if (this.isOpen) {
      this.lastFrameMs = 0;
      this.ensureLoop();
    }
  };

  FloatingMemoField.prototype.onResize = function () {
    if (!this.overlay) return;
    this.updateSceneMetrics();
    this.updateKeyboardInset();
    this.seedMemoTransforms();
  };

  FloatingMemoField.prototype.onVisualViewportChange = function () {
    this.updateKeyboardInset();
    if (this.isOpen) {
      this.ensureLoop();
    }
  };

  FloatingMemoField.prototype.onKeyDown = function (event) {
    if (!this.isOpen || event.key !== 'Escape') return;
    if (document.activeElement && document.activeElement.classList &&
      document.activeElement.classList.contains('memo-field-lab__memo-text')) {
      return;
    }
    event.preventDefault();
    this.close();
  };

  FloatingMemoField.prototype.updateSceneMetrics = function () {
    if (!this.viewport) return;

    this.sceneRect = this.viewport.getBoundingClientRect();
    this.sceneWidth = this.sceneRect.width || window.innerWidth || 1280;
    this.sceneHeight = this.sceneRect.height || window.innerHeight || 720;
    this.sceneHalfWidth = this.sceneWidth / 2;
    this.sceneHalfHeight = this.sceneHeight / 2;
  };

  FloatingMemoField.prototype.updateKeyboardInset = function () {
    var active = document.activeElement;
    if (!active || !active.classList || !active.classList.contains('memo-field-lab__memo-text') || !this.visualViewport) {
      this.keyboardInset = 0;
      return;
    }

    this.keyboardInset = Math.max(
      0,
      window.innerHeight - this.visualViewport.height - this.visualViewport.offsetTop
    );
  };

  FloatingMemoField.prototype.hasActivePointerGesture = function (exceptMemo) {
    for (var i = 0; i < this.memos.length; i++) {
      if (this.memos[i] !== exceptMemo && this.memos[i].pointerId !== null) {
        return true;
      }
    }
    return false;
  };

  FloatingMemoField.prototype.clearPointerGesture = function (memo) {
    memo.pointerId = null;
    memo.gestureMode = 'idle';
    memo.gesturePointerType = '';
    memo.tapMoved = false;
    memo.dragDistance = 0;
    memo.dragOffsetX = 0;
    memo.dragOffsetY = 0;
  };

  FloatingMemoField.prototype.blurForegroundMemo = function (memo, mode) {
    if (!memo || memo.state !== 'foreground') return;
    memo.pendingBlurMode = mode || 'return';
    if (document.activeElement === memo.textarea) {
      memo.textarea.blur();
      return;
    }
    if (memo.pendingBlurMode === 'return') {
      memo.pendingBlurMode = '';
      this.startReturn(memo);
    } else {
      memo.pendingBlurMode = '';
    }
  };

  FloatingMemoField.prototype.focusMemoTextArea = function (memo) {
    var textarea = memo.textarea;
    window.requestAnimationFrame(function () {
      textarea.focus({ preventScroll: true });
      var len = textarea.value.length;
      textarea.setSelectionRange(len, len);
    });
  };

  FloatingMemoField.prototype.getFlowTarget = function (memo, timeSec) {
    var motionFactor = this.reduceMotion ? 0.22 : 1;
    var travelMargin = Math.max(memo.width, memo.height) * 0.92;
    var horizontalLane = Math.max(96, this.sceneHeight * 0.32) * memo.flow.laneOffset;
    var verticalLane = Math.max(120, this.sceneWidth * 0.32) * memo.flow.laneOffset;
    var crossShiftX = this.sceneWidth * 0.08 * memo.flow.crossShift;
    var crossShiftY = this.sceneHeight * 0.08 * memo.flow.crossShift;
    var baseX;
    var baseY;

    if (memo.flow.entryEdge === 'left' || memo.flow.entryEdge === 'right') {
      var startX = memo.flow.entryEdge === 'left'
        ? -this.sceneHalfWidth - travelMargin
        : this.sceneHalfWidth + travelMargin;
      var endX = memo.flow.exitEdge === 'right'
        ? this.sceneHalfWidth + travelMargin
        : -this.sceneHalfWidth - travelMargin;
      baseX = lerp(startX, endX, memo.flow.flowProgress);
      baseY = lerp(horizontalLane, horizontalLane + crossShiftY, memo.flow.flowProgress);
    } else {
      var startY = memo.flow.entryEdge === 'top'
        ? -this.sceneHalfHeight - travelMargin
        : this.sceneHalfHeight + travelMargin;
      var endY = memo.flow.exitEdge === 'bottom'
        ? this.sceneHalfHeight + travelMargin
        : -this.sceneHalfHeight - travelMargin;
      baseX = lerp(verticalLane, verticalLane + crossShiftX, memo.flow.flowProgress);
      baseY = lerp(startY, endY, memo.flow.flowProgress);
    }

    var bobX = Math.sin(timeSec * memo.ambient.bobSpeedX + memo.ambient.phaseX) * memo.ambient.bobAmpX * motionFactor;
    var bobY = Math.cos(timeSec * memo.ambient.bobSpeedY + memo.ambient.phaseY) * memo.ambient.bobAmpY * motionFactor;

    return {
      x: baseX + bobX,
      y: baseY + bobY,
      z: memo.ambient.baseZ + Math.sin(timeSec * memo.ambient.zSpeed + memo.ambient.phaseZ) * memo.ambient.zAmp * motionFactor,
      rotX: memo.ambient.rotBaseX + Math.sin(timeSec * memo.ambient.bobSpeedY + memo.ambient.phaseY) * memo.ambient.rotAmpX * motionFactor,
      rotY: memo.ambient.rotBaseY + Math.cos(timeSec * memo.ambient.bobSpeedX + memo.ambient.phaseX) * memo.ambient.rotAmpY * motionFactor,
      rotZ: memo.ambient.rotBaseZ + Math.sin(timeSec * memo.ambient.zSpeed + memo.ambient.phaseZ) * memo.ambient.rotAmpZ * motionFactor
    };
  };

  FloatingMemoField.prototype.getForegroundTarget = function (memo) {
    var anchorX = typeof memo.focusAnchorX === 'number' ? memo.focusAnchorX : memo.x * 0.2;
    var anchorY = typeof memo.focusAnchorY === 'number' ? memo.focusAnchorY : memo.y * 0.15;
    var adjustedY = clamp(anchorY, -this.sceneHeight * 0.16, this.sceneHeight * 0.12);

    if (this.keyboardInset > 0 && document.activeElement === memo.textarea) {
      var maxVisibleY = this.sceneHalfHeight - this.keyboardInset - memo.height / 2 - KEYBOARD_MARGIN_PX;
      adjustedY = Math.min(adjustedY, maxVisibleY);
    }

    return {
      x: clamp(anchorX, -this.sceneWidth * 0.18, this.sceneWidth * 0.18),
      y: adjustedY,
      z: this.reduceMotion ? 188 : FOREGROUND_Z,
      rotX: this.reduceMotion ? 0 : memo.rotX * 0.14,
      rotY: this.reduceMotion ? 0 : memo.rotY * 0.14,
      rotZ: memo.rotZ * 0.1
    };
  };

  FloatingMemoField.prototype.scenePointFromClient = function (clientX, clientY) {
    if (!this.sceneRect) {
      this.updateSceneMetrics();
    }
    return {
      x: clientX - this.sceneRect.left - this.sceneRect.width / 2,
      y: clientY - this.sceneRect.top - this.sceneRect.height / 2
    };
  };

  FloatingMemoField.prototype.beginDrag = function (memo, event) {
    if (memo.pointerId !== null) return;

    event.preventDefault();
    event.stopPropagation();

    this.releaseOtherForegroundMemos(memo);

    memo.dragOriginState = memo.state;
    memo.pointerId = event.pointerId;
    memo.gestureMode = event.pointerType === 'touch' ? 'armed' : 'dragging';
    memo.gesturePointerType = event.pointerType || 'mouse';
    memo.tapStartX = event.clientX;
    memo.tapStartY = event.clientY;
    memo.tapMoved = false;
    memo.dragMoved = false;
    memo.dragDistance = 0;
    memo.dragStartClientX = event.clientX;
    memo.dragStartClientY = event.clientY;
    memo.lastPointerX = event.clientX;
    memo.lastPointerY = event.clientY;
    memo.lastPointerTs = performance.now();
    memo.releaseSpeed = 0;
    memo.vx = 0;
    memo.vy = 0;
    memo.vz = 0;
    memo.focusAnchorX = memo.x;
    memo.focusAnchorY = memo.y;
    memo.pendingBlurMode = '';

    try {
      memo.element.setPointerCapture(event.pointerId);
    } catch (_) { /* noop */ }

    var self = this;

    memo._moveHandler = function (moveEvent) {
      if (moveEvent.pointerId !== memo.pointerId) return;
      self.continueDrag(memo, moveEvent);
    };

    memo._upHandler = function (upEvent) {
      if (upEvent.pointerId !== memo.pointerId) return;
      self.endPointerInteraction(memo, upEvent);
    };

    memo._windowUpHandler = function (upEvent) {
      if (memo.pointerId === null) return;
      if (upEvent.pointerId && upEvent.pointerId !== memo.pointerId) return;
      self.endPointerInteraction(memo, upEvent);
    };

    memo.element.addEventListener('pointermove', memo._moveHandler);
    memo.element.addEventListener('pointerup', memo._upHandler);
    memo.element.addEventListener('pointercancel', memo._upHandler);
    memo.element.addEventListener('lostpointercapture', memo._upHandler);
    window.addEventListener('pointerup', memo._windowUpHandler, true);
    window.addEventListener('pointercancel', memo._windowUpHandler, true);

    if (event.pointerType !== 'touch') {
      this.activateDrag(memo, event);
    }

    this.ensureLoop();
  };

  FloatingMemoField.prototype.activateDrag = function (memo, event) {
    if (memo.state === 'dragging') return;

    var point = this.scenePointFromClient(event.clientX, event.clientY);
    memo.dragOffsetX = memo.x - point.x;
    memo.dragOffsetY = memo.y - point.y;
    memo.gestureMode = 'dragging';
    memo.state = 'dragging';
    memo.focusAnchorX = memo.x;
    memo.focusAnchorY = memo.y;
    memo.stackOrder = ++this.topStack;

    if (document.activeElement === memo.textarea) {
      memo.textarea.blur();
    }

    this.syncMemoInteractivity();
  };

  FloatingMemoField.prototype.continueDrag = function (memo, event) {
    if (memo.gesturePointerType === 'touch' && memo.gestureMode === 'armed') {
      memo.dragDistance = Math.max(
        memo.dragDistance,
        Math.hypot(event.clientX - memo.tapStartX, event.clientY - memo.tapStartY)
      );

      if (memo.dragDistance < TOUCH_SLOP_PX) {
        return;
      }

      memo.tapMoved = true;
      memo.dragMoved = true;
      this.activateDrag(memo, event);
    }

    if (memo.state !== 'dragging') return;

    var point = this.scenePointFromClient(event.clientX, event.clientY);
    var nextX = point.x + memo.dragOffsetX;
    var nextY = point.y + memo.dragOffsetY;
    var maxX = this.sceneHalfWidth + memo.width * 0.95;
    var maxY = this.sceneHalfHeight + memo.height * 0.95;
    var now = performance.now();
    var dt = Math.max(8, now - memo.lastPointerTs);

    memo.dragDistance = Math.max(
      memo.dragDistance,
      Math.hypot(event.clientX - memo.dragStartClientX, event.clientY - memo.dragStartClientY)
    );
    memo.dragMoved = memo.dragMoved || memo.dragDistance > 4;
    memo.x = clamp(nextX, -maxX, maxX);
    memo.y = clamp(nextY, -maxY, maxY);
    memo.z = lerp(memo.z, this.reduceMotion ? 210 : DRAG_Z, frameEase(0.28, dt));
    memo.vx = (event.clientX - memo.lastPointerX) / dt;
    memo.vy = (event.clientY - memo.lastPointerY) / dt;
    memo.vz = 0;
    memo.rotX = clamp(-memo.vy * 6.5, -6, 6);
    memo.rotY = clamp(memo.vx * 9.5, -8, 8);
    memo.rotZ = clamp(memo.vx * 4.2, -5, 5);
    memo.lastPointerX = event.clientX;
    memo.lastPointerY = event.clientY;
    memo.lastPointerTs = now;

    this.renderMemo(memo);
  };

  FloatingMemoField.prototype.detachDragListeners = function (memo, pointerId) {
    if (memo._moveHandler) memo.element.removeEventListener('pointermove', memo._moveHandler);
    if (memo._upHandler) {
      memo.element.removeEventListener('pointerup', memo._upHandler);
      memo.element.removeEventListener('pointercancel', memo._upHandler);
      memo.element.removeEventListener('lostpointercapture', memo._upHandler);
    }
    if (memo._windowUpHandler) {
      window.removeEventListener('pointerup', memo._windowUpHandler, true);
      window.removeEventListener('pointercancel', memo._windowUpHandler, true);
    }
    try {
      if (pointerId !== null && pointerId !== undefined) {
        memo.element.releasePointerCapture(pointerId);
      }
    } catch (_) { /* noop */ }
    memo._moveHandler = null;
    memo._upHandler = null;
    memo._windowUpHandler = null;
  };

  FloatingMemoField.prototype.handleTouchTap = function (memo) {
    var now = performance.now();

    if (memo.dragOriginState === 'foreground') {
      memo.touchPromotedAt = now;
      memo.touchFocusLockUntil = Math.max(memo.touchFocusLockUntil, now);
      this.syncMemoInteractivity();
      return;
    }

    this.setForegroundMemo(memo, { keepFocus: false, touchPromote: true });
  };

  FloatingMemoField.prototype.cancelDrag = function (memo) {
    memo.releaseSpeed = 0;
    memo.vx = 0;
    memo.vy = 0;
    memo.vz = 0;
    memo.state = 'returning';
    memo.focusAnchorX = memo.x;
    memo.focusAnchorY = memo.y;
    memo.stackOrder = ++this.topStack;
    this.syncMemoInteractivity();
    this.ensureLoop();
  };

  FloatingMemoField.prototype.resetMemoGestureForClose = function (memo) {
    if (memo.pointerId !== null) {
      this.detachDragListeners(memo, memo.pointerId);
    }
    this.clearPointerGesture(memo);
    memo.pendingBlurMode = '';
    memo.touchFocusLockUntil = 0;

    if (memo.state !== 'dragging') return;

    memo.releaseSpeed = 0;
    memo.vx = 0;
    memo.vy = 0;
    memo.vz = 0;
    memo.state = 'returning';
    memo.focusAnchorX = memo.x;
    memo.focusAnchorY = memo.y;
    memo.stackOrder = ++this.topStack;
  };

  FloatingMemoField.prototype.endPointerInteraction = function (memo, event) {
    if (memo.pointerId === null) return;

    var pointerId = memo.pointerId;
    var wasTouchTap = memo.gesturePointerType === 'touch' && memo.gestureMode === 'armed';
    var isCancel = !!(event && event.type && event.type !== 'pointerup');
    this.detachDragListeners(memo, pointerId);
    memo.pointerId = null;

    if (wasTouchTap) {
      this.clearPointerGesture(memo);
      if (!isCancel) {
        this.handleTouchTap(memo);
      }
      return;
    }

    this.clearPointerGesture(memo);

    if (memo.state !== 'dragging') return;

    if (isCancel) {
      this.cancelDrag(memo);
      return;
    }

    memo.focusAnchorX = memo.x;
    memo.focusAnchorY = memo.y;
    memo.releaseSpeed = Math.hypot(memo.vx, memo.vy);

    this.triggerPaperFlutter(memo, memo.releaseSpeed, memo.vx, memo.vy);

    if (!memo.dragMoved) {
      this.setForegroundMemo(memo, { keepFocus: true });
      return;
    }

    if (memo.releaseSpeed > 1.2 && (this.isMemoPastDespawnThreshold(memo) || this.isMemoHeadingOffscreen(memo))) {
      this.scheduleRespawn(memo, performance.now());
      this.syncMemoInteractivity();
      this.ensureLoop();
      return;
    }

    memo.state = 'returning';
    memo.vz = this.reduceMotion ? -0.08 : -0.16;
    memo.stackOrder = ++this.topStack;
    this.syncMemoInteractivity();
    this.ensureLoop();
  };

  FloatingMemoField.prototype.releaseOtherForegroundMemos = function (memo) {
    for (var i = 0; i < this.memos.length; i++) {
      if (this.memos[i] !== memo && this.memos[i].state === 'foreground') {
        this.blurForegroundMemo(this.memos[i], 'return');
      }
    }
  };

  FloatingMemoField.prototype.setForegroundMemo = function (memo, options) {
    var keepFocus = !!(options && options.keepFocus);
    var anchorCenter = !!(options && options.anchorCenter);
    var touchPromote = !!(options && options.touchPromote);

    this.releaseOtherForegroundMemos(memo);

    memo.state = 'foreground';
    memo.focusAnchorX = anchorCenter ? 0 : clamp(memo.x * 0.24, -this.sceneWidth * 0.18, this.sceneWidth * 0.18);
    memo.focusAnchorY = anchorCenter
      ? -this.sceneHeight * 0.05
      : clamp(memo.y * 0.12 - this.sceneHeight * 0.04, -this.sceneHeight * 0.15, this.sceneHeight * 0.1);
    memo.vx = 0;
    memo.vy = 0;
    memo.vz = 0;
    memo.releaseSpeed = 0;
    if (touchPromote) {
      memo.touchPromotedAt = performance.now();
      memo.touchFocusLockUntil = memo.touchPromotedAt + TOUCH_FOCUS_LOCK_MS;
    }
    memo.stackOrder = ++this.topStack;
    this.syncMemoInteractivity();
    this.ensureLoop();

    if (keepFocus) {
      this.focusMemoTextArea(memo);
    }
  };

  FloatingMemoField.prototype.startReturn = function (memo) {
    if (!memo || memo.state === 'floating' || memo.state === 'returning' || memo.state === 'respawning') return;
    if (memo.pointerId !== null) {
      this.detachDragListeners(memo, memo.pointerId);
      this.clearPointerGesture(memo);
    }
    memo.pendingBlurMode = '';
    memo.state = 'returning';
    memo.focusAnchorX = memo.x;
    memo.focusAnchorY = memo.y;
    memo.stackOrder = ++this.topStack;
    this.syncMemoInteractivity();
    this.ensureLoop();
  };

  FloatingMemoField.prototype.releaseForegroundMemos = function () {
    for (var i = 0; i < this.memos.length; i++) {
      if (this.memos[i].state === 'foreground') {
        if (document.activeElement === this.memos[i].textarea) {
          this.blurForegroundMemo(this.memos[i], 'keep');
        } else {
          this.startReturn(this.memos[i]);
        }
      }
    }
  };

  FloatingMemoField.prototype.syncMemoInteractivity = function () {
    for (var i = 0; i < this.memos.length; i++) {
      var memo = this.memos[i];
      var editable = memo.state === 'foreground';
      memo.textarea.readOnly = !editable;
      memo.textarea.tabIndex = editable ? 0 : -1;
      memo.element.style.pointerEvents = memo.state === 'respawning' ? 'none' : 'auto';
      memo.element.setAttribute('data-memo-editable', editable ? 'true' : 'false');
      memo.element.setAttribute('data-memo-state', memo.state);
      memo.element.setAttribute('data-entry-edge', memo.flow ? memo.flow.entryEdge : 'none');
      memo.element.setAttribute('data-spawn-generation', String(memo.spawnGeneration));
      memo.element.setAttribute('data-paper-flutter', memo.paperMotion.flutterAmp > 0.12 ? 'true' : 'false');
      var stateLabel = memo.element.querySelector('.memo-field-lab__memo-state');
      if (stateLabel) {
        if (memo.state === 'foreground') stateLabel.textContent = 'active';
        else if (memo.state === 'dragging') stateLabel.textContent = 'dragging';
        else if (memo.state === 'returning') stateLabel.textContent = 'returning';
        else if (memo.state === 'respawning') stateLabel.textContent = 'respawn';
        else stateLabel.textContent = 'floating';
      }
    }
  };

  FloatingMemoField.prototype.open = function () {
    if (!this.overlay) return;
    this.isOpen = true;
    this.overlay.hidden = false;
    this.overlay.setAttribute('aria-hidden', 'false');
    document.documentElement.setAttribute('data-memo-lab-open', 'true');
    this.updateSceneMetrics();
    this.updateKeyboardInset();
    this.seedMemoTransforms();
    this.lastFrameMs = 0;
    this.syncMemoInteractivity();
    this.ensureLoop();
    if (this.closeButton) this.closeButton.focus({ preventScroll: true });
  };

  FloatingMemoField.prototype.close = function () {
    if (!this.overlay) return;
    this.isOpen = false;
    this.stopLoop();
    for (var i = 0; i < this.memos.length; i++) {
      this.resetMemoGestureForClose(this.memos[i]);
    }
    this.overlay.hidden = true;
    this.overlay.setAttribute('aria-hidden', 'true');
    document.documentElement.removeAttribute('data-memo-lab-open');
    this.keyboardInset = 0;
    this.releaseForegroundMemos();
    saveBodies(this.memos);
  };

  FloatingMemoField.prototype.toggle = function () {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  };

  FloatingMemoField.prototype.ensureLoop = function () {
    if (!this.isOpen || document.hidden || this.frameId) return;
    this.frameId = window.requestAnimationFrame(this.tick);
  };

  FloatingMemoField.prototype.stopLoop = function () {
    if (!this.frameId) return;
    window.cancelAnimationFrame(this.frameId);
    this.frameId = 0;
    this.lastFrameMs = 0;
  };

  FloatingMemoField.prototype.tick = function (now) {
    this.frameId = 0;
    if (!this.isOpen) return;
    if (!this.lastFrameMs) this.lastFrameMs = now;

    var dtMs = clamp(now - this.lastFrameMs || 16, 10, 32);
    var timeSec = now / 1000;
    this.lastFrameMs = now;

    for (var i = 0; i < this.memos.length; i++) {
      this.updateMemo(this.memos[i], dtMs, timeSec, now);
      this.renderMemo(this.memos[i]);
    }

    this.ensureLoop();
  };

  FloatingMemoField.prototype.updateMemo = function (memo, dtMs, timeSec, nowMs) {
    if (memo.state === 'respawning') {
      if (nowMs >= memo.respawnAt) {
        this.configureFlowState(memo, memo.spawnGeneration + 1, false);
        memo.state = 'floating';
        this.placeMemoAtFlowTarget(memo, timeSec);
        this.syncMemoInteractivity();
      }
      this.updatePaperMotion(memo, dtMs);
      return;
    }

    if (!memo.hasTransform) {
      this.placeMemoAtFlowTarget(memo, timeSec);
    }

    var floatingTarget = this.getFlowTarget(memo, timeSec);

    if (memo.state === 'floating') {
      memo.flow.flowProgress += memo.flow.flowSpeed * (dtMs / 1000) * (this.reduceMotion ? 0.35 : 1);
      floatingTarget = this.getFlowTarget(memo, timeSec);
      memo.x = lerp(memo.x, floatingTarget.x, frameEase(this.reduceMotion ? 0.08 : 0.05, dtMs));
      memo.y = lerp(memo.y, floatingTarget.y, frameEase(this.reduceMotion ? 0.08 : 0.05, dtMs));
      memo.z = lerp(memo.z, floatingTarget.z, frameEase(this.reduceMotion ? 0.08 : 0.06, dtMs));
      memo.rotX = lerp(memo.rotX, floatingTarget.rotX, frameEase(0.1, dtMs));
      memo.rotY = lerp(memo.rotY, floatingTarget.rotY, frameEase(0.1, dtMs));
      memo.rotZ = lerp(memo.rotZ, floatingTarget.rotZ, frameEase(0.08, dtMs));
      this.updateViewportMembership(memo);
      if (memo.hasEnteredViewport && this.isMemoPastDespawnThreshold(memo)) {
        this.scheduleRespawn(memo, nowMs);
        this.syncMemoInteractivity();
      }
      this.updatePaperMotion(memo, dtMs);
      return;
    }

    if (memo.state === 'foreground') {
      var frontTarget = this.getForegroundTarget(memo);
      memo.x = lerp(memo.x, frontTarget.x, frameEase(0.12, dtMs));
      memo.y = lerp(memo.y, frontTarget.y, frameEase(0.12, dtMs));
      memo.z = lerp(memo.z, frontTarget.z, frameEase(0.16, dtMs));
      memo.rotX = lerp(memo.rotX, frontTarget.rotX, frameEase(0.16, dtMs));
      memo.rotY = lerp(memo.rotY, frontTarget.rotY, frameEase(0.16, dtMs));
      memo.rotZ = lerp(memo.rotZ, frontTarget.rotZ, frameEase(0.14, dtMs));
      this.updatePaperMotion(memo, dtMs);
      return;
    }

    if (memo.state === 'dragging') {
      memo.z = lerp(memo.z, this.reduceMotion ? 210 : DRAG_Z, frameEase(0.2, dtMs));
      this.updatePaperMotion(memo, dtMs);
      return;
    }

    if (memo.state === 'returning') {
      memo.flow.flowProgress += memo.flow.flowSpeed * (dtMs / 1000) * (this.reduceMotion ? 0.18 : 0.46);
      floatingTarget = this.getFlowTarget(memo, timeSec);

      memo.x += memo.vx * dtMs;
      memo.y += memo.vy * dtMs;
      memo.z += memo.vz * dtMs;

      var damping = Math.pow(this.reduceMotion ? 0.78 : 0.88, dtMs / 16);
      memo.vx *= damping;
      memo.vy *= damping;
      memo.vz *= damping;

      memo.x = lerp(memo.x, floatingTarget.x, frameEase(this.reduceMotion ? 0.05 : 0.035, dtMs));
      memo.y = lerp(memo.y, floatingTarget.y, frameEase(this.reduceMotion ? 0.05 : 0.035, dtMs));
      memo.z = lerp(memo.z, floatingTarget.z, frameEase(this.reduceMotion ? 0.06 : 0.04, dtMs));
      memo.rotX = lerp(memo.rotX, floatingTarget.rotX, frameEase(0.1, dtMs));
      memo.rotY = lerp(memo.rotY, floatingTarget.rotY, frameEase(0.1, dtMs));
      memo.rotZ = lerp(memo.rotZ, floatingTarget.rotZ, frameEase(0.08, dtMs));
      this.updateViewportMembership(memo);

      if (memo.releaseSpeed > 1.2 && (this.isMemoPastDespawnThreshold(memo) || this.isMemoHeadingOffscreen(memo))) {
        this.scheduleRespawn(memo, nowMs);
        this.syncMemoInteractivity();
        this.updatePaperMotion(memo, dtMs);
        return;
      }

      if (Math.abs(memo.x - floatingTarget.x) < 1.8 &&
        Math.abs(memo.y - floatingTarget.y) < 1.8 &&
        Math.abs(memo.z - floatingTarget.z) < 2 &&
        Math.abs(memo.vx) < 0.04 &&
        Math.abs(memo.vy) < 0.04 &&
        Math.abs(memo.vz) < 0.04) {
        memo.state = 'floating';
        memo.vx = 0;
        memo.vy = 0;
        memo.vz = 0;
        this.syncMemoInteractivity();
      }

      this.updatePaperMotion(memo, dtMs);
    }
  };

  FloatingMemoField.prototype.updateViewportMembership = function (memo) {
    var isInside = Math.abs(memo.x) <= this.sceneHalfWidth && Math.abs(memo.y) <= this.sceneHalfHeight;
    if (isInside) {
      memo.hasEnteredViewport = true;
    }
  };

  FloatingMemoField.prototype.isMemoPastDespawnThreshold = function (memo) {
    var outsideX = Math.abs(memo.x) > this.sceneHalfWidth;
    var outsideY = Math.abs(memo.y) > this.sceneHalfHeight;
    if (!outsideX && !outsideY) return false;

    var threshold = Math.max(memo.width, memo.height) * 0.75;
    var distanceX = Math.max(0, Math.abs(memo.x) - this.sceneHalfWidth);
    var distanceY = Math.max(0, Math.abs(memo.y) - this.sceneHalfHeight);

    return Math.max(distanceX, distanceY) > threshold;
  };

  FloatingMemoField.prototype.isMemoHeadingOffscreen = function (memo) {
    var edgeThresholdX = this.sceneHalfWidth * 0.72;
    var edgeThresholdY = this.sceneHalfHeight * 0.72;
    var movingOutX = Math.abs(memo.x) > edgeThresholdX && Math.abs(memo.vx) > 0.2 && Math.sign(memo.x) === Math.sign(memo.vx);
    var movingOutY = Math.abs(memo.y) > edgeThresholdY && Math.abs(memo.vy) > 0.2 && Math.sign(memo.y) === Math.sign(memo.vy);
    return movingOutX || movingOutY;
  };

  FloatingMemoField.prototype.scheduleRespawn = function (memo, nowMs) {
    var delayRandom = createSeededRandom(hashString(memo.id + '|respawn-delay|' + (memo.spawnGeneration + 1)));
    memo.state = 'respawning';
    memo.respawnAt = nowMs + Math.round(seededRange(delayRandom, 120, 400));
    memo.releaseSpeed = 0;
    memo.vx = 0;
    memo.vy = 0;
    memo.vz = 0;
  };

  FloatingMemoField.prototype.triggerPaperFlutter = function (memo, releaseSpeed, vx, vy) {
    var motion = memo.paperMotion;
    var horizontalBias = releaseSpeed ? Math.abs(vx) / releaseSpeed : 0;
    var verticalBias = releaseSpeed ? Math.abs(vy) / releaseSpeed : 0;

    motion.axisX = verticalBias;
    motion.axisY = horizontalBias;

    if (this.reduceMotion) {
      motion.flutterAmp = 0;
      motion.flutterValue = 0;
      motion.bendX = clamp(-vy * 4.8, -2.6, 2.6);
      motion.bendY = clamp(vx * 6.4, -3.2, 3.2);
      return;
    }

    if (releaseSpeed <= 1.2) {
      motion.flutterAmp = 0;
      motion.flutterValue = 0;
      motion.bendX = clamp(-vy * 5.8, -3.1, 3.1);
      motion.bendY = clamp(vx * 7.4, -4.2, 4.2);
      return;
    }

    motion.flutterAmp = clamp((releaseSpeed - 1.2) * 7.6, 1, 6.4);
    motion.flutterFreq = clamp(0.02 + releaseSpeed * 0.008, 0.022, 0.036);
    motion.flutterPhase = 0;
    motion.flutterDamping = clamp(700 - releaseSpeed * 150, 350, 700);
    motion.flutterValue = motion.flutterAmp;
    motion.bendX = clamp(-vy * 7.6, -4.6, 4.6);
    motion.bendY = clamp(vx * 9.4, -6.2, 6.2);
  };

  FloatingMemoField.prototype.updatePaperMotion = function (memo, dtMs) {
    var motion = memo.paperMotion;
    var targetBendX = 0;
    var targetBendY = 0;

    if (memo.state === 'dragging') {
      targetBendX = clamp(-memo.vy * 8.5, -5.2, 5.2);
      targetBendY = clamp(memo.vx * 11.5, -7.4, 7.4);
      motion.axisX = clamp(Math.abs(memo.vy) * 1.4, 0, 1);
      motion.axisY = clamp(Math.abs(memo.vx) * 1.4, 0, 1);
    } else if (memo.state === 'returning') {
      targetBendX = clamp(-memo.vy * 6.4, -3.8, 3.8);
      targetBendY = clamp(memo.vx * 8.4, -4.8, 4.8);
    } else if (memo.state === 'foreground') {
      targetBendX = motion.bendX * 0.28;
      targetBendY = motion.bendY * 0.28;
    }

    if (this.reduceMotion) {
      motion.flutterAmp = 0;
      motion.flutterValue = 0;
      targetBendX *= 0.45;
      targetBendY *= 0.45;
    } else if (motion.flutterAmp > 0.02) {
      motion.flutterPhase += dtMs * motion.flutterFreq;
      motion.flutterAmp *= Math.exp(-dtMs / motion.flutterDamping);
      motion.flutterValue = Math.sin(motion.flutterPhase) * motion.flutterAmp;
      if (motion.flutterAmp < 0.06) {
        motion.flutterAmp = 0;
        motion.flutterValue = 0;
      }
    } else {
      motion.flutterAmp = 0;
      motion.flutterValue = 0;
    }

    motion.bendX = lerp(motion.bendX, targetBendX, frameEase(0.16, dtMs));
    motion.bendY = lerp(motion.bendY, targetBendY, frameEase(0.16, dtMs));
  };

  FloatingMemoField.prototype.renderPaperMotion = function (memo) {
    if (!memo.shell || !memo.content) return;

    var motion = memo.paperMotion;
    var flutter = this.reduceMotion ? 0 : motion.flutterValue;
    var shellRotateX = motion.bendX + flutter * motion.axisX * 0.34;
    var shellRotateY = motion.bendY + flutter * motion.axisY * 0.62;
    var contentRotateX = shellRotateX * 0.25;
    var contentRotateY = shellRotateY * 0.25;

    memo.shell.style.transform =
      'translateZ(0px) rotateX(' + shellRotateX.toFixed(2) + 'deg) rotateY(' + shellRotateY.toFixed(2) + 'deg)';
    memo.content.style.transform =
      'translateZ(10px) rotateX(' + contentRotateX.toFixed(2) + 'deg) rotateY(' + contentRotateY.toFixed(2) + 'deg)';

    for (var i = 0; i < memo.strips.length; i++) {
      var strip = memo.strips[i];
      var ratio = memo.strips.length > 1 ? (i / (memo.strips.length - 1)) * 2 - 1 : 0;
      var stripRotateY = motion.bendY * ratio + flutter * motion.axisY * ratio * 1.25;
      var stripRotateX = motion.bendX * (0.75 - Math.abs(ratio) * 0.2) + flutter * motion.axisX * (0.8 - Math.abs(ratio) * 0.15);
      strip.style.transform =
        'translateZ(' + (1.5 + Math.abs(ratio) * 1.5).toFixed(2) + 'px) rotateX(' + stripRotateX.toFixed(2) + 'deg) rotateY(' + stripRotateY.toFixed(2) + 'deg)';
      strip.style.opacity = (0.12 + clamp(Math.abs(flutter) / 12, 0, 0.18)).toFixed(3);
    }

    memo.element.setAttribute('data-paper-flutter', motion.flutterAmp > 0.12 ? 'true' : 'false');
  };

  FloatingMemoField.prototype.renderMemo = function (memo) {
    if (!memo.element) return;

    var opacity = memo.state === 'respawning'
      ? 0
      : clamp(0.52 + memo.z / 360, 0.48, 1);

    if (memo.state === 'foreground' || memo.state === 'dragging') {
      opacity = 1;
    }

    var interactionBoost = 0;
    if (memo.state === 'dragging') interactionBoost = 920;
    else if (memo.state === 'foreground') interactionBoost = 760;
    else if (memo.state === 'returning') interactionBoost = 160;

    memo.projectedDepth = memo.z + interactionBoost + memo.stackOrder * 0.25;

    memo.element.style.transform =
      'translate3d(' + memo.x.toFixed(2) + 'px, ' + memo.y.toFixed(2) + 'px, ' + memo.z.toFixed(2) + 'px) ' +
      'rotateX(' + memo.rotX.toFixed(2) + 'deg) ' +
      'rotateY(' + memo.rotY.toFixed(2) + 'deg) ' +
      'rotateZ(' + memo.rotZ.toFixed(2) + 'deg)';
    memo.element.style.opacity = opacity.toFixed(3);
    memo.element.style.zIndex = String(Math.round(2400 + memo.projectedDepth * 10));

    this.renderPaperMotion(memo);
  };

  var floatingMemoField = new FloatingMemoField();

  function initWhenReady() {
    floatingMemoField.init();
  }

  window.ZWFloatingMemoField = {
    open: function () {
      floatingMemoField.init();
      floatingMemoField.open();
    },
    close: function () {
      floatingMemoField.close();
    },
    toggle: function () {
      floatingMemoField.init();
      floatingMemoField.toggle();
    },
    isOpen: function () {
      return floatingMemoField.isOpen;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWhenReady, { once: true });
  } else {
    initWhenReady();
  }
})();
