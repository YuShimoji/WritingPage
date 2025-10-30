(function(){
  'use strict';

  function ensure(fn){ try{ return typeof fn === 'function'; } catch(_){ return false; } }
  function byId(id){ return document.getElementById(id); }
  function el(tag, cls){ var e=document.createElement(tag); if (cls) e.className=cls; return e; }
  function parseTags(text){
    return String(text||'')
      .split(',')
      .map(function(s){ return s.trim(); })
      .filter(Boolean);
  }
  function joinTags(tags){ return Array.isArray(tags)? tags.join(', ') : ''; }
  function getContent(){
    try {
      if (window.ZenWriterAPI && ensure(window.ZenWriterAPI.getContent)) {
        return String(window.ZenWriterAPI.getContent() || '');
      }
    } catch(_){}
    try { if (window.ZenWriterStorage && ensure(window.ZenWriterStorage.loadContent)) return String(window.ZenWriterStorage.loadContent()||''); } catch(_){}
    return '';
  }

  function extractCandidateTerms(text){
    var t = String(text||'');
    var tokens = t.split(/[^\p{L}\p{N}_]+/u).filter(Boolean);
    var counts = {};
    for (var i=0;i<tokens.length;i++){
      var w = tokens[i];
      if (w.length < 2) continue;
      // ヒューリスティック: 先頭大文字、全角カタカナ、長い英単語等を候補に
      var isCapital = /^[A-Z][a-zA-Z]+$/.test(w);
      var isKatakana = /^[\u30A0-\u30FFー]+$/.test(w);
      var isLongAscii = /^[A-Za-z]{5,}$/.test(w);
      if (!(isCapital || isKatakana || isLongAscii)) continue;
      counts[w] = (counts[w]||0)+1;
    }
    var list = Object.keys(counts).map(function(k){ return { term:k, freq:counts[k] }; });
    list.sort(function(a,b){ return b.freq - a.freq; });
    return list.slice(0, 50);
  }

  function defaultGenerate(term, options){
    var opt = options || {};
    var detail = opt.detailLevel || 3;
    var tone = opt.tone || 'neutral';
    var variety = opt.variety || 'balanced';
    var lines = [];
    lines.push('# '+term);
    lines.push('概要: この用語の基本的な説明を記入します。');
    if (detail >= 2) lines.push('起源/背景: 歴史的背景や由来。');
    if (detail >= 3) lines.push('登場: 物語中でこの用語がどのように登場するか。');
    if (detail >= 4) lines.push('関係: 関連人物・場所・アイテムとの関係性。');
    if (detail >= 5) lines.push('メモ: 設計意図、補足情報、派生設定など。');
    lines.push('\n[トーン: '+tone+', バラエティ: '+variety+']');
    return lines.join('\n');
  }

  function requestAIGeneration(term, docText, options){
    try {
      if (window.ZenWriterAI && ensure(window.ZenWriterAI.generateWiki)){
        return Promise.resolve(window.ZenWriterAI.generateWiki(term, docText, options)).then(function(res){
          if (typeof res === 'string') return res;
          if (res && typeof res.content === 'string') return res.content;
          return defaultGenerate(term, options);
        }).catch(function(){ return defaultGenerate(term, options); });
      }
    } catch(_){}
    return Promise.resolve(defaultGenerate(term, options));
  }

  function registerGadget(){
    if (!window.ZWGadgets || typeof window.ZWGadgets.register !== 'function') return;

    window.ZWGadgets.register('Wiki', function(root, api){
      var STORAGE = window.ZenWriterStorage;
      if (!STORAGE) { root.textContent = 'ストレージが利用できません'; return; }

      root.innerHTML = '';
      root.style.display = 'flex';
      root.style.flexDirection = 'column';
      root.style.gap = '8px';

      var toolbar = el('div','wiki-toolbar');
      toolbar.style.display='flex'; toolbar.style.gap='6px'; toolbar.style.flexWrap='wrap';
      var search = el('input'); search.type='search'; search.placeholder='検索 (タイトル/本文/タグ)'; search.style.flex='1';
      var btnNew = el('button','small'); btnNew.textContent='新規ページ';
      var btnScan = el('button','small'); btnScan.textContent='ドキュメントから候補抽出';
      toolbar.appendChild(search); toolbar.appendChild(btnNew); toolbar.appendChild(btnScan);

      var settings = el('div','wiki-settings');
      settings.style.display='grid'; settings.style.gridTemplateColumns='repeat(3, minmax(0,1fr))'; settings.style.gap='6px';
      var detailLbl = el('label'); detailLbl.textContent='詳細度';
      var detail = el('input'); detail.type='range'; detail.min='1'; detail.max='5'; detail.step='1'; detail.value=String(api.get('detailLevel',3));
      var toneLbl = el('label'); toneLbl.textContent='トーン';
      var tone = el('select'); ['neutral','formal','casual','dramatic','technical'].forEach(function(t){ var o=el('option'); o.value=t; o.textContent=t; tone.appendChild(o); });
      tone.value = String(api.get('tone','neutral'));
      var varietyLbl = el('label'); varietyLbl.textContent='バラエティ';
      var variety = el('select'); ['balanced','concise','elaborate','creative'].forEach(function(v){ var o=el('option'); o.value=v; o.textContent=v; variety.appendChild(o); });
      variety.value = String(api.get('variety','balanced'));
      settings.appendChild(detailLbl); settings.appendChild(detail); settings.appendChild(toneLbl); settings.appendChild(tone); settings.appendChild(varietyLbl); settings.appendChild(variety);

      var layout = el('div'); layout.style.display='grid'; layout.style.gridTemplateColumns='minmax(180px, 280px) 1fr'; layout.style.gap='8px';
      var listWrap = el('div'); listWrap.style.border='1px solid var(--border-color)'; listWrap.style.borderRadius='4px'; listWrap.style.padding='6px'; listWrap.style.maxHeight='280px'; listWrap.style.overflow='auto';
      var list = el('div'); listWrap.appendChild(list);
      var editor = el('div'); editor.style.display='grid'; editor.style.gap='6px'; editor.style.alignContent='start';
      var title = el('input'); title.type='text'; title.placeholder='タイトル';
      var folder = el('input'); folder.type='text'; folder.placeholder='フォルダ';
      var tags = el('input'); tags.type='text'; tags.placeholder='タグ (カンマ区切り)';
      var body = el('textarea'); body.rows=10; body.placeholder='本文（Markdown 可）';
      var btnSave = el('button','small'); btnSave.textContent='保存';
      var btnGenerate = el('button','small'); btnGenerate.textContent='選択語から生成';
      editor.appendChild(title); editor.appendChild(folder); editor.appendChild(tags); editor.appendChild(body); editor.appendChild(btnSave); editor.appendChild(btnGenerate);

      layout.appendChild(listWrap); layout.appendChild(editor);

      root.appendChild(toolbar); root.appendChild(settings); root.appendChild(layout);

      var state = { currentId: null, items: [] };
      function seedHelpPages(){
        var helpPages = [
          { id: 'help-editor', title: 'エディタ機能', folder: 'ヘルプ', content: '# エディタ機能\n\n## 基本操作\n- **テキスト入力**: 直接編集可能\n- **保存**: Ctrl+S または自動保存\n\n## タイプライター・モード\n- 設定で有効化\n- カーソル位置にテキストが追従\n\n## フォント装飾\n- トップバーアイコンで太字、斜体等\n- テキストアニメーション: フェード、スケール等\n\n## プレビュー\n- マークダウンリアルタイムプレビュー\n- スクロール同期可能', tags: ['help','editor'] },
          { id: 'help-gadgets', title: 'ガジェットガイド', folder: 'ヘルプ', content: '# ガジェットガイド\n\n## 構造タブ\n- **ドキュメント**: 複数ファイル管理\n- **アウトライン**: 見出しレベル設定\n- **Wiki**: 用語管理\n\n## タイポタブ\n- **エディタレイアウト**: 余白調整\n\n## アシストタブ\n- **時計**: 執筆時間表示\n- **目標**: 文字数目標設定\n- **スナップショット**: 自動保存\n- **印刷設定**: 印刷スタイル\n\n## UI設定\n- タブ表示方式: ボタン/タブ/ドロップダウン/アコーディオン\n- サイドバー幅調整', tags: ['help','gadgets'] },
          { id: 'help-wiki', title: 'Wiki使用法', folder: 'ヘルプ', content: '# Wiki使用法\n\n## ページ作成\n- 新規ページボタンで作成\n- タイトル、本文、タグ、フォルダ設定\n\n## AI生成\n- 選択語から自動生成\n- ドキュメント候補抽出\n\n## 検索\n- タイトル、本文、タグで検索\n\n## 設定\n- 詳細度: 1-5\n- トーン: neutral/formal/casual/dramatic/technical\n- バラエティ: balanced/concise/elaborate/creative', tags: ['help','wiki'] },
          { id: 'help-nodegraph', title: 'Node Graph', folder: 'ヘルプ', content: '# Node Graph\n\n## ノード作成\n- 追加ボタンでノード作成\n\n## リンク作成\n- ノード間ドラッグで接続\n\n## 保存\n- 自動保存、ページごと\n\n## 用途\n- キャラクター関係図\n- プロット構造\n- 世界観マップ', tags: ['help','nodegraph'] },
          { id: 'help-typewriter', title: 'タイプライター・モード', folder: 'ヘルプ', content: '# タイプライター・モード\n\n## 有効化\n- アシストタブ > Typewriterガジェット\n\n## 設定\n- **アンカー比**: 0.5 = 画面中央\n- **スティッキネス**: 0 = 追従なし, 1 = 即時追従\n\n## 動作\n- 入力中カーソルが固定位置に\n- 長文執筆に適する', tags: ['help','typewriter'] },
          { id: 'help-snapshot', title: 'スナップショット', folder: 'ヘルプ', content: '# スナップショット\n\n## 自動保存\n- 間隔: デフォルト120秒\n- 変更文字数: デフォルト300文字\n\n## 手動保存\n- Snapshot Managerガジェット > 手動ボタン\n\n## 保持数\n- デフォルト10件\n\n## 復元\n- リストから選択して復元', tags: ['help','snapshot'] }
        ];
        helpPages.forEach(function(page){
          try {
            if (!STORAGE.listWikiPages().some(function(p){ return p.id === page.id; })){
              STORAGE.createWikiPage(page);
            }
          } catch(_){}
        });
      }
      seedHelpPages();
        var all = STORAGE.listWikiPages();
        var q = String(search.value||'').toLowerCase();
        var filtered = !q? all : all.filter(function(p){
          var hay = (p.title||'')+'\n'+(p.content||'')+'\n'+(Array.isArray(p.tags)? p.tags.join(',') : '');
          return hay.toLowerCase().indexOf(q) >= 0;
        });
        state.items = filtered;
        list.innerHTML = '';
        filtered.forEach(function(p){
          var row = el('div','wiki-row');
          row.style.display='grid'; row.style.gridTemplateColumns='1fr auto'; row.style.alignItems='center'; row.style.gap='6px'; row.style.padding='4px'; row.style.borderBottom='1px solid var(--border-color)';
          var left = el('div');
          var ttl = el('div'); ttl.textContent = p.title || p.id; ttl.style.fontWeight='600';
          var meta = el('div'); meta.style.fontSize='0.8rem'; meta.style.opacity='0.8'; meta.textContent = (p.folder? '['+p.folder+'] ' : '') + joinTags(p.tags||[]);
          left.appendChild(ttl); left.appendChild(meta);
          var open = el('button','small'); open.textContent='開く';
          open.addEventListener('click', function(){ loadToEditor(p.id); });
          row.appendChild(left); row.appendChild(open);
          list.appendChild(row);
        });
      }
      function loadToEditor(id){
        var all = STORAGE.listWikiPages();
        var p = all.find(function(x){ return x && x.id === id; });
        if (!p) return;
        state.currentId = id;
        title.value = p.title || '';
        folder.value = p.folder || '';
        tags.value = joinTags(p.tags||[]);
        body.value = p.content || '';
      }
      function saveCurrent(){
        var id = state.currentId;
        if (!id){
          var page = STORAGE.createWikiPage({ title: title.value||'無題', content: body.value||'', tags: parseTags(tags.value||''), folder: String(folder.value||'') });
          state.currentId = page.id;
        } else {
          STORAGE.updateWikiPage(id, { title: title.value||'無題', content: body.value||'', tags: parseTags(tags.value||''), folder: String(folder.value||'') });
        }
        refreshList();
      }

      btnNew.addEventListener('click', function(){
        state.currentId = null;
        title.value=''; folder.value=''; tags.value=''; body.value='';
      });
      btnSave.addEventListener('click', saveCurrent);

      btnGenerate.addEventListener('click', function(){
        var sel = '';
        try {
          var ta = byId('editor');
          if (ta && typeof ta.selectionStart === 'number' && typeof ta.selectionEnd === 'number' && ta.selectionEnd > ta.selectionStart){
            sel = String((ta.value||'').slice(ta.selectionStart, ta.selectionEnd));
          }
        } catch(_){ sel=''; }
        if (!sel) return;
        var opt = { detailLevel: parseInt(detail.value,10)||3, tone: tone.value, variety: variety.value };
        requestAIGeneration(sel, getContent(), opt).then(function(text){
          body.value = text;
        });
      });

      btnScan.addEventListener('click', function(){
        var content = getContent();
        var terms = extractCandidateTerms(content);
        if (!terms.length) return;
        var top = terms[0].term;
        title.value = top;
        var opt = { detailLevel: parseInt(detail.value,10)||3, tone: tone.value, variety: variety.value };
        requestAIGeneration(top, content, opt).then(function(text){ body.value = text; });
      });

      // persist settings via ZWGadgets settings
      detail.addEventListener('change', function(){ api.set('detailLevel', parseInt(detail.value,10)||3); });
      tone.addEventListener('change', function(){ api.set('tone', String(tone.value||'neutral')); });
      variety.addEventListener('change', function(){ api.set('variety', String(variety.value||'balanced')); });

      refreshList();
    }, { title: 'Wiki', groups: ['assist','structure'] });
  }

  // init when gadgets ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerGadget);
  } else {
    registerGadget();
  }
})();
