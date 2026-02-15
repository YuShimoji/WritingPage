/**
 * gadgets-themes.js
 * UIテーマとカラー設定ガジェット
 * 責務: テーマプリセット、カスタムカラー、色リセット、カスタム色プリセット
 */
(function () {
  'use strict';

  var utils = window.ZWGadgetsUtils;
  var ZWGadgets = window.ZWGadgets;
  if (!utils || !ZWGadgets) return;

  ZWGadgets.register('Themes', function (el) {
    try {
      var theme = window.ZenWriterTheme;
      var storage = window.ZenWriterStorage;
      if (!theme || !storage) {
        var warn = document.createElement('p');
        warn.textContent = (window.UILabels && window.UILabels.THEME_SETTINGS_UNAVAILABLE) || 'テーマ設定を読み込めません。';
        warn.style.opacity = '0.7';
        warn.style.fontSize = '0.9rem';
        el.appendChild(warn);
        return;
      }

      var settings = storage.loadSettings ? storage.loadSettings() : {};
      settings = settings || {};

      var wrap = document.createElement('div');
      wrap.className = 'gadget-themes';
      wrap.style.display = 'flex';
      wrap.style.flexDirection = 'column';
      wrap.style.gap = '12px';

      function makeSection(title) {
        var section = document.createElement('div');
        section.className = 'themes-section';
        var heading = document.createElement('h4');
        heading.textContent = title;
        heading.style.margin = '0';
        heading.style.fontSize = '0.95rem';
        section.appendChild(heading);
        section.style.display = 'flex';
        section.style.flexDirection = 'column';
        section.style.gap = '6px';
        return section;
      }

      var makeRow = function (labelText, control) {
        var row = document.createElement('label');
        row.style.display = 'flex';
        row.style.flexDirection = 'column';
        row.style.gap = '4px';
        row.textContent = labelText;
        row.appendChild(control);
        return row;
      };

      // Theme presets
      var themesSection = makeSection((window.UILabels && window.UILabels.THEME_SECTION) || 'テーマ');
      var themeButtons = document.createElement('div');
      themeButtons.style.display = 'flex';
      themeButtons.style.gap = '6px';
      themeButtons.style.flexWrap = 'wrap';

      // ThemeRegistry からプリセット一覧を取得（フォールバック付き）
      var themePresets = (window.ThemeRegistry && typeof window.ThemeRegistry.listPresets === 'function')
        ? window.ThemeRegistry.listPresets().map(function (p) {
            return { key: p.id, label: window.ThemeRegistry.getLabel(p.id) };
          })
        : [
            { key: 'light', label: (window.UILabels && window.UILabels.THEME_NAME_LIGHT) || 'ライト' },
            { key: 'dark', label: (window.UILabels && window.UILabels.THEME_NAME_DARK) || 'ダーク' },
            { key: 'night', label: (window.UILabels && window.UILabels.THEME_NAME_NIGHT) || 'ナイト' },
            { key: 'sepia', label: (window.UILabels && window.UILabels.THEME_NAME_SEPIA) || 'セピア' },
            { key: 'high-contrast', label: (window.UILabels && window.UILabels.THEME_NAME_HIGH_CONTRAST) || '高コントラスト' },
            { key: 'solarized', label: (window.UILabels && window.UILabels.THEME_NAME_SOLARIZED) || 'ソラリゼド' }
          ];

      themePresets.forEach(function (preset) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'small';
        btn.setAttribute('data-theme-preset', preset.key);
        btn.textContent = preset.label;
        btn.addEventListener('click', function () {
          try {
            theme.applyTheme(preset.key);
            refreshState();
          } catch (e) {
            console.error('applyTheme failed', e);
          }
        });
        themeButtons.appendChild(btn);
      });
      themesSection.appendChild(themeButtons);

      // Color section
      var colorSection = makeSection((window.UILabels && window.UILabels.COLOR_SECTION) || '色');
      var bgInput = document.createElement('input');
      bgInput.type = 'color';
      bgInput.id = 'bg-color';
      bgInput.value = settings.bgColor || '#ffffff';
      var textInput = document.createElement('input');
      textInput.type = 'color';
      textInput.id = 'text-color';
      textInput.value = settings.textColor || '#333333';

      bgInput.addEventListener('change', function () {
        theme.applyCustomColors(bgInput.value, textInput.value, true);
        refreshState();
      });
      textInput.addEventListener('change', function () {
        theme.applyCustomColors(bgInput.value, textInput.value, true);
        refreshState();
      });

      colorSection.appendChild(makeRow((window.UILabels && window.UILabels.BACKGROUND_COLOR) || '背景色', bgInput));
      colorSection.appendChild(makeRow((window.UILabels && window.UILabels.TEXT_COLOR) || '文字色', textInput));

      // Reset colors button
      var resetColorsBtn = document.createElement('button');
      resetColorsBtn.type = 'button';
      resetColorsBtn.id = 'reset-colors';
      resetColorsBtn.className = 'small';
      resetColorsBtn.textContent = (window.UILabels && window.UILabels.RESET_COLORS) || '色をリセット';
      resetColorsBtn.addEventListener('click', function () {
        try {
          theme.clearCustomColors();
          refreshState();
        } catch (e) {
          console.error('clearCustomColors failed', e);
        }
      });
      colorSection.appendChild(resetColorsBtn);

      // Custom color presets
      var paletteSection = makeSection((window.UILabels && window.UILabels.CUSTOM_COLOR_SECTION) || 'カスタム色プリセット');
      var customPresets = [];
      try {
        var stored = localStorage.getItem('zenWriter_colorPresets');
        if (stored) customPresets = JSON.parse(stored);
      } catch (_) { }

      var paletteContainer = document.createElement('div');
      paletteContainer.style.display = 'flex';
      paletteContainer.style.gap = '4px';
      paletteContainer.style.flexWrap = 'wrap';

      function renderCustomPresets() {
        paletteContainer.innerHTML = '';
        if (customPresets.length === 0) {
          var hint = document.createElement('span');
          hint.textContent = (window.UILabels && window.UILabels.NO_CUSTOM_COLORS) || '保存されたカスタム色はありません';
          hint.style.fontSize = '0.85rem';
          hint.style.opacity = '0.7';
          paletteContainer.appendChild(hint);
          return;
        }
        customPresets.forEach(function (preset, _idx) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'small';
          btn.textContent = preset.name;
          btn.title = '背景: ' + preset.bg + ', 文字: ' + preset.text;
          btn.addEventListener('click', function () {
            theme.applyCustomColors(preset.bg, preset.text, true);
            refreshState();
          });
          paletteContainer.appendChild(btn);
        });
      }
      renderCustomPresets();
      paletteSection.appendChild(paletteContainer);

      // Save current color as preset
      var saveColorRow = document.createElement('div');
      saveColorRow.style.display = 'flex';
      saveColorRow.style.gap = '4px';
      saveColorRow.style.marginTop = '6px';

      var saveColorBtn = document.createElement('button');
      saveColorBtn.type = 'button';
      saveColorBtn.className = 'small';
      saveColorBtn.textContent = (window.UILabels && window.UILabels.SAVE_COLOR_PRESET) || '現在の色を保存';
      saveColorBtn.addEventListener('click', function () {
        var name = prompt((window.UILabels && window.UILabels.COLOR_PRESET_NAME_PROMPT) || 'プリセット名を入力:', '');
        if (name && name.trim()) {
          customPresets.push({ name: name.trim(), bg: bgInput.value, text: textInput.value });
          try {
            localStorage.setItem('zenWriter_colorPresets', JSON.stringify(customPresets));
          } catch (_) { }
          renderCustomPresets();
        }
      });
      saveColorRow.appendChild(saveColorBtn);
      paletteSection.appendChild(saveColorRow);

      wrap.appendChild(themesSection);
      wrap.appendChild(colorSection);
      wrap.appendChild(paletteSection);
      el.appendChild(wrap);

      function refreshState() {
        try {
          var latest = storage.loadSettings();
          if (!latest) return;

          // カラー設定（C-3 Step3: カラーピッカーは Editor レイヤの色を表示）
          if (latest.useCustomColors && latest.bgColor && latest.textColor) {
            bgInput.value = latest.bgColor;
            textInput.value = latest.textColor;
          } else {
            // テーマの Editor レイヤ既定色を使用（ThemeRegistry 経由、フォールバック付き）
            var currentTheme = latest.theme || 'light';
            var themeColor;
            if (window.ThemeRegistry && typeof window.ThemeRegistry.getEditorColors === 'function') {
              var colors = window.ThemeRegistry.getEditorColors(currentTheme);
              themeColor = { bg: colors.bgColor, text: colors.textColor };
            } else if (window.ThemeRegistry && typeof window.ThemeRegistry.getColors === 'function') {
              var colors = window.ThemeRegistry.getColors(currentTheme);
              themeColor = { bg: colors.bgColor, text: colors.textColor };
            } else {
              var fallbackColors = {
                light: { bg: '#ffffff', text: '#333333' },
                dark: { bg: '#1e1e1e', text: '#e0e0e0' },
                night: { bg: '#262626', text: '#e5e5e5' },
                sepia: { bg: '#f4ecd8', text: '#5b4636' },
                'high-contrast': { bg: '#000000', text: '#ffffff' },
                solarized: { bg: '#fdf6e3', text: '#586e75' }
              };
              themeColor = fallbackColors[currentTheme] || fallbackColors.light;
            }
            bgInput.value = themeColor.bg;
            textInput.value = themeColor.text;
          }
        } catch (e) {
          console.error('refreshState failed', e);
        }
      }

      refreshState();

      window.addEventListener('ZWLoadoutsChanged', refreshState);
      window.addEventListener('ZWLoadoutApplied', refreshState);
      window.addEventListener('ZenWriterSettingsChanged', refreshState);

    } catch (e) {
      console.error('Themes gadget failed:', e);
      try {
        el.textContent = (window.UILabels && window.UILabels.THEME_INIT_FAILED) || 'テーマガジェットの初期化に失敗しました。';
      } catch (_) { }
    }
  }, {
    groups: ['settings'],
    title: (window.UILabels && window.UILabels.GADGET_THEMES_TITLE) || 'テーマ'
  });

})();
