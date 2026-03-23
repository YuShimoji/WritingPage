/**
 * ScrollTriggerController
 * Activates scroll-triggered animations on .zw-scroll elements.
 * Uses IntersectionObserver to detect when elements enter the viewport.
 * Effects: fade-in, slide-up, slide-left, slide-right, zoom-in.
 * Reads data-effect, data-delay (ms), data-threshold from elements.
 */
(function (root) {
  'use strict';

  var DEFAULT_THRESHOLD = 0.2;
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

  function parseDelay(value) {
    if (!value || value === '0ms') return 0;
    var n = parseInt(String(value).replace(/ms$/i, ''), 10);
    return isNaN(n) || n < 0 ? 0 : Math.min(n, 5000);
  }

  function parseThreshold(value) {
    if (value === undefined || value === null || value === '') return DEFAULT_THRESHOLD;
    var n = parseFloat(value);
    return isNaN(n) ? DEFAULT_THRESHOLD : Math.max(0, Math.min(1, n));
  }

  /**
   * Reveal an element by adding the visible class, with optional delay.
   */
  function revealElement(el, delay) {
    if (delay > 0) {
      setTimeout(function () {
        el.classList.add('zw-scroll--visible');
      }, delay);
    } else {
      el.classList.add('zw-scroll--visible');
    }
  }

  /**
   * Activate all .zw-scroll elements within the given container.
   * Returns a cleanup function.
   */
  function activate(container) {
    if (!container) return function () {};

    var elements = container.querySelectorAll('.zw-scroll');
    if (elements.length === 0) return function () {};

    // Reduced motion: show all immediately
    if (isReducedMotion()) {
      for (var r = 0; r < elements.length; r++) {
        elements[r].classList.add('zw-scroll--visible');
        elements[r].classList.add('zw-scroll--reduced');
      }
      return function () {};
    }

    // IntersectionObserver fallback: show all immediately
    if (!('IntersectionObserver' in window)) {
      for (var f = 0; f < elements.length; f++) {
        elements[f].classList.add('zw-scroll--visible');
      }
      return function () {};
    }

    var observers = [];

    for (var i = 0; i < elements.length; i++) {
      (function (el) {
        // Skip if already activated
        if (el.getAttribute('data-scroll-activated') === 'true') return;
        el.setAttribute('data-scroll-activated', 'true');

        var delay = parseDelay(el.getAttribute('data-delay'));
        var threshold = parseThreshold(el.getAttribute('data-threshold'));
        var sfxName = el.getAttribute('data-sfx') || '';

        var observer = new IntersectionObserver(function (entries) {
          for (var j = 0; j < entries.length; j++) {
            if (entries[j].isIntersecting) {
              observer.disconnect();
              revealElement(el, delay);
              // Play SE on reveal
              if (sfxName && root.SoundEffectController) {
                var seDelay = delay > 0 ? delay : 0;
                if (seDelay > 0) {
                  setTimeout(function () { root.SoundEffectController.play(sfxName); }, seDelay);
                } else {
                  root.SoundEffectController.play(sfxName);
                }
              }
              return;
            }
          }
        }, { threshold: threshold });

        observer.observe(el);
        observers.push({ observer: observer, el: el });
      })(elements[i]);
    }

    var instance = { container: container, observers: observers };
    instances.push(instance);

    return function () {
      for (var o = 0; o < observers.length; o++) {
        observers[o].observer.disconnect();
        observers[o].el.removeAttribute('data-scroll-activated');
      }
      var idx = instances.indexOf(instance);
      if (idx !== -1) instances.splice(idx, 1);
    };
  }

  /**
   * Deactivate all scroll trigger effects.
   */
  function deactivateAll() {
    var copy = instances.slice();
    for (var i = 0; i < copy.length; i++) {
      var inst = copy[i];
      for (var o = 0; o < inst.observers.length; o++) {
        inst.observers[o].observer.disconnect();
        inst.observers[o].el.removeAttribute('data-scroll-activated');
      }
    }
    instances.length = 0;
  }

  var api = {
    activate: activate,
    deactivateAll: deactivateAll,
    parseDelay: parseDelay,
    parseThreshold: parseThreshold,
    isReducedMotion: isReducedMotion
  };

  root.ScrollTriggerController = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
