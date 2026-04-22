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
  /** Normal モードのサイドバー専用 edge rail 幅。sidebar 本体の幾何から分離する。 */
  var SIDEBAR_EDGE_RAIL_PX = 14;
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
        return focusPanel.offsetWidth;
      }
    }
    return getSidebarWidthPx();
  }

  /** 開く閾値: **アクティブパネル実幅**（Focus=章パネル / Normal=サイドバー）と連動。
      ユーザーの視覚上「サイドバー内ならホバーで開く」と一致させるため、パネル実幅までを
      トリガー範囲とする。パネルが極端に狭い場合は LEFT_EDGE_OPEN_MIN_PX (120px) で下支え。
      極小ウィンドウではウィンドウ右端より内側にクランプ。 */
  function getLeftEdgeZone() {
    var panelWidth = getActivePanelWidthPx();
    var windowCap = Math.max(LEFT_EDGE_OPEN_MIN_PX, window.innerWidth - WINDOW_RIGHT_SAFE_PX);
    return Math.max(LEFT_EDGE_OPEN_MIN_PX, Math.min(windowCap, panelWidth));
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
    return Math.min(rawDismiss, windowCap);
  }
  /** エッジ内に留まってから UI を出すまでの遅延。0 で即座表示（session 91: ユーザー要望により即応化）。 */
  var DWELL_MS = 0;
  /** エッジ外へ出たあと非表示までの遅延。0 で即座 dismiss（session 91: 同上）。 */
  var DISMISS_MS = 0;
  /** packaged app 起動直後や Focus→Normal 遷移直後は、左端に残ったカーソルで
      sidebar が即 reopen しやすいため、Normal の edge rail を短時間だけ遅延させる。 */
  var NORMAL_RAIL_ARM_DELAY_MS = 450;
  /** Electron のウィンドウ移動後は hover 状態が stale になりやすいため、再検知を少し待つ。 */
  var WINDOW_MOVE_RAIL_SUSPEND_MS = 700;

  var state = {
    top: { active: false, dwellTimer: null, dismissTimer: null },
    left: { active: false, dwellTimer: null, dismissTimer: null }
  };
  /** 左エッジホバー自身が開いたサイドバーの所有権フラグ。
      forceSidebarState(true) が常に data-sidebar-open を付けるため、
      isSidebarNormallyOpen() だけでは「手動で開いた」と「ホバーで一時的に開いた」を判別できず、
      hideEdge の閉じ処理が無効化される問題への対処 (Bug 2-b)。 */
  var leftEdgeOpenedSidebar = false;
  var lastPointer = { x: 0, y: 0 };
  var normalRailSuppressedUntil = 0;
  var lastSidebarOpenState = false;
  var lastWindowScreenPos = {
    x: typeof window.screenX === 'number' ? window.screenX : (typeof window.screenLeft === 'number' ? window.screenLeft : 0),
    y: typeof window.screenY === 'number' ? window.screenY : (typeof window.screenTop === 'number' ? window.screenTop : 0)
  };

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

  function isReaderOverlayOpen() {
    return html.getAttribute('data-reader-overlay-open') === 'true';
  }

  function nowMs() {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return performance.now();
    }
    return Date.now();
  }

  function suspendNormalSidebarRail(delayMs) {
    normalRailSuppressedUntil = nowMs() + (typeof delayMs === 'number' ? delayMs : NORMAL_RAIL_ARM_DELAY_MS);
  }

  function isNormalSidebarRailSuppressed() {
    return !isFocusMode() && nowMs() < normalRailSuppressedUntil;
  }

  function getWindowScreenPos() {
    return {
      x: typeof window.screenX === 'number' ? window.screenX : (typeof window.screenLeft === 'number' ? window.screenLeft : 0),
      y: typeof window.screenY === 'number' ? window.screenY : (typeof window.screenTop === 'number' ? window.screenTop : 0)
    };
  }

  function notifyWindowMoved() {
    if (state.top.active) startDismiss('top');
    if ((state.left.active || leftEdgeOpenedSidebar) && !isFocusMode()) {
      suspendNormalSidebarRail(WINDOW_MOVE_RAIL_SUSPEND_MS);
      startDismiss('left');
    }
  }

  function getSidebarDockSide() {
    return html.getAttribute('data-dock-sidebar') === 'right' ? 'right' : 'left';
  }

  function isSidebarDockedRight() {
    return getSidebarDockSide() === 'right';
  }

  function shouldDismissLeftAt(x) {
    return x > getLeftEdgeDismissZone();
  }

  function getLeftHoverTarget() {
    if (isFocusMode()) {
      return document.querySelector('.focus-chapter-panel');
    }
    return document.getElementById('sidebar');
  }

  function getLeftHoverTargetRect() {
    var target = getLeftHoverTarget();
    if (!target) return null;
    var rect = target.getBoundingClientRect();
    if (!(rect.width > 0 && rect.height > 0)) return null;
    return rect;
  }

  function isPointInsideRect(x, y, rect, extra) {
    if (!rect) return false;
    var pad = typeof extra === 'number' ? extra : 0;
    return x >= rect.left - pad &&
      x <= rect.right + pad &&
      y >= rect.top - pad &&
      y <= rect.bottom + pad;
  }

  function getSidebarEdgeRailRect() {
    var rail = document.getElementById('sidebar-edge-rail');
    if (rail) {
      var rect = rail.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return rect;
    }

    if (isSidebarDockedRight()) {
      return {
        left: window.innerWidth - SIDEBAR_EDGE_RAIL_PX,
        right: window.innerWidth,
        top: 0,
        bottom: window.innerHeight,
        width: SIDEBAR_EDGE_RAIL_PX,
        height: window.innerHeight
      };
    }

    return {
      left: 0,
      right: SIDEBAR_EDGE_RAIL_PX,
      top: 0,
      bottom: window.innerHeight,
      width: SIDEBAR_EDGE_RAIL_PX,
      height: window.innerHeight
    };
  }

  function getSidebarResizeHandleRect() {
    var handle = document.getElementById('dock-sidebar-resize-handle');
    if (!handle) return null;
    var style = getComputedStyle(handle);
    if (style.display === 'none' || style.visibility === 'hidden') return null;
    var rect = handle.getBoundingClientRect();
    if (!(rect.width > 0 && rect.height > 0)) return null;
    return rect;
  }

  function isPointInNormalSidebarRail(x, y) {
    return isPointInsideRect(x, y, getSidebarEdgeRailRect(), 0);
  }

  function isNormalSidebarInteractionActiveAt(x, y) {
    var sidebarRect = getLeftHoverTargetRect();
    if (!sidebarRect) return false;
    if (isPointInsideRect(x, y, sidebarRect, 8)) return true;
    if (isPointInsideRect(x, y, getSidebarResizeHandleRect(), 4)) return true;
    if (isSidebarDockedRight()) {
      return x >= Math.max(0, sidebarRect.left - LEFT_EDGE_CLOSE_BUFFER_PX);
    }
    return x <= Math.min(window.innerWidth, sidebarRect.right + LEFT_EDGE_CLOSE_BUFFER_PX);
  }

  /** 左レールが一度開いた後は、パネル本体か dismiss buffer の内側にいる限り
      「まだ操作継続中」とみなし、window 端の mouseleave や一時的な高速移動で閉じない。 */
  function isLeftInteractionActiveAt(x, y) {
    if (isFocusMode()) {
      if (x <= getLeftEdgeDismissZone()) return true;
      return isPointInsideRect(x, y, getLeftHoverTargetRect(), 8);
    }
    return isNormalSidebarInteractionActiveAt(x, y);
  }

  function clearLeftDwellIfInactive() {
    if (!state.left.active) {
      clearTimeout(state.left.dwellTimer);
      state.left.dwellTimer = null;
    }
  }

  function handleLeftTriggerZoneHover() {
    if (isFocusMode()) {
      if (state.left.active) cancelDismiss('left');
      else startDwell('left');
      return;
    }

    if (isReaderOverlayOpen()) {
      clearLeftDwellIfInactive();
      return;
    }

    if (isNormalSidebarRailSuppressed()) {
      clearLeftDwellIfInactive();
      return;
    }

    if (state.left.active) cancelDismiss('left');
    else startDwell('left');
  }

  function syncSidebarOpenState() {
    var isOpen = isSidebarNormallyOpen();
    if (isOpen === lastSidebarOpenState) return;
    lastSidebarOpenState = isOpen;
    if (!isOpen && !isFocusMode()) {
      suspendNormalSidebarRail();
      clearLeftDwellIfInactive();
    }
  }

  // --- 表示/非表示 ---

  function showEdge(edge) {
    if (state[edge].active) return;
    state[edge].active = true;
    clearTimeout(state[edge].dismissTimer);
    html.setAttribute('data-edge-hover-' + edge, 'true');
  }

  function hideEdge(edge) {
    var forceCloseOwnedSidebar = edge === 'left' && !isFocusMode() && leftEdgeOpenedSidebar;
    if (!state[edge].active && !forceCloseOwnedSidebar) return;
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
    var inLeftTriggerZone = isFocusMode()
      ? x <= getLeftEdgeZone()
      : (!isReaderOverlayOpen() && isPointInNormalSidebarRail(x, y));
    var leftDismissZone = getLeftEdgeDismissZone();
    if (inLeftTriggerZone) {
      handleLeftTriggerZoneHover();
    } else {
      if (!state.left.active) {
        clearLeftDwellIfInactive();
      } else if (isLeftInteractionActiveAt(x, y)) {
        cancelDismiss('left');
      } else if (!isFocusMode() || x > leftDismissZone) {
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
    var sidebarRail = document.getElementById('sidebar-edge-rail');
    var sidebar = document.getElementById('sidebar');

    if (sidebarRail) {
      var handleSidebarRailHover = function (e) {
        if (!e || typeof e.clientX !== 'number' || typeof e.clientY !== 'number') return;
        if (isFocusMode() || isReaderOverlayOpen()) return;
        if (!isPointInNormalSidebarRail(e.clientX, e.clientY)) return;
        lastPointer.x = e.clientX;
        lastPointer.y = e.clientY;
        handleLeftTriggerZoneHover();
      };

      sidebarRail.addEventListener('mouseenter', handleSidebarRailHover);
      sidebarRail.addEventListener('mousemove', handleSidebarRailHover);
      sidebarRail.addEventListener('mouseleave', function (e) {
        if (state.left.active) return;
        if (!e || typeof e.clientX !== 'number' || typeof e.clientY !== 'number') {
          clearLeftDwellIfInactive();
          return;
        }
        if (!isPointInNormalSidebarRail(e.clientX, e.clientY)) {
          clearLeftDwellIfInactive();
        }
      });
    }

    if (sidebar) {
      sidebar.addEventListener('mouseenter', function () {
        cancelDismiss('left');
        markLeftEdgeTouched();
      });
      sidebar.addEventListener('mouseleave', function (e) {
        if (!state.left.active) return;
        var x = e && typeof e.clientX === 'number' ? e.clientX : lastPointer.x;
        if (shouldDismissLeftAt(x)) startDismiss('left');
      });
    }

    var sidebarHandle = document.getElementById('dock-sidebar-resize-handle');
    if (sidebarHandle) {
      sidebarHandle.addEventListener('mouseenter', function () {
        cancelDismiss('left');
        markLeftEdgeTouched();
      });
      sidebarHandle.addEventListener('mouseleave', function (e) {
        if (!state.left.active) return;
        var x = e && typeof e.clientX === 'number' ? e.clientX : lastPointer.x;
        var y = e && typeof e.clientY === 'number' ? e.clientY : lastPointer.y;
        if (!isLeftInteractionActiveAt(x, y)) startDismiss('left');
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
    if (state.left.active) {
      if (isFocusMode()) {
        if (shouldDismissLeftAt(x)) {
          if (isLeftInteractionActiveAt(x, y)) return;
          startDismiss('left');
        }
      } else if (!isLeftInteractionActiveAt(x, y)) {
        startDismiss('left');
      }
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
    suspendNormalSidebarRail();
    lastSidebarOpenState = isSidebarNormallyOpen();
    lastWindowScreenPos = getWindowScreenPos();

    document.addEventListener('mousemove', function (e) {
      onMouseMove(e);
      onMouseLeaveEdge(e);
      updateGlowProximity(e.clientX, e.clientY);
    });

    // ウィンドウ外にカーソルが出たら全dismiss
    document.addEventListener('mouseleave', function () {
      if (state.top.active) startDismiss('top');
      if (state.left.active && !isLeftInteractionActiveAt(lastPointer.x, lastPointer.y)) {
        startDismiss('left');
      }
    });

    setupUIHoverGuard();

    window.addEventListener('ZenWriterUIModeChanged', function (e) {
      if (e && e.detail && e.detail.mode === 'normal') {
        suspendNormalSidebarRail();
      }
    });

    // frameless packaged window を drag した後は、hover-open のまま stale になりやすい。
    // screenX/screenY の変化を軽く監視し、一時表示のサイドバーだけを閉じて再検知を待つ。
    window.setInterval(function () {
      var pos = getWindowScreenPos();
      if (pos.x === lastWindowScreenPos.x && pos.y === lastWindowScreenPos.y) return;
      lastWindowScreenPos = pos;
      notifyWindowMoved();
    }, 150);

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
      var hasSidebarStateChange = mutations.some(function (m) {
        return m.attributeName === 'data-sidebar-open';
      });
      if (hasSidebarStateChange) syncSidebarOpenState();
      updateGlowVisibility(onlyReaderOverlay);
    }).observe(html, { attributes: true, attributeFilter: ['data-ui-mode', 'data-reader-overlay-open', 'data-sidebar-open'] });

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
    /** 外部要因（例: frameless window drag）で hover 状態が stale になった時の解除 */
    notifyWindowMoved: function () { notifyWindowMoved(); },
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
