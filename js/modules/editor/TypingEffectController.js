/**
 * TypingEffectController
 * Activates typing animation on .zw-typing elements.
 * Modes: auto (timer), click (click to advance), scroll (IntersectionObserver).
 * Reads data-speed (ms per char, default 30ms) and data-mode from elements.
 */
(function (root) {
  'use strict';

  var DEFAULT_SPEED = 30;
  var instances = [];

  function isReducedMotion() {
    if (typeof document !== 'undefined' && document.documentElement.getAttribute('data-reduce-motion') === 'true') {
      return true;
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  }

  function parseSpeed(value) {
    if (!value) return DEFAULT_SPEED;
    var n = parseInt(String(value).replace(/ms$/i, ''), 10);
    return isNaN(n) || n < 1 ? DEFAULT_SPEED : Math.min(n, 500);
  }

  /**
   * Split text content into individual character spans.
   * Preserves newlines as <br>.
   */
  function prepareCharacters(textEl) {
    var text = textEl.textContent || '';
    var frag = document.createDocumentFragment();
    var chars = [];

    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === '\n') {
        frag.appendChild(document.createElement('br'));
        continue;
      }
      var span = document.createElement('span');
      span.className = 'zw-typing__char';
      span.textContent = ch;
      span.style.opacity = '0';
      frag.appendChild(span);
      chars.push(span);
    }

    textEl.textContent = '';
    textEl.appendChild(frag);
    return chars;
  }

  /**
   * Reveal characters one by one using requestAnimationFrame.
   */
  function animateAuto(chars, speed, onComplete) {
    var index = 0;
    var lastTime = 0;

    function step(timestamp) {
      if (!lastTime) lastTime = timestamp;
      var elapsed = timestamp - lastTime;

      while (elapsed >= speed && index < chars.length) {
        chars[index].style.opacity = '1';
        index++;
        elapsed -= speed;
        lastTime += speed;
      }

      if (index < chars.length) {
        requestAnimationFrame(step);
      } else if (onComplete) {
        onComplete();
      }
    }

    if (chars.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    requestAnimationFrame(step);
  }

  /**
   * Click mode: reveal chars until next paragraph boundary, then wait for click.
   * Paragraph boundaries are detected by consecutive newline (br) elements.
   */
  function animateClick(container, chars, speed, onComplete) {
    var index = 0;
    var paused = false;

    container.style.cursor = 'pointer';
    container.setAttribute('data-typing-state', 'active');

    function revealChunk() {
      if (index >= chars.length) {
        container.style.cursor = '';
        container.removeAttribute('data-typing-state');
        container.removeEventListener('click', onClickHandler);
        if (onComplete) onComplete();
        return;
      }

      paused = false;
      var lastTime = 0;

      function step(timestamp) {
        if (paused) return;
        if (!lastTime) lastTime = timestamp;
        var elapsed = timestamp - lastTime;

        while (elapsed >= speed && index < chars.length) {
          var ch = chars[index];
          ch.style.opacity = '1';
          index++;
          elapsed -= speed;
          lastTime += speed;

          // Pause after revealing a newline boundary (next char after br)
          if (index < chars.length && index > 1) {
            var prev = chars[index - 1];
            var prevSib = prev && prev.previousSibling;
            if (prevSib && prevSib.nodeName === 'BR') {
              paused = true;
              return;
            }
          }
        }

        if (index < chars.length && !paused) {
          requestAnimationFrame(step);
        } else if (index >= chars.length) {
          container.style.cursor = '';
          container.removeAttribute('data-typing-state');
          container.removeEventListener('click', onClickHandler);
          if (onComplete) onComplete();
        }
      }

      requestAnimationFrame(step);
    }

    function onClickHandler(e) {
      e.preventDefault();
      e.stopPropagation();
      if (paused) {
        revealChunk();
      } else {
        // Fast-forward: reveal all remaining
        for (var i = index; i < chars.length; i++) {
          chars[i].style.opacity = '1';
        }
        index = chars.length;
        container.style.cursor = '';
        container.removeAttribute('data-typing-state');
        container.removeEventListener('click', onClickHandler);
        if (onComplete) onComplete();
      }
    }

    container.addEventListener('click', onClickHandler);
    revealChunk();
  }

  /**
   * Scroll mode: start typing animation when element enters viewport.
   */
  function animateScroll(container, chars, speed, onComplete) {
    if (!('IntersectionObserver' in window)) {
      // Fallback: immediate reveal
      for (var i = 0; i < chars.length; i++) chars[i].style.opacity = '1';
      if (onComplete) onComplete();
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      for (var j = 0; j < entries.length; j++) {
        if (entries[j].isIntersecting) {
          observer.disconnect();
          animateAuto(chars, speed, onComplete);
          return;
        }
      }
    }, { threshold: 0.1 });

    observer.observe(container);
  }

  /**
   * Activate all .zw-typing elements within the given container.
   * Returns a cleanup function.
   */
  function activate(container) {
    if (!container) return function () {};

    var elements = container.querySelectorAll('.zw-typing');
    var cleanups = [];

    for (var i = 0; i < elements.length; i++) {
      (function (el) {
        // Skip if already activated
        if (el.getAttribute('data-typing-activated') === 'true') return;
        el.setAttribute('data-typing-activated', 'true');

        var textEl = el.querySelector('.zw-typing__text');
        if (!textEl) return;

        var speed = parseSpeed(el.getAttribute('data-speed'));
        var mode = el.getAttribute('data-mode') || 'auto';

        // Reduced motion: show immediately
        if (isReducedMotion()) {
          el.classList.add('zw-typing--complete');
          return;
        }

        var chars = prepareCharacters(textEl);

        function onComplete() {
          el.classList.add('zw-typing--complete');
        }

        if (mode === 'click') {
          animateClick(el, chars, speed, onComplete);
        } else if (mode === 'scroll') {
          animateScroll(el, chars, speed, onComplete);
        } else {
          animateAuto(chars, speed, onComplete);
        }

        cleanups.push(function () {
          el.removeAttribute('data-typing-activated');
          el.removeAttribute('data-typing-state');
          el.style.cursor = '';
        });
      })(elements[i]);
    }

    var instance = { container: container, cleanups: cleanups };
    instances.push(instance);

    return function () {
      for (var c = 0; c < cleanups.length; c++) cleanups[c]();
      var idx = instances.indexOf(instance);
      if (idx !== -1) instances.splice(idx, 1);
    };
  }

  /**
   * Deactivate all typing effects.
   */
  function deactivateAll() {
    var copy = instances.slice();
    for (var i = 0; i < copy.length; i++) {
      var inst = copy[i];
      for (var c = 0; c < inst.cleanups.length; c++) inst.cleanups[c]();
    }
    instances.length = 0;
  }

  var api = {
    activate: activate,
    deactivateAll: deactivateAll,
    parseSpeed: parseSpeed,
    isReducedMotion: isReducedMotion
  };

  root.TypingEffectController = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
