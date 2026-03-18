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

  // カテゴリ別ノードカラー
  var CATEGORY_COLORS = {
    character: '#e07cc5',
    location: '#68b5e0',
    item: '#e0a843',
    organization: '#7bc77b',
    term: '#b0a0d0',
    event: '#e06060',
    concept: '#60c0c0',
    wiki: '#a0a0a0',
    document: '#d0c090',
    current: '#c0d080',
    unknown: '#999999'
  };

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
    var coveredRanges = [];
    // Markdown形式: [Label](doc://id#section) または [Label](doc://id)
    var markdownRegex = /\[([^\]]+)\]\(doc:\/\/([^\s)#]+)(?:#([^\s)]+))?\)/g;
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
      coveredRanges.push({ start: match.index, end: match.index + match[0].length });
    }
    // プレーンテキスト形式: doc://id#section または doc://id
    // Markdown形式で既にマッチした範囲は除外する
    var plainRegex = /doc:\/\/([^\s\n#)]+)(?:#([^\s\n)]+))?/g;
    while ((match = plainRegex.exec(text)) !== null) {
      var pos = match.index;
      var covered = coveredRanges.some(function (r) { return pos >= r.start && pos < r.end; });
      if (covered) continue;
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

    // Story Wiki エントリから検索
    try {
      if (ensure(storage.loadStoryWiki)) {
        var swEntries = storage.loadStoryWiki();
        for (var i = 0; i < swEntries.length; i++) {
          var entry = swEntries[i];
          if (!entry) continue;
          // タイトル/別名が一致する自身はスキップ
          if (entry.title === target) continue;
          if (!entry.content) continue;
          var swLinks = parseAllLinks(entry.content);
          var matchSwLinks = swLinks.filter(function (link) {
            return link.target === target || link.link === target;
          });
          // relatedIds による参照も検出
          if (entry.relatedIds && entry.relatedIds.length > 0) {
            // target がエントリIDの場合
            var relMatch = entry.relatedIds.some(function (rid) { return rid === target; });
            if (relMatch && matchSwLinks.length === 0) {
              matchSwLinks.push({ type: 'related', target: target, text: target });
            }
          }
          if (matchSwLinks.length > 0) {
            backlinks.push({
              source: entry.id || entry.title || 'unknown',
              sourceType: 'story-wiki',
              sourceTitle: entry.title || entry.id,
              sourceCategory: entry.category,
              links: matchSwLinks
            });
          }
        }
      }
    } catch (e) { void e; }

    // レガシー Wikiページから検索 (後方互換)
    try {
      if (ensure(storage.listWikiPages)) {
        var wikiPages = storage.listWikiPages();
        for (var wi = 0; wi < wikiPages.length; wi++) {
          var page = wikiPages[wi];
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

    function getOrCreateNode(id, label, type, category) {
      if (nodeMap[id] !== undefined) {
        // カテゴリ情報を後から補完
        if (category && !nodes[nodeMap[id]].category) {
          nodes[nodeMap[id]].category = category;
          nodes[nodeMap[id]].type = type || nodes[nodeMap[id]].type;
        }
        return nodeMap[id];
      }
      var node = {
        id: id,
        label: label || id,
        type: type || 'unknown',
        category: category || null,
        x: Math.random() * 400 + 50,
        y: Math.random() * 300 + 50
      };
      var index = nodes.length;
      nodes.push(node);
      nodeMap[id] = index;
      return index;
    }

    // Story Wiki エントリをノードとして追加
    try {
      if (ensure(storage.loadStoryWiki)) {
        var swEntries = storage.loadStoryWiki();
        for (var si = 0; si < swEntries.length; si++) {
          var swEntry = swEntries[si];
          if (!swEntry) continue;
          var swId = 'wiki:' + swEntry.title;
          getOrCreateNode(swId, swEntry.title, 'story-wiki', swEntry.category);

          // 本文内リンクからエッジを作成
          if (swEntry.content) {
            var swLinks = parseAllLinks(swEntry.content);
            for (var sj = 0; sj < swLinks.length; sj++) {
              var swLink = swLinks[sj];
              var swTargetId = swLink.type === 'doclink' ? 'doc:' + swLink.docId : 'wiki:' + swLink.target;
              var swTargetIdx = getOrCreateNode(swTargetId, swLink.text, swLink.type === 'doclink' ? 'document' : 'wiki');
              edges.push({
                from: nodeMap[swId],
                to: swTargetIdx,
                label: swLink.text,
                type: swLink.type
              });
            }
          }

          // relatedIds からエッジを作成
          if (swEntry.relatedIds) {
            for (var sr = 0; sr < swEntry.relatedIds.length; sr++) {
              var relId = swEntry.relatedIds[sr];
              var relEntry = ensure(storage.getStoryWikiEntry) ? storage.getStoryWikiEntry(relId) : null;
              if (relEntry) {
                var relNodeId = 'wiki:' + relEntry.title;
                var relIdx = getOrCreateNode(relNodeId, relEntry.title, 'story-wiki', relEntry.category);
                edges.push({
                  from: nodeMap[swId],
                  to: relIdx,
                  label: '',
                  type: 'related'
                });
              }
            }
          }
        }
      }
    } catch (e) { void e; }

    // レガシー Wikiページをノードとして追加 (後方互換)
    try {
      if (ensure(storage.listWikiPages)) {
        var wikiPages = storage.listWikiPages();
        for (var i = 0; i < wikiPages.length; i++) {
          var page = wikiPages[i];
          if (!page) continue;
          var pageId = 'wiki:' + (page.id || page.title || 'unknown');
          getOrCreateNode(pageId, page.title || page.id, 'wiki');

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
   * 簡易力学レイアウト (force-directed)
   * @param {Object} graphData - グラフデータ (nodes/edges)
   * @param {number} width - キャンバス幅
   * @param {number} height - キャンバス高さ
   */
  function applyForceLayout(graphData, width, height) {
    var nodes = graphData.nodes;
    var edges = graphData.edges;
    if (nodes.length === 0) return;

    // 初期位置を円形に配置
    var cx = width / 2, cy = height / 2;
    var radius = Math.min(width, height) * 0.35;
    for (var i = 0; i < nodes.length; i++) {
      var angle = (2 * Math.PI * i) / nodes.length;
      nodes[i].x = cx + radius * Math.cos(angle);
      nodes[i].y = cy + radius * Math.sin(angle);
      nodes[i].vx = 0;
      nodes[i].vy = 0;
    }

    // 反復計算
    var iterations = 80;
    var repulsion = 3000;
    var attraction = 0.02;
    var damping = 0.9;
    var minDist = 40;

    for (var iter = 0; iter < iterations; iter++) {
      // 斥力 (全ペア)
      for (var a = 0; a < nodes.length; a++) {
        for (var b = a + 1; b < nodes.length; b++) {
          var dx = nodes[a].x - nodes[b].x;
          var dy = nodes[a].y - nodes[b].y;
          var dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < minDist) dist = minDist;
          var force = repulsion / (dist * dist);
          var fx = (dx / dist) * force;
          var fy = (dy / dist) * force;
          nodes[a].vx += fx;
          nodes[a].vy += fy;
          nodes[b].vx -= fx;
          nodes[b].vy -= fy;
        }
      }
      // 引力 (エッジ)
      for (var e = 0; e < edges.length; e++) {
        var from = nodes[edges[e].from];
        var to = nodes[edges[e].to];
        if (!from || !to) continue;
        var edx = to.x - from.x;
        var edy = to.y - from.y;
        var eDist = Math.sqrt(edx * edx + edy * edy) || 1;
        var af = attraction * eDist;
        from.vx += (edx / eDist) * af;
        from.vy += (edy / eDist) * af;
        to.vx -= (edx / eDist) * af;
        to.vy -= (edy / eDist) * af;
      }
      // 位置更新
      for (var n = 0; n < nodes.length; n++) {
        nodes[n].vx *= damping;
        nodes[n].vy *= damping;
        nodes[n].x += nodes[n].vx;
        nodes[n].y += nodes[n].vy;
        // 境界制約
        nodes[n].x = Math.max(60, Math.min(width - 60, nodes[n].x));
        nodes[n].y = Math.max(30, Math.min(height - 30, nodes[n].y));
      }
    }
  }

  /**
   * ノードの表示色を取得
   */
  function getNodeColor(node) {
    if (node.category && CATEGORY_COLORS[node.category]) return CATEGORY_COLORS[node.category];
    return CATEGORY_COLORS[node.type] || CATEGORY_COLORS.unknown;
  }

  /**
   * グラフをレンダリング（カテゴリ色分け + ノードクリック + 力学レイアウト）
   * @param {HTMLElement} container - コンテナ要素
   * @param {Object} graphData - グラフデータ
   * @param {Object} [options] - オプション { onNodeClick: function(node) }
   */
  function renderGraph(container, graphData, options) {
    if (!container || !graphData) return;
    container.innerHTML = '';
    var opts = options || {};

    var cw = container.clientWidth || 500;
    var ch = container.clientHeight || 400;

    // 力学レイアウト適用
    applyForceLayout(graphData, cw, ch);

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
      line.setAttribute('stroke', edge.type === 'related' ? 'var(--border-color, #666)' : 'var(--text-muted, #999)');
      line.setAttribute('stroke-width', edge.type === 'related' ? '1' : '1.5');
      line.setAttribute('stroke-dasharray', edge.type === 'related' ? '4,3' : 'none');
      line.setAttribute('stroke-opacity', '0.6');
      svg.appendChild(line);
    }

    // ノードを描画
    for (var j = 0; j < graphData.nodes.length; j++) {
      var node = graphData.nodes[j];
      var color = getNodeColor(node);
      var nodeEl = el('div', 'link-graph-node');
      nodeEl.setAttribute('data-type', node.type || 'unknown');
      if (node.category) nodeEl.setAttribute('data-category', node.category);
      nodeEl.style.position = 'absolute';
      nodeEl.style.left = (node.x - 4) + 'px';
      nodeEl.style.top = (node.y - 4) + 'px';
      nodeEl.style.background = color;
      nodeEl.style.color = '#fff';
      nodeEl.style.padding = '3px 8px';
      nodeEl.style.borderRadius = '10px';
      nodeEl.style.fontSize = '0.75rem';
      nodeEl.style.whiteSpace = 'nowrap';
      nodeEl.style.cursor = opts.onNodeClick ? 'pointer' : 'default';
      nodeEl.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
      nodeEl.style.transition = 'transform 0.15s, box-shadow 0.15s';
      nodeEl.textContent = node.label;
      nodeEl.title = node.label + (node.category ? ' (' + node.category + ')' : '');
      if (opts.onNodeClick) {
        (function (n) {
          nodeEl.addEventListener('click', function () { opts.onNodeClick(n); });
          nodeEl.addEventListener('mouseenter', function () { this.style.transform = 'scale(1.15)'; this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)'; });
          nodeEl.addEventListener('mouseleave', function () { this.style.transform = ''; this.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)'; });
        })(node);
      }
      nodesLayer.appendChild(nodeEl);
    }
  }

  /**
   * カテゴリ凡例を描画
   * @param {HTMLElement} container - 凡例のコンテナ
   * @param {Object} graphData - グラフデータ (使用カテゴリを特定)
   */
  function renderLegend(container, graphData) {
    if (!container || !graphData) return;
    container.innerHTML = '';
    container.className = 'link-graph-legend';

    // 使用中のカテゴリを収集
    var usedTypes = {};
    for (var i = 0; i < graphData.nodes.length; i++) {
      var n = graphData.nodes[i];
      var key = n.category || n.type || 'unknown';
      usedTypes[key] = true;
    }

    var labelMap = {
      character: 'キャラクター', location: '場所', item: 'アイテム',
      organization: '組織', term: '用語', event: 'イベント', concept: '概念',
      wiki: 'Wiki', document: 'ドキュメント', current: '現在のドキュメント', unknown: '不明'
    };

    var keys = Object.keys(usedTypes);
    for (var j = 0; j < keys.length; j++) {
      var k = keys[j];
      var color = CATEGORY_COLORS[k] || CATEGORY_COLORS.unknown;
      var item = el('span', 'link-graph-legend-item');
      var dot = el('span', 'link-graph-legend-dot');
      dot.style.background = color;
      dot.style.display = 'inline-block';
      dot.style.width = '10px';
      dot.style.height = '10px';
      dot.style.borderRadius = '50%';
      dot.style.marginRight = '4px';
      item.appendChild(dot);
      item.appendChild(document.createTextNode(labelMap[k] || k));
      item.style.marginRight = '12px';
      item.style.fontSize = '0.8rem';
      container.appendChild(item);
    }
  }

  // 公開API (registerGadget前の仮公開、後でグローバル版で上書きされる)
  window.LinkGraph = {
    parseWikilinks: parseWikilinks,
    parseDocLinks: parseDocLinks,
    parseAllLinks: parseAllLinks,
    findBacklinks: findBacklinks,
    generateGraphData: generateGraphData,
    renderGraph: renderGraph,
    renderLegend: renderLegend,
    CATEGORY_COLORS: CATEGORY_COLORS
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
          backlinksPanel.innerHTML = '<div style="padding:8px; color:var(--text-muted, #999);">バックリンクが見つかりませんでした</div>';
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
    }, { title: 'Link Graph', groups: [], description: 'Wikiリンクの関係性をグラフで可視化。StoryWikiのグラフボタンから利用。' });
  }

  // グローバルAPIを公開 (TASK_044) — 全メソッドを含む完全版
  window.LinkGraph = {
    parseWikilinks: parseWikilinks,
    parseDocLinks: parseDocLinks,
    parseAllLinks: parseAllLinks,
    findBacklinks: function (target, storage) {
      return findBacklinks(target, storage || window.ZenWriterStorage);
    },
    generateGraphData: function (storage) {
      return generateGraphData(storage || window.ZenWriterStorage);
    },
    renderGraph: renderGraph,
    renderLegend: renderLegend,
    CATEGORY_COLORS: CATEGORY_COLORS
  };

  // init when gadgets ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerGadget);
  } else {
    registerGadget();
  }
})();
