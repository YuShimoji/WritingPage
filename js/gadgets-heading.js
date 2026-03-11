/**
 * gadgets-heading.js
 * 見出しタイポグラフィ設定ガジェット (SP-058 Phase 2)
 * 責務: 見出しプリセット選択、ミニプレビュー、H1-H3 個別調整
 */
(function () {
  'use strict';

  var utils = window.ZWGadgetsUtils;
  var ZWGadgets = window.ZWGadgets;
  if (!utils || !ZWGadgets) return;

  ZWGadgets.register('HeadingStyles', function (el) {
    try {
      var theme = window.ZenWriterTheme;
      var storage = window.ZenWriterStorage;
      var registry = window.HeadingPresetRegistry;
      if (!theme || !storage || !registry) {
        var warn = document.createElement('p');
        warn.textContent = '見出し設定を読み込めません。';
        warn.style.opacity = '0.7';
        warn.style.fontSize = '0.9rem';
        el.appendChild(warn);
        return;
      }

      var settings = storage.loadSettings() || {};
      var headingSettings = settings.heading || { preset: 'default', custom: {} };

      var wrap = document.createElement('div');
      wrap.className = 'gadget-heading-styles';
      wrap.style.display = 'flex';
      wrap.style.flexDirection = 'column';
      wrap.style.gap = '12px';

      function makeSection(title) {
        var section = document.createElement('div');
        section.className = 'heading-section';
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

      // --- セクション1: プリセット選択 ---
      var presetSection = makeSection('プリセット');
      var presetSelect = document.createElement('select');
      presetSelect.id = 'heading-preset-select';
      var presets = registry.listPresets();
      presets.forEach(function (p) {
        var opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.label;
        presetSelect.appendChild(opt);
      });
      presetSelect.value = headingSettings.preset || 'default';
      presetSelect.addEventListener('change', function () {
        currentCustom = {};
        applyAndRefreshUI();
      });
      presetSection.appendChild(presetSelect);

      // --- セクション2: ミニプレビュー ---
      var previewBox = document.createElement('div');
      previewBox.className = 'heading-preview';
      previewBox.style.background = 'rgba(128,128,128,0.08)';
      previewBox.style.borderRadius = '6px';
      previewBox.style.padding = '8px 10px';
      previewBox.style.display = 'flex';
      previewBox.style.flexDirection = 'column';
      previewBox.style.gap = '2px';

      var previewLines = {};
      ['h1', 'h2', 'h3'].forEach(function (level) {
        var line = document.createElement('div');
        line.style.fontWeight = 'bold';
        line.style.lineHeight = '1.3';
        line.style.whiteSpace = 'nowrap';
        line.style.overflow = 'hidden';
        line.style.textOverflow = 'ellipsis';
        line.textContent = level.toUpperCase() + ' 見出しサンプル';
        previewBox.appendChild(line);
        previewLines[level] = line;
      });
      presetSection.appendChild(previewBox);
      wrap.appendChild(presetSection);

      // --- セクション3: H1-H3 個別調整 ---
      var DETAIL_LEVELS = ['h1', 'h2', 'h3'];
      var LEVEL_LABELS = { h1: '見出し1', h2: '見出し2', h3: '見出し3' };
      var WEIGHT_OPTIONS = [
        { value: 'normal', label: '標準' },
        { value: '500', label: '中太' },
        { value: '600', label: 'やや太' },
        { value: 'bold', label: '太字' },
        { value: '800', label: '極太' },
        { value: '900', label: '最太' }
      ];

      var currentCustom = headingSettings.custom && typeof headingSettings.custom === 'object'
        ? JSON.parse(JSON.stringify(headingSettings.custom))
        : {};
      var levelControls = {};

      var adjustSection = makeSection('個別調整');

      DETAIL_LEVELS.forEach(function (level) {
        var levelWrap = document.createElement('div');
        levelWrap.style.display = 'flex';
        levelWrap.style.flexDirection = 'column';
        levelWrap.style.gap = '4px';
        levelWrap.style.paddingTop = '4px';
        if (level !== 'h1') {
          levelWrap.style.borderTop = '1px solid var(--border-color)';
          levelWrap.style.marginTop = '4px';
        }

        var levelLabel = document.createElement('div');
        levelLabel.style.fontSize = '0.85rem';
        levelLabel.style.fontWeight = '600';
        levelLabel.textContent = LEVEL_LABELS[level];
        levelWrap.appendChild(levelLabel);

        // size slider
        var sizeRow = document.createElement('div');
        sizeRow.style.display = 'flex';
        sizeRow.style.flexDirection = 'column';
        sizeRow.style.gap = '2px';

        var sizeLabel = document.createElement('div');
        sizeLabel.style.fontSize = '0.8rem';
        sizeLabel.style.opacity = '0.8';

        var sizeInput = document.createElement('input');
        sizeInput.type = 'range';
        sizeInput.min = '0.8';
        sizeInput.max = '3';
        sizeInput.step = '0.05';
        sizeInput.setAttribute('data-level', level);
        sizeInput.setAttribute('data-prop', 'size');

        sizeInput.addEventListener('input', function () {
          sizeLabel.textContent = 'サイズ: ' + sizeInput.value + 'em';
          onCustomChange(level, 'size', sizeInput.value + 'em');
        });

        sizeRow.appendChild(sizeLabel);
        sizeRow.appendChild(sizeInput);
        levelWrap.appendChild(sizeRow);

        // weight select
        var weightRow = document.createElement('div');
        weightRow.style.display = 'flex';
        weightRow.style.alignItems = 'center';
        weightRow.style.gap = '6px';

        var weightLabel = document.createElement('span');
        weightLabel.style.fontSize = '0.8rem';
        weightLabel.style.opacity = '0.8';
        weightLabel.style.minWidth = '32px';
        weightLabel.textContent = '太さ:';

        var weightSelect = document.createElement('select');
        weightSelect.setAttribute('data-level', level);
        weightSelect.setAttribute('data-prop', 'weight');
        weightSelect.style.flex = '1';
        WEIGHT_OPTIONS.forEach(function (w) {
          var opt = document.createElement('option');
          opt.value = w.value;
          opt.textContent = w.label;
          weightSelect.appendChild(opt);
        });

        weightSelect.addEventListener('change', function () {
          onCustomChange(level, 'weight', weightSelect.value);
        });

        weightRow.appendChild(weightLabel);
        weightRow.appendChild(weightSelect);
        levelWrap.appendChild(weightRow);

        adjustSection.appendChild(levelWrap);
        levelControls[level] = { sizeInput: sizeInput, sizeLabel: sizeLabel, weightSelect: weightSelect };
      });

      // リセットボタン
      var resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.className = 'small';
      resetBtn.id = 'heading-reset-btn';
      resetBtn.textContent = 'プリセットに戻す';
      resetBtn.addEventListener('click', function () {
        currentCustom = {};
        applyAndRefreshUI();
      });
      adjustSection.appendChild(resetBtn);

      wrap.appendChild(adjustSection);
      el.appendChild(wrap);

      // --- 内部関数 ---

      function getMergedValues() {
        var presetId = presetSelect.value || 'default';
        var presetValues = registry.getValues(presetId);
        var merged = {};
        DETAIL_LEVELS.forEach(function (level) {
          var base = presetValues[level] || {};
          var custom = currentCustom[level] || {};
          merged[level] = Object.assign({}, base, custom);
        });
        return merged;
      }

      function updatePreview() {
        var merged = getMergedValues();
        DETAIL_LEVELS.forEach(function (level) {
          var line = previewLines[level];
          if (!line) return;
          var val = merged[level] || {};
          line.style.fontSize = val.size || '1em';
          line.style.fontWeight = val.weight || 'bold';
          line.style.letterSpacing = val.letterSpacing || '0em';
        });
      }

      function updateControls() {
        var merged = getMergedValues();
        DETAIL_LEVELS.forEach(function (level) {
          var ctrl = levelControls[level];
          if (!ctrl) return;
          var val = merged[level] || {};
          var sizeNum = parseFloat(val.size) || 1;
          ctrl.sizeInput.value = sizeNum;
          ctrl.sizeLabel.textContent = 'サイズ: ' + sizeNum + 'em';
          ctrl.weightSelect.value = val.weight || 'bold';
        });
      }

      function onCustomChange(level, prop, value) {
        if (!currentCustom[level]) currentCustom[level] = {};
        currentCustom[level][prop] = value;
        applyAndRefreshUI();
      }

      function applyAndRefreshUI() {
        try {
          theme.applyHeadingSettings(presetSelect.value, currentCustom);
        } catch (e) {
          console.error('applyHeadingSettings failed', e);
        }
        updatePreview();
        updateControls();
      }

      function refreshState() {
        try {
          var latest = storage.loadSettings();
          if (!latest || !latest.heading) return;
          presetSelect.value = latest.heading.preset || 'default';
          currentCustom = latest.heading.custom && typeof latest.heading.custom === 'object'
            ? JSON.parse(JSON.stringify(latest.heading.custom))
            : {};
          updatePreview();
          updateControls();
        } catch (e) {
          console.error('refreshState failed', e);
        }
      }

      // 初期描画
      updatePreview();
      updateControls();

      window.addEventListener('ZWLoadoutsChanged', refreshState);
      window.addEventListener('ZWLoadoutApplied', refreshState);
      window.addEventListener('ZenWriterSettingsChanged', refreshState);

    } catch (e) {
      console.error('HeadingStyles gadget failed:', e);
      try {
        el.textContent = '見出しスタイルガジェットの初期化に失敗しました。';
      } catch (_) { }
    }
  }, {
    groups: ['theme'],
    title: '見出しスタイル',
    description: '見出しプリセット選択とH1-H3の個別サイズ・太さ調整。'
  });

})();
