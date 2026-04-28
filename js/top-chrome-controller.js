(function () {
  'use strict';

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
      return;
    }
    fn();
  }

  onReady(function initRetiredShellShim() {
    var body = document.body;
    var VISIBLE_ATTR = 'data-top-chrome-visible';

    function clearVisibleState() {
      if (body) body.removeAttribute(VISIBLE_ATTR);
    }

    function hideRetiredSurface() {
      clearVisibleState();
      if (window.commandPalette && window.commandPalette.isVisible &&
          typeof window.commandPalette.hide === 'function') {
        window.commandPalette.hide({ skipEditingSurfaceFocus: true });
      }
    }

    function openCommandPalette() {
      clearVisibleState();
      if (window.commandPalette && typeof window.commandPalette.show === 'function') {
        window.commandPalette.show();
        return true;
      }
      return false;
    }

    clearVisibleState();

    window.ZenWriterTopChrome = {
      show: openCommandPalette,
      showAndFocus: openCommandPalette,
      toggle: openCommandPalette,
      hide: hideRetiredSurface,
      isVisible: function () { return false; }
    };
  });
})();
