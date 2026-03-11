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

  var MAX_USER_PRESETS = 20;

  function getUserPresets(settings) {
    var h = settings && settings.heading;
    return (h && Array.isArray(h.userPresets)) ? h.userPresets : [];
  }

  var HeadingPresetRegistry = {
    MAX_USER_PRESETS: MAX_USER_PRESETS,

    listPresets: function () {
      return HEADING_PRESETS.map(function (p) { return { id: p.id, label: p.label }; });
    },

    listAllPresets: function (settings) {
      var all = HEADING_PRESETS.map(function (p) {
        return { id: p.id, label: p.label, builtIn: true };
      });
      var user = getUserPresets(settings);
      for (var i = 0; i < user.length && i < MAX_USER_PRESETS; i++) {
        var u = user[i];
        if (u && u.id && u.label && u.values) {
          all.push({ id: u.id, label: u.label, builtIn: false });
        }
      }
      return all;
    },

    getPreset: function (id, settings) {
      for (var i = 0; i < HEADING_PRESETS.length; i++) {
        if (HEADING_PRESETS[i].id === id) return HEADING_PRESETS[i];
      }
      if (settings) {
        var user = getUserPresets(settings);
        for (var j = 0; j < user.length; j++) {
          if (user[j] && user[j].id === id) return user[j];
        }
      }
      return null;
    },

    getDefaultValues: function () {
      return HEADING_PRESETS[0].values;
    },

    isValidPreset: function (id, settings) {
      if (HEADING_PRESETS.some(function (p) { return p.id === id; })) return true;
      if (settings) {
        return getUserPresets(settings).some(function (p) { return p && p.id === id; });
      }
      return false;
    },

    isUserPreset: function (id) {
      return typeof id === 'string' && id.indexOf('user-') === 0;
    },

    isBuiltInPreset: function (id) {
      return HEADING_PRESETS.some(function (p) { return p.id === id; });
    },

    getValues: function (id, settings) {
      var preset = this.getPreset(id, settings);
      return preset ? preset.values : this.getDefaultValues();
    },

    saveUserPreset: function (storage, label, values) {
      if (!storage || !label || !values) return null;
      var settings = storage.loadSettings();
      var heading = settings.heading || { preset: 'default', custom: {} };
      var userPresets = Array.isArray(heading.userPresets) ? heading.userPresets.slice() : [];
      if (userPresets.length >= MAX_USER_PRESETS) return null;
      var id = 'user-' + Date.now();
      var entry = { id: id, label: label, values: values };
      userPresets.push(entry);
      storage.saveSettings({ heading: { preset: heading.preset, custom: heading.custom, userPresets: userPresets } });
      return entry;
    },

    deleteUserPreset: function (storage, id) {
      if (!storage || !id || !this.isUserPreset(id)) return false;
      var settings = storage.loadSettings();
      var heading = settings.heading || { preset: 'default', custom: {} };
      var userPresets = Array.isArray(heading.userPresets) ? heading.userPresets.slice() : [];
      var filtered = userPresets.filter(function (p) { return p && p.id !== id; });
      if (filtered.length === userPresets.length) return false;
      var newPreset = heading.preset === id ? 'default' : heading.preset;
      storage.saveSettings({ heading: { preset: newPreset, custom: heading.custom, userPresets: filtered } });
      return true;
    },

    LEVELS: HEADING_LEVELS
  };

  window.HeadingPresetRegistry = HeadingPresetRegistry;
})();
