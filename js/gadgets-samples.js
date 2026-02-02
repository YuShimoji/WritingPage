(function () {
  'use strict';

  var ZWGadgets = window.ZWGadgets;
  if (!ZWGadgets) return;

  function makeSvgDataUrl(opts) {
    try {
      var w = opts && opts.width ? opts.width : 900;
      var h = opts && opts.height ? opts.height : 520;
      var title = String((opts && opts.title) || 'PANEL');
      var subtitle = String((opts && opts.subtitle) || '');
      var bg = String((opts && opts.bg) || '#0f172a');
      var fg = String((opts && opts.fg) || '#e2e8f0');
      var accent = String((opts && opts.accent) || '#38bdf8');

      var svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="' +
        w +
        '" height="' +
        h +
        '" viewBox="0 0 ' +
        w +
        ' ' +
        h +
        '">' +
        '<defs>' +
        '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="' +
        bg +
        '" />' +
        '<stop offset="1" stop-color="#000000" />' +
        '</linearGradient>' +
        '</defs>' +
        '<rect x="0" y="0" width="' +
        w +
        '" height="' +
        h +
        '" rx="28" fill="url(#g)" />' +
        '<rect x="28" y="28" width="' +
        (w - 56) +
        '" height="' +
        (h - 56) +
        '" rx="18" fill="none" stroke="' +
        accent +
        '" stroke-width="6" opacity="0.75" />' +
        '<text x="50%" y="44%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="56" fill="' +
        fg +
        '">' +
        title +
        '</text>' +
        '<text x="50%" y="57%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="28" fill="' +
        fg +
        '" opacity="0.8">' +
        subtitle +
        '</text>' +
        '</svg>';

      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    } catch (_) {
      return null;
    }
  }

  function dispatchDocumentsChanged(storage) {
    try {
      window.dispatchEvent(
        new CustomEvent('ZWDocumentsChanged', {
          detail: { docs: (storage && storage.loadDocuments ? storage.loadDocuments() : []) || [] },
        }),
      );
    } catch (_) {}
  }

  function createGraphicNovelSample(storage, editorManager) {
    var now = new Date();
    var name =
      'グラフィックノベル・サンプル ' +
      String(now.getFullYear()) +
      '-' +
      String(now.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(now.getDate()).padStart(2, '0');

    var panel1 = makeSvgDataUrl({
      title: 'PANEL 01',
      subtitle: '導入（環境描写）',
      bg: '#0b1220',
      fg: '#e2e8f0',
      accent: '#22c55e',
    });

    var panel2 = makeSvgDataUrl({
      title: 'PANEL 02',
      subtitle: 'セリフ（感情）',
      bg: '#0b1220',
      fg: '#e2e8f0',
      accent: '#38bdf8',
    });

    var panel3 = makeSvgDataUrl({
      title: 'PANEL 03',
      subtitle: '効果音（強調）',
      bg: '#0b1220',
      fg: '#e2e8f0',
      accent: '#f97316',
    });

    var asset1 = panel1 ? storage.saveAssetFromDataUrl(panel1, { name: 'panel-01', fileName: 'panel-01.svg' }) : null;
    var asset2 = panel2 ? storage.saveAssetFromDataUrl(panel2, { name: 'panel-02', fileName: 'panel-02.svg' }) : null;
    var asset3 = panel3 ? storage.saveAssetFromDataUrl(panel3, { name: 'panel-03', fileName: 'panel-03.svg' }) : null;

    var a1 = asset1 && asset1.id ? 'asset://' + asset1.id : '';
    var a2 = asset2 && asset2.id ? 'asset://' + asset2.id : '';
    var a3 = asset3 && asset3.id ? 'asset://' + asset3.id : '';

    var content =
      '# グラフィックノベル サンプル\n\n' +
      '[fadein][bold]第1話: 霧のプロローグ[/bold][/fadein]\n\n' +
      '※ このサンプルは、Zen Writer の装飾タグ（例: `[bold]...[/bold]`）とアニメーションタグ（例: `[fade]...[/fade]`）を使って、\n' +
      '文字表現を強化するための雛形です。\n\n' +
      '---\n\n' +
      '## パネル1（状況）\n\n' +
      (a1 ? '![パネル1](' + a1 + ')\n\n' : '') +
      '街はまだ眠っている。\n' +
      '[light]空気の粒子が、ゆっくりと光を運ぶ。[/light]\n\n' +
      '## パネル2（セリフ）\n\n' +
      (a2 ? '![パネル2](' + a2 + ')\n\n' : '') +
      'A: 「[fade]……聞こえる？[/fade]」\n\n' +
      'B: 「[italic]うん。[/italic] でも、何が？」\n\n' +
      '[shadow]遠くの足音が、こちらへ近づく。[/shadow]\n\n' +
      '## パネル3（効果音）\n\n' +
      (a3 ? '![パネル3](' + a3 + ')\n\n' : '') +
      '[shake][black][wide]ドンッ[/wide][/black][/shake]\n\n' +
      '（※ 漫画風の効果音表現。`[wide]` / `[black]` / `[shake]` を組み合わせています）\n\n' +
      '---\n\n' +
      '### 次にやること\n\n' +
      '- ここから「シーンごとに見出し + パネル画像 + セリフ」を増やす\n' +
      '- `FontDecoration` / `TextAnimation` ガジェットで装飾を試す\n' +
      '- 画像は貼り付けで `asset://` として管理されます\n';

    var doc = storage.createDocument(name, content);
    storage.setCurrentDocId(doc.id);

    if (editorManager && typeof editorManager.setContent === 'function') {
      editorManager.setContent(content);
    } else if (storage && typeof storage.saveContent === 'function') {
      storage.saveContent(content);
    }

    dispatchDocumentsChanged(storage);
    try {
      if (editorManager && typeof editorManager.showNotification === 'function') {
        editorManager.showNotification('サンプルを作成しました', 1600);
      }
    } catch (_) {}

    return doc;
  }

  ZWGadgets.register(
    'Samples',
    function (root) {
      try {
        root.innerHTML = '';

        var storage = window.ZenWriterStorage;
        var editorManager = window.ZenWriterEditor;

        var container = document.createElement('div');
        container.style.display = 'grid';
        container.style.gap = '8px';

        var desc = document.createElement('div');
        desc.style.fontSize = '12px';
        desc.style.opacity = '0.8';
        desc.textContent = 'サンプル文書をワンクリックで追加します（既存の文書は変更しません）。';

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'small';
        btn.textContent = 'グラフィックノベル・サンプルを作成';

        btn.addEventListener('click', function () {
          try {
            if (!storage || typeof storage.createDocument !== 'function') {
              alert('ストレージが利用できません');
              return;
            }

            try {
              var hasDirty = editorManager && typeof editorManager.isDirty === 'function' ? editorManager.isDirty() : false;
              if (hasDirty) {
                var msg = (window.UILabels && window.UILabels.UNSAVED_CHANGES_NEW) ||
                  '未保存の変更があります。サンプル作成を続行しますか？\n現在の内容はスナップショットとして自動退避します。';
                if (!confirm(msg)) return;
                try {
                  var current = editorManager && editorManager.editor ? editorManager.editor.value || '' : '';
                  if (typeof storage.addSnapshot === 'function') storage.addSnapshot(current);
                } catch (_) {}
              }
            } catch (_) {}

            createGraphicNovelSample(storage, editorManager);
          } catch (_) {}
        });

        container.appendChild(desc);
        container.appendChild(btn);
        root.appendChild(container);
      } catch (_) {}
    },
    { groups: ['assist'], title: 'サンプル' },
  );
})();
