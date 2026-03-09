/**
 * gn-renderers.js - Graphic Novel 対話サブレンダラー
 *
 * DialogueRenderer に登録する置換可能なサブレンダラー。
 * Window / Bubble / Icon の3種を提供。
 */
(function () {
  'use strict';

  var GNDialogueRenderer = window.GNDialogueRenderer;
  if (!GNDialogueRenderer) return;

  // ============================
  // WindowRenderer
  // ============================
  // アドベンチャーノベル風の画面下部メッセージウィンドウ。
  // キャラアイコン(左) + 名前ラベル + タイプライター表示テキスト。

  var WindowRenderer = {
    create: function (block, character, container) {
      // ウィンドウ全体
      var windowEl = document.createElement('div');
      windowEl.className = 'gn-dialogue-window';

      // キャラクターエリア (左)
      var charArea = document.createElement('div');
      charArea.className = 'gn-dialogue-char-area';

      if (character) {
        // アイコン
        if (character.icon) {
          var iconEl = document.createElement('div');
          iconEl.className = 'gn-dialogue-icon';
          iconEl.style.backgroundImage = 'url(' + character.icon + ')';
          charArea.appendChild(iconEl);
        } else {
          // アイコンなし: 名前の頭文字
          var initialEl = document.createElement('div');
          initialEl.className = 'gn-dialogue-icon gn-dialogue-icon--initial';
          initialEl.textContent = character.name ? character.name.charAt(0) : '?';
          if (character.color) {
            initialEl.style.backgroundColor = character.color;
          }
          charArea.appendChild(initialEl);
        }

        // 名前ラベル
        var nameEl = document.createElement('div');
        nameEl.className = 'gn-dialogue-name';
        nameEl.textContent = character.name || '';
        if (character.color) {
          nameEl.style.color = character.color;
        }
        charArea.appendChild(nameEl);
      }

      windowEl.appendChild(charArea);

      // テキストエリア (右)
      var textArea = document.createElement('div');
      textArea.className = 'gn-dialogue-text-area';

      var textEl = document.createElement('div');
      textEl.className = 'gn-dialogue-text';
      textArea.appendChild(textEl);

      windowEl.appendChild(textArea);

      container.appendChild(windowEl);

      // タイプライター状態
      var text = block.text || '';
      var speed = block.speed != null ? block.speed : 1.0;
      var charsPerSecond = 20 * speed; // 1秒あたりの文字数

      return {
        el: windowEl,
        textEl: textEl,
        text: text,
        charIndex: 0,
        charsPerSecond: charsPerSecond,
        startTime: null,
        complete: false
      };
    },

    update: function (state, elapsed) {
      if (state.complete) return;

      if (state.startTime === null) {
        state.startTime = elapsed;
      }

      var dt = (elapsed - state.startTime) / 1000; // seconds
      var targetIndex = Math.floor(dt * state.charsPerSecond);

      if (targetIndex > state.text.length) {
        targetIndex = state.text.length;
      }

      if (targetIndex !== state.charIndex) {
        state.charIndex = targetIndex;
        state.textEl.textContent = state.text.substring(0, targetIndex);

        if (targetIndex >= state.text.length) {
          state.complete = true;
          state.textEl.textContent = state.text;
        }
      }
    },

    destroy: function (state) {
      if (state.el && state.el.parentNode) {
        state.el.parentNode.removeChild(state.el);
      }
    }
  };

  GNDialogueRenderer.registerRenderer('window', WindowRenderer);

  // ============================
  // BubbleRenderer
  // ============================
  // 吹き出し形式。アンカー位置から尾が伸びる。

  var BubbleRenderer = {
    create: function (block, character, container) {
      var opts = block.animatorOptions || {};
      var tailDirection = opts.tailDirection || 'bottom'; // 'top'|'bottom'|'left'|'right'
      var position = block.position || {};

      // 吹き出しコンテナ
      var bubbleWrap = document.createElement('div');
      bubbleWrap.className = 'gn-bubble-wrap';
      bubbleWrap.style.position = 'absolute';

      // position
      if (position.x != null) {
        bubbleWrap.style.left = typeof position.x === 'number' ? position.x + 'px' : position.x;
      } else {
        bubbleWrap.style.left = '50%';
      }
      if (position.y != null) {
        bubbleWrap.style.top = typeof position.y === 'number' ? position.y + 'px' : position.y;
      } else {
        bubbleWrap.style.top = '40%';
      }
      bubbleWrap.style.transform = 'translate(-50%, -50%)';

      // 吹き出し本体
      var bubbleEl = document.createElement('div');
      bubbleEl.className = 'gn-bubble gn-bubble--tail-' + tailDirection;

      // 名前ラベル (キャラクターがあれば)
      if (character && character.name) {
        var nameEl = document.createElement('div');
        nameEl.className = 'gn-bubble-name';
        nameEl.textContent = character.name;
        if (character.color) nameEl.style.color = character.color;
        bubbleEl.appendChild(nameEl);
      }

      // テキスト
      var textEl = document.createElement('div');
      textEl.className = 'gn-bubble-text';
      bubbleEl.appendChild(textEl);

      bubbleWrap.appendChild(bubbleEl);
      container.appendChild(bubbleWrap);

      var text = block.text || '';
      var speed = block.speed != null ? block.speed : 1.0;

      return {
        el: bubbleWrap,
        textEl: textEl,
        text: text,
        charIndex: 0,
        charsPerSecond: 22 * speed,
        startTime: null,
        complete: false
      };
    },

    update: function (state, elapsed) {
      if (state.complete) return;
      if (state.startTime === null) state.startTime = elapsed;

      var dt = (elapsed - state.startTime) / 1000;
      var target = Math.floor(dt * state.charsPerSecond);
      if (target > state.text.length) target = state.text.length;

      if (target !== state.charIndex) {
        state.charIndex = target;
        state.textEl.textContent = state.text.substring(0, target);
        if (target >= state.text.length) {
          state.complete = true;
          state.textEl.textContent = state.text;
        }
      }
    },

    destroy: function (state) {
      if (state.el && state.el.parentNode) {
        state.el.parentNode.removeChild(state.el);
      }
    }
  };

  GNDialogueRenderer.registerRenderer('bubble', BubbleRenderer);

  // ============================
  // IconRenderer
  // ============================
  // LINE風チャット形式。メッセージが上から順に追加される。

  var IconRenderer = {
    create: function (block, character, container) {
      var opts = block.animatorOptions || {};
      var side = (character && character.position) || opts.side || 'left';

      // チャットメッセージ1件
      var msgEl = document.createElement('div');
      msgEl.className = 'gn-chat-message gn-chat-message--' + side;

      // アイコン
      var iconEl = document.createElement('div');
      iconEl.className = 'gn-chat-icon';
      if (character && character.icon) {
        iconEl.style.backgroundImage = 'url(' + character.icon + ')';
      } else {
        iconEl.className += ' gn-chat-icon--initial';
        iconEl.textContent = character && character.name ? character.name.charAt(0) : '?';
        if (character && character.color) {
          iconEl.style.backgroundColor = character.color;
        }
      }

      // バブル (名前+テキスト)
      var bubbleEl = document.createElement('div');
      bubbleEl.className = 'gn-chat-bubble';
      if (character && character.color) {
        if (side === 'right') {
          bubbleEl.style.backgroundColor = character.color;
          bubbleEl.style.color = '#fff';
        } else {
          bubbleEl.style.borderColor = character.color;
        }
      }

      if (character && character.name) {
        var nameEl = document.createElement('div');
        nameEl.className = 'gn-chat-name';
        nameEl.textContent = character.name;
        if (character.color && side !== 'right') nameEl.style.color = character.color;
        bubbleEl.appendChild(nameEl);
      }

      var textEl = document.createElement('div');
      textEl.className = 'gn-chat-text';
      bubbleEl.appendChild(textEl);

      // left: icon then bubble, right: bubble then icon
      if (side === 'right') {
        msgEl.appendChild(bubbleEl);
        msgEl.appendChild(iconEl);
      } else {
        msgEl.appendChild(iconEl);
        msgEl.appendChild(bubbleEl);
      }

      container.appendChild(msgEl);

      var text = block.text || '';
      var speed = block.speed != null ? block.speed : 1.0;

      return {
        el: msgEl,
        textEl: textEl,
        text: text,
        charIndex: 0,
        charsPerSecond: 20 * speed,
        startTime: null,
        complete: false
      };
    },

    update: function (state, elapsed) {
      if (state.complete) return;
      if (state.startTime === null) state.startTime = elapsed;

      var dt = (elapsed - state.startTime) / 1000;
      var target = Math.floor(dt * state.charsPerSecond);
      if (target > state.text.length) target = state.text.length;

      if (target !== state.charIndex) {
        state.charIndex = target;
        state.textEl.textContent = state.text.substring(0, target);
        if (target >= state.text.length) {
          state.complete = true;
          state.textEl.textContent = state.text;
        }
      }
    },

    destroy: function (state) {
      if (state.el && state.el.parentNode) {
        state.el.parentNode.removeChild(state.el);
      }
    }
  };

  GNDialogueRenderer.registerRenderer('icon', IconRenderer);
})();
