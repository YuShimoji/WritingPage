/**
 * gadgets-help.js
 * ヘルプ/リファレンスガジェット
 * サイドバー内でヘルプドキュメントをシームレスに閲覧可能
 */
(function () {
  'use strict';

  function el(tag, cls) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }

  // ヘルプコンテンツ定義
  var HELP_SECTIONS = [
    {
      id: 'getting-started',
      title: 'はじめに',
      icon: 'rocket',
      content: function () {
        return `
          <h3>Zen Writer へようこそ</h3>
          <p>Zen Writer は小説執筆に特化したミニマルなエディタです。</p>
          <h4>基本操作</h4>
          <ul>
            <li><strong>執筆</strong>: 中央のエディタに直接入力。自動保存されます。</li>
            <li><strong>サイドバー</strong>: 左上の <span class="help-inline-icon"><i data-lucide="menu" aria-hidden="true"></i></span> で開閉。設定やガジェットにアクセス。</li>
            <li><strong>テーマ</strong>: ライト/ダーク/セピアなどを選択可能。</li>
          </ul>
          <h4>ショートカット</h4>
          <ul>
            <li><kbd>Ctrl/⌘ + S</kbd> — 保存</li>
            <li><kbd>Ctrl/⌘ + F</kbd> — 検索</li>
            <li><kbd>Alt + W</kbd> — ツールバー表示切替</li>
            <li><kbd>Tab</kbd> — インデント</li>
          </ul>
        `;
      }
    },
    {
      id: 'editor',
      title: 'エディタ機能',
      icon: 'pencil',
      content: function () {
        return `
          <h3>エディタ機能ガイド</h3>
          
          <h4>基本編集</h4>
          <ul>
            <li>テキストを入力すると自動保存されます</li>
            <li>Markdown記法に対応（見出し、リスト、太字など）</li>
          </ul>
          
          <h4>検索と置換</h4>
          <ul>
            <li><kbd>Ctrl/⌘ + F</kbd> で検索パネルを開く</li>
            <li>大文字/小文字区別、正規表現に対応</li>
            <li>「すべて置換」で一括変換</li>
          </ul>
          
          <h4>フォント装飾</h4>
          <p>ツールバーの <span class="help-inline-icon"><i data-lucide="type" aria-hidden="true"></i></span> ボタンで装飾パネルを開きます。</p>
          <ul>
            <li><code>[bold]テキスト[/bold]</code> — 太字</li>
            <li><code>[italic]テキスト[/italic]</code> — 斜体</li>
            <li><code>[underline]テキスト[/underline]</code> — 下線</li>
          </ul>
          
          <h4>テキストアニメーション</h4>
          <p>ツールバーの <span class="help-inline-icon"><i data-lucide="sparkles" aria-hidden="true"></i></span> ボタンでアニメーションパネルを開きます。</p>
          <ul>
            <li><code>[fade]テキスト[/fade]</code> — フェードイン</li>
            <li><code>[slide]テキスト[/slide]</code> — スライドイン</li>
            <li><code>[type]テキスト[/type]</code> — タイプライター</li>
          </ul>
        `;
      }
    },
    {
      id: 'documents',
      title: 'ドキュメント管理',
      icon: 'file-text',
      content: function () {
        return `
          <h3>ドキュメント管理</h3>
          
          <h4>複数ドキュメント</h4>
          <ul>
            <li>「ドキュメント一覧」から複数の原稿を切り替え可能</li>
            <li>「作成」で新規、「改名」で名前変更、「削除」で削除</li>
            <li>各ドキュメントは個別に自動保存されます</li>
          </ul>
          
          <h4>ファイル操作</h4>
          <ul>
            <li><strong>読み込み</strong>: .txt/.md ファイルをインポート</li>
            <li><strong>テキストで保存</strong>: .txt としてダウンロード</li>
            <li><strong>Markdownで保存</strong>: .md としてダウンロード</li>
            <li><strong>印刷</strong>: 印刷ダイアログを開く</li>
            <li><strong>PDFエクスポート</strong>: PDF形式で出力</li>
          </ul>
          
          <h4>バックアップ</h4>
          <ul>
            <li>自動スナップショット（2分/300文字以上の変化時）</li>
            <li>「今すぐ保存」で手動スナップショット作成</li>
            <li>スナップショット一覧から復元可能</li>
          </ul>
        `;
      }
    },
    {
      id: 'wiki',
      title: '物語Wiki',
      icon: 'book-open',
      content: function () {
        return `
          <h3>物語Wikiガイド</h3>
          
          <h4>概要</h4>
          <p>登場人物・場所・用語などの設定を整理するデータベースです。</p>
          
          <h4>基本操作</h4>
          <ol>
            <li>「Wiki」タブを選択</li>
            <li>「新規ページ」でページ作成</li>
            <li>タイトル/本文/タグ/フォルダを入力して保存</li>
          </ol>
          
          <h4>検索</h4>
          <ul>
            <li>検索ボックスにキーワードを入力</li>
            <li>タイトル/本文/タグを対象に全文検索</li>
          </ul>
          
          <h4>AI自動生成（オプション）</h4>
          <ul>
            <li>選択したテキストからWikiページを自動生成</li>
            <li>ドキュメントから固有名詞を抽出</li>
          </ul>
        `;
      }
    },
    {
      id: 'gadgets',
      title: 'ガジェット設定',
      icon: 'settings',
      content: function () {
        return `
          <h3>ガジェット設定</h3>
          
          <h4>ロードアウト（プリセット構成）</h4>
          <p>ガジェットの構成をプリセットとして保存・切替できます。</p>
          <ul>
            <li><strong>小説・長編</strong>: フル機能構成</li>
            <li><strong>ミニマル</strong>: 最小限の機能で集中</li>
            <li><strong>ビジュアルノベル</strong>: VN/ゲームシナリオ向け</li>
            <li><strong>脚本・シナリオ</strong>: 映像/舞台脚本向け</li>
          </ul>
          <p>「保存」「複製」「適用」「削除」でカスタムロードアウトを管理。</p>
          
          <h4>主要ガジェット一覧</h4>
          <ul>
            <li><strong>ドキュメント</strong>: 原稿の管理・切り替え・エクスポート</li>
            <li><strong>アウトライン</strong>: 部/章/節の構造管理</li>
            <li><strong>EditorLayout</strong>: エディタの幅・余白・背景色</li>
            <li><strong>Typewriter</strong>: タイプライターモード設定</li>
            <li><strong>HUD設定</strong>: ミニ通知の表示設定</li>
            <li><strong>執筆目標</strong>: 目標文字数と締切</li>
            <li><strong>スナップショット</strong>: バックアップ管理</li>
            <li><strong>テーマ</strong>: テーマ・カラー設定</li>
            <li><strong>フォント</strong>: フォント・行間設定</li>
            <li><strong>Visual Profile</strong>: 複合プロファイル管理</li>
          </ul>
        `;
      }
    },
    {
      id: 'visual-profile',
      title: 'Visual Profile',
      icon: 'theater',
      content: function () {
        return `
          <h3>Visual Profile（表示プロファイル）</h3>
          
          <h4>概要</h4>
          <p>テーマ・フォント・行間・余白バランスをまとめたプリセット機能です。</p>
          
          <h4>組み込みプロファイル</h4>
          <ul>
            <li><strong>ライト</strong>: 明るい標準テーマ</li>
            <li><strong>ダーク</strong>: 暗い背景、狭めの幅</li>
            <li><strong>ライト（余白広め）</strong>: 広い余白でゆったり執筆</li>
          </ul>
          
          <h4>エディタ幅モード</h4>
          <ul>
            <li><strong>narrow</strong>: 狭い幅（集中向け）</li>
            <li><strong>medium</strong>: 標準幅</li>
            <li><strong>wide</strong>: 広い幅（長文向け）</li>
          </ul>
          
          <h4>表示モードとの違い</h4>
          <p>Visual Profileは「見た目」を、表示モードは「UI構成」を制御します。
          プロファイル切り替え時、サイドバーの状態は維持されます。</p>
        `;
      }
    },
    {
      id: 'ui-modes',
      title: '表示モード',
      icon: 'monitor',
      content: function () {
        return `
          <h3>表示モード</h3>
          
          <p>ツールバー右側の「表示モード」から切り替えられます。</p>
          
          <h4>通常モード</h4>
          <p>サイドバー/ツールバーを含む標準レイアウト。</p>
          
          <h4>フォーカスモード</h4>
          <p>サイドバーを非表示にし、執筆に集中できる画面構成。</p>
          
          <h4>ブランクモード</h4>
          <p>ほぼ本文のみのミニマルな画面。<kbd>Alt + W</kbd>で復帰。</p>
          
          <h4>フローティングツール</h4>
          <p>右下の <span class="help-inline-icon"><i data-lucide="settings" aria-hidden="true"></i></span> ボタンでフォントサイズ調整パネルを開閉。</p>
        `;
      }
    },
    {
      id: 'themes',
      title: 'テーマ・外観',
      icon: 'palette',
      content: function () {
        return `
          <h3>テーマ・外観設定</h3>
          
          <h4>テーマプリセット</h4>
          <ul>
            <li><strong>ライト</strong>: 明るい背景</li>
            <li><strong>ダーク</strong>: 暗い背景</li>
            <li><strong>セピア</strong>: 温かみのある配色</li>
            <li><strong>ハイコントラスト</strong>: 視認性重視</li>
            <li><strong>ソラライズド</strong>: Solarizedテーマ</li>
          </ul>
          
          <h4>カスタムカラー</h4>
          <p>「テーマ・フォント」タブで個別に調整できます。</p>
          <ul>
            <li>背景色/文字色</li>
            <li>フォントファミリー/サイズ/行間</li>
          </ul>
          
          <h4>背景グラデーション</h4>
          <p>「UI Design」ガジェットで背景のグラデーションを設定可能。</p>
          
          <h4>プリセット保存</h4>
          <p>「テーマプリセット（拡張）」で現在の設定を名前を付けて保存できます。</p>
        `;
      }
    },
    {
      id: 'keyboard',
      title: 'キーボード操作',
      icon: 'keyboard',
      content: function () {
        return `
          <h3>キーボードショートカット一覧</h3>
          
          <h4>基本操作</h4>
          <table class="help-table">
            <tr><td><kbd>Ctrl/⌘ + S</kbd></td><td>保存</td></tr>
            <tr><td><kbd>Ctrl/⌘ + F</kbd></td><td>検索パネルを開く</td></tr>
            <tr><td><kbd>Ctrl/⌘ + Z</kbd></td><td>元に戻す</td></tr>
            <tr><td><kbd>Ctrl/⌘ + Y</kbd></td><td>やり直し</td></tr>
            <tr><td><kbd>Tab</kbd></td><td>インデント</td></tr>
          </table>
          
          <h4>フォントサイズ</h4>
          <table class="help-table">
            <tr><td><kbd>Ctrl/⌘ + +</kbd></td><td>拡大</td></tr>
            <tr><td><kbd>Ctrl/⌘ + -</kbd></td><td>縮小</td></tr>
            <tr><td><kbd>Ctrl/⌘ + 0</kbd></td><td>初期化</td></tr>
          </table>
          
          <h4>UI操作</h4>
          <table class="help-table">
            <tr><td><kbd>Alt + W</kbd></td><td>ツールバー表示切替</td></tr>
            <tr><td><kbd>Alt + 1</kbd></td><td>サイドバー開閉</td></tr>
          </table>
          
          <h4>テキスト装飾</h4>
          <table class="help-table">
            <tr><td><kbd>Ctrl/⌘ + B</kbd></td><td>太字</td></tr>
            <tr><td><kbd>Ctrl/⌘ + I</kbd></td><td>斜体</td></tr>
          </table>
        `;
      }
    }
  ];

  function register() {
    if (!window.ZWGadgets || typeof window.ZWGadgets.register !== 'function') return;

    window.ZWGadgets.register('Help', function (root) {
      root.innerHTML = '';
      root.style.display = 'flex';
      root.style.flexDirection = 'column';
      root.style.gap = '0';
      root.style.maxHeight = '60vh';

      // ナビゲーション部分
      var nav = el('div', 'help-nav');
      nav.style.display = 'flex';
      nav.style.flexWrap = 'wrap';
      nav.style.gap = '4px';
      nav.style.marginBottom = '8px';
      nav.style.paddingBottom = '8px';
      nav.style.borderBottom = '1px solid var(--border-color)';

      // コンテンツ表示部分
      var contentArea = el('div', 'help-content');
      contentArea.style.flex = '1';
      contentArea.style.overflow = 'auto';
      contentArea.style.fontSize = '13px';
      contentArea.style.lineHeight = '1.6';

      var activeSection = null;

      function showSection(section) {
        if (activeSection === section.id) return;
        activeSection = section.id;

        // ナビボタンのアクティブ状態を更新
        nav.querySelectorAll('.help-nav-btn').forEach(function (btn) {
          btn.classList.toggle('active', btn.dataset.section === section.id);
        });

        // コンテンツを更新
        contentArea.innerHTML = section.content();
        try {
          if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons({ icons: window.lucide.icons, root: root });
          }
        } catch (_) { }
        contentArea.scrollTop = 0;
      }

      // ナビゲーションボタンを生成
      HELP_SECTIONS.forEach(function (section) {
        var btn = el('button', 'help-nav-btn small');
        btn.type = 'button';
        btn.dataset.section = section.id;
        btn.innerHTML = '<span class="help-nav-icon"><i data-lucide="' + section.icon + '" aria-hidden="true"></i></span><span class="help-nav-text">' + section.title + '</span>';
        btn.title = section.title;
        btn.addEventListener('click', function () {
          showSection(section);
        });
        nav.appendChild(btn);
      });

      root.appendChild(nav);
      root.appendChild(contentArea);

      // 初期表示
      if (HELP_SECTIONS.length > 0) {
        showSection(HELP_SECTIONS[0]);
      }
    }, { title: 'ヘルプ', groups: ['assist'] });
  }

  // 登録実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', register);
  } else {
    register();
  }
  document.addEventListener('ZWGadgetsReady', register);
})();
