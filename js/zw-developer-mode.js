/**
 * 開発者モード判定（Markdown ソース編集・一部実験コマンドのゲート）
 * - localStorage zenwriter-developer-mode === 'true'
 * - または localhost / 127.0.0.1（ローカル検証用）
 */
(function () {
  'use strict';

  function isEnabled() {
    try {
      if (localStorage.getItem('zenwriter-developer-mode') === 'true') return true;
    } catch (_) { /* noop */ }
    var h = (typeof location !== 'undefined' && location.hostname) ? String(location.hostname) : '';
    if (h === 'localhost' || h === '127.0.0.1') return true;
    return false;
  }

  function syncDocumentAttr() {
    try {
      if (isEnabled()) {
        document.documentElement.setAttribute('data-developer-mode', 'true');
      } else {
        document.documentElement.removeAttribute('data-developer-mode');
      }
    } catch (_) { /* noop */ }
  }

  window.ZenWriterDeveloperMode = {
    isEnabled: isEnabled,
    syncDocumentAttr: syncDocumentAttr
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncDocumentAttr);
  } else {
    syncDocumentAttr();
  }
})();
