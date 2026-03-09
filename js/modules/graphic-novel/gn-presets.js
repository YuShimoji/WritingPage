/**
 * gn-presets.js - Graphic Novel プリセット + ディレクティブ
 *
 * 名前付きプリセット8種: 雰囲気で選ぶだけでシーンが生成される。
 * ディレクティブ12種: [指示: キーワード] でブロック単位の微調整。
 */
(function () {
  'use strict';

  var presets = {};
  var directives = {};

  // ============================
  // Preset Registry
  // ============================

  function registerPreset(name, generator) {
    presets[name] = generator;
  }

  function applyPreset(name, text, options) {
    var gen = presets[name];
    if (!gen) return null;
    return gen(text, options || {});
  }

  function listPresets() {
    return Object.keys(presets);
  }

  // ============================
  // Directive Registry
  // ============================

  function registerDirective(keyword, handler) {
    directives[keyword] = handler;
  }

  function applyDirectives(block, directiveList) {
    if (!directiveList || !Array.isArray(directiveList)) return block;
    for (var i = 0; i < directiveList.length; i++) {
      var d = directiveList[i].trim();
      if (directives[d]) {
        directives[d](block);
      }
    }
    return block;
  }

  // ============================
  // 8 Named Presets
  // ============================

  // 1. 映画予告風 - 暗背景 + fade-in テキスト + 緊張感のある間
  registerPreset('映画予告風', function (text, opts) {
    var lines = text.split(/\n+/).filter(function (l) { return l.trim(); });
    var blocks = [];
    for (var i = 0; i < lines.length; i++) {
      blocks.push({
        text: lines[i].trim(),
        animator: 'anchored',
        delay: i * 3000,
        position: { x: '50%', y: '45%' },
        animatorOptions: { textEffect: 'fade', panelStyle: 'none' }
      });
    }
    return {
      scenes: [{
        name: opts.name || '映画予告風',
        background: { color: '#0a0a0a' },
        transition: { type: 'fade', duration: 800 },
        autoAdvance: 'timer',
        duration: lines.length * 3000 + 2000,
        blocks: blocks
      }]
    };
  });

  // 2. 桜散る - 柔らかい背景 + ワードクラウドが散る演出
  registerPreset('桜散る', function (text, opts) {
    return {
      scenes: [{
        name: opts.name || '桜散る',
        background: { gradient: 'linear-gradient(180deg, #fce4ec, #f8bbd0, #f48fb1)' },
        transition: { type: 'fade', duration: 1000 },
        autoAdvance: 'click',
        blocks: [{
          text: text,
          animator: 'wordcloud',
          delay: 0,
          speed: 0.5,
          animatorOptions: {
            tokenize: 'sentence',
            sizeRange: [14, 36],
            flowSpeed: 0.3,
            staggerMs: 400
          }
        }]
      }]
    };
  });

  // 3. 嵐の夜 - 暗い背景 + 激しい流動
  registerPreset('嵐の夜', function (text, opts) {
    var lines = text.split(/\n+/).filter(function (l) { return l.trim(); });
    var blocks = [];
    if (lines.length > 1) {
      blocks.push({
        text: lines.slice(1).join('\u3002'),
        animator: 'wordcloud',
        delay: 0,
        speed: 2.0,
        animatorOptions: {
          tokenize: 'sentence',
          sizeRange: [12, 28],
          flowSpeed: 1.5,
          staggerMs: 100
        }
      });
    }
    blocks.push({
      text: lines[0] || text,
      animator: 'anchored',
      delay: 500,
      position: { x: '50%', y: '50%' },
      animatorOptions: { textEffect: 'typewriter', panelStyle: 'glass' }
    });
    return {
      scenes: [{
        name: opts.name || '嵐の夜',
        background: { color: '#0d0d1a', gradient: 'linear-gradient(135deg, #0d0d1a, #1a0a2e, #0a1628)' },
        transition: { type: 'cut' },
        autoAdvance: 'click',
        blocks: blocks
      }]
    };
  });

  // 4. 樹の開花 - テキストが樹のように枝分かれして成長
  registerPreset('樹の開花', function (text, opts) {
    return {
      scenes: [{
        name: opts.name || '樹の開花',
        background: { color: '#0a1628' },
        transition: { type: 'fade', duration: 800 },
        autoAdvance: 'click',
        blocks: [{
          text: text,
          animator: 'tree',
          delay: 0,
          speed: 1.0,
          animatorOptions: { direction: 'bottom-up', branchAngle: 25, nodeSpacing: 80 }
        }]
      }]
    };
  });

  // 5. 対話劇 - キャラクター対話シーン (ウィンドウ形式)
  registerPreset('対話劇', function (text, opts) {
    var lines = text.split(/\n+/).filter(function (l) { return l.trim(); });
    var chars = opts.characters || [
      { id: 'char-a', name: 'A', color: '#4a90e2', position: 'left' },
      { id: 'char-b', name: 'B', color: '#e24a90', position: 'right' }
    ];
    var blocks = [];
    for (var i = 0; i < lines.length; i++) {
      var charIdx = i % chars.length;
      blocks.push({
        text: lines[i].trim(),
        animator: 'dialogue',
        delay: i * 2500,
        characterId: chars[charIdx].id,
        animatorOptions: { renderer: 'window' }
      });
    }
    return {
      scenes: [{
        name: opts.name || '対話劇',
        background: { color: '#1a1a2e' },
        transition: { type: 'fade', duration: 600 },
        autoAdvance: 'click',
        blocks: blocks
      }],
      characters: chars
    };
  });

  // 6. チャット - LINE風対話
  registerPreset('チャット', function (text, opts) {
    var lines = text.split(/\n+/).filter(function (l) { return l.trim(); });
    var chars = opts.characters || [
      { id: 'char-a', name: 'A', color: '#4a90e2', position: 'left' },
      { id: 'char-b', name: 'B', color: '#e24a90', position: 'right' }
    ];
    var blocks = [];
    for (var i = 0; i < lines.length; i++) {
      var charIdx = i % chars.length;
      blocks.push({
        text: lines[i].trim(),
        animator: 'dialogue',
        delay: i * 1800,
        characterId: chars[charIdx].id,
        animatorOptions: { renderer: 'icon' }
      });
    }
    return {
      scenes: [{
        name: opts.name || 'チャット',
        background: { color: '#0f0f23' },
        transition: { type: 'slide', duration: 500 },
        autoAdvance: 'click',
        blocks: blocks
      }],
      characters: chars
    };
  });

  // 7. 独白 - 中央配置 + ゆっくりfade
  registerPreset('独白', function (text, opts) {
    return {
      scenes: [{
        name: opts.name || '独白',
        background: { color: '#0d1117' },
        transition: { type: 'fade', duration: 1200 },
        autoAdvance: 'click',
        blocks: [{
          text: text,
          animator: 'anchored',
          delay: 0,
          speed: 0.6,
          position: { x: '50%', y: '50%' },
          animatorOptions: { textEffect: 'typewriter', panelStyle: 'none' }
        }]
      }]
    };
  });

  // 8. 回想 - セピア調背景 + ぼかし + スライド
  registerPreset('回想', function (text, opts) {
    var lines = text.split(/\n+/).filter(function (l) { return l.trim(); });
    var scenes = [];
    for (var i = 0; i < lines.length; i++) {
      scenes.push({
        name: (opts.name || '回想') + ' (' + (i + 1) + ')',
        background: {
          color: '#2e1f0a',
          gradient: 'linear-gradient(135deg, #2e1f0a, #3d2b1a, #1a1408)',
          blur: 3
        },
        transition: { type: 'slide', duration: 800 },
        autoAdvance: 'click',
        blocks: [{
          text: lines[i].trim(),
          animator: 'anchored',
          delay: 0,
          speed: 0.7,
          position: { x: '50%', y: '45%' },
          animatorOptions: { textEffect: 'fade', panelStyle: 'glass' }
        }]
      });
    }
    return { scenes: scenes };
  });

  // ============================
  // 12 Directives
  // ============================

  registerDirective('ゆっくり', function (block) {
    block.speed = 0.5;
  });

  registerDirective('速く', function (block) {
    block.speed = 2.0;
  });

  registerDirective('右から左へ', function (block) {
    if (!block.animatorOptions) block.animatorOptions = {};
    block.animatorOptions.flowDirection = 'rtl';
  });

  registerDirective('左から右へ', function (block) {
    if (!block.animatorOptions) block.animatorOptions = {};
    block.animatorOptions.flowDirection = 'ltr';
  });

  registerDirective('下から上へ', function (block) {
    if (!block.animatorOptions) block.animatorOptions = {};
    block.animatorOptions.flowDirection = 'btu';
  });

  registerDirective('上から下へ', function (block) {
    if (!block.animatorOptions) block.animatorOptions = {};
    block.animatorOptions.flowDirection = 'ttb';
  });

  registerDirective('バウンス', function (block) {
    if (!block.animatorOptions) block.animatorOptions = {};
    block.animatorOptions.textEffect = 'bounce';
  });

  registerDirective('タイプライター', function (block) {
    if (!block.animatorOptions) block.animatorOptions = {};
    block.animatorOptions.textEffect = 'typewriter';
  });

  registerDirective('フェード', function (block) {
    if (!block.animatorOptions) block.animatorOptions = {};
    block.animatorOptions.textEffect = 'fade';
  });

  registerDirective('中央固定', function (block) {
    block.position = { x: '50%', y: '50%' };
  });

  registerDirective('背景として', function (block) {
    if (!block.animatorOptions) block.animatorOptions = {};
    block.animatorOptions.panelStyle = 'none';
    if (!block.style) block.style = {};
    block.style.opacity = 0.3;
  });

  registerDirective('ガラス', function (block) {
    if (!block.animatorOptions) block.animatorOptions = {};
    block.animatorOptions.panelStyle = 'glass';
  });

  // ============================
  // Export
  // ============================
  window.GNPresets = {
    register: registerPreset,
    apply: applyPreset,
    list: listPresets,
    registerDirective: registerDirective,
    applyDirectives: applyDirectives
  };
})();
