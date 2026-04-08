/**
 * ロードアウトプリセット定義
 * ハードコーディングを避けるため外部ファイルに分離
 *
 * グループ名は KNOWN_GROUPS と一致させること:
 *   sections, structure, edit, theme, assist, advanced
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
            'SnapshotManager',
            'HUDSettings',
            'WritingGoal',
            'MarkdownReference',
            'PomodoroTimer'
          ],
          advanced: [
            'EditorLayout',
            'UISettings',
            'PrintSettings',
            'LoadoutManager',
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
            'SnapshotManager',
            'WritingGoal',
            'MarkdownReference'
          ],
          advanced: [
            'EditorLayout',
            'LoadoutManager',
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
            'SnapshotManager',
            'HUDSettings',
            'WritingGoal',
            'MarkdownReference',
            'PomodoroTimer'
          ],
          advanced: [
            'EditorLayout',
            'UISettings',
            'LoadoutManager',
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
            'SnapshotManager',
            'WritingGoal',
            'MarkdownReference',
            'PomodoroTimer'
          ],
          advanced: [
            'EditorLayout',
            'UISettings',
            'LoadoutManager',
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
