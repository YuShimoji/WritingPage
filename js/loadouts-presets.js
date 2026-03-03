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
            'Clock'
          ],
          typography: [],
          wiki: ['StoryWiki'],
          settings: [
            'Themes',
            'Typography',
            'VisualProfile',
            'EditorLayout',
            'SceneGradient',
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
          structure: [
            'Documents',
            'Outline'
          ],
          assist: [
            'Typewriter',
            'FocusMode',
            'SnapshotManager',
            'HUDSettings',
            'WritingGoal',
            'Clock'
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
            'Clock'
          ],
          typography: [],
          wiki: ['StoryWiki'],
          settings: [
            'Themes',
            'Typography',
            'VisualProfile',
            'EditorLayout',
            'SceneGradient',
            'Images',
            'ChoiceTools',
            'MarkdownPreview',
            'UISettings',
            'GadgetPrefs',
            'Keybinds'
          ]
        }
      },
      'graphic-novel': {
        label: 'グラフィックノベル',
        description: '漫画/グラフィックノベル向け（画像・装飾・サンプル）',
        groups: {
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
            'Clock'
          ],
          typography: [],
          wiki: ['StoryWiki'],
          settings: [
            'Themes',
            'Typography',
            'VisualProfile',
            'EditorLayout',
            'SceneGradient',
            'Images',
            'FontDecoration',
            'TextAnimation',
            'Samples',
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
            'Typewriter',
            'FocusMode',
            'SnapshotManager',
            'HUDSettings',
            'WritingGoal',
            'Clock'
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
