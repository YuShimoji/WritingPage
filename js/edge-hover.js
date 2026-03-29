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
    return html.getAttribute('data-toolbar-hidden') !== 'true' &&
           mode !== 'blank' && mode !== 'focus';
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

    // サイドバーをエッジホバーで開いた場合、閉じる (focus/blankモードではサイドバー不使用)
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

      // 左端: focus/blankモードでは章パネルのみ(CSS制御)、normalではサイドバーを一時的に開く
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

  // --- ヒントテキスト (M-4) ---

  var HINT_STORAGE_KEY = 'zenwriter-edge-hint-count';
  var HINT_MAX_SHOWS = 2; // 2回表示したら以後は非表示
  var hintElements = { top: null, left: null };

  function getHintShownCount() {
    try {
      var raw = localStorage.getItem(HINT_STORAGE_KEY);
      return raw ? parseInt(raw, 10) || 0 : 0;
    } catch (_) { return 0; }
  }

  function incrementHintShown() {
    try {
      var count = getHintShownCount() + 1;
      localStorage.setItem(HINT_STORAGE_KEY, String(count));
      return count;
    } catch (_) { return 999; }
  }

  function createHints() {
    if (getHintShownCount() >= HINT_MAX_SHOWS) return;

    // 上部ヒント
    var topHint = document.createElement('div');
    topHint.className = 'edge-hover-hint edge-hover-hint--top';
    topHint.textContent = '\u2191 \u753b\u9762\u4e0a\u90e8\u306b\u30de\u30a6\u30b9\u3092\u79fb\u52d5\u3059\u308b\u3068\u30c4\u30fc\u30eb\u30d0\u30fc\u304c\u8868\u793a\u3055\u308c\u307e\u3059';
    topHint.setAttribute('aria-hidden', 'true');
    document.body.appendChild(topHint);
    hintElements.top = topHint;

    // 左部ヒント
    var leftHint = document.createElement('div');
    leftHint.className = 'edge-hover-hint edge-hover-hint--left';
    leftHint.textContent = '\u2190 \u753b\u9762\u5de6\u7aef\u306b\u30de\u30a6\u30b9\u3092\u79fb\u52d5\u3059\u308b\u3068\u7ae0\u30d1\u30cd\u30eb\u304c\u8868\u793a\u3055\u308c\u307e\u3059';
    leftHint.setAttribute('aria-hidden', 'true');
    document.body.appendChild(leftHint);
    hintElements.left = leftHint;
  }

  function updateHintVisibility() {
    var mode = html.getAttribute('data-ui-mode');
    var shouldShow = (mode === 'focus' || mode === 'blank') && getHintShownCount() < HINT_MAX_SHOWS;

    if (hintElements.top) hintElements.top.style.display = shouldShow ? '' : 'none';
    if (hintElements.left) hintElements.left.style.display = shouldShow ? '' : 'none';
  }

  function dismissHints() {
    if (hintElements.top) { hintElements.top.style.display = 'none'; }
    if (hintElements.left) { hintElements.left.style.display = 'none'; }
    incrementHintShown();
  }

  // エッジホバーが発火したらヒントを消す
  var originalShowEdge = showEdge;
  showEdge = function (edge) {
    dismissHints();
    originalShowEdge(edge);
  };

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

    // ヒントテキスト表示
    createHints();
    updateHintVisibility();

    // UIモード変更時にヒント表示を更新
    new MutationObserver(function () {
      updateHintVisibility();
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
