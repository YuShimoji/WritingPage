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

      // ===== 本文マイクロタイポグラフィ (SP-057) =====
      var microSection = makeSection((window.UILabels && window.UILabels.MICRO_TYPO_SECTION) || '本文');
      var micro = settings.microTypography || {};

      // 字間 (letterSpacing)
      var letterSpacingInput = document.createElement('input');
      letterSpacingInput.type = 'range';
      letterSpacingInput.min = '-0.02';
      letterSpacingInput.max = '0.12';
      letterSpacingInput.step = '0.01';
      letterSpacingInput.value = typeof micro.letterSpacing === 'number' ? micro.letterSpacing : 0;

      var letterSpacingLabel = document.createElement('div');
      letterSpacingLabel.style.fontSize = '0.85rem';
      letterSpacingLabel.style.opacity = '0.8';
      letterSpacingLabel.textContent = ((window.UILabels && window.UILabels.LETTER_SPACING_PREFIX) || '字間: ') + letterSpacingInput.value + 'em';

      letterSpacingInput.addEventListener('input', function (e) {
        letterSpacingLabel.textContent = ((window.UILabels && window.UILabels.LETTER_SPACING_PREFIX) || '字間: ') + e.target.value + 'em';
        applyMicroSettings();
      });

      var letterSpacingRow = document.createElement('div');
      letterSpacingRow.style.display = 'flex';
      letterSpacingRow.style.flexDirection = 'column';
      letterSpacingRow.style.gap = '4px';
      letterSpacingRow.appendChild(letterSpacingLabel);
      letterSpacingRow.appendChild(letterSpacingInput);
      microSection.appendChild(letterSpacingRow);

      // 段落間 (paragraphSpacing)
      var paragraphSpacingInput = document.createElement('input');
      paragraphSpacingInput.type = 'range';
      paragraphSpacingInput.min = '0';
      paragraphSpacingInput.max = '3';
      paragraphSpacingInput.step = '0.1';
      paragraphSpacingInput.value = typeof micro.paragraphSpacing === 'number' ? micro.paragraphSpacing : 1;

      var paragraphSpacingLabel = document.createElement('div');
      paragraphSpacingLabel.style.fontSize = '0.85rem';
      paragraphSpacingLabel.style.opacity = '0.8';
      paragraphSpacingLabel.textContent = ((window.UILabels && window.UILabels.PARAGRAPH_SPACING_PREFIX) || '段落間: ') + paragraphSpacingInput.value + 'em';

      paragraphSpacingInput.addEventListener('input', function (e) {
        paragraphSpacingLabel.textContent = ((window.UILabels && window.UILabels.PARAGRAPH_SPACING_PREFIX) || '段落間: ') + e.target.value + 'em';
        applyMicroSettings();
      });

      var paragraphSpacingRow = document.createElement('div');
      paragraphSpacingRow.style.display = 'flex';
      paragraphSpacingRow.style.flexDirection = 'column';
      paragraphSpacingRow.style.gap = '4px';
      paragraphSpacingRow.appendChild(paragraphSpacingLabel);
      paragraphSpacingRow.appendChild(paragraphSpacingInput);
      microSection.appendChild(paragraphSpacingRow);

      // 字下げ (paragraphIndent)
      var paragraphIndentInput = document.createElement('input');
      paragraphIndentInput.type = 'range';
      paragraphIndentInput.min = '0';
      paragraphIndentInput.max = '3';
      paragraphIndentInput.step = '0.5';
      paragraphIndentInput.value = typeof micro.paragraphIndent === 'number' ? micro.paragraphIndent : 0;

      var paragraphIndentLabel = document.createElement('div');
      paragraphIndentLabel.style.fontSize = '0.85rem';
      paragraphIndentLabel.style.opacity = '0.8';
      paragraphIndentLabel.textContent = ((window.UILabels && window.UILabels.PARAGRAPH_INDENT_PREFIX) || '字下げ: ') + paragraphIndentInput.value + 'em';

      paragraphIndentInput.addEventListener('input', function (e) {
        paragraphIndentLabel.textContent = ((window.UILabels && window.UILabels.PARAGRAPH_INDENT_PREFIX) || '字下げ: ') + e.target.value + 'em';
        applyMicroSettings();
      });

      var paragraphIndentRow = document.createElement('div');
      paragraphIndentRow.style.display = 'flex';
      paragraphIndentRow.style.flexDirection = 'column';
      paragraphIndentRow.style.gap = '4px';
      paragraphIndentRow.appendChild(paragraphIndentLabel);
      paragraphIndentRow.appendChild(paragraphIndentInput);
      microSection.appendChild(paragraphIndentRow);

      // 禁則モード (lineBreakMode)
      var lineBreakSelect = document.createElement('select');
      var lineBreakModes = [
        { value: 'normal', label: (window.UILabels && window.UILabels.LINE_BREAK_NORMAL) || '標準' },
        { value: 'strict-ja', label: (window.UILabels && window.UILabels.LINE_BREAK_STRICT_JA) || '和文禁則' }
      ];
      lineBreakModes.forEach(function (m) {
        var opt = document.createElement('option');
        opt.value = m.value;
        opt.textContent = m.label;
        lineBreakSelect.appendChild(opt);
      });
      lineBreakSelect.value = micro.lineBreakMode || 'normal';
      lineBreakSelect.addEventListener('change', function () {
        applyMicroSettings();
      });
      microSection.appendChild(makeRow((window.UILabels && window.UILabels.LINE_BREAK_MODE) || '禁則処理', lineBreakSelect));

      wrap.appendChild(microSection);

      // ===== ルビ設定 (SP-059 Phase 2) =====
      var rubySection = makeSection('ルビ');
      var ruby = settings.ruby || {};

      // ルビサイズ比 (sizeRatio) - slider
      var rubySizeInput = document.createElement('input');
      rubySizeInput.type = 'range';
      rubySizeInput.min = '0.3';
      rubySizeInput.max = '0.7';
      rubySizeInput.step = '0.05';
      rubySizeInput.value = typeof ruby.sizeRatio === 'number' ? ruby.sizeRatio : 0.5;

      var rubySizeLabel = document.createElement('div');
      rubySizeLabel.style.fontSize = '0.85rem';
      rubySizeLabel.style.opacity = '0.8';
      rubySizeLabel.textContent = 'ルビサイズ: ' + rubySizeInput.value + 'em';

      rubySizeInput.addEventListener('input', function (e) {
        rubySizeLabel.textContent = 'ルビサイズ: ' + e.target.value + 'em';
        applyRubySettings();
      });

      var rubySizeRow = document.createElement('div');
      rubySizeRow.style.display = 'flex';
      rubySizeRow.style.flexDirection = 'column';
      rubySizeRow.style.gap = '4px';
      rubySizeRow.appendChild(rubySizeLabel);
      rubySizeRow.appendChild(rubySizeInput);
      rubySection.appendChild(rubySizeRow);

      // ルビ位置 (position) - select
      var rubyPositionSelect = document.createElement('select');
      var rubyPositions = [
        { value: 'over', label: '上付き (over)' },
        { value: 'under', label: '下付き (under)' }
      ];
      rubyPositions.forEach(function (p) {
        var opt = document.createElement('option');
        opt.value = p.value;
        opt.textContent = p.label;
        rubyPositionSelect.appendChild(opt);
      });
      rubyPositionSelect.value = ruby.position || 'over';
      rubyPositionSelect.addEventListener('change', function () {
        applyRubySettings();
      });
      rubySection.appendChild(makeRow('ルビ位置', rubyPositionSelect));

      // ルビ表示/非表示 (visible) - checkbox
      var rubyVisibleCheckbox = document.createElement('input');
      rubyVisibleCheckbox.type = 'checkbox';
      rubyVisibleCheckbox.checked = ruby.visible !== false;
      rubyVisibleCheckbox.style.width = 'auto';
      rubyVisibleCheckbox.addEventListener('change', function () {
        applyRubySettings();
      });

      var rubyVisibleRow = document.createElement('label');
      rubyVisibleRow.style.display = 'flex';
      rubyVisibleRow.style.alignItems = 'center';
      rubyVisibleRow.style.gap = '8px';
      rubyVisibleRow.style.cursor = 'pointer';
      rubyVisibleRow.appendChild(rubyVisibleCheckbox);
      rubyVisibleRow.appendChild(document.createTextNode('ルビを表示'));
      rubySection.appendChild(rubyVisibleRow);

      wrap.appendChild(rubySection);

      // ===== タイポグラフィパック (SP-061 Phase 2) =====
      var vp = window.ZenWriterVisualProfile;
      if (vp && vp.getTypographyPacks) {
        var packSection = makeSection('タイポグラフィパック');
        var packSelect = document.createElement('select');
        var noneOpt = document.createElement('option');
        noneOpt.value = '';
        noneOpt.textContent = '-- なし --';
        packSelect.appendChild(noneOpt);

        var packs = vp.getTypographyPacks();
        packs.forEach(function (p) {
          var opt = document.createElement('option');
          opt.value = p.id;
          opt.textContent = p.label;
          if (p.description) opt.title = p.description;
          packSelect.appendChild(opt);
        });

        // 現在のパックを復元
        var currentPackId = vp.getCurrentTypographyPackId();
        if (currentPackId) {
          packSelect.value = currentPackId;
        }

        var packDesc = document.createElement('div');
        packDesc.style.fontSize = '0.8rem';
        packDesc.style.opacity = '0.6';
        packDesc.style.minHeight = '1.2em';
        function updatePackDesc(id) {
          var pack = id ? vp.getTypographyPack(id) : null;
          packDesc.textContent = pack ? pack.description : '';
        }
        updatePackDesc(currentPackId);

        packSelect.addEventListener('change', function () {
          var id = packSelect.value;
          if (id) {
            vp.applyTypographyPack(id);
          } else {
            vp.clearTypographyPack();
          }
          updatePackDesc(id);
          // パック適用後、個別設定UIも同期
          refreshState();
        });

        packSection.appendChild(makeRow('パック選択', packSelect));
        packSection.appendChild(packDesc);
        wrap.appendChild(packSection);

        // パック変更イベントでUI同期
        window.addEventListener('ZenWriterTypographyPackApplied', function (e) {
          if (e.detail && e.detail.packId) {
            packSelect.value = e.detail.packId;
            updatePackDesc(e.detail.packId);
            refreshState();
          }
        });
      }

      el.appendChild(wrap);

      function applyRubySettings() {
        try {
          var sr = parseFloat(rubySizeInput.value);
          var pos = rubyPositionSelect.value;
          var vis = rubyVisibleCheckbox.checked;
          theme.applyRubySettings({ sizeRatio: sr, position: pos, visible: vis });
        } catch (e) {
          console.error('applyRubySettings failed', e);
        }
      }

      function applyMicroSettings() {
        try {
          var ls = parseFloat(letterSpacingInput.value);
          var ps = parseFloat(paragraphSpacingInput.value);
          var pi = parseFloat(paragraphIndentInput.value);
          var lbm = lineBreakSelect.value;
          theme.applyMicroTypographySettings({ letterSpacing: ls, paragraphSpacing: ps, paragraphIndent: pi, lineBreakMode: lbm });
        } catch (e) {
          console.error('applyMicroSettings failed', e);
        }
      }

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

          var latestMicro = latest.microTypography || {};
          letterSpacingInput.value = typeof latestMicro.letterSpacing === 'number' ? latestMicro.letterSpacing : 0;
          letterSpacingLabel.textContent = ((window.UILabels && window.UILabels.LETTER_SPACING_PREFIX) || '字間: ') + letterSpacingInput.value + 'em';

          paragraphSpacingInput.value = typeof latestMicro.paragraphSpacing === 'number' ? latestMicro.paragraphSpacing : 1;
          paragraphSpacingLabel.textContent = ((window.UILabels && window.UILabels.PARAGRAPH_SPACING_PREFIX) || '段落間: ') + paragraphSpacingInput.value + 'em';

          paragraphIndentInput.value = typeof latestMicro.paragraphIndent === 'number' ? latestMicro.paragraphIndent : 0;
          paragraphIndentLabel.textContent = ((window.UILabels && window.UILabels.PARAGRAPH_INDENT_PREFIX) || '字下げ: ') + paragraphIndentInput.value + 'em';

          lineBreakSelect.value = latestMicro.lineBreakMode || 'normal';

          var latestRuby = latest.ruby || {};
          rubySizeInput.value = typeof latestRuby.sizeRatio === 'number' ? latestRuby.sizeRatio : 0.5;
          rubySizeLabel.textContent = 'ルビサイズ: ' + rubySizeInput.value + 'em';
          rubyPositionSelect.value = latestRuby.position || 'over';
          rubyVisibleCheckbox.checked = latestRuby.visible !== false;
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
    groups: ['theme'],
    title: (window.UILabels && window.UILabels.GADGET_TYPOGRAPHY_TITLE) || 'フォント',
    description: 'フォントファミリー、サイズ、行間の設定。'
  });

})();
