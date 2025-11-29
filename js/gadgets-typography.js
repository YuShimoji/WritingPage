(function () {
  'use strict';

  // Depends on gadgets-utils.js and gadgets-core.js
  var utils = window.ZWGadgetsUtils;
  var ZWGadgetsCore = window.ZWGadgetsCore;
  if (!utils || !ZWGadgetsCore) return;

  // Use the global ZWGadgets instance instead of creating a new one
  var ZWGadgetsInstance = window.ZWGadgets;
  if (!ZWGadgetsInstance) return;

  // TypographyThemes gadget (個別ファイル化)
  ZWGadgetsInstance.register('TypographyThemes', function (el) {
    try {
      var theme = window.ZenWriterTheme;
      var storage = window.ZenWriterStorage;
      if (!theme || !storage) {
        var warn = document.createElement('p');
        warn.textContent = (window.UILabels && window.UILabels.TYPO_SETTINGS_UNAVAILABLE) || 'タイポ設定を読み込めません。';
        warn.style.opacity = '0.7'; warn.style.fontSize = '0.9rem';
        el.appendChild(warn);
        return;
      }

      var settings = storage.loadSettings ? storage.loadSettings() : {};
      settings = settings || {};

      var wrap = document.createElement('div');
      wrap.className = 'gadget-typography';
      wrap.style.display = 'flex';
      wrap.style.flexDirection = 'column';
      wrap.style.gap = '12px';

      // Visual Profile プリセット（新API利用）
      var visualProfileApi = window.ZenWriterVisualProfile;
      if (!visualProfileApi) {
        console.warn('ZenWriterVisualProfile API not available, falling back to inline profiles');
        // フォールバック: 従来のハードコードプロファイル
        var visualProfiles = [
          {
            id: '',
            label: (window.UILabels && window.UILabels.VISUAL_PROFILE_CUSTOM) || 'カスタム（個別設定）'
          },
          {
            id: 'standard',
            label: (window.UILabels && window.UILabels.VISUAL_PROFILE_STANDARD) || 'ライト',
            theme: 'light',
            useCustomColors: false,
            fontFamily: '"Noto Serif JP", serif',
            uiFontSize: 16,
            editorFontSize: 16,
            lineHeight: 1.6
          },
          {
            id: 'focus-dark',
            label: (window.UILabels && window.UILabels.VISUAL_PROFILE_FOCUS_DARK) || 'ダーク',
            theme: 'dark',
            useCustomColors: false,
            fontFamily: '"Noto Serif JP", serif',
            uiFontSize: 15,
            editorFontSize: 17,
            lineHeight: 1.8
          },
          {
            id: 'blank-light',
            label: (window.UILabels && window.UILabels.VISUAL_PROFILE_BLANK_LIGHT) || 'ライト（余白広め）',
            theme: 'light',
            useCustomColors: false,
            fontFamily: '"Noto Serif JP", serif',
            uiFontSize: 14,
            editorFontSize: 18,
            lineHeight: 1.9
          }
        ];
      } else {
        // 新API利用: 組み込みプロファイルを取得し、カスタムを追加
        var builtInProfiles = visualProfileApi.getBuiltInProfiles();
        var visualProfiles = [
          {
            id: '',
            label: (window.UILabels && window.UILabels.VISUAL_PROFILE_CUSTOM) || 'カスタム（個別設定）'
          }
        ].concat(builtInProfiles);
      }

      var visualProfileMap = {};
      visualProfiles.forEach(function (p) {
        if (p.id) visualProfileMap[p.id] = p;
      });

      var visualProfileSelect = null;

      function applyVisualProfile(profile) {
        // 新APIが利用可能な場合はそれを使用
        if (visualProfileApi && typeof visualProfileApi.applyVisualProfile === 'function') {
          visualProfileApi.applyVisualProfile(profile);
          return;
        }

        // フォールバック: 従来の実装
        if (!profile || !profile.id) return;

        // テーマ/色
        try {
          var themeName = profile.theme || 'light';
          theme.applyTheme(themeName);
          if (profile.useCustomColors && profile.bgColor && profile.textColor) {
            theme.applyCustomColors(profile.bgColor, profile.textColor, true);
          } else {
            theme.clearCustomColors();
          }
        } catch (e) {
          console.error('applyVisualProfile theme failed', e);
        }

        // フォント/行間
        try {
          var ff = profile.fontFamily || (fonts && fonts[0] && fonts[0].value) || '"Noto Serif JP", serif';
          var baseSize = settings.fontSize || 16;
          var uiSize = profile.uiFontSize || settings.uiFontSize || baseSize;
          var editorSize = profile.editorFontSize || settings.editorFontSize || baseSize;
          var lh = profile.lineHeight || settings.lineHeight || 1.6;
          theme.applyFontSettings(ff, editorSize, lh, uiSize, editorSize);
        } catch (e) {
          console.error('applyVisualProfile fonts failed', e);
        }

        // 表示モード（UIモード）はここでは変更しない（既存のUIモードUIに委ねる）
        try {
          if (storage && typeof storage.loadSettings === 'function' && typeof storage.saveSettings === 'function') {
            var s = storage.loadSettings() || {};
            if (!s.ui) s.ui = {};
            s.visualProfileId = profile.id;
            storage.saveSettings(s);
          }
        } catch (e) {
          console.error('applyVisualProfile ui mode fallback failed', e);
        }

        // UI状態の再同期
        try {
          if (typeof refreshState === 'function') {
            refreshState();
          }
        } catch (e) {
          console.error('applyVisualProfile refresh failed', e);
        }
      }

      function makeSection(title) {
        var section = document.createElement('div');
        section.className = 'typography-section';
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
      ['light', 'dark', 'sepia', 'high-contrast', 'solarized'].forEach(function (key) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'small';
        btn.setAttribute('data-theme-preset', key);
        btn.textContent = ({
          light: (window.UILabels && window.UILabels.THEME_NAME_LIGHT) || 'ライト',
          dark: (window.UILabels && window.UILabels.THEME_NAME_DARK) || 'ダーク',
          sepia: (window.UILabels && window.UILabels.THEME_NAME_SEPIA) || 'セピア',
          'high-contrast': (window.UILabels && window.UILabels.THEME_NAME_HIGH_CONTRAST) || '高コントラスト',
          solarized: (window.UILabels && window.UILabels.THEME_NAME_SOLARIZED) || 'ソラリゼド'
        })[key] || key;
        btn.addEventListener('click', function () {
          try {
            theme.applyTheme(key);
            try { refreshState(); } catch (_) { }
          } catch (e) { console.error('applyTheme failed', e); }
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
        } catch (e) { console.error('clearCustomColors failed', e); }
      });
      colorSection.appendChild(resetColorsBtn);

      // Custom color presets
      var paletteSection = makeSection((window.UILabels && window.UILabels.CUSTOM_COLOR_SECTION) || 'カスタム色');
      var customPresets = [];
      try {
        var stored = localStorage.getItem('zenWriter_colorPresets');
        if (stored) customPresets = JSON.parse(stored);
      } catch (_) { }
      if (customPresets.length > 0) {
        customPresets.forEach(function (preset, _idx) {
          var _btn2 = document.createElement('button');
          _btn2.type = 'button';
          _btn2.className = 'small';
          _btn2.textContent = preset.name;
          _btn2.addEventListener('click', function () {
            theme.applyCustomColors(preset.bg, preset.text, true);
            refreshState();
          });
          paletteSection.appendChild(_btn2);
        });
      }

      // Visual Profile presets
      var visualProfileSection = makeSection((window.UILabels && window.UILabels.VISUAL_PROFILE_SECTION) || 'Visual Profile（試験機能）');
      visualProfileSelect = document.createElement('select');
      visualProfileSelect.style.maxWidth = '100%';
      visualProfiles.forEach(function (p) {
        var opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.label;
        visualProfileSelect.appendChild(opt);
      });
      visualProfileSelect.addEventListener('change', function (e) {
        var id = e.target.value;
        var profile = visualProfileMap[id];
        if (!profile) {
          // カスタムに戻す場合は visualProfileId のみクリア
          try {
            if (storage && typeof storage.loadSettings === 'function' && typeof storage.saveSettings === 'function') {
              var s = storage.loadSettings() || {};
              if (s.visualProfileId) {
                delete s.visualProfileId;
                storage.saveSettings(s);
              }
            }
          } catch (err) {
            console.error('clear visualProfileId failed', err);
          }
          return;
        }
        applyVisualProfile(profile);
      });
      visualProfileSection.appendChild(visualProfileSelect);

      // Font settings
      var fontSection = makeSection((window.UILabels && window.UILabels.FONT_SECTION) || 'フォント');
      var fontSelect = document.createElement('select');
      var fonts = [
        { value: '"Noto Serif JP", serif', label: 'Noto Serif JP' },
        { value: '"Yu Mincho", "YuMincho", serif', label: '游明朝' },
        { value: '"Hiragino Mincho ProN", serif', label: 'ヒラギノ明朝' }
      ];
      fonts.forEach(function (f) { var opt = document.createElement('option'); opt.value = f.value; opt.textContent = f.label; fontSelect.appendChild(opt); });
      fontSection.appendChild(makeRow((window.UILabels && window.UILabels.FONT_FAMILY) || 'フォントファミリー', fontSelect));

      var fontSizeInput = document.createElement('input');
      fontSizeInput.type = 'range'; fontSizeInput.min = '12'; fontSizeInput.max = '32'; fontSizeInput.step = '1'; fontSizeInput.value = settings.fontSize || 16;
      var fontSizeLabel = document.createElement('div');
      fontSizeLabel.style.fontSize = '0.85rem'; fontSizeLabel.style.opacity = '0.8';
      fontSizeLabel.textContent = 'フォントサイズ: ' + fontSizeInput.value + 'px';
      fontSizeInput.addEventListener('input', function (e) {
        fontSizeLabel.textContent = ((window.UILabels && window.UILabels.FONT_SIZE_PREFIX) || 'フォントサイズ: ') + e.target.value + 'px';
        theme.applyFontSettings(fontSelect.value, parseFloat(e.target.value), parseFloat(lineHeightInput.value), parseInt(uiFontSizeInput.value || e.target.value, 10), parseInt(editorFontSizeInput.value || e.target.value, 10));
        refreshState();
      });
      fontSection.appendChild(makeRow((window.UILabels && window.UILabels.BODY_FONT_SIZE) || '本文フォントサイズ', fontSizeInput));

      var uiFontSizeInput = document.createElement('input');
      uiFontSizeInput.type = 'range'; uiFontSizeInput.min = '12'; uiFontSizeInput.max = '32'; uiFontSizeInput.step = '1'; uiFontSizeInput.value = settings.uiFontSize || settings.fontSize || 16;
      var uiFontSizeLabel = document.createElement('div');
      uiFontSizeLabel.style.fontSize = '0.85rem'; uiFontSizeLabel.style.opacity = '0.8';
      uiFontSizeLabel.textContent = ((window.UILabels && window.UILabels.UI_FONT_SIZE_PREFIX) || 'UIフォントサイズ: ') + uiFontSizeInput.value + 'px';
      uiFontSizeInput.addEventListener('input', function (e) {
        uiFontSizeLabel.textContent = ((window.UILabels && window.UILabels.UI_FONT_SIZE_PREFIX) || 'UIフォントサイズ: ') + e.target.value + 'px';
        theme.applyFontSettings(fontSelect.value, parseFloat(fontSizeInput.value), parseFloat(lineHeightInput.value), parseInt(e.target.value, 10), parseInt(editorFontSizeInput.value, 10));
        refreshState();
      });
      var uiFontSizeRow = document.createElement('div');
      uiFontSizeRow.style.display = 'flex';
      uiFontSizeRow.style.flexDirection = 'column';
      uiFontSizeRow.style.gap = '4px';
      uiFontSizeRow.appendChild(uiFontSizeLabel);
      uiFontSizeRow.appendChild(uiFontSizeInput);
      fontSection.appendChild(uiFontSizeRow);

      var editorFontSizeInput = document.createElement('input');
      editorFontSizeInput.type = 'range'; editorFontSizeInput.min = '12'; editorFontSizeInput.max = '32'; editorFontSizeInput.step = '1'; editorFontSizeInput.value = settings.editorFontSize || 16;
      var editorFontSizeLabel = document.createElement('div');
      editorFontSizeLabel.style.fontSize = '0.85rem'; editorFontSizeLabel.style.opacity = '0.8';
      editorFontSizeLabel.textContent = ((window.UILabels && window.UILabels.EDITOR_FONT_SIZE_PREFIX) || 'エディタフォントサイズ: ') + editorFontSizeInput.value + 'px';
      editorFontSizeInput.addEventListener('input', function (e) {
        editorFontSizeLabel.textContent = ((window.UILabels && window.UILabels.EDITOR_FONT_SIZE_PREFIX) || 'エディタフォントサイズ: ') + e.target.value + 'px';
        theme.applyFontSettings(fontSelect.value, parseFloat(fontSizeInput.value), parseFloat(lineHeightInput.value), parseInt(uiFontSizeInput.value, 10), parseInt(e.target.value, 10));
        refreshState();
      });
      var editorFontSizeRow = document.createElement('div');
      editorFontSizeRow.style.display = 'flex';
      editorFontSizeRow.style.flexDirection = 'column';
      editorFontSizeRow.style.gap = '4px';
      editorFontSizeRow.appendChild(editorFontSizeLabel);
      editorFontSizeRow.appendChild(editorFontSizeInput);
      fontSection.appendChild(editorFontSizeRow);

      var lineHeightInput = document.createElement('input');
      lineHeightInput.type = 'range'; lineHeightInput.min = '1'; lineHeightInput.max = '3'; lineHeightInput.step = '0.1';
      lineHeightInput.value = settings.lineHeight || 1.6;
      var lineHeightLabel = document.createElement('div');
      lineHeightLabel.style.fontSize = '0.85rem'; lineHeightLabel.style.opacity = '0.8';
      lineHeightLabel.textContent = ((window.UILabels && window.UILabels.LINE_HEIGHT_PREFIX) || '行間: ') + lineHeightInput.value;
      lineHeightInput.addEventListener('input', function (e) {
        lineHeightLabel.textContent = ((window.UILabels && window.UILabels.LINE_HEIGHT_PREFIX) || '行間: ') + e.target.value;
        theme.applyFontSettings(fontSelect.value, parseFloat(fontSizeInput.value), parseFloat(e.target.value), parseInt(uiFontSizeInput.value, 10), parseInt(editorFontSizeInput.value, 10));
        refreshState();
      });
      var lineHeightRow = document.createElement('div');
      lineHeightRow.style.display = 'flex';
      lineHeightRow.style.flexDirection = 'column';
      lineHeightRow.style.gap = '4px';
      lineHeightRow.appendChild(lineHeightLabel);
      lineHeightRow.appendChild(lineHeightInput);
      fontSection.appendChild(lineHeightRow);

      wrap.appendChild(themesSection);
      wrap.appendChild(colorSection);
      wrap.appendChild(paletteSection);
      wrap.appendChild(visualProfileSection);
      wrap.appendChild(fontSection);

      el.appendChild(wrap);

      function refreshState() {
        try {
          var latest = storage.loadSettings();
          if (!latest) return;
          fontSelect.value = latest.fontFamily || fonts[0].value;
          fontSizeInput.value = latest.fontSize || 16;
          fontSizeLabel.textContent = ((window.UILabels && window.UILabels.FONT_SIZE_PREFIX) || 'フォントサイズ: ') + fontSizeInput.value + 'px';
          uiFontSizeInput.value = latest.uiFontSize || fontSizeInput.value;
          uiFontSizeLabel.textContent = ((window.UILabels && window.UILabels.UI_FONT_SIZE_PREFIX) || 'UIフォントサイズ: ') + uiFontSizeInput.value + 'px';
          editorFontSizeInput.value = latest.editorFontSize || fontSizeInput.value;
          editorFontSizeLabel.textContent = ((window.UILabels && window.UILabels.EDITOR_FONT_SIZE_PREFIX) || 'エディタフォントサイズ: ') + editorFontSizeInput.value + 'px';
          lineHeightInput.value = latest.lineHeight || 1.6;
          lineHeightLabel.textContent = ((window.UILabels && window.UILabels.LINE_HEIGHT_PREFIX) || '行間: ') + lineHeightInput.value;
          
          // カラー設定
          if (latest.useCustomColors && latest.bgColor && latest.textColor) {
            bgInput.value = latest.bgColor;
            textInput.value = latest.textColor;
          } else {
            // テーマの既定色を使用
            var currentTheme = latest.theme || 'light';
            var themeColors = { light: { bg: '#ffffff', text: '#333333' }, dark: { bg: '#1e1e1e', text: '#e0e0e0' }, sepia: { bg: '#f4ecd8', text: '#5b4636' } };
            var themeColor = themeColors[currentTheme] || themeColors.light;
            bgInput.value = themeColor.bg;
            textInput.value = themeColor.text;
          }

          // Visual Profile セレクトの状態を同期
          if (visualProfileSelect) {
            var selectedId = latest.visualProfileId || '';
            var matched = null;
            var latestUiMode = latest.ui && latest.ui.uiMode;

            if (selectedId && visualProfileMap[selectedId]) {
              matched = visualProfileMap[selectedId];
            } else {
              visualProfiles.some(function (p) {
                if (!p.id) return false;
                if (p.theme && p.theme !== latest.theme) return false;
                if (p.fontFamily && p.fontFamily !== (latest.fontFamily || fonts[0].value)) return false;
                if (typeof p.editorFontSize === 'number' && p.editorFontSize !== (latest.editorFontSize || latest.fontSize || 16)) return false;
                if (typeof p.lineHeight === 'number' && String(p.lineHeight) !== String(latest.lineHeight || 1.6)) return false;
                if (p.uiMode && p.uiMode !== latestUiMode) return false;
                matched = p;
                return true;
              });
              selectedId = matched ? matched.id : '';
            }

            visualProfileSelect.value = selectedId;
          }
        } catch (e) { console.error('refreshState failed', e); }
      }

      refreshState();

      window.addEventListener('ZWLoadoutsChanged', refreshState);
      window.addEventListener('ZWLoadoutApplied', refreshState);
      window.addEventListener('ZenWriterSettingsChanged', refreshState);
    } catch (e) {
      console.error('TypographyThemes gadget failed:', e);
      try { el.textContent = (window.UILabels && window.UILabels.TYPO_INIT_FAILED) || 'タイポ設定ガジェットの初期化に失敗しました。'; } catch (e) { void e; }
    }
  }, { groups: ['typography'], title: (window.UILabels && window.UILabels.GADGET_THEME_TITLE) || 'テーマ & フォント' });

})();
