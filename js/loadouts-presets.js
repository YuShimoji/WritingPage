/**
 * ロードアウトプリセット定義
 * ハードコーディングを避けるため外部ファイルに分離
 */
(function() {
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
            'OutlineQuick',
            'EditorLayout',
            'SceneGradient',
            'ChoiceTools',
            'PrintSettings'
          ],
          assist: [
            'Typewriter',
            'SnapshotManager',
            'HUDSettings',
            'WritingGoal',
            'Clock',
            'MarkdownPreview',
            'UISettings',
            'GadgetPrefs',
            'Help'
          ],
          typography: ['Themes', 'Typography', 'VisualProfile'],
          wiki: ['Wiki']
        }
      },
      'novel-minimal': {
        label: 'ミニマル',
        description: '最小限の機能で集中執筆',
        groups: {
          structure: ['Documents', 'Outline', 'EditorLayout', 'SceneGradient'],
          assist: ['HUDSettings', 'WritingGoal', 'Clock', 'Help'],
          typography: ['Themes', 'Typography', 'VisualProfile'],
          wiki: ['Wiki']
        }
      },
      'vn-layout': {
        label: 'ビジュアルノベル',
        description: 'VN・ゲームシナリオ向け',
        groups: {
          structure: [
            'Documents',
            'Outline',
            'EditorLayout',
            'SceneGradient',
            'Images',
            'ChoiceTools'
          ],
          assist: [
            'Typewriter',
            'SnapshotManager',
            'HUDSettings',
            'WritingGoal',
            'Clock',
            'MarkdownPreview',
            'UISettings',
            'GadgetPrefs',
            'Help'
          ],
          typography: ['Themes', 'Typography', 'VisualProfile'],
          wiki: ['Wiki', 'StoryWiki']
        }
      },
      'screenplay': {
        label: '脚本・シナリオ',
        description: '映像・舞台脚本向け',
        groups: {
          structure: [
            'Documents',
            'Outline',
            'EditorLayout',
            'ChoiceTools'
          ],
          assist: [
            'HUDSettings',
            'WritingGoal',
            'Clock',
            'UISettings',
            'GadgetPrefs',
            'Help'
          ],
          typography: ['Themes', 'Typography', 'VisualProfile'],
          wiki: ['Wiki']
        }
      }
    }
  };
})();
