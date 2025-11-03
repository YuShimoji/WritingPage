(function(){
  'use strict';

  function el(tag, cls){ var e=document.createElement(tag); if (cls) e.className=cls; return e; }
  function clamp(n, min, max){ n=parseFloat(n); if (isNaN(n)) return min; return Math.max(min, Math.min(max, n)); }
  function toInt(n, d){ var v = parseInt(n,10); return isNaN(v) ? d : v; }

  function withStorage(updater){
    try {
      var s = window.ZenWriterStorage.loadSettings();
      updater(s);
      window.ZenWriterStorage.saveSettings(s);
    } catch(_) {}
  }

  function refreshTypewriter(){ try { if (window.ZenWriterEditor && typeof window.ZenWriterEditor.applyTypewriterIfEnabled === 'function') window.ZenWriterEditor.applyTypewriterIfEnabled(); } catch(_){} }
  function applyWrapCols(){ try { if (window.ZenWriterEditor && typeof window.ZenWriterEditor.applyWrapCols === 'function') window.ZenWriterEditor.applyWrapCols(); } catch(_){} }

  function register(){
    if (!window.ZWGadgets || typeof window.ZWGadgets.register !== 'function') return;

    // Typewriter Gadget
    window.ZWGadgets.register('Typewriter', function(root){
      var s = window.ZenWriterStorage.loadSettings();
      var tw = (s && s.typewriter) || {};
      root.innerHTML='';
      root.style.display='grid'; root.style.gap='6px';

      var row1 = el('div');
      var enabled = el('input'); enabled.type='checkbox'; enabled.checked = !!tw.enabled; var lbl1 = el('label'); lbl1.textContent = '有効化'; lbl1.style.marginLeft='6px';
      row1.appendChild(enabled); row1.appendChild(lbl1);

      var row2 = el('div');
      var anchor = el('input'); anchor.type='range'; anchor.min='0.05'; anchor.max='0.95'; anchor.step='0.05'; anchor.value = String(typeof tw.anchorRatio==='number'? tw.anchorRatio : 0.5);
      var aLbl = el('div'); aLbl.textContent = 'アンカー位置: '+anchor.value; aLbl.style.fontSize='12px';
      row2.appendChild(aLbl); row2.appendChild(anchor);

      var row3 = el('div');
      var stick = el('input'); stick.type='range'; stick.min='0'; stick.max='1'; stick.step='0.1'; stick.value = String(typeof tw.stickiness==='number'? tw.stickiness : 0.9);
      var sLbl = el('div'); sLbl.textContent = '張り付き強度: '+stick.value; sLbl.style.fontSize='12px';
      row3.appendChild(sLbl); row3.appendChild(stick);

      var row4 = el('div');
      var wrapCols = el('input'); wrapCols.type='range'; wrapCols.min='40'; wrapCols.max='120'; wrapCols.step='10'; wrapCols.value = String(typeof tw.wrapCols==='number'? tw.wrapCols : 80);
      var wLbl = el('div'); wLbl.textContent = '折り返し文字数: '+wrapCols.value; wLbl.style.fontSize='12px';
      row4.appendChild(wLbl); row4.appendChild(wrapCols);

      var btnApply = el('button','small'); btnApply.textContent='今すぐ整列';

      enabled.addEventListener('change', function(){ withStorage(function(cfg){ cfg.typewriter = cfg.typewriter||{}; cfg.typewriter.enabled = !!enabled.checked; }); refreshTypewriter(); });
      anchor.addEventListener('input', function(){ aLbl.textContent = 'アンカー位置: '+anchor.value; });
      anchor.addEventListener('change', function(){ withStorage(function(cfg){ cfg.typewriter = cfg.typewriter||{}; cfg.typewriter.anchorRatio = clamp(anchor.value,0.05,0.95); }); refreshTypewriter(); });
      stick.addEventListener('input', function(){ sLbl.textContent = '張り付き強度: '+stick.value; });
      stick.addEventListener('change', function(){ withStorage(function(cfg){ cfg.typewriter = cfg.typewriter||{}; cfg.typewriter.stickiness = clamp(stick.value,0,1); }); refreshTypewriter(); });
      wrapCols.addEventListener('input', function(){ wLbl.textContent = '折り返し文字数: '+wrapCols.value; });
      wrapCols.addEventListener('change', function(){ withStorage(function(cfg){ cfg.typewriter = cfg.typewriter||{}; cfg.typewriter.wrapCols = clamp(wrapCols.value,40,120); }); applyWrapCols(); });
      btnApply.addEventListener('click', refreshTypewriter);

      root.appendChild(row1); root.appendChild(row2); root.appendChild(row3); root.appendChild(row4); root.appendChild(btnApply);
    }, { title: 'Typewriter', groups: ['typography','assist'] });

    // Snapshot Manager Gadget
    window.ZWGadgets.register('SnapshotManager', function(root){
      var s = window.ZenWriterStorage.loadSettings();
      var snap = (s && s.snapshot) || {};
      root.innerHTML=''; root.style.display='grid'; root.style.gap='6px';

      function addNumber(label, id, min, max, step, val, onChange){
        var row = el('div'); row.style.display='grid'; row.style.gridTemplateColumns='auto 1fr'; row.style.gap='6px';
        var l = el('label'); l.textContent = label; l.setAttribute('for', id);
        var input = el('input'); input.type='number'; input.id=id; input.min=String(min); input.max=String(max); input.step=String(step); input.value=String(val);
        input.addEventListener('change', function(){ onChange(toInt(input.value, val)); });
        row.appendChild(l); row.appendChild(input); root.appendChild(row);
      }

      addNumber('間隔(ms)','snap-int',30000,300000,30000, (snap.intervalMs||120000), function(v){ withStorage(function(cfg){ cfg.snapshot=cfg.snapshot||{}; cfg.snapshot.intervalMs = Math.max(30000, Math.min(300000, v)); }); });
      addNumber('差分文字数','snap-delta',50,1000,50, (snap.deltaChars||300), function(v){ withStorage(function(cfg){ cfg.snapshot=cfg.snapshot||{}; cfg.snapshot.deltaChars = Math.max(50, Math.min(1000, v)); }); });
      addNumber('保持数','snap-keep',1,50,1, (snap.retention||10), function(v){ withStorage(function(cfg){ cfg.snapshot=cfg.snapshot||{}; cfg.snapshot.retention = Math.max(1, Math.min(50, v)); }); });

      var btn = el('button','small'); btn.textContent='今すぐスナップショット';
      btn.addEventListener('click', function(){
        if (window.ZenWriterAPI && typeof window.ZenWriterAPI.takeSnapshot==='function') { window.ZenWriterAPI.takeSnapshot(); }
        else {
          try {
            var elEditor = document.getElementById('editor');
            var content = elEditor ? (elEditor.value||'') : '';
            if (window.ZenWriterStorage && typeof window.ZenWriterStorage.addSnapshot === 'function') window.ZenWriterStorage.addSnapshot(content);
          } catch(_){}
        }
      });
      root.appendChild(btn);
    }, { title: 'Snapshot Manager', groups: ['assist','structure'] });

    // Markdown Preview Gadget
    window.ZWGadgets.register('MarkdownPreview', function(root){
      var s = window.ZenWriterStorage.loadSettings();
      var prev = (s && s.preview) || {};
      root.innerHTML=''; root.style.display='grid'; root.style.gap='6px';

      var row = el('div');
      var sync = el('input'); sync.type='checkbox'; sync.checked = !!prev.syncScroll; var lbl = el('label'); lbl.textContent='スクロール同期'; lbl.style.marginLeft='6px'; row.appendChild(sync); row.appendChild(lbl);

      var btnToggle = el('button','small'); btnToggle.textContent = 'プレビュー開閉';
      btnToggle.addEventListener('click', function(){
        var pv = document.getElementById('editor-preview'); if (!pv) return; pv.classList.toggle('editor-preview--collapsed');
      });
      sync.addEventListener('change', function(){ withStorage(function(cfg){ cfg.preview = cfg.preview||{}; cfg.preview.syncScroll = !!sync.checked; }); });

      root.appendChild(row); root.appendChild(btnToggle);
    }, { title: 'Markdown Preview', groups: ['assist','typography'] });

    // UI Settings Gadget
    window.ZWGadgets.register('UISettings', function(root){
      var s = window.ZenWriterStorage.loadSettings();
      var ui = (s && s.ui) || {};
      root.innerHTML=''; root.style.display='grid'; root.style.gap='8px';

      var presRow = el('div');
      var sel = el('select'); ['buttons','tabs','dropdown','accordion'].forEach(function(k){ var o=el('option'); o.value=k; o.textContent=k; sel.appendChild(o); }); sel.value = String(ui.tabsPresentation || 'tabs');
      var l1 = el('label'); l1.textContent='タブ表示方式'; l1.style.display='block'; presRow.appendChild(l1); presRow.appendChild(sel);

      var widthRow = el('div');
      var rng = el('input'); rng.type='range'; rng.min='220'; rng.max='560'; rng.step='10'; rng.value=String(typeof ui.sidebarWidth==='number'? ui.sidebarWidth : 320);
      var note = el('div'); note.style.fontSize='12px'; note.textContent = 'サイドバー幅: '+rng.value+'px';
      widthRow.appendChild(note); widthRow.appendChild(rng);

      var fontRow = el('div');
      var hInput = el('input'); hInput.type='number'; hInput.min='10'; hInput.max='50'; hInput.value=String(fs.heading || 20);
      var bInput = el('input'); bInput.type='number'; bInput.min='10'; bInput.max='50'; bInput.value=String(fs.body || 16);
      var hLabel = el('label'); hLabel.textContent='見出しサイズ'; hLabel.style.display='block';
      var bLabel = el('label'); bLabel.textContent='本文サイズ'; bLabel.style.display='block';
      fontRow.appendChild(hLabel); fontRow.appendChild(hInput); fontRow.appendChild(bLabel); fontRow.appendChild(bInput);

      sel.addEventListener('change', function(){ withStorage(function(cfg){ cfg.ui = cfg.ui || {}; cfg.ui.tabsPresentation = String(sel.value||'tabs'); }); try{ var sb=document.getElementById('sidebar'); if (sb) sb.setAttribute('data-tabs-presentation', String(sel.value)); if (window.ZWApplyTabsPresentationUI) window.ZWApplyTabsPresentationUI(); }catch(_){} });
      hInput.addEventListener('change', function(){ withStorage(function(cfg){ cfg.fontSizes = cfg.fontSizes || {}; cfg.fontSizes.heading = toInt(hInput.value,20); }); applyElementFontSizes(); });
      bInput.addEventListener('change', function(){ withStorage(function(cfg){ cfg.fontSizes = cfg.fontSizes || {}; cfg.fontSizes.body = toInt(bInput.value,16); }); applyElementFontSizes(); });

      root.appendChild(presRow); root.appendChild(widthRow); root.appendChild(fontRow);
    }, { title: 'UI Settings', groups: ['assist'] });

    // Font Decoration Gadget (パネルのミラー)
    window.ZWGadgets.register('FontDecoration', function(root){
      root.innerHTML='';
      var mkBtn = function(id,label){ var b=el('button','decor-btn'); b.dataset.tag=id; b.textContent=label; b.style.margin='2px'; return b; };
      var row1 = el('div'); row1.appendChild(mkBtn('bold','B')); row1.appendChild(mkBtn('italic','I')); row1.appendChild(mkBtn('underline','U')); row1.appendChild(mkBtn('strike','S')); row1.appendChild(mkBtn('black','極'));
      var row2 = el('div'); row2.appendChild(mkBtn('light','細')); row2.appendChild(mkBtn('smallcaps','SC')); row2.appendChild(mkBtn('shadow','影')); row2.appendChild(mkBtn('outline','輪')); row2.appendChild(mkBtn('glow','光'));
      var row3 = el('div'); row3.appendChild(mkBtn('uppercase','大')); row3.appendChild(mkBtn('lowercase','小')); row3.appendChild(mkBtn('capitalize','頭')); row3.appendChild(mkBtn('wide','広')); row3.appendChild(mkBtn('narrow','狭'));
      function bind(container){
        var btns = container.querySelectorAll('.decor-btn');
        btns.forEach(function(btn){ btn.addEventListener('click', function(){ try{ if (window.ZenWriterEditor && typeof window.ZenWriterEditor.applyFontDecoration==='function'){ window.ZenWriterEditor.applyFontDecoration(btn.dataset.tag); }}catch(_){} }); });
      }
      root.appendChild(row1); root.appendChild(row2); root.appendChild(row3); bind(root);
    }, { title: 'Font Decoration', groups: ['typography','assist'] });

    // Text Animation Gadget (パネルのミラー)
    window.ZWGadgets.register('TextAnimation', function(root){
      root.innerHTML='';
      var mkBtn = function(id,label){ var b=el('button','decor-btn'); b.dataset.tag=id; b.textContent=label; b.style.margin='2px'; return b; };
      var row1 = el('div'); row1.appendChild(mkBtn('fade','フェード')); row1.appendChild(mkBtn('slide','スライド')); row1.appendChild(mkBtn('type','タイプ')); row1.appendChild(mkBtn('pulse','パルス'));
      var row2 = el('div'); row2.appendChild(mkBtn('shake','シェイク')); row2.appendChild(mkBtn('bounce','バウンス')); row2.appendChild(mkBtn('fadein','遅フェード'));
      function bind(container){
        var btns = container.querySelectorAll('.decor-btn');
        btns.forEach(function(btn){ btn.addEventListener('click', function(){ try{ if (window.ZenWriterEditor && typeof window.ZenWriterEditor.applyFontDecoration==='function'){ window.ZenWriterEditor.applyFontDecoration(btn.dataset.tag); }}catch(_){} }); });
      }
      root.appendChild(row1); root.appendChild(row2); bind(root);
    }, { title: 'Text Animation', groups: ['assist','typography'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', register); else register();
})();
