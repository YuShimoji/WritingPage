/**
 * edge-hover.js — スクリーンエッジホバーUI (SP-081 Phase 3)
 *
 * マウスカーソルが画面端に近づくと、隠れたUIを一時的にスライドイン表示する。
 * - 上端: ツールバー
 * - 左端: 章パネル (Focus モード)
 *
 * Focus モードでツールバー/章パネルが隠れている場合に操作へ到達する。
 */
(function () {
  'use strict';

  var EDGE_ZONE = 24;       // エッジ検知ゾーン (px)
  var DWELL_MS = 120;       // 滞在時間閾値 (ms)
  var DISMISS_MS = 300;     // 離脱後の非表示ディレイ (ms)

  var state = {
    top: { active: false, dwellTimer: null, dismissTimer: null },
    left: { active: false, dwellTimer: null, dismissTimer: null }
  };

  var html = document.documentElement;

  // --- ヘルパー ---

  function isToolbarNormallyVisible() {
    var mode = html.getAttribute('data-ui-mode');
    return html.getAttribute('data-toolbar-hidden') !== 'true' && mode !== 'focus';
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

  function startDwell(edge) {
    clearTimeout(state[edge].dwellTimer);
    clearTimeout(state[edge].dismissTimer);
    state[edge].dwellTimer = setTimeout(function () {
      // 対象エッジのUIが既に表示中なら何もしない
      if (edge === 'top' && isToolbarNormallyVisible()) return;
      if (edge === 'left' && isSidebarNormallyOpen()) return;

      showEdge(edge);

      // 左端: focusモードでは章パネルのみ(CSS制御)、normalではサイドバーを一時的に開く
      var mode = html.getAttribute('data-ui-mode');
      if (edge === 'left' && mode === 'normal' && window.sidebarManager &&
          typeof window.sidebarManager.forceSidebarState === 'function') {
        window.sidebarManager.forceSidebarState(true);
      }
    }, DWELL_MS);
  }

  function startDismiss(edge) {
    clearTimeout(state[edge].dwellTimer);
    clearTimeout(state[edge].dismissTimer);
    state[edge].dismissTimer = setTimeout(function () {
      hideEdge(edge);
    }, DISMISS_MS);
  }

  function cancelDismiss(edge) {
    clearTimeout(state[edge].dismissTimer);
  }

  // --- マウス検知 ---

  function onMouseMove(e) {
    var x = e.clientX;
    var y = e.clientY;

    // 上端判定
    if (y <= EDGE_ZONE) {
      if (!state.top.active) startDwell('top');
    } else {
      if (!state.top.active) {
        clearTimeout(state.top.dwellTimer);
      }
    }

    // 左端判定
    if (x <= EDGE_ZONE) {
      if (!state.left.active) startDwell('left');
    } else {
      if (!state.left.active) {
        clearTimeout(state.left.dwellTimer);
      }
    }
  }

  // ツールバー/サイドバー上にいる間はdismissをキャンセル
  function setupUIHoverGuard() {
    var toolbar = document.querySelector('.toolbar');
    var sidebar = document.getElementById('sidebar');

    if (toolbar) {
      toolbar.addEventListener('mouseenter', function () { cancelDismiss('top'); });
      toolbar.addEventListener('mouseleave', function () {
        if (state.top.active) startDismiss('top');
      });
    }

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
      // ツールバー上にいるかチェック
      var toolbar = document.querySelector('.toolbar');
      if (toolbar) {
        var rect = toolbar.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          return; // ツールバー上 → dismiss しない
        }
      }
      startDismiss('top');
    }

    if (state.left.active && x > EDGE_ZONE) {
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

  function updateGlowVisibility() {
    var mode = html.getAttribute('data-ui-mode');
    var shouldShow = mode === 'focus';

    if (glowElements.top) glowElements.top.style.display = shouldShow ? '' : 'none';
    if (glowElements.left) glowElements.left.style.display = shouldShow ? '' : 'none';
  }

  // マウス位置に応じてグローの opacity を変化させる
  function updateGlowOpacity(x, y) {
    if (!glowElements.top && !glowElements.left) return;
    var mode = html.getAttribute('data-ui-mode');
    if (mode !== 'focus') return;

    // 上部グロー: y が 0-120px で opacity 0→0.6
    if (glowElements.top && glowElements.top.style.display !== 'none') {
      var topOpacity = y <= 120 ? (1 - y / 120) * 0.6 : 0;
      glowElements.top.style.opacity = String(topOpacity);
    }

    // 左部グロー: x が 0-80px で opacity 0→0.6
    if (glowElements.left && glowElements.left.style.display !== 'none') {
      var leftOpacity = x <= 80 ? (1 - x / 80) * 0.6 : 0;
      glowElements.left.style.opacity = String(leftOpacity);
    }
  }

  function dismissGlows() {
    if (glowElements.top) { glowElements.top.style.display = 'none'; }
    if (glowElements.left) { glowElements.left.style.display = 'none'; }
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
      updateGlowOpacity(e.clientX, e.clientY);
    });

    // ウィンドウ外にカーソルが出たら全dismiss
    document.addEventListener('mouseleave', function () {
      if (state.top.active) startDismiss('top');
      if (state.left.active) startDismiss('left');
    });

    setupUIHoverGuard();

    // エッジグロー表示
    createEdgeGlows();
    updateGlowVisibility();

    // UIモード変更時にグロー表示を更新
    new MutationObserver(function () {
      updateGlowVisibility();
    }).observe(html, { attributes: true, attributeFilter: ['data-ui-mode'] });
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
    dismissAll: function () { hideEdge('top'); hideEdge('left'); }
  };
})();
