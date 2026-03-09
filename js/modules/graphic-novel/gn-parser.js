/**
 * gn-parser.js - Graphic Novel マークアップパーサー
 *
 * :::gn-scene{...} マークアップをパースしてScene JSONに変換する。
 * 逆変換 (JSON -> マークアップ) もサポート。
 */
(function () {
  'use strict';

  var SCENE_OPEN_RE = /^:::gn-scene\{(.*)\}\s*$/;
  var SCENE_CLOSE_RE = /^:::\s*$/;
  var DIRECTIVE_RE = /^\[指示:\s*(.+)\]\s*$/;
  var BLOCK_OPEN_RE = /^\[gn-(\w+)((?:\s+\w+(?::"[^"]*"|:'[^']*'|:[^\s\]]+))*)\]\s*$/;
  var BLOCK_CLOSE_RE = /^\[\/gn-(\w+)\]\s*$/;

  // ============================
  // Attribute Parser
  // ============================

  function parseAttributes(attrStr) {
    var attrs = {};
    if (!attrStr) return attrs;

    var re = /(\w+):\s*(?:"([^"]*)"|'([^']*)'|([^\s,}]+))/g;
    var match;
    while ((match = re.exec(attrStr)) !== null) {
      var key = match[1];
      var val = match[2] !== undefined ? match[2]
        : match[3] !== undefined ? match[3]
          : match[4];
      // 数値変換
      if (/^\d+(\.\d+)?$/.test(val)) {
        val = parseFloat(val);
      } else if (val === 'true') {
        val = true;
      } else if (val === 'false') {
        val = false;
      }
      attrs[key] = val;
    }
    return attrs;
  }

  // ============================
  // Markup -> JSON
  // ============================

  function parseMarkup(text) {
    var lines = text.split('\n');
    var scenes = [];
    var currentScene = null;
    var currentBlock = null;
    var currentBlockText = [];
    var currentDirectives = [];

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var trimmed = line.trim();

      // シーン開始
      var sceneMatch = trimmed.match(SCENE_OPEN_RE);
      if (sceneMatch) {
        var sceneAttrs = parseAttributes(sceneMatch[1]);
        currentScene = {
          name: sceneAttrs.name || '',
          preset: sceneAttrs.preset || '',
          background: {},
          transition: { type: sceneAttrs.transition || 'fade', duration: sceneAttrs.transitionDuration || 600 },
          autoAdvance: sceneAttrs.autoAdvance || 'click',
          blocks: []
        };
        if (sceneAttrs.bg) {
          if (sceneAttrs.bg.indexOf('gradient') >= 0 || sceneAttrs.bg.indexOf('linear') >= 0) {
            currentScene.background.gradient = sceneAttrs.bg;
          } else {
            currentScene.background.color = sceneAttrs.bg;
          }
        }
        if (sceneAttrs.duration) {
          currentScene.duration = sceneAttrs.duration;
        }
        currentDirectives = [];
        continue;
      }

      // シーン終了
      if (SCENE_CLOSE_RE.test(trimmed) && currentScene) {
        // プリセットが指定されていて blocks が空の場合、
        // 残りのテキストをプリセットで処理
        if (currentScene.preset && currentScene.blocks.length === 0 && currentBlockText.length > 0) {
          var presetText = currentBlockText.join('\n');
          currentBlockText = [];
          var GNPresets = window.GNPresets;
          if (GNPresets) {
            var presetResult = GNPresets.apply(currentScene.preset, presetText);
            if (presetResult && presetResult.scenes) {
              for (var p = 0; p < presetResult.scenes.length; p++) {
                scenes.push(presetResult.scenes[p]);
              }
              currentScene = null;
              continue;
            }
          }
        }

        // 未閉じのブロックテキストがあればフリーテキストとして追加
        if (currentBlockText.length > 0) {
          currentScene.blocks.push({
            text: currentBlockText.join('\n'),
            animator: 'anchored',
            delay: currentScene.blocks.length * 1000,
            position: { x: '50%', y: '50%' },
            animatorOptions: { textEffect: 'fade', panelStyle: 'none' },
            directives: currentDirectives.slice()
          });
          currentBlockText = [];
        }

        scenes.push(currentScene);
        currentScene = null;
        currentDirectives = [];
        continue;
      }

      if (!currentScene) continue;

      // ディレクティブ
      var directiveMatch = trimmed.match(DIRECTIVE_RE);
      if (directiveMatch) {
        var keywords = directiveMatch[1].split(/[,、]/).map(function (k) { return k.trim(); });
        currentDirectives = currentDirectives.concat(keywords);
        continue;
      }

      // ブロック開始タグ
      var blockOpenMatch = trimmed.match(BLOCK_OPEN_RE);
      if (blockOpenMatch) {
        // 直前のフリーテキストがあれば確定
        if (currentBlockText.length > 0) {
          currentScene.blocks.push({
            text: currentBlockText.join('\n'),
            animator: 'anchored',
            delay: currentScene.blocks.length * 1000,
            position: { x: '50%', y: '50%' },
            animatorOptions: { textEffect: 'fade', panelStyle: 'none' },
            directives: currentDirectives.slice()
          });
          currentBlockText = [];
          currentDirectives = [];
        }

        var blockType = blockOpenMatch[1];
        var blockAttrs = parseAttributes(blockOpenMatch[2]);
        currentBlock = {
          type: blockType,
          attrs: blockAttrs,
          lines: []
        };
        continue;
      }

      // ブロック終了タグ
      var blockCloseMatch = trimmed.match(BLOCK_CLOSE_RE);
      if (blockCloseMatch && currentBlock && blockCloseMatch[1] === currentBlock.type) {
        var block = buildBlock(currentBlock, currentScene.blocks.length, currentDirectives);
        currentScene.blocks.push(block);
        currentBlock = null;
        currentDirectives = [];
        continue;
      }

      // テキスト行
      if (currentBlock) {
        currentBlock.lines.push(line);
      } else if (trimmed) {
        currentBlockText.push(trimmed);
      }
    }

    return { scenes: scenes };
  }

  function buildBlock(blockDef, index, blockDirectives) {
    var text = blockDef.lines.join('\n').trim();
    var attrs = blockDef.attrs;
    var block = {
      text: text,
      delay: index * 1000,
      directives: blockDirectives.slice()
    };

    switch (blockDef.type) {
    case 'dialogue':
      block.animator = 'dialogue';
      if (attrs.char) block.characterId = attrs.char;
      block.animatorOptions = { renderer: attrs.renderer || 'window' };
      break;
    case 'anchored':
      block.animator = 'anchored';
      if (attrs.pos) {
        var posParts = attrs.pos.split(',');
        block.position = { x: posParts[0].trim(), y: (posParts[1] || '50%').trim() };
      }
      block.animatorOptions = {
        textEffect: attrs.effect || 'fade',
        panelStyle: attrs.panel || 'none'
      };
      break;
    case 'tree':
      block.animator = 'tree';
      if (attrs.speed) block.speed = attrs.speed;
      block.animatorOptions = {
        direction: attrs.direction || 'bottom-up',
        branchAngle: attrs.branchAngle || 25,
        nodeSpacing: attrs.nodeSpacing || 80
      };
      break;
    case 'wordcloud':
      block.animator = 'wordcloud';
      if (attrs.speed) block.speed = attrs.speed;
      block.animatorOptions = {
        tokenize: attrs.tokenize || 'sentence',
        sizeRange: [attrs.minSize || 16, attrs.maxSize || 48],
        flowSpeed: attrs.flowSpeed || 0.6,
        staggerMs: attrs.stagger || 250
      };
      break;
    case 'bubble':
      block.animator = 'dialogue';
      if (attrs.char) block.characterId = attrs.char;
      if (attrs.pos) {
        var bubblePos = attrs.pos.split(',');
        block.position = { x: bubblePos[0].trim(), y: (bubblePos[1] || '40%').trim() };
      }
      block.animatorOptions = {
        renderer: 'bubble',
        tailDirection: attrs.tail || 'bottom'
      };
      break;
    default:
      block.animator = blockDef.type;
      block.animatorOptions = {};
      break;
    }

    if (attrs.delay != null) block.delay = attrs.delay;

    return block;
  }

  // ============================
  // JSON -> Markup
  // ============================

  function toMarkup(data) {
    var lines = [];
    var scenes = data.scenes || [];

    for (var i = 0; i < scenes.length; i++) {
      var scene = scenes[i];
      var sceneAttrs = [];
      if (scene.name) sceneAttrs.push('name:"' + scene.name + '"');
      if (scene.preset) sceneAttrs.push('preset:"' + scene.preset + '"');
      if (scene.background) {
        if (scene.background.color) sceneAttrs.push('bg:"' + scene.background.color + '"');
        else if (scene.background.gradient) sceneAttrs.push('bg:"' + scene.background.gradient + '"');
      }
      if (scene.transition && scene.transition.type !== 'fade') {
        sceneAttrs.push('transition:"' + scene.transition.type + '"');
      }
      if (scene.autoAdvance && scene.autoAdvance !== 'click') {
        sceneAttrs.push('autoAdvance:"' + scene.autoAdvance + '"');
      }

      lines.push(':::gn-scene{' + sceneAttrs.join(', ') + '}');

      var blocks = scene.blocks || [];
      for (var j = 0; j < blocks.length; j++) {
        var block = blocks[j];

        // ディレクティブ出力
        if (block.directives && block.directives.length > 0) {
          lines.push('[指示: ' + block.directives.join(', ') + ']');
        }

        var blockAttrs = [];
        var tagName = block.animator || 'anchored';
        var opts = block.animatorOptions || {};

        switch (tagName) {
        case 'dialogue':
          if (opts.renderer === 'bubble') {
            tagName = 'bubble';
            if (block.characterId) blockAttrs.push('char:"' + block.characterId + '"');
            if (block.position) blockAttrs.push('pos:"' + block.position.x + ',' + block.position.y + '"');
            if (opts.tailDirection) blockAttrs.push('tail:"' + opts.tailDirection + '"');
          } else {
            if (block.characterId) blockAttrs.push('char:"' + block.characterId + '"');
            if (opts.renderer && opts.renderer !== 'window') blockAttrs.push('renderer:"' + opts.renderer + '"');
          }
          break;
        case 'anchored':
          if (block.position) blockAttrs.push('pos:"' + block.position.x + ',' + block.position.y + '"');
          if (opts.textEffect) blockAttrs.push('effect:"' + opts.textEffect + '"');
          if (opts.panelStyle && opts.panelStyle !== 'none') blockAttrs.push('panel:"' + opts.panelStyle + '"');
          break;
        case 'tree':
          if (block.speed != null) blockAttrs.push('speed:' + block.speed);
          break;
        case 'wordcloud':
          if (block.speed != null) blockAttrs.push('speed:' + block.speed);
          if (opts.tokenize) blockAttrs.push('tokenize:"' + opts.tokenize + '"');
          break;
        }

        if (block.delay > 0) blockAttrs.push('delay:' + block.delay);

        lines.push('[gn-' + tagName + (blockAttrs.length ? ' ' + blockAttrs.join(' ') : '') + ']');
        lines.push(block.text || '');
        lines.push('[/gn-' + tagName + ']');
        lines.push('');
      }

      lines.push(':::');
      lines.push('');
    }

    return lines.join('\n').trim();
  }

  // ============================
  // Export
  // ============================
  window.GNParser = {
    parse: parseMarkup,
    toMarkup: toMarkup
  };
})();
