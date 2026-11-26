/**
 * NarrativeScreenBridge
 * Zen Writer <-> NarrativeGen hand-off and screen compatibility.
 *
 * - projectToContract / contractToProject: chapter pages <-> the NarrativeGen
 *   hand-off envelope (SP-WP-001 `wp-ng-0.2`: nodes with text, speaker, choices).
 * - framesToMarkdown: NarrativeGen screen frames (SP-SCREEN-001) -> Markdown that
 *   the Reader shows like the NarrativeGen Studio window and the Unity chat
 *   (speaker bubbles on the left, the player's choice on the right).
 *
 * Specs live in NarrativeGen: docs/specs/writingpage-io-contract.md and
 * docs/specs/screen-frame.md. Pure functions; no DOM or storage access.
 */
(function (root) {
  'use strict';

  var CONTRACT_VERSION = 'wp-ng-0.2';
  var FRAME_FORMAT = 'narrativegen-screen-frame';
  var FRAME_VERSION = 1;

  var Parser = root && root.TextboxDslParser;
  if (!Parser && typeof require === 'function') {
    Parser = require('../editor/TextboxDslParser.js');
  }

  var CHOICE_LINK = /^\s*(?:[-*+]\s+|\d+\.\s+)?\[([^\]]+)\]\(chapter:\/\/([^)\s]+)\)\s*$/;
  var DECOR_TAG = /\[\/?(?:bold|italic|underline|strike|smallcaps|light|shadow|black|uppercase|lowercase|capitalize|outline|glow|wide|narrow|fade|slide|type|pulse|shake|bounce|fadein|wave|sparkle|cosmic|fire|glitch)\]/g;

  // Same rule as chapter-nav.js so links resolve to the chapter the Reader would open.
  function slugify(str) {
    return (str || '').toLowerCase().trim()
      .replace(/[\s_]+/g, '-')
      .replace(/[^\w　-鿿豈-﫿一-龯-]/g, '');
  }

  function warn(list, message) { list.push(message); }

  /**
   * Zen Writer inline markup -> envelope text. Ruby `{漢字|かんじ}` becomes
   * `|漢字《かんじ》` (also Zen Writer syntax, and free of NarrativeGen `{…}`),
   * kenten and wikilinks keep their visible text, decoration tags are dropped.
   */
  function toContractText(text, warnings, where) {
    var src = String(text || '');
    var out = src
      .replace(/\{kenten\|([^{}]+)\}/g, '$1')
      .replace(/\{([^{}|]+)\|([^{}|]+)\}/g, '|$1《$2》')
      .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
      .replace(/\[\[([^\]]+)\]\]/g, '$1');
    var stripped = out.replace(DECOR_TAG, '');
    if (stripped !== out && warnings) warn(warnings, where + ': 装飾タグは渡らないため外しました');
    return stripped;
  }

  function paragraphs(text) {
    return String(text || '').split(/\n\s*\n/).map(function (p) { return p.trim(); }).filter(Boolean);
  }

  function pageNodeId(page, index) {
    var meta = page && page.metadata && page.metadata.narrativegen;
    if (meta && typeof meta.nodeId === 'string' && meta.nodeId) return meta.nodeId;
    if (page && typeof page.title === 'string' && page.title.trim()) return page.title.trim();
    return 'page-' + (index + 1);
  }

  /**
   * zenwriter-v1 project (exportProjectJSON) -> wp-ng-0.2 input envelope.
   * Visible pages become nodes in page order; the first is the start.
   * `:::zw-dialog{speaker}` gives the speaker, `[text](chapter://章)` lines give choices.
   * @returns {{envelope: object, warnings: string[]}}
   */
  function projectToContract(project) {
    if (!project || typeof project !== 'object') throw new Error('プロジェクトがオブジェクトではありません');
    if (typeof project.format === 'string' && project.format.indexOf('zenwriter-') !== 0) {
      throw new Error('Zen Writer のプロジェクトではありません: ' + project.format);
    }
    var warnings = [];
    var pages = (Array.isArray(project.pages) ? project.pages.slice() : [])
      .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    var visible = pages.filter(function (p) {
      var shown = !p.visibility || p.visibility === 'visible';
      if (!shown) warn(warnings, pageNodeId(p, 0) + ': 非表示の章は渡しません');
      return shown;
    });
    if (!visible.length) throw new Error('表示する章がありません');

    var ids = visible.map(pageNodeId);
    var bySlug = Object.create(null);
    var seen = Object.create(null);
    ids.forEach(function (id, i) {
      if (seen[id]) throw new Error('nodeId ' + id + ' が重複しています（章名を変えるか metadata.narrativegen.nodeId を付けてください）');
      seen[id] = true;
      var slug = slugify(visible[i].title || id);
      if (bySlug[slug] && bySlug[slug] !== id) warn(warnings, id + ': 章名のslugが ' + bySlug[slug] + ' と同じため、リンクは先の章へ向きます');
      if (!bySlug[slug]) bySlug[slug] = id;
      if (visible[i].id) bySlug['id:' + visible[i].id] = id;
    });

    function resolveTarget(raw, where) {
      var decoded = raw;
      try { decoded = decodeURIComponent(raw); } catch (_e) { /* keep raw */ }
      decoded = decoded.replace(/#style=\w+$/, '');
      if (seen[decoded]) return decoded;
      var bySlugId = bySlug[slugify(decoded)] || bySlug['id:' + decoded];
      if (bySlugId) return bySlugId;
      warn(warnings, where + ': リンク先の章 ' + decoded + ' が見つからないため選択肢にしません');
      return null;
    }

    var nodes = visible.map(function (page, index) {
      var nodeId = ids[index];
      var speaker = '';
      var texts = [];
      var choices = [];
      Parser.parseSegments(page.content || '').forEach(function (seg) {
        if (seg.type === 'text') {
          var rest = [];
          String(seg.value).split(/\r?\n/).forEach(function (line) {
            var m = CHOICE_LINK.exec(line);
            if (m) {
              var target = resolveTarget(m[2], nodeId);
              if (target) choices.push({ text: toContractText(m[1], warnings, nodeId), target: target });
            } else {
              rest.push(line);
            }
          });
          var prose = rest.join('\n').trim();
          if (prose) texts.push(prose);
          return;
        }
        var content = String(seg.content || '').trim();
        if (seg.type === 'dialog' && seg.attrs && seg.attrs.speaker) {
          if (!speaker) speaker = seg.attrs.speaker;
          else if (speaker !== seg.attrs.speaker) warn(warnings, nodeId + ': 話者が複数あります。先の ' + speaker + ' を場面の話者にします');
        }
        if (content) texts.push(content);
      });
      var node = { nodeId: nodeId, text: toContractText(texts.join('\n\n'), warnings, nodeId) };
      if (speaker) node.speaker = speaker;
      if (choices.length) node.choices = choices;
      return node;
    });

    var sourceId = (project.document && project.document.id) || (project.document && project.document.name) || 'zenwriter-document';
    return { envelope: { contractVersion: CONTRACT_VERSION, sourceDocumentId: String(sourceId), nodes: nodes }, warnings: warnings };
  }

  function attrValue(value) {
    // parseAttrs splits on "," and stops at "}"; it does not unescape quotes.
    return String(value || '').replace(/"/g, '”').replace(/,/g, '，').replace(/}/g, '｝');
  }

  function dialog(speaker, text, position) {
    var attrs = { position: position || 'left', style: 'bubble' };
    if (speaker) attrs.speaker = attrValue(speaker);
    return Parser.wrap(text, attrs, 'dialog');
  }

  function textbox(role, text) {
    return Parser.wrap(text, { role: role }, 'textbox');
  }

  function choiceLink(text, target) {
    return '- [' + String(text).replace(/[[\]]/g, '') + '](chapter://' + encodeURIComponent(target) + ')';
  }

  /**
   * NarrativeGen output envelope (wp-ng-0.x) -> zenwriter-v1 project for importProjectJSON.
   * Each node is a chapter named by its nodeId; choices are chapter links.
   */
  function contractToProject(envelope, options) {
    if (!envelope || typeof envelope !== 'object') throw new Error('封筒がオブジェクトではありません');
    var version = /^wp-ng-(\d+)\.(\d+)$/.exec(String(envelope.contractVersion || ''));
    if (!version || Number(version[1]) !== 0) {
      throw new Error('contractVersion ' + envelope.contractVersion + ' は互換がありません（期待 ' + CONTRACT_VERSION + '）');
    }
    if (typeof envelope.modelId !== 'string') throw new Error('必須フィールド modelId がありません');
    if (!Array.isArray(envelope.nodes) || !envelope.nodes.length) throw new Error('必須フィールド nodes がないか空です');
    var name = (options && options.name) || envelope.modelId || 'NarrativeGen';
    var seen = new Set();
    var pages = envelope.nodes.map(function (node, index) {
      if (!node || typeof node.nodeId !== 'string' || !node.nodeId || typeof node.text !== 'string') {
        throw new Error('nodes[' + index + '] に必須フィールド nodeId / text がありません');
      }
      if (seen.has(node.nodeId)) throw new Error('nodeId ' + node.nodeId + ' が重複しています');
      seen.add(node.nodeId);
      var blocks = paragraphs(node.text).map(function (p) { return node.speaker ? dialog(node.speaker, p) : p; });
      if (node.choices !== undefined && !Array.isArray(node.choices)) throw new Error(node.nodeId + ': choices が配列ではありません');
      (node.choices || []).forEach(function (c) {
        if (!c || typeof c.text !== 'string' || typeof c.target !== 'string') throw new Error(node.nodeId + ': 選択肢に text / target がありません');
        blocks.push(choiceLink(c.text, c.target));
      });
      return {
        title: node.nodeId,
        content: blocks.join('\n\n'),
        order: index,
        level: 2,
        visibility: 'visible',
        metadata: { narrativegen: node.speaker ? { nodeId: node.nodeId, speaker: node.speaker } : { nodeId: node.nodeId } }
      };
    });
    return {
      format: 'zenwriter-v1',
      version: '0.3',
      document: { id: String(envelope.modelId || name), name: String(name), content: '', chapterMode: true, createdAt: null, updatedAt: null },
      pages: pages,
      exportedAt: (options && options.exportedAt) || null
    };
  }

  function frameText(frame) {
    return (frame.paragraphs || []).map(function (p) {
      return p.map(function (s) { return s.text; }).join('').trim();
    }).filter(Boolean);
  }

  /**
   * NarrativeGen screen frames (one per step) -> Reader Markdown. The mapping is the
   * same as the Unity chat (NarrativeGenChatScreen): header and place as narration,
   * one speaker bubble per paragraph, the chosen text as the player's bubble,
   * new journal notes as system lines, and the ending.
   */
  function framesToMarkdown(frames) {
    if (!Array.isArray(frames) || !frames.length) throw new Error('画面フレームがありません');
    var blocks = [];
    var previous = null;
    frames.forEach(function (frame, index) {
      if (!frame || frame.format !== FRAME_FORMAT || frame.version !== FRAME_VERSION) {
        throw new Error('frames[' + index + '] は ' + FRAME_FORMAT + ' version ' + FRAME_VERSION + ' ではありません');
      }
      var inquiry = frame.layout === 'inquiry';
      if (!previous && frame.header && frame.header.title) {
        var title = frame.header.region ? frame.header.region + '｜' + frame.header.title : frame.header.title;
        blocks.push(textbox('narration', frame.header.goal ? title + '\n' + frame.header.goal : title));
      }
      if (frame.choiceText) blocks.push(dialog('', frame.choiceText, 'right'));
      if (frame.place && frame.place !== (previous && previous.place)) blocks.push(textbox('narration', '― ' + frame.place + ' ―'));
      frameText(frame).forEach(function (p) {
        blocks.push(frame.speaker ? dialog(frame.speaker, p) : textbox('narration', p));
      });
      if (frame.newNote) {
        (frame.notes || []).slice(previous ? previous.notes.length : 0).forEach(function (n) {
          blocks.push(textbox('system', (inquiry ? '旅の手帳に記した' : '記録した') + ' — ' + n.source + '：' + n.text));
        });
      }
      if (frame.ending) {
        if (inquiry) {
          blocks.push(textbox('system', '依頼完了'));
          if ((frame.notes || []).length) {
            blocks.push(textbox('system', '旅の手帳\n' + frame.notes.map(function (n) { return '・' + n.source + '：' + n.text; }).join('\n')));
          }
        }
        blocks.push(textbox('system', '再生終了'));
      } else if (index === frames.length - 1) {
        (frame.choiceGroups || []).forEach(function (g) {
          blocks.push('**' + g.label + '**\n\n' + g.choices.map(function (c) { return '- ' + c.text; }).join('\n'));
        });
      }
      previous = frame;
    });
    return blocks.join('\n\n') + '\n';
  }

  var api = {
    CONTRACT_VERSION: CONTRACT_VERSION,
    FRAME_FORMAT: FRAME_FORMAT,
    FRAME_VERSION: FRAME_VERSION,
    slugify: slugify,
    toContractText: toContractText,
    projectToContract: projectToContract,
    contractToProject: contractToProject,
    framesToMarkdown: framesToMarkdown
  };

  if (root) root.NarrativeScreenBridge = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
