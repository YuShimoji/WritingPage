/**
 * ロードアウトプリセット定義
 * ハードコーディングを避けるため外部ファイルに分離
 *
 * グループ名は KNOWN_GROUPS と一致させること（左ナビの4区分と同じ）:
 *   manuscript(原稿), reference(資料), view(表示), advanced(設定)
 * 旧6区分のキー（sections / structure / edit / theme / assist）で保存された配置は
 * gadgets-utils.js の normaliseGroups が現行区分へ移す。ここでは使わない。
 *
 * 執筆優先の並び（方針）:
 * - manuscript: 章・セクション移動を最上段に、続けて文書・アウトライン・バックアップ
 * - reference: Wiki・リンク・画像・Markdown早見表（書きながら参照するもの）
 * - view: 執筆中に切り替える集中・タイプライター・目標を上に、設定頻度の低いテーマ系を下に
 * - advanced: 環境設定・出力・キー割り当て
 * 各配列の先頭に近いほど、サイドバー一覧では上側に表示されやすい（区分内順）。
 * ドック初期値は各エントリの dockLayout を参照（spec-writing-mode-unification-prep.md session 79）。
 */
(function () {
  'use strict';

  window.ZWLoadoutPresets = {
    active: 'novel-standard',
    entries: {
      'novel-standard': {
        label: '小説・長編',
        description: '長編小説向けの標準構成',
        groups: {
          manuscript: [
            'SectionsNavigator',
            'Documents',
            'Outline',
            'TagsAndSmartFolders',
            'SnapshotManager'
          ],
          reference: [
            'StoryWiki',
            'LinkGraph',
            'MarkdownReference'
          ],
          view: [
            'FocusMode',
            'Typewriter',
            'WritingGoal',
            'Themes',
            'Typography',
            'HeadingStyles',
            'VisualProfile'
          ],
          advanced: [
            'EditorLayout',
            'UISettings',
            'EditorAdvancedSettings',
            'PrintSettings',
            'GadgetPrefs',
            'Keybinds'
          ]
        },
        dockLayout: {
          sidebarDock: 'right',
          leftPanel: { visible: false, width: 280, tabs: [], activeTab: 0 },
          rightPanel: { width: 320 }
        }
      },
      'novel-minimal': {
        label: 'ミニマル',
        description: '最小限の機能で集中執筆',
        groups: {
          manuscript: [
            'SectionsNavigator',
            'Documents',
            'Outline',
            'SnapshotManager'
          ],
          reference: [
            'StoryWiki',
            'MarkdownReference'
          ],
          view: [
            'WritingGoal',
            'Themes',
            'Typography',
            'HeadingStyles',
            'VisualProfile'
          ],
          advanced: [
            'EditorLayout',
            'GadgetPrefs'
          ]
        },
        dockLayout: {
          sidebarDock: 'right',
          leftPanel: { visible: false, width: 280, tabs: [], activeTab: 0 },
          rightPanel: { width: 280 }
        }
      },
      'vn-layout': {
        label: 'ビジュアルノベル',
        description: 'VN・ゲームシナリオ向け',
        groups: {
          manuscript: [
            'SectionsNavigator',
            'Documents',
            'Outline',
            'TagsAndSmartFolders',
            'SnapshotManager',
            'ChoiceTools',
            'TextEffects'
          ],
          reference: [
            'StoryWiki',
            'LinkGraph',
            'Images',
            'MarkdownReference'
          ],
          view: [
            'FocusMode',
            'Typewriter',
            'WritingGoal',
            'Themes',
            'Typography',
            'HeadingStyles',
            'VisualProfile'
          ],
          advanced: [
            'EditorLayout',
            'UISettings',
            'EditorAdvancedSettings',
            'GadgetPrefs',
            'Keybinds'
          ]
        },
        dockLayout: {
          sidebarDock: 'right',
          leftPanel: { visible: false, width: 280, tabs: [], activeTab: 0 },
          rightPanel: { width: 320 }
        }
      },
      'screenplay': {
        label: '脚本・シナリオ',
        description: '映像・舞台脚本向け',
        groups: {
          manuscript: [
            'SectionsNavigator',
            'Documents',
            'Outline',
            'SnapshotManager'
          ],
          reference: [
            'StoryWiki',
            'MarkdownReference'
          ],
          view: [
            'WritingGoal',
            'Themes',
            'Typography',
            'HeadingStyles',
            'VisualProfile'
          ],
          advanced: [
            'EditorLayout',
            'UISettings',
            'EditorAdvancedSettings',
            'GadgetPrefs',
            'Keybinds'
          ]
        },
        dockLayout: {
          sidebarDock: 'right',
          leftPanel: { visible: false, width: 280, tabs: [], activeTab: 0 },
          rightPanel: { width: 300 }
        }
      }
    }
  };
})();
