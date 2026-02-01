(function () {
  // 有効条件: ?embed=1 のときのみ postMessage リスナーを有効化
  var isEmbed = /(?:^|[?&])embed=1(?:&|$)/.test(location.search);
  if (!isEmbed) return;

  var allowedOrigin = (function () {
    try {
      var sp = new URLSearchParams(location.search);
      var p = sp.get('embed_origin') || '';
      if (p) return p;
      // フォールバック: 親の origin を referrer から推定
      try {
        return new URL(document.referrer).origin;
      } catch (_) {
        return '';
      }
    } catch (_) {
      return '';
    }
  })();

  function sendToParent(msg) {
    try {
      if (!window.parent) return;
      // 許可 origin が特定できない場合は送信しない
      if (!allowedOrigin) return;
      window.parent.postMessage(msg, allowedOrigin);
    } catch (_) { }
  }

  function reply(requestId, ok, result, error) {
    sendToParent({
      type: 'ZW_RESPONSE',
      requestId: requestId,
      ok: !!ok,
      result: result,
      error: error,
    });
  }

  function onMessage(event) {
    // 親フレームからのメッセージのみ受理 + origin 検証
    if (event.source !== window.parent) return;
    if (!allowedOrigin) return;
    if (event.origin !== allowedOrigin) return;
    var data = (event && event.data) || {};
    if (!data || !data.type) return;
    var id = data.requestId;
    try {
      switch (data.type) {
        case 'ZW_GET_CONTENT':
          if (
            window.ZenWriterAPI &&
            typeof window.ZenWriterAPI.getContent === 'function'
          ) {
            var text = String(window.ZenWriterAPI.getContent() || '');
            reply(id, true, text);
          } else {
            reply(id, true, '');
          }
          break;
        case 'ZW_SET_CONTENT':
          var t = (data.payload && data.payload.text) || '';
          if (
            window.ZenWriterAPI &&
            typeof window.ZenWriterAPI.setContent === 'function'
          ) {
            var ok = !!window.ZenWriterAPI.setContent(String(t));
            reply(id, ok, ok);
          } else {
            reply(id, false, false, 'ZenWriterAPI.setContent not available');
          }
          break;
        case 'ZW_FOCUS':
          if (
            window.ZenWriterAPI &&
            typeof window.ZenWriterAPI.focus === 'function'
          ) {
            var fok = !!window.ZenWriterAPI.focus();
            reply(id, fok, fok);
          } else {
            reply(id, false, false, 'ZenWriterAPI.focus not available');
          }
          break;
        case 'ZW_TAKE_SNAPSHOT':
          if (
            window.ZenWriterAPI &&
            typeof window.ZenWriterAPI.takeSnapshot === 'function'
          ) {
            var sok = !!window.ZenWriterAPI.takeSnapshot();
            reply(id, sok, sok);
          } else {
            reply(id, false, false, 'ZenWriterAPI.takeSnapshot not available');
          }
          break;
        default:
          // ignore
          break;
      }
    } catch (e) {
      reply(id, false, null, (e && e.message) || 'error');
    }
  }

  window.addEventListener('message', onMessage);

  function ready() {
    // ZenWriterAPI 準備完了を待ってから READY を通知（set/get の競合回避）
    (function waitAPI(startTs) {
      try {
        if (
          window.ZenWriterAPI &&
          typeof window.ZenWriterAPI.getContent === 'function' &&
          typeof window.ZenWriterAPI.setContent === 'function'
        ) {
          sendToParent({ type: 'ZW_EMBED_READY' });
          return;
        }
      } catch (_) { }
      if (!startTs) startTs = Date.now();
      if (Date.now() - startTs > 10000) {
        // タイムアウト時は最小限のREADY（getは空文字fallback, setは失敗返却）
        sendToParent({ type: 'ZW_EMBED_READY' });
        return;
      }
      setTimeout(function () {
        waitAPI(startTs);
      }, 50);
    })();
  }
  if (
    document.readyState === 'complete' ||
    document.readyState === 'interactive'
  )
    ready();
  else window.addEventListener('DOMContentLoaded', ready);

  // ======= 子→親 イベント通知 =======
  function tryHookEvents() {
    try {
      var ed =
        window.ZenWriterEditor && window.ZenWriterEditor.editor
          ? window.ZenWriterEditor.editor
          : document.getElementById('editor');
      if (ed && !ed.__zw_hooked_input__) {
        ed.addEventListener('input', function () {
          try {
            sendToParent({
              type: 'ZW_CONTENT_CHANGED',
              payload: { len: (ed.value || '').length },
            });
          } catch (_) { }
        });
        ed.__zw_hooked_input__ = true;
      }
      // setContent フック
      if (
        window.ZenWriterEditor &&
        typeof window.ZenWriterEditor.setContent === 'function' &&
        !window.ZenWriterEditor.__zw_hooked_set__
      ) {
        var _origSet = window.ZenWriterEditor.setContent.bind(
          window.ZenWriterEditor,
        );
        window.ZenWriterEditor.setContent = function (text) {
          var r = _origSet(text);
          try {
            var el =
              window.ZenWriterEditor && window.ZenWriterEditor.editor
                ? window.ZenWriterEditor.editor
                : document.getElementById('editor');
            sendToParent({
              type: 'ZW_CONTENT_CHANGED',
              payload: { len: el ? (el.value || '').length : 0 },
            });
          } catch (_) { }
          return r;
        };
        window.ZenWriterEditor.__zw_hooked_set__ = true;
      }
      // addSnapshot フック
      if (
        window.ZenWriterStorage &&
        typeof window.ZenWriterStorage.addSnapshot === 'function' &&
        !window.ZenWriterStorage.__zw_hooked_snap__
      ) {
        var _origSnap = window.ZenWriterStorage.addSnapshot.bind(
          window.ZenWriterStorage,
        );
        window.ZenWriterStorage.addSnapshot = function (content) {
          var r = _origSnap(content);
          try {
            sendToParent({ type: 'ZW_SNAPSHOT_CREATED' });
          } catch (_) { }
          return r;
        };
        window.ZenWriterStorage.__zw_hooked_snap__ = true;
      }
    } catch (_) { }
  }
  if (
    document.readyState === 'complete' ||
    document.readyState === 'interactive'
  )
    tryHookEvents();
  else window.addEventListener('DOMContentLoaded', tryHookEvents);
})();
