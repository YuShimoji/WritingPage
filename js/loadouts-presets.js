/**
 * ロードアウトプリセット定義
 * ハードコーディングを避けるため外部ファイルに分離
 *
 * グループ名は KNOWN_GROUPS と一致させること:
 *   sections, structure, edit, theme, assist, advanced
 *
 * 執筆優先の並び（方針）:
 * - sections: 章・セクション移動を最上段に
 * - structure: 原稿ツリー・アウトライン・Wiki・リンク系を続ける
 * - edit: プレビュー・装飾・表現ツール
 * - theme / assist / advanced: 低頻度・補助を後方カテゴリへ
 * 各配列の先頭に近いほど、サイドバー一覧では上側に表示されやすい（カテゴリ内順）。
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
          sections: [
            'SectionsNavigator'
          ],
          structure: [
            'Documents',
            'Outline',
            'TagsAndSmartFolders',
            'SnapshotManager',
            'StoryWiki',
            'LinkGraph'
          ],
          edit: [
            'MarkdownPreview',
            'ChoiceTools',
            'FontDecoration',
            'TextAnimation'
          ],
          theme: [
            'Themes',
            'Typography',
            'HeadingStyles',
            'VisualProfile'
          ],
          assist: [
            'Typewriter',
            'FocusMode',
            'WritingGoal',
            'MarkdownReference',
            'PomodoroTimer'
          ],
          advanced: [
            'EditorLayout',
            'UISettings',
            'HUDSettings',
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
          sections: [
            'SectionsNavigator'
          ],
          structure: [
            'Documents',
            'Outline',
            'SnapshotManager',
            'StoryWiki'
          ],
          edit: [],
          theme: [
            'Themes',
            'Typography',
            'HeadingStyles',
            'VisualProfile'
          ],
          assist: [
            'WritingGoal',
            'MarkdownReference'
          ],
          advanced: [
            'EditorLayout',
            'HUDSettings',
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
          sections: [
            'SectionsNavigator'
          ],
          structure: [
            'Documents',
            'Outline',
            'TagsAndSmartFolders',
            'SnapshotManager',
            'StoryWiki',
            'LinkGraph'
          ],
          edit: [
            'Images',
            'ChoiceTools',
            'MarkdownPreview',
            'FontDecoration',
            'TextAnimation'
          ],
          theme: [
            'Themes',
            'Typography',
            'HeadingStyles',
            'VisualProfile'
          ],
          assist: [
            'Typewriter',
            'FocusMode',
            'WritingGoal',
            'MarkdownReference',
            'PomodoroTimer'
          ],
          advanced: [
            'EditorLayout',
            'UISettings',
            'HUDSettings',
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
          sections: [
            'SectionsNavigator'
          ],
          structure: [
            'Documents',
            'Outline',
            'SnapshotManager',
            'StoryWiki'
          ],
          edit: [
            'ChoiceTools',
            'FontDecoration',
            'TextAnimation'
          ],
          theme: [
            'Themes',
            'Typography',
            'HeadingStyles',
            'VisualProfile'
          ],
          assist: [
            'WritingGoal',
            'MarkdownReference',
            'PomodoroTimer'
          ],
          advanced: [
            'EditorLayout',
            'UISettings',
            'HUDSettings',
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
