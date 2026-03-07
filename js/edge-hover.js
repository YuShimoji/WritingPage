/**
 * edge-hover.js — スクリーンエッジホバーUI
 *
 * マウスカーソルが画面端に近づくと、隠れたUIを一時的にスライドイン表示する。
 * - 上端: ツールバー
 * - 左端: サイドバー
 *
 * ブランクモード等でUIが完全に隠れている場合でも操作に到達できる。
 */
(function () {
  'use strict';

  var EDGE_ZONE = 18;       // エッジ検知ゾーン (px)
  var DWELL_MS = 280;       // 滞在時間閾値 (ms)
  var DISMISS_MS = 500;     // 離脱後の非表示ディレイ (ms)

  var state = {
    top: { active: false, dwellTimer: null, dismissTimer: null },
    left: { active: false, dwellTimer: null, dismissTimer: null }
  };

  var html = document.documentElement;

  // --- ヘルパー ---

  function isToolbarNormallyVisible() {
    return html.getAttribute('data-toolbar-hidden') !== 'true' &&
           html.getAttribute('data-ui-mode') !== 'blank';
  }

  function isSidebarNormallyOpen() {
    return html.getAttribute('data-sidebar-open') === 'true';
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

    // サイドバーをエッジホバーで開いた場合、閉じる
    if (edge === 'left' && !isSidebarNormallyOpen()) {
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

      // 左端: サイドバーを一時的に開く
      if (edge === 'left' && window.sidebarManager &&
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
      var sidebar = document.getElementById('sidebar');
      if (sidebar) {
        var rect2 = sidebar.getBoundingClientRect();
        if (x >= rect2.left && x <= rect2.right && y >= rect2.top && y <= rect2.bottom) {
          return; // サイドバー上 → dismiss しない
        }
      }
      startDismiss('left');
    }
  }

  // --- 初期化 ---

  function init() {
    document.addEventListener('mousemove', function (e) {
      onMouseMove(e);
      onMouseLeaveEdge(e);
    });

    // ウィンドウ外にカーソルが出たら全dismiss
    document.addEventListener('mouseleave', function () {
      if (state.top.active) startDismiss('top');
      if (state.left.active) startDismiss('left');
    });

    setupUIHoverGuard();
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
