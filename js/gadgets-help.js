/**
 * gadgets-help.js
 * アプリ内ヘルプモーダル
 * Markdownリファレンスは gadgets-markdown-ref.js (MarkdownReference ガジェット) が担当
 */
(function () {
  'use strict';

  function el(tag, cls) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }

  var HELP_SECTIONS = [
    {
      id: 'getting-started',
      title: 'はじめに',
      content: function () {
        return `
          <h3>Zen Writer へようこそ</h3>
          <p>Zen Writer は小説執筆に特化したエディタです。</p>
          <h4>基本操作</h4>
          <ul>
            <li><strong>執筆</strong>: 中央のエディタに直接入力。原稿は<strong>自動保存</strong>が主。必要なときだけ <kbd>Ctrl/Cmd + S</kbd> やコマンドパレットの「保存」で<strong>手動の即時保存</strong>。</li>
            <li><strong>サイドバー</strong>: 左上のメニューボタンで開閉。</li>
            <li><strong>テーマ</strong>: サイドバーのテーマカテゴリから選択。</li>
          </ul>
          <h4>主要ショートカット</h4>
          <ul>
            <li><kbd>Ctrl/Cmd + S</kbd> — 手動保存（即時・自動保存に加えて実行）</li>
            <li><kbd>Ctrl/Cmd + F</kbd> — 検索</li>
            <li><kbd>Alt + W</kbd> — ツールバー表示切替</li>
            <li><kbd>F2</kbd> — 表示モード切替</li>
          </ul>
        `;
      }
    },
    {
      id: 'editor',
      title: 'エディタ機能',
      content: function () {
        return `
          <h3>エディタ機能</h3>
          <h4>基本編集</h4>
          <ul>
            <li>入力内容は<strong>自動保存</strong>。明示的に書き出すときは <kbd>Ctrl/Cmd + S</kbd> またはコマンドパレット（<kbd>Ctrl/Cmd + P</kbd>）の「保存」</li>
            <li>Markdown記法に対応 (見出し、リスト、太字など)</li>
            <li>リッチ編集表示で装飾のリアルタイムプレビュー</li>
          </ul>
          <h4>検索と置換</h4>
          <ul>
            <li><kbd>Ctrl/Cmd + F</kbd> で検索パネルを開く</li>
            <li>大文字/小文字区別、正規表現に対応</li>
          </ul>
          <h4>テキスト装飾</h4>
          <p>テキストを選択するとツールチップが表示され、装飾を適用できます。</p>
          <ul>
            <li><code>[bold]テキスト[/bold]</code> — 太字</li>
            <li><code>[italic]テキスト[/italic]</code> — 斜体</li>
            <li><code>[underline]テキスト[/underline]</code> — 下線</li>
          </ul>
          <p>詳しい記法はサイドバーの「Markdownリファレンス」ガジェットを参照してください。</p>
        `;
      }
    },
    {
      id: 'chapters',
      title: '章管理',
      content: function () {
        return `
          <h3>章管理</h3>
          <h4>チャプターモード</h4>
          <p>新規ドキュメントは章ごとの独立保存モードで作成されます。</p>
          <ul>
            <li>サイドバーの「セクション」カテゴリで章リストを表示</li>
            <li>クリックで章を切り替え</li>
            <li>ダブルクリックで章名を変更</li>
            <li>右クリックでリネーム/複製/移動/削除</li>
            <li>ドラッグ&ドロップで並び替え</li>
          </ul>
          <h4>ドキュメント管理</h4>
          <ul>
            <li>「構造」カテゴリのドキュメントガジェットで管理</li>
            <li>フォルダ作成でドキュメントを階層的に整理</li>
          </ul>
          <h4>バックアップ</h4>
          <ul>
            <li>自動スナップショット (2分/300文字以上の変化時)</li>
            <li>手動スナップショットも作成可能</li>
          </ul>
        `;
      }
    },
    {
      id: 'wiki',
      title: '物語Wiki',
      content: function () {
        return `
          <h3>物語Wiki</h3>
          <h4>概要</h4>
          <p>登場人物・場所・用語などの設定を整理するデータベースです。</p>
          <h4>基本操作</h4>
          <ol>
            <li>サイドバーの「構造」カテゴリ内にある Story Wiki を開く</li>
            <li>「新規ページ」でページを作成</li>
            <li>タイトル/本文/タグ/カテゴリを入力して保存</li>
          </ol>
          <h4>Wikiリンク</h4>
          <ul>
            <li>本文中に <code>[[ページ名]]</code> と書くと自動的にリンクされます</li>
            <li>形態素解析による固有名詞の自動検出にも対応</li>
          </ul>
          <h4>グラフビュー</h4>
          <p>Wiki内のリンク関係をグラフで可視化できます。</p>
          <h4>AI自動生成 (オプション)</h4>
          <p>選択テキストからWikiページを自動生成。OpenAI APIキー設定時に利用可能。</p>
        `;
      }
    },
    {
      id: 'modes',
      title: '表示モード',
      content: function () {
        return `
          <h3>表示モード</h3>
          <p><kbd>F2</kbd> またはツールバーから切り替えられます。</p>
          <h4>通常モード (Normal)</h4>
          <p>サイドバー/ツールバーを含む標準レイアウト。</p>
          <h4>フォーカスモード (Focus)</h4>
          <p>サイドバーを非表示にし、章リストのみ表示。執筆に集中。</p>
          <h4>ブランクモード (Blank)</h4>
          <p>本文のみのミニマル画面。画面端にマウスを移動で復帰メニュー。</p>
          <h4>リーダーモード (Reader)</h4>
          <p>装飾・演出を含む読者向けプレビュー。</p>
        `;
      }
    },
    {
      id: 'keyboard',
      title: 'ショートカット',
      content: function () {
        return `
          <h3>キーボードショートカット</h3>
          <table class="help-table">
            <tr><td><kbd>Ctrl/Cmd + S</kbd></td><td>手動保存（即時）</td></tr>
            <tr><td><kbd>Ctrl/Cmd + F</kbd></td><td>検索</td></tr>
            <tr><td><kbd>Ctrl/Cmd + Z</kbd></td><td>元に戻す</td></tr>
            <tr><td><kbd>Ctrl/Cmd + Y</kbd></td><td>やり直し</td></tr>
            <tr><td><kbd>Ctrl/Cmd + B</kbd></td><td>太字</td></tr>
            <tr><td><kbd>Ctrl/Cmd + I</kbd></td><td>斜体</td></tr>
            <tr><td><kbd>F2</kbd></td><td>表示モード切替</td></tr>
            <tr><td><kbd>Alt + W</kbd></td><td>ツールバー表示切替</td></tr>
            <tr><td><kbd>Alt + 1</kbd></td><td>サイドバー開閉</td></tr>
            <tr><td><kbd>Esc</kbd></td><td>モーダルを閉じる / 通常モードに戻る</td></tr>
            <tr><td><kbd>Ctrl/Cmd + +/-/0</kbd></td><td>フォントサイズ 拡大/縮小/初期化</td></tr>
          </table>
        `;
      }
    }
  ];

  var rendered = false;

  function renderHelpModal() {
    if (rendered) return;
    var root = document.getElementById('help-modal-body');
    if (!root) return;

    rendered = true;
    root.innerHTML = '';
    root.style.display = 'flex';
    root.style.flexDirection = 'column';
    root.style.gap = '0';

    var nav = el('div', 'help-nav');
    nav.style.display = 'flex';
    nav.style.flexWrap = 'wrap';
    nav.style.gap = '0.25rem';
    nav.style.marginBottom = '0.5rem';
    nav.style.paddingBottom = '0.5rem';
    nav.style.borderBottom = '1px solid var(--border-color)';

    var contentArea = el('div', 'help-content');
    contentArea.style.flex = '1';
    contentArea.style.overflow = 'auto';
    contentArea.style.fontSize = '0.8125rem';
    contentArea.style.lineHeight = '1.6';

    var activeSection = null;

    function showSection(section) {
      if (activeSection === section.id) return;
      activeSection = section.id;
      nav.querySelectorAll('.help-nav-btn').forEach(function (btn) {
        btn.classList.toggle('active', btn.dataset.section === section.id);
      });
      contentArea.innerHTML = section.content();
      contentArea.scrollTop = 0;
    }

    HELP_SECTIONS.forEach(function (section) {
      var btn = el('button', 'help-nav-btn small');
      btn.type = 'button';
      btn.dataset.section = section.id;
      btn.textContent = section.title;
      btn.title = section.title;
      btn.addEventListener('click', function () {
        showSection(section);
      });
      nav.appendChild(btn);
    });

    root.appendChild(nav);
    root.appendChild(contentArea);

    if (HELP_SECTIONS.length > 0) {
      showSection(HELP_SECTIONS[0]);
    }
  }

  window.ZenWriterHelpModal = { render: renderHelpModal };
})();
