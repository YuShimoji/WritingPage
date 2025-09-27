(function(){
  // 有効条件: ?embed=1 のときのみ postMessage リスナーを有効化
  var isEmbed = /(?:^|[?&])embed=1(?:&|$)/.test(location.search);
  if (!isEmbed) return;

  var allowedOrigin = (function(){
    try { return new URLSearchParams(location.search).get('embed_origin') || ''; } catch (_) { return ''; }
  })();

  function sendToParent(msg){
    try {
      var target = allowedOrigin || '*';
      window.parent && window.parent.postMessage(msg, target);
    } catch(_) {}
  }

  function reply(requestId, ok, result, error){
    sendToParent({ type: 'ZW_RESPONSE', requestId: requestId, ok: !!ok, result: result, error: error });
  }

  function onMessage(event){
    // origin 検証（親からのメッセージのみ受理）
    if (allowedOrigin && event.origin !== allowedOrigin) return;
    var data = event && event.data || {};
    if (!data || !data.type) return;
    var id = data.requestId;
    try {
      switch (data.type) {
        case 'ZW_GET_CONTENT':
          if (window.ZenWriterAPI && typeof window.ZenWriterAPI.getContent === 'function') {
            var text = String(window.ZenWriterAPI.getContent() || '');
            reply(id, true, text);
          } else {
            reply(id, true, '');
          }
          break;
        case 'ZW_SET_CONTENT':
          var t = (data.payload && data.payload.text) || '';
          if (window.ZenWriterAPI && typeof window.ZenWriterAPI.setContent === 'function') {
            var ok = !!window.ZenWriterAPI.setContent(String(t));
            reply(id, ok, ok);
          } else {
            reply(id, false, false, 'ZenWriterAPI.setContent not available');
          }
          break;
        case 'ZW_FOCUS':
          if (window.ZenWriterAPI && typeof window.ZenWriterAPI.focus === 'function') {
            var fok = !!window.ZenWriterAPI.focus();
            reply(id, fok, fok);
          } else {
            reply(id, false, false, 'ZenWriterAPI.focus not available');
          }
          break;
        case 'ZW_TAKE_SNAPSHOT':
          if (window.ZenWriterAPI && typeof window.ZenWriterAPI.takeSnapshot === 'function') {
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
      reply(id, false, null, e && e.message || 'error');
    }
  }

  window.addEventListener('message', onMessage);

  function ready(){ sendToParent({ type: 'ZW_EMBED_READY' }); }
  if (document.readyState === 'complete' || document.readyState === 'interactive') ready();
  else window.addEventListener('DOMContentLoaded', ready);
})();
