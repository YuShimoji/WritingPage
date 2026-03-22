/**
 * gadgets-graphic-novel.js - Graphic Novel ガジェット
 *
 * サイドバー(advancedグループ)にシーン管理UIを表示する。
 * Phase 3: プリセット選択 + キャラ管理 + マークアップ入力。
 */
(function () {
  'use strict';

  var ZWGadgets = window.ZWGadgets;
  if (!ZWGadgets) return;

  var DEMO_JSON = JSON.stringify({
    scenes: [
      {
        name: '1. Dialogue (Window)',
        background: { color: '#0d1117' },
        transition: { type: 'fade', duration: 600 },
        autoAdvance: 'click',
        blocks: [
          {
            text: '\u3053\u3053\u304C\u3001\u50D5\u305F\u3061\u306E\u7269\u8A9E\u306E\u59CB\u307E\u308A\u3060\u3002',
            animator: 'dialogue',
            delay: 0,
            characterId: 'demo-char',
            animatorOptions: { renderer: 'window' }
          }
        ]
      },
      {
        name: '2. Dialogue (Bubble)',
        background: { color: '#1a1a2e' },
        transition: { type: 'fade', duration: 600 },
        autoAdvance: 'click',
        blocks: [
          {
            text: '\u305D\u308C\u306F\u672C\u5F53\u306B\u305D\u3046\u306A\u306E\uFF1F',
            animator: 'dialogue',
            delay: 0,
            characterId: 'demo-char-2',
            position: { x: '40%', y: '35%' },
            animatorOptions: { renderer: 'bubble', tailDirection: 'bottom' }
          },
          {
            text: '\u3042\u3042\u3001\u9593\u9055\u3044\u306A\u3044\u3002',
            animator: 'dialogue',
            delay: 2000,
            characterId: 'demo-char',
            position: { x: '60%', y: '60%' },
            animatorOptions: { renderer: 'bubble', tailDirection: 'top' }
          }
        ]
      },
      {
        name: '3. Dialogue (Chat)',
        background: { color: '#0f0f23' },
        transition: { type: 'slide', duration: 500 },
        autoAdvance: 'click',
        blocks: [
          {
            text: '\u4ECA\u65E5\u306E\u4F5C\u6226\u4F1A\u8B70\u3001\u59CB\u3081\u3088\u3046\u304B\u3002',
            animator: 'dialogue',
            delay: 0,
            characterId: 'demo-char',
            animatorOptions: { renderer: 'icon' }
          },
          {
            text: '\u4E86\u89E3\u3002\u6E96\u5099\u306F\u3067\u304D\u3066\u308B\u3088\u3002',
            animator: 'dialogue',
            delay: 1800,
            characterId: 'demo-char-2',
            animatorOptions: { renderer: 'icon' }
          }
        ]
      },
      {
        name: '4. Tree',
        background: { color: '#0a1628' },
        transition: { type: 'fade', duration: 800 },
        autoAdvance: 'click',
        blocks: [
          {
            text: '\u4E00\u3064\u306E\u7269\u8A9E\u304C\u3002\u679D\u5206\u304B\u308C\u3057\u3066\u3044\u304F\u3002\u3084\u304C\u3066\u305D\u308C\u306F\u3002\u68EE\u306B\u306A\u3063\u305F\u3002',
            animator: 'tree',
            delay: 0,
            speed: 1.0,
            animatorOptions: { direction: 'bottom-up', branchAngle: 25, nodeSpacing: 80 }
          }
        ]
      },
      {
        name: '5. Word Cloud',
        background: { gradient: 'linear-gradient(135deg, #0d1117, #1a1a2e, #16213e)' },
        transition: { type: 'fade', duration: 600 },
        autoAdvance: 'click',
        blocks: [
          {
            text: '\u661F\u3002\u591C\u7A7A\u3002\u5149\u3002\u5E0C\u671B\u3002\u904B\u547D\u3002\u7D46\u3002\u7D04\u675F\u3002\u8A18\u61B6\u3002\u672A\u6765\u3002\u904E\u53BB\u3002\u6C38\u9060\u3002\u4E00\u77AC\u3002',
            animator: 'wordcloud',
            delay: 0,
            speed: 0.8,
            animatorOptions: { tokenize: 'sentence', sizeRange: [16, 48], flowSpeed: 0.6, staggerMs: 250 }
          }
        ]
      },
      {
        name: '6. Anchored Text',
        background: { color: '#1a0a2e' },
        transition: { type: 'slide', duration: 500 },
        autoAdvance: 'click',
        blocks: [
          {
            text: '\u591C\u7A7A\u306B\u661F\u304C\u77AC\u304F\u3002\u4E00\u3064\u3001\u307E\u305F\u4E00\u3064\u3068\u3002',
            animator: 'anchored',
            delay: 0,
            position: { x: '50%', y: '35%' },
            animatorOptions: { textEffect: 'fade', panelStyle: 'glass' }
          },
          {
            text: '\u305D\u306E\u5149\u306F\u3001\u8AB0\u304B\u306E\u7948\u308A\u306E\u3088\u3046\u3060\u3063\u305F\u3002',
            animator: 'anchored',
            delay: 2500,
            position: { x: '50%', y: '65%' },
            animatorOptions: { textEffect: 'typewriter', panelStyle: 'none' }
          }
        ]
      }
    ],
    characters: [
      { id: 'demo-char', name: '\u30E6\u30A6\u30AD', color: '#4a90e2', position: 'left' },
      { id: 'demo-char-2', name: '\u30DF\u30AB', color: '#e24a90', position: 'right' }
    ]
  }, null, 2);

  ZWGadgets.register('GraphicNovel', function (el) {
    var GNEngine = window.GNEngine;
    var GNCore = window.GNCore;
    var GNPresets = window.GNPresets;
    var GNParser = window.GNParser;
    if (!GNEngine || !GNCore) {
      el.textContent = 'GN Engine not loaded';
      return;
    }

    var wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.gap = '0.625rem';

    // --- Preset Section ---
    var presetSection = document.createElement('div');
    presetSection.className = 'gn-gadget-section';

    var presetTitle = document.createElement('div');
    presetTitle.className = 'gn-gadget-section-title';
    presetTitle.textContent = 'Preset';
    presetSection.appendChild(presetTitle);

    var presetRow = document.createElement('div');
    presetRow.style.display = 'flex';
    presetRow.style.gap = '0.375rem';

    var presetSelect = document.createElement('select');
    presetSelect.className = 'gn-select';
    var defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = '-- Select --';
    presetSelect.appendChild(defaultOpt);

    if (GNPresets) {
      var presetNames = GNPresets.list();
      for (var pi = 0; pi < presetNames.length; pi++) {
        var opt = document.createElement('option');
        opt.value = presetNames[pi];
        opt.textContent = presetNames[pi];
        presetSelect.appendChild(opt);
      }
    }

    presetRow.appendChild(presetSelect);

    var presetApplyBtn = document.createElement('button');
    presetApplyBtn.className = 'gn-btn';
    presetApplyBtn.textContent = 'Apply';
    presetRow.appendChild(presetApplyBtn);

    presetSection.appendChild(presetRow);

    var presetTextInput = document.createElement('textarea');
    presetTextInput.className = 'gn-json-input';
    presetTextInput.style.minHeight = '60px';
    presetTextInput.placeholder = 'Enter text for preset...';
    presetSection.appendChild(presetTextInput);

    wrap.appendChild(presetSection);

    // --- Scene List Section ---
    var sceneSection = document.createElement('div');
    sceneSection.className = 'gn-gadget-section';

    var sceneTitle = document.createElement('div');
    sceneTitle.className = 'gn-gadget-section-title';
    sceneTitle.textContent = 'Scenes';
    sceneSection.appendChild(sceneTitle);

    var sceneListEl = document.createElement('div');
    sceneListEl.className = 'gn-scene-list';
    sceneSection.appendChild(sceneListEl);

    wrap.appendChild(sceneSection);

    // --- Character Section ---
    var charSection = document.createElement('div');
    charSection.className = 'gn-gadget-section';

    var charTitle = document.createElement('div');
    charTitle.className = 'gn-gadget-section-title';
    charTitle.textContent = 'Characters';
    charSection.appendChild(charTitle);

    var charListEl = document.createElement('div');
    charListEl.className = 'gn-char-list';
    charSection.appendChild(charListEl);

    var addCharBtn = document.createElement('button');
    addCharBtn.className = 'gn-btn';
    addCharBtn.textContent = '+ Add';
    addCharBtn.style.marginTop = '0.25rem';
    charSection.appendChild(addCharBtn);

    wrap.appendChild(charSection);

    // --- Input Mode Toggle ---
    var inputSection = document.createElement('div');
    inputSection.className = 'gn-gadget-section';

    var inputModeRow = document.createElement('div');
    inputModeRow.style.display = 'flex';
    inputModeRow.style.gap = '0.25rem';
    inputModeRow.style.marginBottom = '0.375rem';

    var jsonModeBtn = document.createElement('button');
    jsonModeBtn.className = 'gn-btn gn-btn--primary';
    jsonModeBtn.textContent = 'JSON';
    jsonModeBtn.style.flex = '1';

    var markupModeBtn = document.createElement('button');
    markupModeBtn.className = 'gn-btn';
    markupModeBtn.textContent = 'Markup';
    markupModeBtn.style.flex = '1';

    inputModeRow.appendChild(jsonModeBtn);
    inputModeRow.appendChild(markupModeBtn);
    inputSection.appendChild(inputModeRow);

    var jsonInput = document.createElement('textarea');
    jsonInput.className = 'gn-json-input';
    jsonInput.placeholder = '{"scenes": [...], "characters": [...]}';
    jsonInput.value = DEMO_JSON;
    inputSection.appendChild(jsonInput);

    var errorEl = document.createElement('div');
    errorEl.className = 'gn-error';
    errorEl.style.display = 'none';
    inputSection.appendChild(errorEl);

    wrap.appendChild(inputSection);

    // --- Action Buttons ---
    var btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.gap = '0.5rem';
    btnRow.style.flexWrap = 'wrap';

    var playBtn = document.createElement('button');
    playBtn.className = 'gn-btn gn-btn--primary';
    playBtn.textContent = '\u25B6 Play';

    var loadBtn = document.createElement('button');
    loadBtn.className = 'gn-btn';
    loadBtn.textContent = 'Load';

    var demoBtn = document.createElement('button');
    demoBtn.className = 'gn-btn';
    demoBtn.textContent = 'Demo';

    btnRow.appendChild(playBtn);
    btnRow.appendChild(loadBtn);
    btnRow.appendChild(demoBtn);
    wrap.appendChild(btnRow);

    el.appendChild(wrap);

    // ============================
    // State
    // ============================
    var currentData = null;
    var inputMode = 'json'; // 'json' | 'markup'
    var characters = GNCore.Storage.loadCharacters() || [];

    // ============================
    // Helpers
    // ============================
    function showError(msg) {
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
    }

    function clearError() {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    }

    function parseInput() {
      clearError();
      var raw = jsonInput.value.trim();
      if (!raw) {
        showError('Input is empty');
        return null;
      }

      if (inputMode === 'markup') {
        if (!GNParser) {
          showError('GNParser not loaded');
          return null;
        }
        try {
          var parsed = GNParser.parse(raw);
          if (!parsed.scenes || parsed.scenes.length === 0) {
            showError('No scenes found in markup');
            return null;
          }
          // ディレクティブ適用
          if (GNPresets) {
            for (var s = 0; s < parsed.scenes.length; s++) {
              var blocks = parsed.scenes[s].blocks || [];
              for (var b = 0; b < blocks.length; b++) {
                if (blocks[b].directives && blocks[b].directives.length > 0) {
                  GNPresets.applyDirectives(blocks[b], blocks[b].directives);
                }
              }
            }
          }
          parsed.characters = characters;
          return parsed;
        } catch (e) {
          showError('Markup parse error: ' + e.message);
          return null;
        }
      }

      // JSON mode
      try {
        var data = JSON.parse(raw);
        if (!data.scenes || !Array.isArray(data.scenes)) {
          showError('"scenes" array is required');
          return null;
        }
        return data;
      } catch (e) {
        showError('Invalid JSON: ' + e.message);
        return null;
      }
    }

    function renderSceneList(data) {
      sceneListEl.innerHTML = '';
      if (!data || !data.scenes) return;

      for (var i = 0; i < data.scenes.length; i++) {
        (function (index, scene) {
          var item = document.createElement('div');
          item.className = 'gn-scene-item';

          var name = document.createElement('span');
          name.className = 'gn-scene-item-name';
          name.textContent = scene.name || ('Scene ' + (index + 1));
          item.appendChild(name);

          var playSceneBtn = document.createElement('button');
          playSceneBtn.className = 'gn-scene-item-play';
          playSceneBtn.textContent = '\u25B6';
          playSceneBtn.title = 'Play from this scene';
          playSceneBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            playFromScene(index);
          });
          item.appendChild(playSceneBtn);

          sceneListEl.appendChild(item);
        })(i, data.scenes[i]);
      }
    }

    function renderCharList() {
      charListEl.innerHTML = '';
      for (var i = 0; i < characters.length; i++) {
        (function (index, ch) {
          var item = document.createElement('div');
          item.className = 'gn-char-item';

          var swatch = document.createElement('span');
          swatch.className = 'gn-char-swatch';
          swatch.style.backgroundColor = ch.color || '#888';
          item.appendChild(swatch);

          var nameEl = document.createElement('span');
          nameEl.className = 'gn-char-name';
          nameEl.textContent = ch.name || ch.id;
          item.appendChild(nameEl);

          var posEl = document.createElement('span');
          posEl.className = 'gn-char-pos';
          posEl.textContent = ch.position || 'left';
          item.appendChild(posEl);

          var removeBtn = document.createElement('button');
          removeBtn.className = 'gn-scene-item-play';
          removeBtn.textContent = '\u00D7';
          removeBtn.title = 'Remove';
          removeBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            characters.splice(index, 1);
            GNCore.Storage.saveCharacters(characters);
            renderCharList();
          });
          item.appendChild(removeBtn);

          charListEl.appendChild(item);
        })(i, characters[i]);
      }
    }

    function loadData(data) {
      currentData = data;
      if (data.characters && Array.isArray(data.characters)) {
        characters = data.characters;
        GNCore.Storage.saveCharacters(characters);
        renderCharList();
      }
      renderSceneList(data);
    }

    function playFromScene(startIndex) {
      if (!currentData || !currentData.scenes) return;
      var scenes = currentData.scenes.slice(startIndex);
      GNEngine.loadScenes(scenes);
      GNEngine.play();
    }

    function setInputMode(mode) {
      inputMode = mode;
      if (mode === 'json') {
        jsonModeBtn.className = 'gn-btn gn-btn--primary';
        markupModeBtn.className = 'gn-btn';
        jsonInput.placeholder = '{"scenes": [...], "characters": [...]}';
      } else {
        jsonModeBtn.className = 'gn-btn';
        markupModeBtn.className = 'gn-btn gn-btn--primary';
        jsonInput.placeholder = ':::gn-scene{preset:"\u5BFE\u8A71\u5287"}\n[gn-dialogue char:"A"]\nText here\n[/gn-dialogue]\n:::';
      }
    }

    function showAddCharDialog() {
      var dialog = document.createElement('div');
      dialog.className = 'gn-char-dialog';

      var fields = [
        { label: 'ID', key: 'id', placeholder: 'char-1' },
        { label: 'Name', key: 'name', placeholder: '\u30E6\u30A6\u30AD' },
        { label: 'Color', key: 'color', placeholder: '#4a90e2', type: 'color' }
      ];

      var inputs = {};
      for (var f = 0; f < fields.length; f++) {
        var row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '0.25rem';
        row.style.alignItems = 'center';
        row.style.marginBottom = '0.25rem';

        var lbl = document.createElement('label');
        lbl.textContent = fields[f].label;
        lbl.style.width = '40px';
        lbl.style.fontSize = '0.75rem';
        row.appendChild(lbl);

        var inp = document.createElement('input');
        inp.className = 'gn-char-input';
        inp.placeholder = fields[f].placeholder;
        if (fields[f].type) inp.type = fields[f].type;
        inp.style.flex = '1';
        row.appendChild(inp);

        inputs[fields[f].key] = inp;
        dialog.appendChild(row);
      }

      // Position select
      var posRow = document.createElement('div');
      posRow.style.display = 'flex';
      posRow.style.gap = '0.25rem';
      posRow.style.alignItems = 'center';
      posRow.style.marginBottom = '0.25rem';

      var posLbl = document.createElement('label');
      posLbl.textContent = 'Pos';
      posLbl.style.width = '40px';
      posLbl.style.fontSize = '0.75rem';
      posRow.appendChild(posLbl);

      var posSelect = document.createElement('select');
      posSelect.className = 'gn-select';
      posSelect.style.flex = '1';
      var positions = ['left', 'right', 'center'];
      for (var p = 0; p < positions.length; p++) {
        var posOpt = document.createElement('option');
        posOpt.value = positions[p];
        posOpt.textContent = positions[p];
        posSelect.appendChild(posOpt);
      }
      posRow.appendChild(posSelect);
      dialog.appendChild(posRow);

      var dialogBtns = document.createElement('div');
      dialogBtns.style.display = 'flex';
      dialogBtns.style.gap = '0.25rem';
      dialogBtns.style.marginTop = '0.375rem';

      var saveBtn = document.createElement('button');
      saveBtn.className = 'gn-btn gn-btn--primary';
      saveBtn.textContent = 'Save';
      saveBtn.addEventListener('click', function () {
        var id = inputs.id.value.trim() || ('char-' + Date.now().toString(36));
        var name = inputs.name.value.trim() || id;
        var color = inputs.color.value || '#4a90e2';
        characters.push({
          id: id,
          name: name,
          color: color,
          position: posSelect.value
        });
        GNCore.Storage.saveCharacters(characters);
        renderCharList();
        dialog.remove();
      });

      var cancelBtn = document.createElement('button');
      cancelBtn.className = 'gn-btn';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.addEventListener('click', function () {
        dialog.remove();
      });

      dialogBtns.appendChild(saveBtn);
      dialogBtns.appendChild(cancelBtn);
      dialog.appendChild(dialogBtns);

      charSection.appendChild(dialog);
    }

    // ============================
    // Event Handlers
    // ============================

    presetApplyBtn.addEventListener('click', function () {
      var presetName = presetSelect.value;
      var text = presetTextInput.value.trim();
      if (!presetName) {
        showError('Select a preset');
        return;
      }
      if (!text) {
        showError('Enter text for preset');
        return;
      }
      if (!GNPresets) {
        showError('GNPresets not loaded');
        return;
      }
      var result = GNPresets.apply(presetName, text, { characters: characters });
      if (!result) {
        showError('Preset failed');
        return;
      }
      if (result.characters) {
        characters = result.characters;
        GNCore.Storage.saveCharacters(characters);
      }
      // JSONに反映
      jsonInput.value = JSON.stringify(result, null, 2);
      setInputMode('json');
      loadData(result);
      clearError();
    });

    jsonModeBtn.addEventListener('click', function () {
      if (inputMode === 'markup' && GNParser && jsonInput.value.trim()) {
        // マークアップからJSONに変換
        var parsed = parseInput();
        if (parsed) {
          jsonInput.value = JSON.stringify(parsed, null, 2);
        }
      }
      setInputMode('json');
    });

    markupModeBtn.addEventListener('click', function () {
      if (inputMode === 'json' && GNParser && jsonInput.value.trim()) {
        // JSONからマークアップに変換
        try {
          var data = JSON.parse(jsonInput.value);
          jsonInput.value = GNParser.toMarkup(data);
        } catch (e) {
          // 変換失敗時はそのまま
        }
      }
      setInputMode('markup');
    });

    loadBtn.addEventListener('click', function () {
      var data = parseInput();
      if (data) {
        loadData(data);
      }
    });

    playBtn.addEventListener('click', function () {
      if (!currentData) {
        var data = parseInput();
        if (!data) return;
        loadData(data);
      }
      playFromScene(0);
    });

    demoBtn.addEventListener('click', function () {
      setInputMode('json');
      jsonInput.value = DEMO_JSON;
      var data = parseInput();
      if (data) {
        loadData(data);
      }
    });

    addCharBtn.addEventListener('click', function () {
      showAddCharDialog();
    });

    jsonInput.addEventListener('input', function () {
      currentData = null;
      clearError();
      sceneListEl.innerHTML = '';
    });

    // ============================
    // Initial Load
    // ============================
    renderCharList();
    var initData = parseInput();
    if (initData) {
      loadData(initData);
    }

  }, { groups: ['advanced'], title: 'Graphic Novel', description: 'グラフィックノベル形式のビジュアルエディタ。コマ割り・演出を設定。' });
})();
