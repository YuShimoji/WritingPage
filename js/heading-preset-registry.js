/**
 * heading-preset-registry.js
 * 見出しタイポグラフィプリセットの集中管理レジストリ (SP-058)
 *
 * ThemeRegistry と同じパターンで、見出しH1-H6のスタイルセットを
 * プリセットとして管理する。SP-061 Visual Profile への統合経路を持つ。
 */
(function () {
  'use strict';

  var HEADING_LEVELS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

  var HEADING_PRESETS = [
    {
      id: 'default',
      label: '標準',
      values: {
        h1: { size: '1.5em', weight: 'bold', lineHeight: '1.2', marginTop: '1.5em', marginBottom: '0.5em', letterSpacing: '0em' },
        h2: { size: '1.3em', weight: 'bold', lineHeight: '1.3', marginTop: '1.5em', marginBottom: '0.8em', letterSpacing: '0em' },
        h3: { size: '1.2em', weight: 'bold', lineHeight: '1.4', marginTop: '1.2em', marginBottom: '0.6em', letterSpacing: '0em' },
        h4: { size: '1.1em', weight: 'bold', lineHeight: '1.4', marginTop: '1em', marginBottom: '0.5em', letterSpacing: '0em' },
        h5: { size: '1.1em', weight: 'bold', lineHeight: '1.4', marginTop: '1em', marginBottom: '0.5em', letterSpacing: '0em' },
        h6: { size: '1.1em', weight: 'bold', lineHeight: '1.4', marginTop: '1em', marginBottom: '0.5em', letterSpacing: '0em' }
      }
    },
    {
      id: 'chapter-title',
      label: '章扉',
      values: {
        h1: { size: '2em', weight: 'bold', lineHeight: '1.3', marginTop: '2em', marginBottom: '1em', letterSpacing: '0.08em' },
        h2: { size: '1.4em', weight: 'bold', lineHeight: '1.3', marginTop: '1.5em', marginBottom: '0.6em', letterSpacing: '0.04em' },
        h3: { size: '1.15em', weight: 'bold', lineHeight: '1.4', marginTop: '1.2em', marginBottom: '0.5em', letterSpacing: '0em' },
        h4: { size: '1.05em', weight: 'bold', lineHeight: '1.4', marginTop: '1em', marginBottom: '0.4em', letterSpacing: '0em' },
        h5: { size: '1.05em', weight: 'bold', lineHeight: '1.4', marginTop: '1em', marginBottom: '0.4em', letterSpacing: '0em' },
        h6: { size: '1.05em', weight: 'bold', lineHeight: '1.4', marginTop: '1em', marginBottom: '0.4em', letterSpacing: '0em' }
      }
    },
    {
      id: 'body-emphasis',
      label: '本文重視',
      values: {
        h1: { size: '1.25em', weight: 'bold', lineHeight: '1.3', marginTop: '1.2em', marginBottom: '0.4em', letterSpacing: '0em' },
        h2: { size: '1.15em', weight: 'bold', lineHeight: '1.4', marginTop: '1em', marginBottom: '0.3em', letterSpacing: '0em' },
        h3: { size: '1.05em', weight: 'bold', lineHeight: '1.4', marginTop: '0.8em', marginBottom: '0.3em', letterSpacing: '0em' },
        h4: { size: '1em', weight: '600', lineHeight: '1.4', marginTop: '0.6em', marginBottom: '0.2em', letterSpacing: '0em' },
        h5: { size: '1em', weight: '600', lineHeight: '1.4', marginTop: '0.6em', marginBottom: '0.2em', letterSpacing: '0em' },
        h6: { size: '1em', weight: '600', lineHeight: '1.4', marginTop: '0.6em', marginBottom: '0.2em', letterSpacing: '0em' }
      }
    }
  ];

  var HeadingPresetRegistry = {
    listPresets: function () {
      return HEADING_PRESETS.map(function (p) { return { id: p.id, label: p.label }; });
    },

    getPreset: function (id) {
      for (var i = 0; i < HEADING_PRESETS.length; i++) {
        if (HEADING_PRESETS[i].id === id) return HEADING_PRESETS[i];
      }
      return null;
    },

    getDefaultValues: function () {
      return HEADING_PRESETS[0].values;
    },

    isValidPreset: function (id) {
      return HEADING_PRESETS.some(function (p) { return p.id === id; });
    },

    getValues: function (id) {
      var preset = this.getPreset(id);
      return preset ? preset.values : this.getDefaultValues();
    },

    LEVELS: HEADING_LEVELS
  };

  window.HeadingPresetRegistry = HeadingPresetRegistry;
})();
