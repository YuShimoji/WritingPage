/**
 * gadgets-typography.js
 * タイポグラフィ設定ガジェット
 * 責務: フォントファミリー、UIフォントサイズ、エディタフォントサイズ、行間
 */
(function () {
  'use strict';

  var utils = window.ZWGadgetsUtils;
  var ZWGadgets = window.ZWGadgets;
  if (!utils || !ZWGadgets) return;

  ZWGadgets.register('Typography', function (el) {
    try {
      var theme = window.ZenWriterTheme;
      var storage = window.ZenWriterStorage;
      if (!theme || !storage) {
        var warn = document.createElement('p');
        warn.textContent = (window.UILabels && window.UILabels.TYPO_SETTINGS_UNAVAILABLE) || 'タイポグラフィ設定を読み込めません。';
        warn.style.opacity = '0.7';
        warn.style.fontSize = '0.9rem';
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

      // Font settings
      var fontSection = makeSection((window.UILabels && window.UILabels.FONT_SECTION) || 'フォント');

      // Font family
      var fontSelect = document.createElement('select');
      var fonts = [
        { value: '"Noto Serif JP", serif', label: 'Noto Serif JP' },
        { value: '"Yu Mincho", "YuMincho", serif', label: '游明朝' },
        { value: '"Hiragino Mincho ProN", serif', label: 'ヒラギノ明朝' },
        { value: '"Noto Sans JP", sans-serif', label: 'Noto Sans JP' },
        { value: '"Yu Gothic", "YuGothic", sans-serif', label: '游ゴシック' },
        { value: '"Hiragino Kaku Gothic ProN", sans-serif', label: 'ヒラギノ角ゴ' },
        { value: 'serif', label: 'システム明朝' },
        { value: 'sans-serif', label: 'システムゴシック' },
        { value: 'monospace', label: '等幅フォント' }
      ];
      fonts.forEach(function (f) {
        var opt = document.createElement('option');
        opt.value = f.value;
        opt.textContent = f.label;
        fontSelect.appendChild(opt);
      });
      fontSelect.value = settings.fontFamily || fonts[0].value;
      fontSelect.addEventListener('change', function () {
        applyFontSettings();
      });
      fontSection.appendChild(makeRow((window.UILabels && window.UILabels.FONT_FAMILY) || 'フォントファミリー', fontSelect));

      // UI Font size
      var uiFontSizeInput = document.createElement('input');
      uiFontSizeInput.type = 'range';
      uiFontSizeInput.min = '12';
      uiFontSizeInput.max = '24';
      uiFontSizeInput.step = '1';
      uiFontSizeInput.value = settings.uiFontSize || settings.fontSize || 16;

      var uiFontSizeLabel = document.createElement('div');
      uiFontSizeLabel.style.fontSize = '0.85rem';
      uiFontSizeLabel.style.opacity = '0.8';
      uiFontSizeLabel.textContent = ((window.UILabels && window.UILabels.UI_FONT_SIZE_PREFIX) || 'UIフォントサイズ: ') + uiFontSizeInput.value + 'px';

      uiFontSizeInput.addEventListener('input', function (e) {
        uiFontSizeLabel.textContent = ((window.UILabels && window.UILabels.UI_FONT_SIZE_PREFIX) || 'UIフォントサイズ: ') + e.target.value + 'px';
        applyFontSettings();
      });

      var uiFontSizeRow = document.createElement('div');
      uiFontSizeRow.style.display = 'flex';
      uiFontSizeRow.style.flexDirection = 'column';
      uiFontSizeRow.style.gap = '4px';
      uiFontSizeRow.appendChild(uiFontSizeLabel);
      uiFontSizeRow.appendChild(uiFontSizeInput);
      fontSection.appendChild(uiFontSizeRow);

      // Editor Font size
      var editorFontSizeInput = document.createElement('input');
      editorFontSizeInput.type = 'range';
      editorFontSizeInput.min = '12';
      editorFontSizeInput.max = '32';
      editorFontSizeInput.step = '1';
      editorFontSizeInput.value = settings.editorFontSize || settings.fontSize || 16;

      var editorFontSizeLabel = document.createElement('div');
      editorFontSizeLabel.style.fontSize = '0.85rem';
      editorFontSizeLabel.style.opacity = '0.8';
      editorFontSizeLabel.textContent = ((window.UILabels && window.UILabels.EDITOR_FONT_SIZE_PREFIX) || 'エディタフォントサイズ: ') + editorFontSizeInput.value + 'px';

      editorFontSizeInput.addEventListener('input', function (e) {
        editorFontSizeLabel.textContent = ((window.UILabels && window.UILabels.EDITOR_FONT_SIZE_PREFIX) || 'エディタフォントサイズ: ') + e.target.value + 'px';
        applyFontSettings();
      });

      var editorFontSizeRow = document.createElement('div');
      editorFontSizeRow.style.display = 'flex';
      editorFontSizeRow.style.flexDirection = 'column';
      editorFontSizeRow.style.gap = '4px';
      editorFontSizeRow.appendChild(editorFontSizeLabel);
      editorFontSizeRow.appendChild(editorFontSizeInput);
      fontSection.appendChild(editorFontSizeRow);

      // Line height
      var lineHeightInput = document.createElement('input');
      lineHeightInput.type = 'range';
      lineHeightInput.min = '1';
      lineHeightInput.max = '3';
      lineHeightInput.step = '0.1';
      lineHeightInput.value = settings.lineHeight || 1.6;

      var lineHeightLabel = document.createElement('div');
      lineHeightLabel.style.fontSize = '0.85rem';
      lineHeightLabel.style.opacity = '0.8';
      lineHeightLabel.textContent = ((window.UILabels && window.UILabels.LINE_HEIGHT_PREFIX) || '行間: ') + lineHeightInput.value;

      lineHeightInput.addEventListener('input', function (e) {
        lineHeightLabel.textContent = ((window.UILabels && window.UILabels.LINE_HEIGHT_PREFIX) || '行間: ') + e.target.value;
        applyFontSettings();
      });

      var lineHeightRow = document.createElement('div');
      lineHeightRow.style.display = 'flex';
      lineHeightRow.style.flexDirection = 'column';
      lineHeightRow.style.gap = '4px';
      lineHeightRow.appendChild(lineHeightLabel);
      lineHeightRow.appendChild(lineHeightInput);
      fontSection.appendChild(lineHeightRow);

      wrap.appendChild(fontSection);
      el.appendChild(wrap);

      function applyFontSettings() {
        try {
          var ff = fontSelect.value;
          var uiSize = parseInt(uiFontSizeInput.value, 10);
          var editorSize = parseInt(editorFontSizeInput.value, 10);
          var lh = parseFloat(lineHeightInput.value);
          theme.applyFontSettings(ff, editorSize, lh, uiSize, editorSize);
        } catch (e) {
          console.error('applyFontSettings failed', e);
        }
      }

      function refreshState() {
        try {
          var latest = storage.loadSettings();
          if (!latest) return;

          fontSelect.value = latest.fontFamily || fonts[0].value;

          uiFontSizeInput.value = latest.uiFontSize || latest.fontSize || 16;
          uiFontSizeLabel.textContent = ((window.UILabels && window.UILabels.UI_FONT_SIZE_PREFIX) || 'UIフォントサイズ: ') + uiFontSizeInput.value + 'px';

          editorFontSizeInput.value = latest.editorFontSize || latest.fontSize || 16;
          editorFontSizeLabel.textContent = ((window.UILabels && window.UILabels.EDITOR_FONT_SIZE_PREFIX) || 'エディタフォントサイズ: ') + editorFontSizeInput.value + 'px';

          lineHeightInput.value = latest.lineHeight || 1.6;
          lineHeightLabel.textContent = ((window.UILabels && window.UILabels.LINE_HEIGHT_PREFIX) || '行間: ') + lineHeightInput.value;
        } catch (e) {
          console.error('refreshState failed', e);
        }
      }

      refreshState();

      window.addEventListener('ZWLoadoutsChanged', refreshState);
      window.addEventListener('ZWLoadoutApplied', refreshState);
      window.addEventListener('ZenWriterSettingsChanged', refreshState);

    } catch (e) {
      console.error('Typography gadget failed:', e);
      try {
        el.textContent = (window.UILabels && window.UILabels.TYPO_INIT_FAILED) || 'タイポグラフィガジェットの初期化に失敗しました。';
      } catch (_) { }
    }
  }, {
    groups: ['typography'],
    title: (window.UILabels && window.UILabels.GADGET_TYPOGRAPHY_TITLE) || 'フォント'
  });

})();
