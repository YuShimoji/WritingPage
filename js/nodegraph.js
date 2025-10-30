(function(){
  'use strict';

  function byId(id){ return document.getElementById(id); }
  function el(tag, cls){ var e=document.createElement(tag); if (cls) e.className=cls; return e; }
  function ensure(fn){ try{ return typeof fn === 'function'; } catch(_){ return false; } }

  function getDocId(){
    try { if (window.ZenWriterStorage && ensure(window.ZenWriterStorage.getCurrentDocId)) return window.ZenWriterStorage.getCurrentDocId() || 'default'; } catch(_){}
    return 'default';
  }
  function storageKey(docId){ return 'zw_nodegraph:'+ (docId || getDocId()); }
  function loadGraph(docId){
    try {
      var raw = localStorage.getItem(storageKey(docId));
      var obj = raw ? JSON.parse(raw) : null;
      if (!obj || typeof obj !== 'object') obj = { nodes: [], edges: [] };
      if (!Array.isArray(obj.nodes)) obj.nodes = [];
      if (!Array.isArray(obj.edges)) obj.edges = [];
      return obj;
    } catch(_) { return { nodes: [], edges: [] }; }
  }
  function saveGraph(docId, data){
    try { localStorage.setItem(storageKey(docId), JSON.stringify(data||{ nodes: [], edges: [] })); } catch(_){}
  }
  function uid(prefix){ return String(prefix||'ng_') + Math.random().toString(36).slice(2); }

  var TYPE_COLORS = {
    scene: '#4a90e2',
    chapter: '#7b8a8b',
    character: '#d64545',
    place: '#27ae60',
    item: '#8e44ad',
    idea: '#f39c12'
  };

  function createCanvas(){
    var wrap = el('div','ng-wrap');
    wrap.style.position='relative';
    wrap.style.width='100%';
    wrap.style.height='100%';
    wrap.style.backgroundSize='20px 20px';
    wrap.style.backgroundImage='linear-gradient(0deg, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)';
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class','ng-edges');
    svg.style.position='absolute'; svg.style.left='0'; svg.style.top='0'; svg.style.width='100%'; svg.style.height='100%';
    var nodesLayer = el('div','ng-nodes'); nodesLayer.style.position='absolute'; nodesLayer.style.left='0'; nodesLayer.style.top='0'; nodesLayer.style.width='100%'; nodesLayer.style.height='100%';
    wrap.appendChild(svg); wrap.appendChild(nodesLayer);
    return { wrap: wrap, svg: svg, nodesLayer: nodesLayer };
  }

  function renderGraph(canvas, data, onChange){
    // edges
    while (canvas.svg.firstChild) canvas.svg.removeChild(canvas.svg.firstChild);
    // nodes
    while (canvas.nodesLayer.firstChild) canvas.nodesLayer.removeChild(canvas.nodesLayer.firstChild);

    function nodeCenter(n){ return { x: (n.x||0)+((n.w||160)/2), y: (n.y||0)+((n.h||48)/2) }; }

    // draw edges
    for (var i=0;i<data.edges.length;i++){
      var e = data.edges[i];
      var from = data.nodes.find(function(n){ return n && n.id === e.from; });
      var to = data.nodes.find(function(n){ return n && n.id === e.to; });
      if (!from || !to) continue;
      var p1 = nodeCenter(from), p2 = nodeCenter(to);
      var line = document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('x1', p1.x);
      line.setAttribute('y1', p1.y);
      line.setAttribute('x2', p2.x);
      line.setAttribute('y2', p2.y);
      line.setAttribute('stroke', '#666');
      line.setAttribute('stroke-width', '2');
      canvas.svg.appendChild(line);
      if (e.label){
        var midx = (p1.x + p2.x) / 2, midy = (p1.y + p2.y) / 2;
        var text = document.createElementNS('http://www.w3.org/2000/svg','text');
        text.setAttribute('x', midx);
        text.setAttribute('y', midy - 4);
        text.setAttribute('text-anchor','middle');
        text.setAttribute('fill','#333');
        text.setAttribute('font-size','12');
        text.textContent = e.label;
        canvas.svg.appendChild(text);
      }
    }

    // draw nodes
    for (var j=0;j<data.nodes.length;j++){
      (function(n){
        var node = el('div','ng-node');
        node.style.position='absolute';
        node.style.left = (n.x||0) + 'px';
        node.style.top = (n.y||0) + 'px';
        node.style.width = (n.w||160) + 'px';
        node.style.minHeight = (n.h||48) + 'px';
        node.style.border = '2px solid '+(n.color||TYPE_COLORS[n.type]||'#888');
        node.style.borderRadius='8px';
        node.style.background='var(--bg-color, #fff)';
        node.style.boxShadow='0 2px 4px rgba(0,0,0,0.08)';
        node.style.padding='6px 8px';
        node.style.cursor='move';

        var header = el('div','ng-node-header');
        header.style.display='flex'; header.style.alignItems='center'; header.style.gap='6px';
        var badge = el('span'); badge.textContent = n.type || 'node'; badge.style.fontSize='11px'; badge.style.padding='1px 6px'; badge.style.borderRadius='999px'; badge.style.background=(n.color||TYPE_COLORS[n.type]||'#888'); badge.style.color='#fff';
        var title = el('div'); title.textContent = n.title || n.id; title.style.fontWeight='700'; title.style.flex='1';
        var del = el('button','small'); del.textContent='✕'; del.title='削除';
        header.appendChild(badge); header.appendChild(title); header.appendChild(del);
        node.appendChild(header);

        var meta = el('div','ng-node-meta'); meta.style.fontSize='12px'; meta.style.opacity='0.8'; meta.textContent = n.status ? ('status: '+n.status) : '';
        node.appendChild(meta);

        // drag
        (function(w){
          var sx, sy, sl, st;
          w.addEventListener('mousedown', function(ev){
            if (ev.button && ev.button !== 0) return;
            ev.preventDefault();
            sx = ev.clientX; sy = ev.clientY;
            sl = parseFloat(w.style.left||'0');
            st = parseFloat(w.style.top||'0');
            var move = function(ev2){
              var dx = ev2.clientX - sx, dy = ev2.clientY - sy;
              w.style.left = (sl + dx) + 'px';
              w.style.top = (st + dy) + 'px';
            };
            var up = function(){
              document.removeEventListener('mousemove', move);
              document.removeEventListener('mouseup', up);
              n.x = parseFloat(w.style.left||'0')||0;
              n.y = parseFloat(w.style.top||'0')||0;
              onChange && onChange();
            };
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
          });
        })(node);

        del.addEventListener('click', function(){
          var idx = data.nodes.findIndex(function(x){ return x && x.id === n.id; });
          if (idx>=0) data.nodes.splice(idx,1);
          // remove edges
          data.edges = data.edges.filter(function(e){ return e && e.from !== n.id && e.to !== n.id; });
          onChange && onChange();
        });

        canvas.nodesLayer.appendChild(node);
      })(data.nodes[j]);
    }
  }

  function openInPanel(title, content){
    if (window.ZenWriterPanels && ensure(window.ZenWriterPanels.createDockablePanel)){
      var id = 'panel-nodegraph';
      var exist = byId(id);
      if (exist) exist.parentNode && exist.parentNode.removeChild(exist);
      var p = window.ZenWriterPanels.createDockablePanel(id, title, content);
      window.ZenWriterPanels.showPanel(id);
      return p;
    }
    return null;
  }

  function registerGadget(){
    if (!window.ZWGadgets || typeof window.ZWGadgets.register !== 'function') return;

    window.ZWGadgets.register('NodeGraph', function(root, api){
      root.innerHTML = '';
      root.style.display='grid'; root.style.gap='6px';

      var toolbar = el('div','ng-toolbar'); toolbar.style.display='flex'; toolbar.style.gap='6px'; toolbar.style.flexWrap='wrap';
      var btnOpen = el('button','small'); btnOpen.textContent='パネルで開く';
      var btnAdd = el('button','small'); btnAdd.textContent='ノード追加';
      var btnLink = el('button','small'); btnLink.textContent='リンク';
      toolbar.appendChild(btnOpen); toolbar.appendChild(btnAdd); toolbar.appendChild(btnLink);

      var viewport = el('div','ng-viewport');
      viewport.style.minHeight='260px'; viewport.style.border='1px solid var(--border-color)'; viewport.style.borderRadius='4px'; viewport.style.position='relative';
      viewport.style.background='var(--bg-color)';

      root.appendChild(toolbar); root.appendChild(viewport);

      var data = loadGraph();
      var canvas = createCanvas();
      viewport.appendChild(canvas.wrap);

      function commit(){ saveGraph(getDocId(), data); renderGraph(canvas, data, commit); }
      renderGraph(canvas, data, commit);

      btnAdd.addEventListener('click', function(){
        var n = { id: uid('node_'), x: 16, y: 16, w: 180, h: 56, type: 'idea', title: '新規ノード', status: 'draft' };
        data.nodes.push(n); commit();
      });
      btnLink.addEventListener('click', function(){
        if (data.nodes.length < 2) return;
        var a = data.nodes[0], b = data.nodes[data.nodes.length-1];
        data.edges.push({ id: uid('edge_'), from: a.id, to: b.id, label: '関連' }); commit();
      });
      btnOpen.addEventListener('click', function(){
        var content = el('div'); content.style.minWidth='480px'; content.style.minHeight='280px'; content.style.padding='8px';
        var canvas2 = createCanvas(); content.appendChild(canvas2.wrap);
        function commit2(){ saveGraph(getDocId(), data); renderGraph(canvas2, data, commit2); }
        renderGraph(canvas2, data, commit2);
        openInPanel('Node Graph', content);
      });
    }, { title: 'Node Graph', groups: ['structure','assist'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', registerGadget); else registerGadget();
})();
