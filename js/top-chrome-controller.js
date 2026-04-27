(function () {
  'use strict';

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
      return;
    }
    fn();
  }

  onReady(function initTopChrome() {
    var body = document.body;
    var topChrome = document.getElementById('top-chrome');
    var trigger = document.getElementById('top-chrome-trigger');
    var handle = document.getElementById('top-chrome-handle');
    if (!body || !topChrome || !trigger || !handle) return;

    var VISIBLE_ATTR = 'data-top-chrome-visible';
    var HIDE_DELAY_MS = 30;
    var hideTimer = null;

    function isVisible() {
      return body.getAttribute(VISIBLE_ATTR) === 'true';
    }

    function cancelHide() {
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
    }

    function updateA11y(visible) {
      topChrome.setAttribute('aria-hidden', visible ? 'false' : 'true');
      handle.setAttribute('aria-expanded', visible ? 'true' : 'false');
    }

    function show(options) {
      cancelHide();
      body.setAttribute(VISIBLE_ATTR, 'true');
      updateA11y(true);
      if (options && options.focus) {
        var focusTarget = topChrome.querySelector('button:not([disabled]), [href], input:not([disabled]), select:not([disabled])');
        if (focusTarget && typeof focusTarget.focus === 'function') {
          try {
            focusTarget.focus({ preventScroll: true });
          } catch (_) {
            focusTarget.focus();
          }
        }
      }
    }

    function hide(force) {
      if (!force && topChrome.matches(':focus-within')) return;
      cancelHide();
      body.removeAttribute(VISIBLE_ATTR);
      updateA11y(false);
    }

    function scheduleHide() {
      cancelHide();
      hideTimer = setTimeout(function () {
        hide(false);
      }, HIDE_DELAY_MS);
    }

    function toggle() {
      if (isVisible()) {
        hide(true);
      } else {
        show({ focus: true });
      }
    }

    function bindButton(id, handler) {
      var button = document.getElementById(id);
      if (!button || button.dataset.topChromeBound === '1') return;
      button.dataset.topChromeBound = '1';
      button.addEventListener('click', function (event) {
        event.preventDefault();
        show();
        handler();
      });
    }

    bindButton('top-chrome-command-palette', function () {
      if (window.commandPalette && typeof window.commandPalette.toggle === 'function') {
        window.commandPalette.toggle();
      }
    });

    bindButton('top-chrome-reader-toggle', function () {
      if (window.ZWReaderPreview && typeof window.ZWReaderPreview.toggle === 'function') {
        window.ZWReaderPreview.toggle();
      }
    });

    bindButton('top-chrome-open-settings', function () {
      if (window.ZenWriterApp && typeof window.ZenWriterApp.openSettingsModal === 'function') {
        window.ZenWriterApp.openSettingsModal();
      }
    });

    bindButton('top-chrome-open-help', function () {
      if (window.ZenWriterApp && typeof window.ZenWriterApp.openHelpModal === 'function') {
        window.ZenWriterApp.openHelpModal();
      }
    });

    handle.addEventListener('click', function (event) {
      event.preventDefault();
      toggle();
    });

    topChrome.addEventListener('mouseenter', cancelHide);
    topChrome.addEventListener('mouseleave', function () {
      scheduleHide();
    });
    topChrome.addEventListener('focusin', function () {
      show();
    });
    topChrome.addEventListener('focusout', function () {
      setTimeout(function () {
        if (!topChrome.matches(':focus-within')) {
          scheduleHide();
        }
      }, 0);
    });

    document.addEventListener('mousemove', function (event) {
      if (!isVisible()) return;
      var rect = topChrome.getBoundingClientRect();
      var chromeBottom = rect.bottom > 0 ? rect.bottom : 0;
      if (event.clientY > chromeBottom + 8 && !topChrome.contains(event.target)) {
        scheduleHide();
      }
    }, true);

    document.addEventListener('pointerdown', function (event) {
      if (!isVisible()) return;
      if (topChrome.contains(event.target) || handle.contains(event.target)) return;
      hide(true);
    }, true);

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isVisible()) {
        hide(true);
      }
    }, true);

    updateA11y(false);

    window.ZenWriterTopChrome = {
      show: show,
      hide: function () { hide(true); },
      toggle: toggle,
      isVisible: isVisible,
      showAndFocus: function () { show({ focus: true }); }
    };
  });
})();
