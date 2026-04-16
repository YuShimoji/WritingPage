/**
 * edge-hover.js — スクリーンエッジホバーUI (SP-081 Phase 3)
 *
 * マウスカーソルが画面端に近づくと、隠れたUIを一時的にスライドイン表示する。
 * - 上端 (Focus のみ): メインハブのクイックツールを表示
 * - 左端: 章パネル (Focus) / サイドバー一時表示 (Normal)
 *
 * 上端ホバーはツールバーのスライドイン表示（Focus のみ）。MainHubPanel は廃止済み。
 *
 * 左エッジは y > EDGE_ZONE のみ（左上隅は上端ホバーとトグル競合を避けるため除外）。
 */
(function () {
  'use strict';

  /** 上端エッジ検知ゾーン (px)。画面上端からこの距離内でホバー扱い（ツールバー用、固定）。 */
  var EDGE_ZONE = 24;
  /** 開く側トリガー下限 (px): パネル実幅が極端に狭い場合の保険。 */
  var LEFT_EDGE_OPEN_MIN_PX = 120;
  /** 閉じる側バッファ (px)。パネル右端からこの距離を超えたら閉じる（ヒステリシス）。
      リサイズハンドル (.dock-resize-handle, width 4px, right -2px) のヒットエリアを
      跨いでも閉じないよう、col-resize カーソル活性化に必要な余裕を十分に確保する。 */
  var LEFT_EDGE_CLOSE_BUFFER_PX = 120;
  /** ウィンドウ右端から内側に確保する安全マージン (px)。極小ウィンドウ (DevTools ドック時等)
      でも閉じる操作を可能にするため、openZone/dismissZone はこの範囲内にクランプする。 */
  var WINDOW_RIGHT_SAFE_PX = 16;

  function parseCssLengthToPx(raw, baseFontPx) {
    var value = String(raw || '').trim();
    if (!value) return NaN;
    if (value.endsWith('px')) return parseFloat(value);
    if (value.endsWith('rem') || value.endsWith('em')) {
      return parseFloat(value) * (baseFontPx || 16);
    }
    return parseFloat(value);
  }

  function getSidebarWidthPx() {
    var sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.offsetWidth > 0) {
      return sidebar.offsetWidth;
    }

    var rootStyle = getComputedStyle(document.documentElement);
    var cssWidth = rootStyle.getPropertyValue('--sidebar-width');
    var rootFontPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    var parsed = parseCssLengthToPx(cssWidth, rootFontPx);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 320;
  }

  /** edge-hover の基準となる「実際に表示されているパネル」の幅を返す。
      Focus モード: .focus-chapter-panel (max-width: 15rem = 240px)
      Normal モード: .sidebar (動的リサイズ可能)
      対象が存在しない/幅 0 のときはサイドバーへフォールバック。 */
  function getActivePanelWidthPx() {
    if (isFocusMode()) {
      var focusPanel = document.querySelector('.focus-chapter-panel');
      if (focusPanel && focusPanel.offsetWidth > 0) {
        if (debugLastSidebarWidth !== focusPanel.offsetWidth) {
          debugLastSidebarWidth = focusPanel.offsetWidth;
          sendDebugLog('H1', 'edge-hover.js:getActivePanelWidthPx', 'focus-chapter-panel width observed', {
            width: focusPanel.offsetWidth,
            source: 'focus-chapter-panel'
          });
        }
        return focusPanel.offsetWidth;
      }
    }
    var sidebarWidth = getSidebarWidthPx();
    if (debugLastSidebarWidth !== sidebarWidth) {
      debugLastSidebarWidth = sidebarWidth;
      sendDebugLog('H1', 'edge-hover.js:getActivePanelWidthPx', 'sidebar width observed', {
        width: sidebarWidth,
        source: 'sidebar'
      });
    }
    return sidebarWidth;
  }

  /** 開く閾値: **アクティブパネル実幅**（Focus=章パネル / Normal=サイドバー）と連動。
      ユーザーの視覚上「サイドバー内ならホバーで開く」と一致させるため、パネル実幅までを
      トリガー範囲とする。パネルが極端に狭い場合は LEFT_EDGE_OPEN_MIN_PX (120px) で下支え。
      極小ウィンドウではウィンドウ右端より内側にクランプ。 */
  function getLeftEdgeZone() {
    var panelWidth = getActivePanelWidthPx();
    var windowCap = Math.max(LEFT_EDGE_OPEN_MIN_PX, window.innerWidth - WINDOW_RIGHT_SAFE_PX);
    var openZone = Math.max(LEFT_EDGE_OPEN_MIN_PX, Math.min(windowCap, panelWidth));
    if (debugLastOpenZone !== openZone) {
      debugLastOpenZone = openZone;
      sendDebugLog('H2', 'edge-hover.js:getLeftEdgeZone', 'left open zone recalculated', {
        windowWidth: window.innerWidth,
        panelWidth: panelWidth,
        windowCap: windowCap,
        openZone: openZone
      });
    }
    return openZone;
  }

  /** 閉じる閾値: **アクティブパネル右端 + 固定バッファ (120px)**。
      パネル幅を変えても右端から一定の緩衝距離を維持。リサイズハンドル (col-resize)
      のヒットエリアを跨いでも閉じない。
      極小ウィンドウではウィンドウ右端より内側にクランプ（閉じる手段を残すため）。 */
  function getLeftEdgeDismissZone() {
    var panelWidth = getActivePanelWidthPx();
    var rawDismiss = panelWidth + LEFT_EDGE_CLOSE_BUFFER_PX;
    // ウィンドウ右端 - 8px より内側にクランプ
    var windowCap = Math.max(getLeftEdgeZone() + 4, window.innerWidth - 8);
    var dismissZone = Math.min(rawDismiss, windowCap);
    if (debugLastDismissZone !== dismissZone) {
      debugLastDismissZone = dismissZone;
      sendDebugLog('H3', 'edge-hover.js:getLeftEdgeDismissZone', 'left dismiss zone recalculated', {
        panelWidth: panelWidth,
        rawDismiss: rawDismiss,
        windowCap: windowCap,
        dismissZone: dismissZone,
        closeBuffer: LEFT_EDGE_CLOSE_BUFFER_PX
      });
    }
    return dismissZone;
  }
  /** エッジ内に留まってから UI を出すまでの遅延。0 で即座表示（session 91: ユーザー要望により即応化）。 */
  var DWELL_MS = 0;
  /** エッジ外へ出たあと非表示までの遅延。0 で即座 dismiss（session 91: 同上）。 */
  var DISMISS_MS = 0;

  var state = {
    top: { active: false, dwellTimer: null, dismissTimer: null },
    left: { active: false, dwellTimer: null, dismissTimer: null }
  };
  var debugLastSidebarWidth = null;
  var debugLastOpenZone = null;
  var debugLastDismissZone = null;
  var debugRunId = 'run-initial';

  function sendDebugLog(hypothesisId, location, message, data) {
    // #region agent log
    fetch('http://127.0.0.1:7416/ingest/098d6a5f-d8af-4eb7-95ba-2f5a854b921a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'76c44c'},body:JSON.stringify({sessionId:'76c44c',runId:debugRunId,hypothesisId:hypothesisId,location:location,message:message,data:data,timestamp:Date.now()})}).catch(function () {});
    // #endregion
  }

  /** 左エッジホバー自身が開いたサイドバーの所有権フラグ。
      forceSidebarState(true) が常に data-sidebar-open を付けるため、
      isSidebarNormallyOpen() だけでは「手動で開いた」と「ホバーで一時的に開いた」を判別できず、
      hideEdge の閉じ処理が無効化される問題への対処 (Bug 2-b)。 */
  var leftEdgeOpenedSidebar = false;
  var lastPointer = { x: 0, y: 0 };

  var html = document.documentElement;

  /** 上端エッジで MainHub を開いたときだけ true（手動オープンのハブを誤って閉じない） */
  // --- ヘルパー ---

  /** Normal では上端ホバーを使わない */
  function shouldSkipTopEdgeDwell() {
    var mode = html.getAttribute('data-ui-mode');
    if (mode !== 'focus') return true;
    return false;
  }

  function isSidebarNormallyOpen() {
    return html.getAttribute('data-sidebar-open') === 'true';
  }

  function isFocusMode() {
    return html.getAttribute('data-ui-mode') === 'focus';
  }

  function shouldDismissLeftAt(x) {
    return x > getLeftEdgeDismissZone();
  }

  // --- 表示/非表示 ---

  function showEdge(edge) {
    if (state[edge].active) return;
    state[edge].active = true;
    clearTimeout(state[edge].dismissTimer);
    html.setAttribute('data-edge-hover-' + edge, 'true');
  }

  function hideEdge(edge) {
    if (!state[edge].active) return;
    state[edge].active = false;
    html.removeAttribute('data-edge-hover-' + edge);
    if (edge === 'left') {
      // hover 到達済みフラグもリセット（次回スライドイン時は再度フェードイン予告から始める）
      html.removeAttribute('data-edge-hover-left-touched');
    }

    // サイドバーをエッジホバーで開いた場合、閉じる (focusモードではサイドバー不使用)
    var mode = html.getAttribute('data-ui-mode');
    if (edge === 'left' && mode === 'normal' && leftEdgeOpenedSidebar) {
      var sidebar = document.getElementById('sidebar');
      if (sidebar && sidebar.classList.contains('open') &&
          window.sidebarManager && typeof window.sidebarManager.forceSidebarState === 'function') {
        window.sidebarManager.forceSidebarState(false);
      }
      leftEdgeOpenedSidebar = false;
    }
  }

  function runDwellAction(edge) {
    if (edge === 'top' && shouldSkipTopEdgeDwell()) return;
    if (edge === 'left' && isSidebarNormallyOpen()) return;

    showEdge(edge);

    // 左端: focusモードでは章パネルのみ(CSS制御)、normalではサイドバーを一時的に開く
    var mode = html.getAttribute('data-ui-mode');
    if (edge === 'left' && mode === 'normal' && window.sidebarManager &&
        typeof window.sidebarManager.forceSidebarState === 'function') {
      var sidebar = document.getElementById('sidebar');
      var alreadyOpen = sidebar && sidebar.classList.contains('open');
      if (!alreadyOpen) {
        leftEdgeOpenedSidebar = true;
      }
      window.sidebarManager.forceSidebarState(true);
    }
  }

  function startDwell(edge) {
    if (DWELL_MS <= 0) {
      clearTimeout(state[edge].dwellTimer);
      clearTimeout(state[edge].dismissTimer);
      state[edge].dwellTimer = null;
      state[edge].dismissTimer = null;
      runDwellAction(edge);
      if (edge === 'left') {
        sendDebugLog('H4', 'edge-hover.js:startDwell', 'left dwell triggered', {
          x: lastPointer.x,
          openZone: getLeftEdgeZone(),
          dismissZone: getLeftEdgeDismissZone(),
          stateActive: state.left.active
        });
      }
      return;
    }
    clearTimeout(state[edge].dismissTimer);
    state[edge].dismissTimer = null;
    if (state[edge].dwellTimer) return;
    state[edge].dwellTimer = setTimeout(function () {
      state[edge].dwellTimer = null;
      runDwellAction(edge);
    }, DWELL_MS);
  }

  function startDismiss(edge) {
    clearTimeout(state[edge].dwellTimer);
    clearTimeout(state[edge].dismissTimer);
    state[edge].dismissTimer = null;
    if (DISMISS_MS <= 0) {
      if (edge === 'left') {
        sendDebugLog('H5', 'edge-hover.js:startDismiss', 'left dismiss triggered', {
          x: lastPointer.x,
          openZone: getLeftEdgeZone(),
          dismissZone: getLeftEdgeDismissZone(),
          stateActive: state.left.active
        });
      }
      hideEdge(edge);
      return;
    }
    state[edge].dismissTimer = setTimeout(function () {
      state[edge].dismissTimer = null;
      hideEdge(edge);
    }, DISMISS_MS);
  }

  function cancelDismiss(edge) {
    clearTimeout(state[edge].dismissTimer);
    state[edge].dismissTimer = null;
  }

  // --- マウス検知 ---

  function onMouseMove(e) {
    var x = e.clientX;
    var y = e.clientY;
    lastPointer.x = x;
    lastPointer.y = y;

    // 上端判定
    if (y <= EDGE_ZONE) {
      if (state.top.active) cancelDismiss('top');
      else startDwell('top');
    } else {
      if (!state.top.active) {
        clearTimeout(state.top.dwellTimer);
        state.top.dwellTimer = null;
      }
    }

    // 左端判定:
    //  - 開く: アクティブパネル実幅 (Focus=章パネル / Normal=サイドバー) 内のホバー
    //  - 閉じる: パネル右端 + LEFT_EDGE_CLOSE_BUFFER_PX (120px) を超えたら dismiss 開始
    // パネル幅を変えても、右端からの緩衝距離は一定 (リサイズハンドル col-resize を跨いでも閉じない)。
    // 画面高さは全域で発火 (session 91 で y > EDGE_ZONE 除外撤廃)
    var leftZone = getLeftEdgeZone();
    var leftDismissZone = getLeftEdgeDismissZone();
    if (x <= leftZone) {
      if (state.left.active) cancelDismiss('left');
      else startDwell('left');
    } else {
      if (!state.left.active) {
        clearTimeout(state.left.dwellTimer);
        state.left.dwellTimer = null;
      } else if (x > leftDismissZone) {
        // 境界近傍では閉じない。バッファを超えたら dismiss 開始。
        startDismiss('left');
      }
    }
  }

  /** パネルへの hover 到達を記録し、以降は「予告フェードイン」から「固定不透明」に切り替える。
      初回スライドイン時の opacity: 0.35 → パネルに触れた瞬間 opacity: 1 に固定、
      以降パネル外に出ても (dismiss zone 内であれば) 半透明化しない。 */
  function markLeftEdgeTouched() {
    html.setAttribute('data-edge-hover-left-touched', 'true');
  }

  function setupUIHoverGuard() {
    var sidebar = document.getElementById('sidebar');

    if (sidebar) {
      sidebar.addEventListener('mouseenter', function () {
        cancelDismiss('left');
        markLeftEdgeTouched();
      });
      sidebar.addEventListener('mouseleave', function (e) {
        if (!state.left.active) return;
        var x = e && typeof e.clientX === 'number' ? e.clientX : lastPointer.x;
        sendDebugLog('H5', 'edge-hover.js:sidebarMouseleave', 'sidebar mouseleave evaluated', {
          x: x,
          dismissAt: getLeftEdgeDismissZone(),
          willDismiss: shouldDismissLeftAt(x)
        });
        if (shouldDismissLeftAt(x)) startDismiss('left');
      });
    }

    // 章パネル (focusモード用)
    var chapterPanel = document.querySelector('.focus-chapter-panel');
    if (chapterPanel) {
      chapterPanel.addEventListener('mouseenter', function () {
        cancelDismiss('left');
        markLeftEdgeTouched();
      });
      chapterPanel.addEventListener('mouseleave', function (e) {
        if (!state.left.active) return;
        var x = e && typeof e.clientX === 'number' ? e.clientX : lastPointer.x;
        sendDebugLog('H5', 'edge-hover.js:chapterPanelMouseleave', 'chapter panel mouseleave evaluated', {
          x: x,
          dismissAt: getLeftEdgeDismissZone(),
          willDismiss: shouldDismissLeftAt(x)
        });
        if (shouldDismissLeftAt(x)) startDismiss('left');
      });
    }
  }

  // エッジゾーンから離れた場合のdismiss開始
  function onMouseLeaveEdge(e) {
    var x = e.clientX;
    var y = e.clientY;

    if (state.top.active && y > EDGE_ZONE) {
      startDismiss('top');
    }

    // session 93: 上端用定数 EDGE_ZONE(24) の誤用を修正し、左端は getLeftEdgeZone() を使う。
    // 旧実装ではマウスがトリガーゾーン内 (例 50px) でも毎 mousemove で x > 24 が true となり
    // dismiss が即発火、パネルが開いても即閉じる race condition が発生していた。
    if (state.left.active && shouldDismissLeftAt(x)) {
      // focusモードでは章パネル、通常はサイドバーの矩形を参照
      var leftTarget = isFocusMode()
        ? document.querySelector('.focus-chapter-panel')
        : document.getElementById('sidebar');
      if (leftTarget) {
        var rect2 = leftTarget.getBoundingClientRect();
        if (x >= rect2.left && x <= rect2.right && y >= rect2.top && y <= rect2.bottom) {
          return; // パネル/サイドバー上 → dismiss しない
        }
      }
      startDismiss('left');
    }
  }

  // --- エッジグロー (R-5: SP-081 Phase 3) ---
  // Focus モードでエッジ付近に微かなグラデーションを常時表示。
  // テキストは一切表示しない（「自分が書いた以外の文字の排除」原則）。
  // マウスが近づくとグローが強くなり、UIの存在を示唆する。

  var glowElements = { top: null, left: null };
  // session 93: hub affordance (中央上部の極小ハンドル) を廃止。
  // createHubAffordance / updateHubAffordanceVisibility 関数は削除、関連 CSS もクリーンアップ。

  function updateHubAffordanceVisibility() {
    // session 93: 互換のため関数は残すが実質 no-op (呼出側が存在するため)
  }

  function createEdgeGlows() {
    // 上部グロー
    var topGlow = document.createElement('div');
    topGlow.className = 'edge-glow edge-glow--top';
    topGlow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(topGlow);
    glowElements.top = topGlow;

    // 左部グロー
    var leftGlow = document.createElement('div');
    leftGlow.className = 'edge-glow edge-glow--left';
    leftGlow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(leftGlow);
    glowElements.left = leftGlow;
  }

  // --- グローフラッシュ (Focus 進入時ヒント、2回限定) ---
  var GLOW_FLASH_DURATION = 2000;
  var GLOW_FLASH_MAX_COUNT = 2;
  var GLOW_FLASH_STORAGE_KEY = 'zw_edge_glow_flash_count';
  var glowFlashTimer = null;

  function getGlowFlashCount() {
    try { return parseInt(localStorage.getItem(GLOW_FLASH_STORAGE_KEY), 10) || 0; }
    catch (e) { return 0; }
  }

  function incrementGlowFlashCount() {
    try { localStorage.setItem(GLOW_FLASH_STORAGE_KEY, String(getGlowFlashCount() + 1)); }
    catch (e) { /* ignore */ }
  }

  function flashGlows() {
    if (getGlowFlashCount() >= GLOW_FLASH_MAX_COUNT) return;
    incrementGlowFlashCount();

    if (glowElements.top) glowElements.top.classList.add('edge-glow--flash');
    if (glowElements.left) glowElements.left.classList.add('edge-glow--flash');

    clearTimeout(glowFlashTimer);
    glowFlashTimer = setTimeout(function () {
      glowFlashTimer = null;
      if (html.getAttribute('data-ui-mode') !== 'focus') return;
      if (glowElements.top) glowElements.top.classList.remove('edge-glow--flash');
      if (glowElements.left) glowElements.left.classList.remove('edge-glow--flash');
    }, GLOW_FLASH_DURATION);
  }

  /** @param {boolean} [skipFlash] data-reader-overlay のみ変化したとき true（進入フラッシュを重ねない） */
  function updateGlowVisibility(skipFlash) {
    var mode = html.getAttribute('data-ui-mode');
    var shouldShow = mode === 'focus';

    if (glowElements.top) {
      glowElements.top.style.display = shouldShow ? '' : 'none';
      glowElements.top.classList.remove('edge-glow--near');
    }
    if (glowElements.left) {
      glowElements.left.style.display = shouldShow ? '' : 'none';
      glowElements.left.classList.remove('edge-glow--near');
    }

    if (shouldShow && !skipFlash) flashGlows();
    updateHubAffordanceVisibility();
  }

  /** グロー近接検知 (px)。EDGE_ZONE より広く「近づいている」ヒントのみ出す。 */
  var GLOW_ZONE = 96;

  // マウス近接でクラスを切り替え、opacity は CSS transition に委ねる
  function updateGlowProximity(x, y) {
    if (!glowElements.top && !glowElements.left) return;
    var mode = html.getAttribute('data-ui-mode');
    if (mode !== 'focus') return;
    if (glowFlashTimer) return;

    var topNear = !state.top.active && y <= GLOW_ZONE;
    var leftNear = !state.left.active && x <= GLOW_ZONE;

    if (glowElements.top) glowElements.top.classList.toggle('edge-glow--near', topNear);
    if (glowElements.left) glowElements.left.classList.toggle('edge-glow--near', leftNear);
  }

  function dismissGlows() {
    if (glowElements.top) glowElements.top.classList.remove('edge-glow--near');
    if (glowElements.left) glowElements.left.classList.remove('edge-glow--near');
  }

  // エッジホバーが発火したらグローを消す
  var originalShowEdge = showEdge;
  showEdge = function (edge) {
    dismissGlows();
    originalShowEdge(edge);
  };

  // --- 初期化 ---

  function init() {
    document.addEventListener('mousemove', function (e) {
      onMouseMove(e);
      onMouseLeaveEdge(e);
      updateGlowProximity(e.clientX, e.clientY);
    });

    // ウィンドウ外にカーソルが出たら全dismiss
    document.addEventListener('mouseleave', function () {
      if (state.top.active) startDismiss('top');
      if (state.left.active) startDismiss('left');
    });

    setupUIHoverGuard();

    // エッジグロー表示
    createEdgeGlows();
    // session 93: createHubAffordance() 呼出を撤廃。
    // 中央上部の極小ボタン (#edge-hover-hub-affordance) は Focus モードで通常サイドバーを
    // toggle するが、Focus では .focus-chapter-panel が主ナビゲーションで、通常サイドバー内の
    // mode-switch (最小/フル) はレガシー導線として混乱の原因だった。ボタン自体を生成しない。
    updateGlowVisibility();

    // UIモード変更時にグロー表示を更新
    new MutationObserver(function (mutations) {
      var onlyReaderOverlay = mutations.length > 0 && mutations.every(function (m) {
        return m.attributeName === 'data-reader-overlay-open';
      });
      updateGlowVisibility(onlyReaderOverlay);
    }).observe(html, { attributes: true, attributeFilter: ['data-ui-mode', 'data-reader-overlay-open'] });

    // ウィンドウリサイズ時にゾーンキャッシュを無効化し、直後の mousemove で再計算ログが出るようにする。
    // ゾーン値自体は毎回 mousemove で再計算されているため挙動には影響しないが、
    // デバッグ追跡 (debugLast*) を最新化するための保険。
    window.addEventListener('resize', function () {
      debugLastSidebarWidth = null;
      debugLastOpenZone = null;
      debugLastDismissZone = null;
    });
  }

  // DOMReady後に初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 外部API
  window.ZWEdgeHover = {
    /** 特定エッジのホバー状態を即時解除 */
    dismiss: function (edge) { hideEdge(edge); },
    /** 全エッジのホバー状態を解除 */
    dismissAll: function () { hideEdge('top'); hideEdge('left'); },
    /**
     * Focus へ入った直後に左章レール（data-edge-hover-left）だけ立ち上げる。
     * setUIMode が dismissAll するため、ホバー無しで章パネルを復帰させる用。
     */
    peekFocusLeftChapterRail: function () {
      if (!isFocusMode()) return;
      showEdge('left');
    }
  };
})();
