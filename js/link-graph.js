(function () {
  'use strict';

  /**
   * Wikilinks/バックリンク/グラフ機能
   * - `[[link]]`構文のパース
   * - `doc://`リンクの検出
   * - バックリンク検出
   * - 相互参照グラフの可視化
   */

  function ensure(fn) { try { return typeof fn === 'function'; } catch (_) { return false; } }
  function _byId(id) { return document.getElementById(id); }
  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }

  /**
   * `[[link]]`構文をパースしてリンク情報を抽出
   * @param {string} text - パース対象のテキスト
   * @returns {Array<{text: string, link: string, fullMatch: string}>} リンク情報の配列
   */
  function parseWikilinks(text) {
    if (!text || typeof text !== 'string') return [];
    var links = [];
    // `[[link]]` または `[[link|display]]` 形式を検出
    var regex = /\[\[([^\]]+)\]\]/g;
    var match;
    while ((match = regex.exec(text)) !== null) {
      var content = match[1];
      var parts = content.split('|');
      var link = parts[0].trim();
      var display = parts.length > 1 ? parts[1].trim() : link;
      links.push({
        text: display,
        link: link,
        fullMatch: match[0],
        index: match.index
      });
    }
    return links;
  }

  /**
   * `doc://`リンクを検出
   * @param {string} text - パース対象のテキスト
   * @returns {Array<{text: string, link: string, docId: string, section?: string}>} リンク情報の配列
   */
  function parseDocLinks(text) {
    if (!text || typeof text !== 'string') return [];
    var links = [];
    // Markdown形式: [Label](doc://id#section) または [Label](doc://id)
    var markdownRegex = /\[([^\]]+)\]\(doc:\/\/([^\s)]+)(?:#([^\s)]+))?\)/g;
    var match;
    while ((match = markdownRegex.exec(text)) !== null) {
      var label = match[1];
      var docId = match[2];
      var section = match[3] || undefined;
      links.push({
        text: label,
        link: 'doc://' + docId + (section ? '#' + section : ''),
        docId: docId,
        section: section,
        index: match.index
      });
    }
    // プレーンテキスト形式: doc://id#section または doc://id
    var plainRegex = /doc:\/\/([^\s\n]+)(?:#([^\s\n]+))?/g;
    while ((match = plainRegex.exec(text)) !== null) {
      var docId2 = match[1];
      var section2 = match[2] || undefined;
      links.push({
        text: docId2,
        link: 'doc://' + docId2 + (section2 ? '#' + section2 : ''),
        docId: docId2,
        section: section2,
        index: match.index
      });
    }
    return links;
  }

  /**
   * すべてのリンクを検出（Wikilinks + doc://）
   * @param {string} text - パース対象のテキスト
   * @returns {Array} すべてのリンク情報
   */
  function parseAllLinks(text) {
    var wikilinks = parseWikilinks(text).map(function (link) {
      return {
        type: 'wikilink',
        text: link.text,
        link: link.link,
        target: link.link, // Wikilinkのターゲット（Wikiページ名またはdoc://形式）
        index: link.index
      };
    });
    var docLinks = parseDocLinks(text).map(function (link) {
      return {
        type: 'doclink',
        text: link.text,
        link: link.link,
        target: link.docId,
        docId: link.docId,
        section: link.section,
        index: link.index
      };
    });
    return wikilinks.concat(docLinks);
  }

  /**
   * バックリンクを検出（指定されたターゲットへのリンクを探す）
   * @param {string} target - 検索対象のターゲット（Wikiページ名またはdoc://id）
   * @param {Object} storage - ストレージオブジェクト
   * @returns {Array<{source: string, sourceType: string, links: Array}>} バックリンク情報
   */
  function findBacklinks(target, storage) {
    if (!target || !storage) return [];
    var backlinks = [];

    // Wikiページから検索
    try {
      if (ensure(storage.listWikiPages)) {
        var wikiPages = storage.listWikiPages();
        for (var i = 0; i < wikiPages.length; i++) {
          var page = wikiPages[i];
          if (!page || !page.content) continue;
          var links = parseAllLinks(page.content);
          var matchingLinks = links.filter(function (link) {
            return link.target === target || link.link === target ||
              (link.type === 'doclink' && link.docId === target);
          });
          if (matchingLinks.length > 0) {
            backlinks.push({
              source: page.id || page.title || 'unknown',
              sourceType: 'wiki',
              sourceTitle: page.title || page.id,
              links: matchingLinks
            });
          }
        }
      }
    } catch (e) { void e; }

    // ドキュメントから検索
    try {
      if (ensure(storage.loadDocuments)) {
        var docs = storage.loadDocuments();
        if (Array.isArray(docs)) {
          for (var j = 0; j < docs.length; j++) {
            var doc = docs[j];
            if (!doc || !doc.content) continue;
            var docLinks = parseAllLinks(doc.content);
            var matchingDocLinks = docLinks.filter(function (link) {
              return link.target === target || link.link === target ||
                (link.type === 'doclink' && link.docId === target);
            });
            if (matchingDocLinks.length > 0) {
              backlinks.push({
                source: doc.id || 'unknown',
                sourceType: 'document',
                sourceTitle: doc.title || doc.id,
                links: matchingDocLinks
              });
            }
          }
        }
      }
    } catch (e) { void e; }

    // 現在のエディタコンテンツから検索
    try {
      var currentContent = '';
      if (window.ZenWriterAPI && ensure(window.ZenWriterAPI.getContent)) {
        currentContent = String(window.ZenWriterAPI.getContent() || '');
      } else if (window.ZenWriterStorage && ensure(window.ZenWriterStorage.getContent)) {
        currentContent = String(window.ZenWriterStorage.getContent() || '');
      }
      if (currentContent) {
        var currentLinks = parseAllLinks(currentContent);
        var matchingCurrentLinks = currentLinks.filter(function (link) {
          return link.target === target || link.link === target ||
            (link.type === 'doclink' && link.docId === target);
        });
        if (matchingCurrentLinks.length > 0) {
          backlinks.push({
            source: 'current',
            sourceType: 'current',
            sourceTitle: '現在のドキュメント',
            links: matchingCurrentLinks
          });
        }
      }
    } catch (e) { void e; }

    return backlinks;
  }

  /**
   * グラフデータを生成（ノードとエッジ）
   * @param {Object} storage - ストレージオブジェクト
   * @returns {Object} {nodes: Array, edges: Array} グラフデータ
   */
  function generateGraphData(storage) {
    if (!storage) return { nodes: [], edges: [] };
    var nodes = [];
    var edges = [];
    var nodeMap = {}; // ノードID -> ノードインデックス

    function getOrCreateNode(id, label, type) {
      if (nodeMap[id] !== undefined) return nodeMap[id];
      var node = {
        id: id,
        label: label || id,
        type: type || 'unknown',
        x: Math.random() * 400 + 50,
        y: Math.random() * 300 + 50
      };
      var index = nodes.length;
      nodes.push(node);
      nodeMap[id] = index;
      return index;
    }

    // Wikiページをノードとして追加
    try {
      if (ensure(storage.listWikiPages)) {
        var wikiPages = storage.listWikiPages();
        for (var i = 0; i < wikiPages.length; i++) {
          var page = wikiPages[i];
          if (!page) continue;
          var pageId = 'wiki:' + (page.id || page.title || 'unknown');
          getOrCreateNode(pageId, page.title || page.id, 'wiki');

          // リンクを検出してエッジを作成
          if (page.content) {
            var links = parseAllLinks(page.content);
            for (var j = 0; j < links.length; j++) {
              var link = links[j];
              var targetId = link.type === 'doclink' ? 'doc:' + link.docId : 'wiki:' + link.target;
              var targetNodeIndex = getOrCreateNode(targetId, link.text, link.type === 'doclink' ? 'document' : 'wiki');
              edges.push({
                from: nodeMap[pageId],
                to: targetNodeIndex,
                label: link.text,
                type: link.type
              });
            }
          }
        }
      }
    } catch (e) { void e; }

    // ドキュメントをノードとして追加
    try {
      if (ensure(storage.loadDocuments)) {
        var docs = storage.loadDocuments();
        if (Array.isArray(docs)) {
          for (var k = 0; k < docs.length; k++) {
            var doc = docs[k];
            if (!doc) continue;
            var docId = 'doc:' + (doc.id || 'unknown');
            getOrCreateNode(docId, doc.title || doc.id, 'document');

            // リンクを検出してエッジを作成
            if (doc.content) {
              var docLinks = parseAllLinks(doc.content);
              for (var l = 0; l < docLinks.length; l++) {
                var docLink = docLinks[l];
                var targetDocId = docLink.type === 'doclink' ? 'doc:' + docLink.docId : 'wiki:' + docLink.target;
                var targetDocNodeIndex = getOrCreateNode(targetDocId, docLink.text, docLink.type === 'doclink' ? 'document' : 'wiki');
                edges.push({
                  from: nodeMap[docId],
                  to: targetDocNodeIndex,
                  label: docLink.text,
                  type: docLink.type
                });
              }
            }
          }
        }
      }
    } catch (e) { void e; }

    return { nodes: nodes, edges: edges };
  }

  /**
   * グラフをレンダリング（簡易版、D3.js等のライブラリを使用する場合は別途実装）
   * @param {HTMLElement} container - コンテナ要素
   * @param {Object} graphData - グラフデータ
   */
  function renderGraph(container, graphData) {
    if (!container || !graphData) return;
    container.innerHTML = '';

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';

    var nodesLayer = el('div', 'link-graph-nodes');
    nodesLayer.style.position = 'relative';
    nodesLayer.style.width = '100%';
    nodesLayer.style.height = '100%';

    container.appendChild(svg);
    container.appendChild(nodesLayer);

    // エッジを描画
    for (var i = 0; i < graphData.edges.length; i++) {
      var edge = graphData.edges[i];
      var fromNode = graphData.nodes[edge.from];
      var toNode = graphData.nodes[edge.to];
      if (!fromNode || !toNode) continue;

      var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', fromNode.x);
      line.setAttribute('y1', fromNode.y);
      line.setAttribute('x2', toNode.x);
      line.setAttribute('y2', toNode.y);
      line.setAttribute('stroke', '#999');
      line.setAttribute('stroke-width', '2');
      svg.appendChild(line);
    }

    // ノードを描画
    for (var j = 0; j < graphData.nodes.length; j++) {
      var node = graphData.nodes[j];
      var nodeEl = el('div', 'link-graph-node');
      nodeEl.style.position = 'absolute';
      nodeEl.style.left = node.x + 'px';
      nodeEl.style.top = node.y + 'px';
      nodeEl.style.padding = '6px 10px';
      nodeEl.style.border = '2px solid ' + (node.type === 'wiki' ? '#4a90e2' : node.type === 'document' ? '#27ae60' : '#888');
      nodeEl.style.borderRadius = '6px';
      nodeEl.style.background = 'var(--bg-color, #fff)';
      nodeEl.style.cursor = 'pointer';
      nodeEl.textContent = node.label;
      nodeEl.title = node.id + ' (' + node.type + ')';
      nodesLayer.appendChild(nodeEl);
    }
  }

  // 公開API
  window.LinkGraph = {
    parseWikilinks: parseWikilinks,
    parseDocLinks: parseDocLinks,
    parseAllLinks: parseAllLinks,
    findBacklinks: findBacklinks,
    generateGraphData: generateGraphData,
    renderGraph: renderGraph
  };

  // Gadgetとして登録
  function registerGadget() {
    if (!window.ZWGadgets || typeof window.ZWGadgets.register !== 'function') return;

    window.ZWGadgets.register('LinkGraph', function (root, _api) {
      var STORAGE = window.ZenWriterStorage;
      if (!STORAGE) { root.textContent = 'ストレージが利用できません'; return; }

      root.innerHTML = '';
      root.style.display = 'flex';
      root.style.flexDirection = 'column';
      root.style.gap = '8px';

      var toolbar = el('div', 'link-graph-toolbar');
      toolbar.style.display = 'flex';
      toolbar.style.gap = '6px';
      toolbar.style.flexWrap = 'wrap';

      var btnRefresh = el('button', 'small');
      btnRefresh.textContent = '更新';
      var btnBacklinks = el('button', 'small');
      btnBacklinks.textContent = 'バックリンク表示';
      var searchInput = el('input');
      searchInput.type = 'text';
      searchInput.placeholder = 'ターゲットを検索...';
      searchInput.style.flex = '1';

      toolbar.appendChild(btnRefresh);
      toolbar.appendChild(btnBacklinks);
      toolbar.appendChild(searchInput);

      var graphContainer = el('div', 'link-graph-container');
      graphContainer.style.minHeight = '300px';
      graphContainer.style.border = '1px solid var(--border-color)';
      graphContainer.style.borderRadius = '4px';
      graphContainer.style.position = 'relative';
      graphContainer.style.background = 'var(--bg-color)';
      graphContainer.style.overflow = 'auto';

      var backlinksPanel = el('div', 'link-graph-backlinks');
      backlinksPanel.style.display = 'none';
      backlinksPanel.style.maxHeight = '200px';
      backlinksPanel.style.overflow = 'auto';
      backlinksPanel.style.border = '1px solid var(--border-color)';
      backlinksPanel.style.borderRadius = '4px';
      backlinksPanel.style.padding = '8px';
      backlinksPanel.style.fontSize = '0.9rem';

      root.appendChild(toolbar);
      root.appendChild(graphContainer);
      root.appendChild(backlinksPanel);

      function refreshGraph() {
        var graphData = generateGraphData(STORAGE);
        renderGraph(graphContainer, graphData);
      }

      function showBacklinks(target) {
        if (!target) return;
        var backlinks = findBacklinks(target, STORAGE);
        backlinksPanel.innerHTML = '';
        if (backlinks.length === 0) {
          backlinksPanel.innerHTML = '<div style="padding:8px; color:#999;">バックリンクが見つかりませんでした</div>';
        } else {
          var title = el('div');
          title.textContent = '「' + target + '」へのバックリンク:';
          title.style.fontWeight = '600';
          title.style.marginBottom = '8px';
          backlinksPanel.appendChild(title);
          for (var i = 0; i < backlinks.length; i++) {
            var bl = backlinks[i];
            var item = el('div');
            item.style.padding = '4px 0';
            item.style.borderBottom = '1px solid var(--border-color)';
            var sourceLabel = el('strong');
            sourceLabel.textContent = bl.sourceTitle || bl.source;
            item.appendChild(sourceLabel);
            item.appendChild(document.createTextNode(' (' + bl.sourceType + ')'));
            backlinksPanel.appendChild(item);
          }
        }
        backlinksPanel.style.display = 'block';
      }

      btnRefresh.addEventListener('click', refreshGraph);
      btnBacklinks.addEventListener('click', function () {
        var target = searchInput.value.trim();
        if (target) {
          showBacklinks(target);
        }
      });

      // 初期表示
      refreshGraph();
    }, { title: 'Link Graph', groups: ['wiki', 'structure'] });
  }

  // グローバルAPIを公開 (TASK_044)
  window.LinkGraph = {
    parseWikilinks: parseWikilinks,
    parseDocLinks: parseDocLinks,
    parseAllLinks: function (text) { return parseAllLinks(text); },
    findBacklinks: function (target) {
      return findBacklinks(target, window.ZenWriterStorage);
    }
  };

  // init when gadgets ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerGadget);
  } else {
    registerGadget();
  }
})();
