/**
 * Story Wiki ガジェット
 * 物語の世界観を構築・管理する用語集Wikiシステム
 *
 * Phase 1: 基本機能 (CRUD / ツリー / カテゴリ / 検索 / エディタ連携)
 */
/* global ZWGadgets */
(function () {
  'use strict';

  var S = (typeof window !== 'undefined' && window.ZenWriterStorage) || {};

  // ── ヘルパー ──────────────────────────

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'className') node.className = attrs[k];
        else if (k === 'textContent') node.textContent = attrs[k];
        else if (k === 'innerHTML') node.innerHTML = attrs[k];
        else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        else if (k === 'dataset') Object.assign(node.dataset, attrs[k]);
        else node.setAttribute(k, attrs[k]);
      });
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(function (c) {
        if (typeof c === 'string') node.appendChild(document.createTextNode(c));
        else if (c) node.appendChild(c);
      });
    }
    return node;
  }

  // Markdown → HTML (markdown-it があれば使用、なければ簡易変換)
  function renderMarkdown(text) {
    if (window.markdownit) {
      var md = window.markdownit({ html: false, linkify: true, breaks: true });
      return md.render(text || '');
    }
    // 簡易フォールバック
    return (text || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  // カテゴリラベル取得
  function getCategoryLabel(catId) {
    var cats = S.loadStoryWikiCategories ? S.loadStoryWikiCategories() : [];
    var found = cats.find(function (c) { return c.id === catId; });
    return found ? found.label : catId;
  }

  // ── メインガジェット ──────────────────

  ZWGadgets.register('StoryWiki', function (root) {
    // データマイグレーション (初回のみ)
    if (S.migrateOldWikiToStoryWiki) S.migrateOldWikiToStoryWiki();

    var state = {
      mode: 'compact',   // 'compact' | 'full'
      selectedId: null,
      editingId: null,
      searchQuery: '',
      expandedCategories: {}
    };

    // ── コンパクト表示 (サイドバー) ─────

    function renderCompact() {
      root.innerHTML = '';
      root.className = 'swiki-root swiki-compact';

      var searchBar = el('div', { className: 'swiki-search-bar' }, [
        el('input', {
          type: 'text',
          className: 'swiki-search-input',
          placeholder: '検索...',
          value: state.searchQuery,
          onInput: function (e) {
            state.searchQuery = e.target.value;
            renderCompact();
          }
        })
      ]);
      root.appendChild(searchBar);

      if (state.searchQuery) {
        renderSearchResults(root);
      } else {
        renderCategoryList(root);
      }

      var footer = el('div', { className: 'swiki-footer' }, [
        el('button', {
          className: 'swiki-btn swiki-btn-new',
          textContent: '+ 新規作成',
          onClick: function () { openCreateDialog(); }
        }),
        el('button', {
          className: 'swiki-btn swiki-btn-scan',
          textContent: 'スキャン',
          title: '本文から用語候補を検出',
          onClick: function () { scanCurrentDocument(); }
        }),
        el('button', {
          className: 'swiki-btn swiki-btn-graph',
          textContent: 'グラフ',
          title: 'リンクグラフを表示',
          onClick: function () { openGraphOverlay(); }
        }),
        el('button', {
          className: 'swiki-btn swiki-btn-expand',
          textContent: '展開',
          onClick: function () {
            state.mode = 'full';
            renderFull();
          }
        })
      ]);
      root.appendChild(footer);
    }

    function renderCategoryList(container) {
      var categories = S.loadStoryWikiCategories ? S.loadStoryWikiCategories() : [];
      var counts = S.getStoryWikiCategoryCounts ? S.getStoryWikiCategoryCounts() : {};

      var list = el('div', { className: 'swiki-category-list' });
      categories.forEach(function (cat) {
        var count = counts[cat.id] || 0;
        var row = el('div', {
          className: 'swiki-category-row',
          onClick: function () {
            state.expandedCategories[cat.id] = !state.expandedCategories[cat.id];
            renderCompact();
          }
        }, [
          el('span', { className: 'swiki-category-label', textContent: cat.label }),
          el('span', { className: 'swiki-category-count', textContent: '(' + count + ')' })
        ]);
        list.appendChild(row);

        if (state.expandedCategories[cat.id]) {
          var entries = S.getStoryWikiByCategory ? S.getStoryWikiByCategory(cat.id) : [];
          entries.forEach(function (entry) {
            var item = el('div', {
              className: 'swiki-entry-item',
              textContent: entry.title,
              onClick: function (e) {
                e.stopPropagation();
                state.selectedId = entry.id;
                state.mode = 'full';
                renderFull();
              }
            });
            list.appendChild(item);
          });
        }
      });
      container.appendChild(list);
    }

    function renderSearchResults(container) {
      var results = S.searchStoryWiki ? S.searchStoryWiki(state.searchQuery) : [];
      var list = el('div', { className: 'swiki-search-results' });
      if (results.length === 0) {
        list.appendChild(el('div', { className: 'swiki-empty', textContent: '該当なし' }));
      } else {
        results.forEach(function (entry) {
          list.appendChild(el('div', {
            className: 'swiki-entry-item',
            onClick: function () {
              state.selectedId = entry.id;
              state.mode = 'full';
              renderFull();
            }
          }, [
            el('span', { className: 'swiki-entry-title', textContent: entry.title }),
            el('span', { className: 'swiki-entry-cat', textContent: getCategoryLabel(entry.category) })
          ]));
        });
      }
      container.appendChild(list);
    }

    // ── 全画面表示 (2ペイン) ─────────────

    function closeFull() {
      state.mode = 'compact';
      state.editingId = null;
      removeEscHandler();
      renderCompact();
    }

    // ESCキーで全画面ペインを閉じる
    var escHandler = null;
    function installEscHandler() {
      if (escHandler) return;
      escHandler = function (e) {
        if (e.key === 'Escape' && state.mode === 'full') {
          // ダイアログが開いている場合はダイアログを優先
          if (document.querySelector('.swiki-overlay')) return;
          e.preventDefault();
          e.stopPropagation();
          closeFull();
        }
      };
      document.addEventListener('keydown', escHandler, true);
    }
    function removeEscHandler() {
      if (escHandler) {
        document.removeEventListener('keydown', escHandler, true);
        escHandler = null;
      }
    }

    // ── グラフビューオーバーレイ ─────────────
    function openGraphOverlay() {
      if (!window.LinkGraph) return;

      var overlay = el('div', { className: 'swiki-overlay swiki-graph-overlay' });
      var dialog = el('div', { className: 'swiki-dialog swiki-graph-dialog' });
      dialog.style.cssText = 'width: 90vw; max-width: 900px; height: 80vh; max-height: 80vh; display: flex; flex-direction: column;';

      var header = el('div', { className: 'swiki-dialog-header' }, [
        el('h3', { textContent: 'リンクグラフ' }),
        el('button', {
          className: 'swiki-btn',
          textContent: '閉じる',
          onClick: function () { overlay.remove(); }
        })
      ]);
      dialog.appendChild(header);

      var graphContainer = el('div', { className: 'link-graph-container' });
      graphContainer.style.cssText = 'flex: 1; overflow: auto; position: relative;';
      dialog.appendChild(graphContainer);

      overlay.appendChild(dialog);
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) overlay.remove();
      });
      document.body.appendChild(overlay);

      // グラフデータ生成と描画
      try {
        var graphData = window.LinkGraph.generateGraphData();
        if (graphData && graphData.nodes.length > 0) {
          window.LinkGraph.renderGraph(graphContainer, graphData);
        } else {
          graphContainer.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-muted,#999);">リンクデータがありません。本文に [[wikilink]] や doc:// リンクを追加してください。</div>';
        }
      } catch (err) {
        graphContainer.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--error-color,#e55);">グラフ生成中にエラーが発生しました。</div>';
      }
    }

    function renderFull() {
      root.innerHTML = '';
      root.className = 'swiki-root swiki-full';

      installEscHandler();

      var header = el('div', { className: 'swiki-full-header' }, [
        el('button', {
          className: 'swiki-btn swiki-btn-collapse',
          textContent: '\u2190 閉じる',
          title: 'サイドバーに戻る (Esc)',
          onClick: closeFull
        }),
        el('input', {
          type: 'text',
          className: 'swiki-search-input swiki-full-search',
          placeholder: '検索...',
          value: state.searchQuery,
          onInput: function (e) {
            state.searchQuery = e.target.value;
            renderFull();
          }
        }),
        el('button', {
          className: 'swiki-btn swiki-btn-new',
          textContent: '+ 新規作成',
          onClick: function () { openCreateDialog(); }
        }),
        el('button', {
          className: 'swiki-btn swiki-btn-graph',
          textContent: 'グラフ',
          title: 'リンクグラフを表示',
          onClick: function () { openGraphOverlay(); }
        })
      ]);

      var treePane = el('div', { className: 'swiki-tree-pane' });
      var detailPane = el('div', { className: 'swiki-detail-pane' });
      var body = el('div', { className: 'swiki-full-body' }, [treePane, detailPane]);

      root.appendChild(header);
      root.appendChild(body);

      renderTree(treePane);
      renderDetail(detailPane);
    }

    function renderTree(container) {
      var categories = S.loadStoryWikiCategories ? S.loadStoryWikiCategories() : [];
      var allEntries = state.searchQuery
        ? (S.searchStoryWiki ? S.searchStoryWiki(state.searchQuery) : [])
        : (S.loadStoryWiki ? S.loadStoryWiki() : []);

      categories.forEach(function (cat) {
        var catEntries = allEntries.filter(function (e) { return e.category === cat.id; });
        if (state.searchQuery && catEntries.length === 0) return;

        var isExpanded = state.expandedCategories[cat.id] !== false;
        var catHeader = el('div', {
          className: 'swiki-tree-cat' + (isExpanded ? ' is-expanded' : ''),
          onClick: function () {
            state.expandedCategories[cat.id] = !isExpanded;
            renderFull();
          }
        }, [
          el('span', { className: 'swiki-tree-arrow', textContent: isExpanded ? '\u25BC' : '\u25B6' }),
          el('span', { textContent: ' ' + cat.label + ' (' + catEntries.length + ')' })
        ]);
        container.appendChild(catHeader);

        if (isExpanded) {
          catEntries.sort(function (a, b) { return a.title.localeCompare(b.title); });
          catEntries.forEach(function (entry) {
            var isSelected = entry.id === state.selectedId;
            container.appendChild(el('div', {
              className: 'swiki-tree-item' + (isSelected ? ' is-selected' : ''),
              textContent: entry.title,
              onClick: function () {
                state.selectedId = entry.id;
                state.editingId = null;
                renderFull();
              }
            }));
          });
        }
      });
    }

    function renderDetail(container) {
      if (!state.selectedId) {
        container.appendChild(el('div', { className: 'swiki-detail-empty', textContent: '記事を選択してください' }));
        return;
      }

      var entry = S.getStoryWikiEntry ? S.getStoryWikiEntry(state.selectedId) : null;
      if (!entry) {
        container.appendChild(el('div', { className: 'swiki-detail-empty', textContent: '記事が見つかりません' }));
        state.selectedId = null;
        return;
      }

      if (state.editingId === entry.id) {
        renderEditForm(container, entry);
        return;
      }

      // 表示モード
      var header = el('div', { className: 'swiki-detail-header' }, [
        el('h2', { className: 'swiki-detail-title', textContent: entry.title }),
        el('div', { className: 'swiki-detail-meta' }, [
          el('span', { className: 'swiki-detail-cat-badge', textContent: getCategoryLabel(entry.category) }),
          entry.aliases.length > 0
            ? el('span', { className: 'swiki-detail-aliases', textContent: '別名: ' + entry.aliases.join(', ') })
            : null
        ]),
        entry.tags.length > 0
          ? el('div', { className: 'swiki-detail-tags' },
            entry.tags.map(function (t) { return el('span', { className: 'swiki-tag', textContent: '#' + t }); })
          )
          : null
      ]);
      container.appendChild(header);

      var contentHtml = renderMarkdown(entry.content);
      var contentDiv = el('div', { className: 'swiki-detail-content wiki-preview', innerHTML: contentHtml });
      container.appendChild(contentDiv);

      // 関連記事
      if (entry.relatedIds && entry.relatedIds.length > 0) {
        var relSection = el('div', { className: 'swiki-detail-related' }, [
          el('h3', { textContent: '関連項目' })
        ]);
        entry.relatedIds.forEach(function (rid) {
          var related = S.getStoryWikiEntry ? S.getStoryWikiEntry(rid) : null;
          if (related) {
            relSection.appendChild(el('a', {
              className: 'swiki-related-link',
              textContent: related.title,
              href: '#',
              onClick: function (e) {
                e.preventDefault();
                state.selectedId = rid;
                state.editingId = null;
                renderFull();
              }
            }));
          }
        });
        container.appendChild(relSection);
      }

      // アクションボタン
      var actions = el('div', { className: 'swiki-detail-actions' }, [
        el('button', {
          className: 'swiki-btn',
          textContent: '編集',
          onClick: function () {
            state.editingId = entry.id;
            renderFull();
          }
        }),
        el('button', {
          className: 'swiki-btn swiki-btn-danger',
          textContent: '削除',
          onClick: function () {
            if (confirm('「' + entry.title + '」を削除しますか？')) {
              if (S.deleteStoryWikiEntry) S.deleteStoryWikiEntry(entry.id);
              state.selectedId = null;
              state.editingId = null;
              renderFull();
            }
          }
        })
      ]);
      container.appendChild(actions);
    }

    // ── 編集フォーム ─────────────────────

    function renderEditForm(container, entry) {
      var categories = S.loadStoryWikiCategories ? S.loadStoryWikiCategories() : [];

      var form = el('div', { className: 'swiki-edit-form' });

      // タイトル
      form.appendChild(el('label', { textContent: 'タイトル' }));
      var titleInput = el('input', { type: 'text', className: 'swiki-input', value: entry.title });
      form.appendChild(titleInput);

      // カテゴリ
      form.appendChild(el('label', { textContent: 'カテゴリ' }));
      var catSelect = el('select', { className: 'swiki-select' });
      categories.forEach(function (cat) {
        var opt = el('option', { value: cat.id, textContent: cat.label });
        if (cat.id === entry.category) opt.selected = true;
        catSelect.appendChild(opt);
      });
      form.appendChild(catSelect);

      // 別名
      form.appendChild(el('label', { textContent: '別名 (カンマ区切り)' }));
      var aliasInput = el('input', { type: 'text', className: 'swiki-input', value: (entry.aliases || []).join(', ') });
      form.appendChild(aliasInput);

      // タグ
      form.appendChild(el('label', { textContent: 'タグ (カンマ区切り)' }));
      var tagInput = el('input', { type: 'text', className: 'swiki-input', value: (entry.tags || []).join(', ') });
      form.appendChild(tagInput);

      // 本文
      form.appendChild(el('label', { textContent: '本文 (Markdown)' }));
      var contentArea = el('textarea', { className: 'swiki-textarea', value: entry.content || '' });
      contentArea.value = entry.content || '';
      form.appendChild(contentArea);

      // プレビュートグル
      var previewDiv = el('div', { className: 'swiki-edit-preview wiki-preview' });
      var previewVisible = false;
      var previewBtn = el('button', {
        className: 'swiki-btn swiki-btn-sm',
        textContent: 'プレビュー',
        onClick: function () {
          previewVisible = !previewVisible;
          if (previewVisible) {
            previewDiv.innerHTML = renderMarkdown(contentArea.value);
            previewDiv.style.display = 'block';
          } else {
            previewDiv.style.display = 'none';
          }
        }
      });
      form.appendChild(previewBtn);
      form.appendChild(previewDiv);

      // 保存/キャンセル
      var btnRow = el('div', { className: 'swiki-edit-actions' }, [
        el('button', {
          className: 'swiki-btn swiki-btn-primary',
          textContent: '保存',
          onClick: function () {
            var aliases = aliasInput.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
            var tags = tagInput.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
            if (S.updateStoryWikiEntry) {
              S.updateStoryWikiEntry(entry.id, {
                title: titleInput.value || '無題',
                category: catSelect.value,
                aliases: aliases,
                tags: tags,
                content: contentArea.value
              });
            }
            state.editingId = null;
            renderFull();
          }
        }),
        el('button', {
          className: 'swiki-btn',
          textContent: 'キャンセル',
          onClick: function () {
            state.editingId = null;
            renderFull();
          }
        })
      ]);
      form.appendChild(btnRow);

      container.appendChild(form);
    }

    // ── 新規作成ダイアログ ───────────────

    function openCreateDialog() {
      var categories = S.loadStoryWikiCategories ? S.loadStoryWikiCategories() : [];

      // オーバーレイ
      var overlay = el('div', { className: 'swiki-overlay' });
      var dialog = el('div', { className: 'swiki-dialog' });

      dialog.appendChild(el('h3', { textContent: '新規Wiki記事' }));

      dialog.appendChild(el('label', { textContent: 'タイトル' }));
      var titleInput = el('input', { type: 'text', className: 'swiki-input', placeholder: '用語名' });
      dialog.appendChild(titleInput);

      dialog.appendChild(el('label', { textContent: 'カテゴリ' }));
      var catSelect = el('select', { className: 'swiki-select' });
      categories.forEach(function (cat) {
        catSelect.appendChild(el('option', { value: cat.id, textContent: cat.label }));
      });
      dialog.appendChild(catSelect);

      dialog.appendChild(el('label', { textContent: '別名 (カンマ区切り、省略可)' }));
      var aliasInput = el('input', { type: 'text', className: 'swiki-input' });
      dialog.appendChild(aliasInput);

      var btnRow = el('div', { className: 'swiki-dialog-actions' }, [
        el('button', {
          className: 'swiki-btn swiki-btn-primary',
          textContent: '作成',
          onClick: function () {
            var title = titleInput.value.trim();
            if (!title) { titleInput.focus(); return; }
            var aliases = aliasInput.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
            var newEntry = S.createStoryWikiEntry ? S.createStoryWikiEntry({
              title: title,
              category: catSelect.value,
              aliases: aliases,
              source: 'manual'
            }) : null;
            overlay.remove();
            if (newEntry) {
              state.selectedId = newEntry.id;
              state.editingId = newEntry.id;
              if (state.mode === 'compact') {
                state.mode = 'full';
              }
              renderFull();
            }
          }
        }),
        el('button', {
          className: 'swiki-btn',
          textContent: 'キャンセル',
          onClick: function () { overlay.remove(); }
        })
      ]);
      dialog.appendChild(btnRow);

      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
      titleInput.focus();

      // ESCで閉じる
      var dialogEsc = function (e) {
        if (e.key === 'Escape') {
          e.stopPropagation();
          overlay.remove();
          document.removeEventListener('keydown', dialogEsc, true);
        }
      };
      document.addEventListener('keydown', dialogEsc, true);
      // オーバーレイクリックで閉じる
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
          overlay.remove();
          document.removeEventListener('keydown', dialogEsc, true);
        }
      });
    }

    // ── 自動検出 ──────────────────────────

    // 日本語頻出語の除外パターン
    var COMMON_WORDS = /^(それ|これ|あれ|ここ|そこ|あそこ|こちら|そちら|あちら|どこ|どれ|どちら|いつ|なぜ|なに|何|自分|相手|みんな|みなさん|ところ|こと|もの|とき|ため|まま|うち|ほう|ほか|あと|いま|すべて|今日|昨日|明日|今年|去年|来年|一人|二人|三人|世界|時間|場所|問題|意味|気持|気持ち|理由|結果|最初|最後|次|前|後|上|下|中|外|右|左|東|西|南|北|大変|大切|大丈夫|必要|可能|普通|簡単|大人|子供|男|女|人間|社会|仕事|生活|状態|状況|部分|全体|種類|方法|目的|内容|関係|影響|変化|原因|条件|程度|本当|絶対|一般|特別|以上|以下|以外|その他|について|ありがとう|よろしく)$/;

    function extractCandidateTerms(text) {
      if (!text) return [];
      var existingEntries = S.loadStoryWiki ? S.loadStoryWiki() : [];
      var settings = S.loadStoryWikiSettings ? S.loadStoryWikiSettings() : { ignoredTerms: [] };
      var ignoredTerms = settings.ignoredTerms || [];

      // 既存タイトルと別名を集約
      var knownTerms = new Set();
      existingEntries.forEach(function (e) {
        knownTerms.add(e.title);
        (e.aliases || []).forEach(function (a) { knownTerms.add(a); });
      });
      ignoredTerms.forEach(function (t) { knownTerms.add(t); });

      var candidates = new Map(); // term → count

      // カタカナ連続 (2文字以上)
      var katakana = text.match(/[\u30A1-\u30F6\u30FC]{2,}/g) || [];
      katakana.forEach(function (w) {
        if (!knownTerms.has(w) && w.length >= 2) {
          candidates.set(w, (candidates.get(w) || 0) + 1);
        }
      });

      // 大文字始まり英単語 (2文字以上、一般的な英単語除外)
      var english = text.match(/[A-Z][a-zA-Z]{1,}/g) || [];
      var commonEnglish = /^(The|This|That|These|Those|There|Here|What|When|Where|Which|How|Why|Who|And|But|Not|For|With|From|Into|About|After|Before|Between|Through|During|Without|Chapter|Section|Part|Page|Note|Item|Type|Data|Info|Error|Text|File|Name|Time|Date|Year|Day|List|Table|Form|View|Edit|Save|Load|Open|Close|Show|Hide|Add|Set|Get|New|Old|All|Any|None)$/;
      english.forEach(function (w) {
        if (!knownTerms.has(w) && !commonEnglish.test(w)) {
          candidates.set(w, (candidates.get(w) || 0) + 1);
        }
      });

      // 漢字連続 (2-6文字、一般的でないもの)
      var kanji = text.match(/[\u4E00-\u9FAF]{2,6}/g) || [];
      kanji.forEach(function (w) {
        if (!knownTerms.has(w) && !COMMON_WORDS.test(w) && w.length >= 2) {
          candidates.set(w, (candidates.get(w) || 0) + 1);
        }
      });

      // 出現回数2回以上で絞り込み (1回だけは除外)
      var results = [];
      candidates.forEach(function (count, term) {
        if (count >= 2) {
          results.push({ term: term, count: count, suggestedCategory: guessCategoryForTerm(term) });
        }
      });

      // 出現回数降順
      results.sort(function (a, b) { return b.count - a.count; });
      return results;
    }

    function guessCategoryForTerm(term) {
      // カタカナ名前っぽい → キャラクター
      if (/^[\u30A1-\u30F6\u30FC]{2,6}$/.test(term)) return 'character';
      // 英語名 → キャラクターか用語
      if (/^[A-Z][a-z]+$/.test(term)) return 'character';
      return 'term';
    }

    function showAutoDetectSuggestions(candidateTerms) {
      if (candidateTerms.length === 0) return;

      var categories = S.loadStoryWikiCategories ? S.loadStoryWikiCategories() : [];
      var overlay = el('div', { className: 'swiki-overlay' });
      var dialog = el('div', { className: 'swiki-dialog swiki-suggest-dialog' });

      dialog.appendChild(el('h3', { textContent: '新しい用語候補が見つかりました' }));

      var checkStates = candidateTerms.map(function () { return true; });
      var catStates = candidateTerms.map(function (c) { return c.suggestedCategory; });

      var listDiv = el('div', { className: 'swiki-suggest-list' });
      candidateTerms.forEach(function (candidate, idx) {
        var row = el('div', { className: 'swiki-suggest-row' });

        var checkbox = el('input', { type: 'checkbox', checked: '' });
        checkbox.checked = true;
        checkbox.addEventListener('change', function () { checkStates[idx] = checkbox.checked; });
        row.appendChild(checkbox);

        row.appendChild(el('span', { className: 'swiki-suggest-term', textContent: candidate.term }));
        row.appendChild(el('span', { className: 'swiki-suggest-count', textContent: '\u00D7' + candidate.count }));

        var catSelect = el('select', { className: 'swiki-select swiki-suggest-cat' });
        categories.forEach(function (cat) {
          var opt = el('option', { value: cat.id, textContent: cat.label });
          if (cat.id === candidate.suggestedCategory) opt.selected = true;
          catSelect.appendChild(opt);
        });
        catSelect.addEventListener('change', function () { catStates[idx] = catSelect.value; });
        row.appendChild(catSelect);

        listDiv.appendChild(row);
      });
      dialog.appendChild(listDiv);

      var btnRow = el('div', { className: 'swiki-dialog-actions' }, [
        el('button', {
          className: 'swiki-btn swiki-btn-primary',
          textContent: '選択した候補を登録',
          onClick: function () {
            candidateTerms.forEach(function (candidate, idx) {
              if (checkStates[idx] && S.createStoryWikiEntry) {
                S.createStoryWikiEntry({
                  title: candidate.term,
                  category: catStates[idx],
                  source: 'auto'
                });
              }
            });
            overlay.remove();
            if (state.mode === 'compact') renderCompact();
            else renderFull();
          }
        }),
        el('button', {
          className: 'swiki-btn',
          textContent: 'すべて無視',
          onClick: function () {
            // 無視した用語を除外リストに追加
            var settings = S.loadStoryWikiSettings ? S.loadStoryWikiSettings() : { autoDetect: true, ignoredTerms: [] };
            candidateTerms.forEach(function (candidate) {
              if (!settings.ignoredTerms.includes(candidate.term)) {
                settings.ignoredTerms.push(candidate.term);
              }
            });
            if (S.saveStoryWikiSettings) S.saveStoryWikiSettings(settings);
            overlay.remove();
          }
        })
      ]);
      dialog.appendChild(btnRow);

      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      // ESCで閉じる
      var suggestEsc = function (e) {
        if (e.key === 'Escape') {
          e.stopPropagation();
          overlay.remove();
          document.removeEventListener('keydown', suggestEsc, true);
        }
      };
      document.addEventListener('keydown', suggestEsc, true);
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
          overlay.remove();
          document.removeEventListener('keydown', suggestEsc, true);
        }
      });
    }

    // 手動スキャン: ガジェットUIにスキャンボタン追加
    function scanCurrentDocument() {
      var settings = S.loadStoryWikiSettings ? S.loadStoryWikiSettings() : { autoDetect: true };
      if (!settings.autoDetect) return;

      // エディタの本文を取得
      var editorArea = document.querySelector('.editor-area') || document.querySelector('#editor');
      if (!editorArea) return;
      var text = editorArea.innerText || editorArea.textContent || '';
      var candidates = extractCandidateTerms(text);
      if (candidates.length > 0) {
        showAutoDetectSuggestions(candidates);
      }
    }

    // グローバルに公開
    window.StoryWikiAutoDetect = {
      scan: scanCurrentDocument,
      extractCandidates: extractCandidateTerms,
      showSuggestions: showAutoDetectSuggestions
    };

    // 保存時フック: ドキュメント保存時に自動検出をトリガー
    document.addEventListener('zen-content-saved', function (e) {
      var settings = S.loadStoryWikiSettings ? S.loadStoryWikiSettings() : { autoDetect: true };
      if (!settings.autoDetect) return;
      var content = e.detail && e.detail.content;
      if (!content) return;
      var candidates = extractCandidateTerms(content);
      if (candidates.length > 0) {
        showAutoDetectSuggestions(candidates);
      }
    });

    // ── カスタムイベントリスナー ────────

    document.addEventListener('swiki-open-entry', function (e) {
      var entryId = e.detail && e.detail.entryId;
      if (entryId) {
        state.selectedId = entryId;
        state.editingId = null;
        state.mode = 'full';
        renderFull();
      }
    });

    // ── 初回レンダリング ────────────────

    renderCompact();

  }, { title: 'Story Wiki', groups: ['structure'], description: 'Wiki形式のストーリーノート管理。ページ作成・リンク・検索が可能。' });

})();

/**
 * Story Wiki エディタ連携モジュール
 * - 登録済み用語の自動ハイライト
 * - ツールチップ表示
 * - [[wikilink]] クリック対応
 */
(function () {
  'use strict';

  var S = (typeof window !== 'undefined' && window.ZenWriterStorage) || {};
  var debounceTimer = null;

  // ツールチップ要素
  var tooltip = null;

  function ensureTooltip() {
    if (tooltip) return tooltip;
    tooltip = document.createElement('div');
    tooltip.className = 'swiki-tooltip';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);
    return tooltip;
  }

  function showTooltip(x, y, entry) {
    var tip = ensureTooltip();
    var catLabel = '';
    if (S.loadStoryWikiCategories) {
      var cats = S.loadStoryWikiCategories();
      var found = cats.find(function (c) { return c.id === entry.category; });
      if (found) catLabel = found.label;
    }
    var preview = (entry.content || '').slice(0, 100);
    if (entry.content && entry.content.length > 100) preview += '...';
    tip.innerHTML = '<strong>' + escapeHtml(entry.title) + '</strong>' +
      (catLabel ? ' <span class="swiki-tooltip-cat">' + escapeHtml(catLabel) + '</span>' : '') +
      (preview ? '<div class="swiki-tooltip-preview">' + escapeHtml(preview) + '</div>' : '');
    tip.style.display = 'block';
    // 位置調整
    var rect = document.body.getBoundingClientRect();
    var tipX = Math.min(x, rect.width - 280);
    var tipY = y + 20;
    tip.style.left = tipX + 'px';
    tip.style.top = tipY + 'px';
  }

  function hideTooltip() {
    if (tooltip) tooltip.style.display = 'none';
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // エディタ本文内のWiki用語をハイライトする
  function highlightWikiTerms() {
    var editorArea = document.querySelector('.editor-area');
    if (!editorArea) return;

    // contenteditable なので、テキストノードを走査して一致箇所をマーク
    var entries = S.loadStoryWiki ? S.loadStoryWiki() : [];
    if (entries.length === 0) return;

    // 全用語とaliasesをまとめたマップ (term → entry)
    var termMap = new Map();
    entries.forEach(function (entry) {
      termMap.set(entry.title, entry);
      (entry.aliases || []).forEach(function (alias) {
        if (alias) termMap.set(alias, entry);
      });
    });

    // 長い用語から優先的にマッチさせる
    var allTerms = Array.from(termMap.keys()).sort(function (a, b) { return b.length - a.length; });
    if (allTerms.length === 0) return;

    // 正規表現パターン構築
    var escapedTerms = allTerms.map(function (t) {
      return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    });
    var pattern = new RegExp('(' + escapedTerms.join('|') + ')', 'g');

    // テキストノードを走査
    var walker = document.createTreeWalker(editorArea, NodeFilter.SHOW_TEXT, null, false);
    var nodesToProcess = [];
    var textNode;
    while ((textNode = walker.nextNode())) {
      // 既にハイライト済みの親要素はスキップ
      if (textNode.parentElement && textNode.parentElement.classList.contains('swiki-highlight')) continue;
      if (pattern.test(textNode.textContent)) {
        nodesToProcess.push(textNode);
      }
      pattern.lastIndex = 0;
    }

    nodesToProcess.forEach(function (node) {
      var text = node.textContent;
      var frag = document.createDocumentFragment();
      var lastIndex = 0;
      var match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(text)) !== null) {
        // テキスト前部分
        if (match.index > lastIndex) {
          frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        }
        // ハイライトspan
        var span = document.createElement('span');
        span.className = 'swiki-highlight';
        span.textContent = match[1];
        var matchedEntry = termMap.get(match[1]);
        if (matchedEntry) {
          span.dataset.entryId = matchedEntry.id;
        }
        frag.appendChild(span);
        lastIndex = pattern.lastIndex;
      }
      if (lastIndex < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex)));
      }
      if (node.parentNode) {
        node.parentNode.replaceChild(frag, node);
      }
    });
  }

  // ハイライトをクリア
  function clearHighlights() {
    var editorArea = document.querySelector('.editor-area');
    if (!editorArea) return;
    var highlights = editorArea.querySelectorAll('.swiki-highlight');
    highlights.forEach(function (span) {
      var parent = span.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(span.textContent), span);
        parent.normalize();
      }
    });
  }

  // デバウンス付きハイライト更新
  function scheduleHighlight() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      clearHighlights();
      highlightWikiTerms();
    }, 500);
  }

  // イベント委譲: ハイライトへのホバー/クリック
  function setupEditorListeners() {
    var editorArea = document.querySelector('.editor-area');
    if (!editorArea) return;

    editorArea.addEventListener('mouseover', function (e) {
      var target = e.target;
      if (target.classList && target.classList.contains('swiki-highlight')) {
        var entryId = target.dataset.entryId;
        if (entryId && S.getStoryWikiEntry) {
          var entry = S.getStoryWikiEntry(entryId);
          if (entry) {
            var rect = target.getBoundingClientRect();
            showTooltip(rect.left, rect.bottom, entry);
          }
        }
      }
    });

    editorArea.addEventListener('mouseout', function (e) {
      if (e.target.classList && e.target.classList.contains('swiki-highlight')) {
        hideTooltip();
      }
    });

    editorArea.addEventListener('click', function (e) {
      if (e.target.classList && e.target.classList.contains('swiki-highlight')) {
        hideTooltip();
        var entryId = e.target.dataset.entryId;
        // Wiki全画面を開いて該当記事を表示
        if (entryId && window.StoryWikiAutoDetect) {
          // ガジェットのstate更新は直接アクセスできないため、
          // カスタムイベントで通知
          var evt = new CustomEvent('swiki-open-entry', { detail: { entryId: entryId } });
          document.dispatchEvent(evt);
        }
      }
    });

    // 入力イベントでハイライト更新
    editorArea.addEventListener('input', scheduleHighlight);
  }

  // 初期化
  function init() {
    setupEditorListeners();
    // 初回ハイライト
    setTimeout(highlightWikiTerms, 1000);
  }

  // DOMReady後に初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 500);
  }

  // グローバルに公開
  window.StoryWikiEditor = {
    highlight: highlightWikiTerms,
    clearHighlights: clearHighlights,
    scheduleHighlight: scheduleHighlight
  };
})();
