/**
 * RichTextTurndownRules
 * リッチ編集の HTML を Markdown 正本へ戻す Turndown のカスタムルール集。
 * 装飾・傍点・ルビ・章リンク・段落揃えなどの往復を 1 か所で定義する（以前は RichTextEditor のコンストラクタ内）。
 * Turndown は後から追加したルールが優先されるため、install 内の登録順は意味を持つ。
 */
(function (root) {
  'use strict';

  var DECOR_CLASS_TO_TAG = {
    'decor-bold': 'bold',
    'decor-italic': 'italic',
    'decor-underline': 'underline',
    'decor-strikethrough': 'strike',
    'decor-smallcaps': 'smallcaps',
    'decor-light': 'light',
    'decor-shadow': 'shadow',
    'decor-black': 'black',
    'decor-uppercase': 'uppercase',
    'decor-lowercase': 'lowercase',
    'decor-capitalize': 'capitalize',
    'decor-outline': 'outline',
    'decor-glow': 'glow',
    'decor-wide': 'wide',
    'decor-narrow': 'narrow'
  };

  var ANIM_CLASS_TO_TAG = {
    'anim-fade': 'fade',
    'anim-slide': 'slide',
    'anim-typewriter': 'type',
    'anim-pulse': 'pulse',
    'anim-shake': 'shake',
    'anim-bounce': 'bounce',
    'anim-fade-in': 'fadein'
  };

  // P2: data-zw-align を持てるブロック
  var ALIGN_TAGS = { P: 'p', H1: 'h1', H2: 'h2', H3: 'h3', BLOCKQUOTE: 'blockquote', LI: 'li' };

  function getDecorTag(node) {
    if (!node || !node.classList) return '';
    for (var i = 0; i < node.classList.length; i++) {
      var cls = node.classList.item(i);
      if (DECOR_CLASS_TO_TAG[cls]) return DECOR_CLASS_TO_TAG[cls];
    }
    return '';
  }

  function hasInlineTextDecoration(node, keyword) {
    if (!node || node.nodeName !== 'SPAN' || !node.style) return false;
    var re = new RegExp(keyword, 'i');
    return re.test(node.style.textDecorationLine || '') || re.test(node.style.textDecoration || '');
  }

  /**
   * @param {object} turndownService TurndownService インスタンス
   */
  function install(turndownService) {
    if (!turndownService || typeof turndownService.addRule !== 'function') return;

    turndownService.addRule('fontDecorations', {
      filter: function (node) {
        return node.nodeName === 'SPAN' && !!getDecorTag(node);
      },
      replacement: function (content, node) {
        var tag = getDecorTag(node);
        return '[' + tag + ']' + content + '[/' + tag + ']';
      }
    });
    turndownService.addRule('nativeStrikethrough', {
      filter: function (node) {
        if (!node || !node.nodeName) return false;
        if (node.nodeName === 'S' || node.nodeName === 'STRIKE' || node.nodeName === 'DEL') return true;
        return hasInlineTextDecoration(node, 'line-through');
      },
      replacement: function (content) {
        return '~~' + content + '~~';
      }
    });
    // 下線 <u> → [underline]...[/underline]。Turndown 既定では <u> が落ち、保存・プレビューで下線が消える
    turndownService.addRule('nativeUnderline', {
      filter: function (node) {
        if (!node || !node.nodeName) return false;
        if (node.nodeName === 'U') return true;
        return hasInlineTextDecoration(node, 'underline');
      },
      replacement: function (content) {
        return '[underline]' + content + '[/underline]';
      }
    });
    // 傍点 span.kenten → {kenten|...} 逆変換
    turndownService.addRule('kenten', {
      filter: function (node) {
        return node.nodeName === 'SPAN' && node.className === 'kenten';
      },
      replacement: function (content) {
        return '{kenten|' + content + '}';
      }
    });
    // ルビ <ruby> → {漢字|かな} 逆変換
    turndownService.addRule('ruby', {
      filter: 'ruby',
      replacement: function (_content, node) {
        var base = '';
        var rt = '';
        for (var i = 0; i < node.childNodes.length; i++) {
          var child = node.childNodes[i];
          if (child.nodeName === 'RT') {
            rt = child.textContent || '';
          } else if (child.nodeName !== 'RP') {
            base += child.textContent || '';
          }
        }
        return '{' + base.trim() + '|' + rt.trim() + '}';
      }
    });
    // SP-072: chapter-link → [text](chapter://target) 逆変換
    // data-style がある場合は chapter://target#style=card 形式で保持
    turndownService.addRule('chapterLink', {
      filter: function (node) {
        return node.nodeName === 'A' && node.classList.contains('chapter-link');
      },
      replacement: function (content, node) {
        var target = node.dataset.chapterTarget || '';
        var decoded = decodeURIComponent(target);
        var style = node.dataset.style || '';
        var suffix = style ? '#style=' + style : '';
        return '[' + content + '](chapter://' + decoded + suffix + ')';
      }
    });
    turndownService.addRule('textAnimations', {
      filter: function (node) {
        return node.nodeName === 'SPAN' && node.className && /^anim-/.test(node.className);
      },
      replacement: function (content, node) {
        var tag = ANIM_CLASS_TO_TAG[node.className] || node.className.replace('anim-', '');
        return '[' + tag + ']' + content + '[/' + tag + ']';
      }
    });
    turndownService.addRule('textureOverlay', {
      filter: function (node) {
        return node.nodeName === 'SPAN' && node.className && /^tex-/.test(node.className);
      },
      replacement: function (content, node) {
        var texName = node.className.replace('tex-', '');
        return '[' + texName + ']' + content + '[/' + texName + ']';
      }
    });
    // P2: data-zw-align 付きブロックは HTML 断片として保持（段落揃えの往復）
    turndownService.addRule('zwBlockAlign', {
      filter: function (node) {
        if (!ALIGN_TAGS[node.nodeName]) return false;
        var v = node.getAttribute && node.getAttribute('data-zw-align');
        return v === 'start' || v === 'center' || v === 'end';
      },
      replacement: function (content, node) {
        var t = ALIGN_TAGS[node.nodeName];
        var v = node.getAttribute('data-zw-align') || 'start';
        return '<' + t + ' data-zw-align="' + v + '">' + content + '</' + t + '>';
      }
    });
  }

  var api = { install: install };
  root.RichTextTurndownRules = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
