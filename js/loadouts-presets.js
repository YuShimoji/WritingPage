/**
 * ロードアウトプリセット定義
 * ハードコーディングを避けるため外部ファイルに分離
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
            'TagsAndSmartFolders'
          ],
          assist: [
            'Typewriter',
            'FocusMode',
            'SnapshotManager',
            'HUDSettings',
            'WritingGoal',
            'MarkdownReference'
          ],
          typography: [],
          wiki: ['StoryWiki'],
          settings: [
            'Themes',
            'Typography',
            'VisualProfile',
            'EditorLayout',
            'MarkdownPreview',
            'UISettings',
            'PrintSettings',
            'ChoiceTools',
            'LoadoutManager',
            'GadgetPrefs',
            'Keybinds'
          ]
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
            'Outline'
          ],
          assist: [
            'SnapshotManager',
            'WritingGoal',
            'MarkdownReference'
          ],
          typography: [],
          wiki: ['StoryWiki'],
          settings: [
            'Themes',
            'Typography',
            'VisualProfile',
            'EditorLayout',
            'GadgetPrefs'
          ]
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
            'TagsAndSmartFolders'
          ],
          assist: [
            'Typewriter',
            'FocusMode',
            'SnapshotManager',
            'HUDSettings',
            'WritingGoal',
            'MarkdownReference'
          ],
          typography: [],
          wiki: ['StoryWiki'],
          settings: [
            'Themes',
            'Typography',
            'VisualProfile',
            'EditorLayout',
            'Images',
            'ChoiceTools',
            'MarkdownPreview',
            'UISettings',
            'GadgetPrefs',
            'Keybinds'
          ]
        }
      },
      'screenplay': {
        label: '脚本・シナリオ',
        description: '映像・舞台脚本向け',
        groups: {
          structure: [
            'Documents',
            'Outline'
          ],
          assist: [
            'SnapshotManager',
            'WritingGoal',
            'MarkdownReference'
          ],
          typography: [],
          wiki: ['StoryWiki'],
          settings: [
            'Themes',
            'Typography',
            'VisualProfile',
            'EditorLayout',
            'ChoiceTools',
            'UISettings',
            'GadgetPrefs',
            'Keybinds'
          ]
        }
      }
    }
  };
})();
