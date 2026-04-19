/**
 * gadgets-markdown-ref.js
 * SP-063: Markdownリファレンスガジェット
 * 責務: Markdown記法・ショートカット・アプリ固有拡張の参照UI
 */
(function () {
  'use strict';

  var ZWGadgets = window.ZWGadgets;
  if (!ZWGadgets) return;

  var STORAGE_KEY = 'zenwriter-mdref-collapsed';

  var REFERENCE = [
    {
      id: 'basic',
      title: '基本装飾',
      defaultOpen: true,
      items: [
        { syntax: '**太字**', shortcut: 'Ctrl+B', desc: '選択テキストを太字にする' },
        { syntax: '*斜体*', shortcut: 'Ctrl+I', desc: '選択テキストを斜体にする' },
        { syntax: '~~取り消し線~~', shortcut: null, desc: '取り消し線を適用する' },
        { syntax: '`コード`', shortcut: null, desc: 'インラインコードとして表示' }
      ]
    },
    {
      id: 'headings',
      title: '見出し',
      defaultOpen: false,
      items: [
        { syntax: '# 見出し1', shortcut: null, desc: '章タイトル（最上位）' },
        { syntax: '## 見出し2', shortcut: null, desc: 'シーン区切り' },
        { syntax: '### 見出し3', shortcut: null, desc: '小見出し' },
        { syntax: '#### 見出し4〜6', shortcut: null, desc: '#の数で深さを指定（4〜6）' }
      ]
    },
    {
      id: 'blocks',
      title: 'ブロック要素',
      defaultOpen: false,
      items: [
        { syntax: '- 項目', shortcut: null, desc: '順序なしリスト（* でも可）' },
        { syntax: '1. 項目', shortcut: null, desc: '順序付きリスト' },
        { syntax: '> 引用テキスト', shortcut: null, desc: '引用ブロック' },
        { syntax: '```\nコード\n```', shortcut: null, desc: 'コードブロック' },
        { syntax: '---', shortcut: null, desc: '水平線（区切り）' }
      ]
    },
    {
      id: 'links',
      title: 'リンク・画像',
      defaultOpen: false,
      items: [
        { syntax: '[テキスト](URL)', shortcut: 'Ctrl+K', desc: 'ハイパーリンクを挿入' },
        { syntax: '![代替テキスト](URL)', shortcut: null, desc: '画像を挿入' }
      ]
    },
    {
      id: 'tables',
      title: 'テーブル',
      defaultOpen: false,
      items: [
        { syntax: '| 列1 | 列2 |', shortcut: null, desc: 'テーブルヘッダー行' },
        { syntax: '|---|---|', shortcut: null, desc: '区切り行（必須）' },
        { syntax: '| A | B |', shortcut: null, desc: 'データ行' }
      ]
    },
    {
      id: 'app-ext',
      title: 'アプリ固有拡張',
      defaultOpen: false,
      items: [
        { syntax: '[[用語名]]', shortcut: null, desc: 'Wikiリンク（物語Wiki連携）' },
        { syntax: '[[用語|表示名]]', shortcut: null, desc: '表示名付きWikiリンク' },
        { syntax: '{漢字|かんじ}', shortcut: null, desc: 'ルビ（ふりがな）を振る' },
        { syntax: ':::zw-textbox{preset:"名"}', shortcut: null, desc: 'テキストボックス装飾（閉じ:::）' }
      ]
    },
    {
      id: 'shortcuts',
      title: 'キーボードショートカット',
      defaultOpen: false,
      items: [
        { syntax: null, shortcut: 'Ctrl+S', desc: '保存' },
        { syntax: null, shortcut: 'Ctrl+Z', desc: '元に戻す' },
        { syntax: null, shortcut: 'Ctrl+Y', desc: 'やり直し' },
        { syntax: null, shortcut: 'Ctrl+F', desc: '検索パネルを開く' },
        { syntax: null, shortcut: 'Ctrl+P', desc: 'コマンドパレットを開く' },
        { syntax: null, shortcut: 'Ctrl++/-/0', desc: 'フォントサイズ拡大/縮小/リセット' },
        { syntax: null, shortcut: 'F2', desc: 'UIモード切替（フルChrome ↔ ミニマル）' },
        { syntax: null, shortcut: 'Alt+1', desc: 'サイドバー開閉' },
        { syntax: null, shortcut: 'Alt+W', desc: 'ツールバー表示切替' },
        { syntax: null, shortcut: 'Esc', desc: 'モーダルを閉じる / 通常モードに戻る' }
      ]
    },
    {
      id: 'navigation',
      title: 'ナビゲーション',
      defaultOpen: false,
      items: [
        { syntax: null, shortcut: 'Alt+↑', desc: '前のシーンへ移動' },
        { syntax: null, shortcut: 'Alt+↓', desc: '次のシーンへ移動' },
        { syntax: null, shortcut: 'Alt+Shift+↑', desc: '前の章へ移動' },
        { syntax: null, shortcut: 'Alt+Shift+↓', desc: '次の章へ移動' }
      ]
    }
  ];

  function loadCollapseState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) { return {}; }
  }

  function saveCollapseState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  }

  ZWGadgets.register('MarkdownReference', function (el) {
    var wrap = document.createElement('div');
    wrap.className = 'gadget-markdown-ref';
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.gap = '0.375rem';

    // --- Search ---
    var searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.placeholder = '検索...';
    searchInput.style.cssText = 'width:100%;padding:0.25rem 0.5rem;border:1px solid var(--border-color,#ccc);border-radius:4px;font-size:0.85rem;box-sizing:border-box;background:var(--input-bg,#fff);color:var(--text-color,#333);';
    wrap.appendChild(searchInput);

    var collapseState = loadCollapseState();
    var categoryEls = [];

    // --- Categories ---
    REFERENCE.forEach(function (cat) {
      var section = document.createElement('div');
      section.className = 'mdref-category';
      section.setAttribute('data-category', cat.id);

      // Header
      var header = document.createElement('div');
      header.style.cssText = 'cursor:pointer;display:flex;align-items:center;gap:0.25rem;padding:0.1875rem 0;font-size:0.9rem;font-weight:600;user-select:none;';
      var arrow = document.createElement('span');
      arrow.style.cssText = 'font-size:0.7rem;width:12px;display:inline-block;transition:transform 0.15s;';
      var titleSpan = document.createElement('span');
      titleSpan.textContent = cat.title;
      header.appendChild(arrow);
      header.appendChild(titleSpan);
      section.appendChild(header);

      // Items container
      var itemsEl = document.createElement('div');
      itemsEl.className = 'mdref-items';
      itemsEl.style.cssText = 'display:flex;flex-direction:column;gap:0.125rem;padding-left:1rem;';

      cat.items.forEach(function (item) {
        var row = document.createElement('div');
        row.className = 'mdref-item';
        row.style.cssText = 'display:flex;align-items:baseline;gap:0.375rem;padding:0.125rem 0;font-size:0.82rem;line-height:1.4;';

        // Left: syntax or shortcut
        if (item.syntax) {
          var codeEl = document.createElement('code');
          codeEl.textContent = item.syntax;
          codeEl.style.cssText = 'font-size:0.8rem;background:var(--code-bg,rgba(128,128,128,0.1));padding:0.0625rem 0.25rem;border-radius:3px;white-space:nowrap;flex-shrink:0;';
          row.appendChild(codeEl);
        }

        // Right: shortcut badge (if present)
        if (item.shortcut) {
          var kbdEl = document.createElement('kbd');
          kbdEl.textContent = item.shortcut;
          kbdEl.style.cssText = 'font-size:0.75rem;background:var(--kbd-bg,rgba(128,128,128,0.15));padding:0.0625rem 0.3125rem;border-radius:3px;border:1px solid var(--border-color,#ccc);white-space:nowrap;flex-shrink:0;font-family:inherit;';
          row.appendChild(kbdEl);
        }

        // Description
        var descEl = document.createElement('span');
        descEl.textContent = item.desc;
        descEl.style.cssText = 'opacity:0.7;flex:1;min-width:0;';
        row.appendChild(descEl);

        // Store searchable text
        row._searchText = ((item.syntax || '') + ' ' + (item.shortcut || '') + ' ' + item.desc).toLowerCase();

        itemsEl.appendChild(row);
      });

      section.appendChild(itemsEl);

      // Collapse logic
      var isOpen = collapseState[cat.id] !== undefined ? collapseState[cat.id] : cat.defaultOpen;

      function setOpen(open) {
        isOpen = open;
        arrow.textContent = open ? '\u25BC' : '\u25B6';
        itemsEl.style.display = open ? 'flex' : 'none';
        collapseState[cat.id] = open;
        saveCollapseState(collapseState);
      }

      header.addEventListener('click', function () { setOpen(!isOpen); });
      setOpen(isOpen);

      wrap.appendChild(section);
      categoryEls.push({ section: section, itemsEl: itemsEl, cat: cat, setOpen: setOpen });
    });

    // --- Search filter ---
    searchInput.addEventListener('input', function () {
      var query = searchInput.value.trim().toLowerCase();
      if (!query) {
        // Show all, restore collapse state
        categoryEls.forEach(function (c) {
          c.section.style.display = '';
          var saved = collapseState[c.cat.id] !== undefined ? collapseState[c.cat.id] : c.cat.defaultOpen;
          c.setOpen(saved);
          var items = c.itemsEl.children;
          for (var i = 0; i < items.length; i++) {
            items[i].style.display = '';
          }
        });
        return;
      }

      categoryEls.forEach(function (c) {
        var hasMatch = false;
        var items = c.itemsEl.children;
        for (var i = 0; i < items.length; i++) {
          var match = items[i]._searchText && items[i]._searchText.indexOf(query) >= 0;
          items[i].style.display = match ? '' : 'none';
          if (match) hasMatch = true;
        }
        c.section.style.display = hasMatch ? '' : 'none';
        if (hasMatch) c.setOpen(true);
      });
    });

    el.appendChild(wrap);
  }, {
    groups: ['assist'],
    title: (window.UILabels && window.UILabels.GADGET_MARKDOWN_REF_TITLE) || 'Markdownリファレンス',
    description: 'Markdown記法・ショートカット・拡張記法を参照。',
    defaultCollapsed: true
  });

})();
