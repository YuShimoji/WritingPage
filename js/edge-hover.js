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
  /** 左端エッジ検知ゾーン: ウィンドウ幅の 1/6、最小 192px (12rem)、最大 384px (24rem)。
      CSS 側の --focus-panel-width: clamp(12rem, 100vw/6, 24rem) と同じ式で連動 (session 92)。 */
  var LEFT_EDGE_RATIO = 1 / 6;
  var LEFT_EDGE_MIN = 192;
  var LEFT_EDGE_MAX = 384;
  function getLeftEdgeZone() {
    var target = window.innerWidth * LEFT_EDGE_RATIO;
    if (target < LEFT_EDGE_MIN) return LEFT_EDGE_MIN;
    if (target > LEFT_EDGE_MAX) return LEFT_EDGE_MAX;
    return target;
  }
  /** エッジ内に留まってから UI を出すまでの遅延。0 で即座表示（session 91: ユーザー要望により即応化）。 */
  var DWELL_MS = 0;
  /** エッジ外へ出たあと非表示までの遅延。0 で即座 dismiss（session 91: 同上）。 */
  var DISMISS_MS = 0;

  var state = {
    top: { active: false, dwellTimer: null, dismissTimer: null },
    left: { active: false, dwellTimer: null, dismissTimer: null }
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

    // サイドバーをエッジホバーで開いた場合、閉じる (focusモードではサイドバー不使用)
    var mode = html.getAttribute('data-ui-mode');
    if (edge === 'left' && mode === 'normal' && !isSidebarNormallyOpen()) {
      var sidebar = document.getElementById('sidebar');
      if (sidebar && sidebar.classList.contains('open') &&
          window.sidebarManager && typeof window.sidebarManager.forceSidebarState === 'function') {
        window.sidebarManager.forceSidebarState(false);
      }
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

    // 左端判定 (session 92: トリガー幅をサイドバー幅と連動。ウィンドウ幅の 1/6、最小 192px / 最大 384px)
    // 画面高さは全域で発火 (session 91 で y > EDGE_ZONE 除外撤廃)
    // パネルそのものの上をマウスオーバーすればフェードイン発火、パネル外へ出ればフェードアウトする
    var leftZone = getLeftEdgeZone();
    if (x <= leftZone) {
      if (state.left.active) cancelDismiss('left');
      else startDwell('left');
    } else {
      if (!state.left.active) {
        clearTimeout(state.left.dwellTimer);
        state.left.dwellTimer = null;
      }
    }
  }

  function setupUIHoverGuard() {
    var sidebar = document.getElementById('sidebar');

    if (sidebar) {
      sidebar.addEventListener('mouseenter', function () { cancelDismiss('left'); });
      sidebar.addEventListener('mouseleave', function () {
        if (state.left.active) startDismiss('left');
      });
    }

    // 章パネル (focusモード用)
    var chapterPanel = document.querySelector('.focus-chapter-panel');
    if (chapterPanel) {
      chapterPanel.addEventListener('mouseenter', function () { cancelDismiss('left'); });
      chapterPanel.addEventListener('mouseleave', function () {
        if (state.left.active) startDismiss('left');
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
    if (state.left.active && x > getLeftEdgeZone()) {
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
