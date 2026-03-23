/**
 * GenrePresetRegistry
 * Genre presets that combine Phase 1-5 effects into themed experiences.
 * Applied as CSS classes on reader-preview container.
 * SP-074 Phase 6.
 */
(function (root) {
  'use strict';

  var GENRE_PRESETS = [
    {
      id: 'adv',
      label: 'ADV / ビジュアルノベル',
      description: '画面下部ダイアログ、タイピング演出、クリック進行',
      className: 'genre-adv',
      defaults: {
        dialogStyle: 'default',
        dialogPosition: 'center',
        typingSpeed: '40ms',
        typingMode: 'click',
        scrollEffect: 'fade-in',
        sfx: 'keystroke'
      }
    },
    {
      id: 'webnovel',
      label: 'Web小説',
      description: '縦スクロール、自動タイピング、フェードイン演出',
      className: 'genre-webnovel',
      defaults: {
        dialogStyle: 'bubble',
        dialogPosition: 'left',
        typingSpeed: '25ms',
        typingMode: 'auto',
        scrollEffect: 'slide-up',
        sfx: ''
      }
    },
    {
      id: 'horror',
      label: 'ホラー',
      description: '遅いタイピング、暗い配色、グリッチテクスチャ',
      className: 'genre-horror',
      defaults: {
        dialogStyle: 'bordered',
        dialogPosition: 'center',
        typingSpeed: '80ms',
        typingMode: 'click',
        scrollEffect: 'fade-in',
        sfx: 'ping'
      }
    },
    {
      id: 'poem',
      label: 'ポエム / 詩的散文',
      description: 'ゆったりフェード、中央寄せ、静寂',
      className: 'genre-poem',
      defaults: {
        dialogStyle: 'transparent',
        dialogPosition: 'center',
        typingSpeed: '60ms',
        typingMode: 'scroll',
        scrollEffect: 'zoom-in',
        sfx: ''
      }
    }
  ];

  /**
   * Get all genre presets.
   */
  function list() {
    return GENRE_PRESETS.slice();
  }

  /**
   * Find a genre preset by ID.
   */
  function resolve(id) {
    var target = String(id || '').toLowerCase();
    for (var i = 0; i < GENRE_PRESETS.length; i++) {
      if (GENRE_PRESETS[i].id === target) return GENRE_PRESETS[i];
    }
    return null;
  }

  /**
   * Apply genre preset CSS class to a container element.
   * Removes any existing genre-* class first.
   */
  function apply(container, genreId) {
    if (!container) return;
    // Remove existing genre classes
    for (var i = 0; i < GENRE_PRESETS.length; i++) {
      container.classList.remove(GENRE_PRESETS[i].className);
    }
    // Apply new genre class
    var preset = resolve(genreId);
    if (preset) {
      container.classList.add(preset.className);
    }
  }

  /**
   * Remove all genre preset CSS classes from a container.
   */
  function clear(container) {
    if (!container) return;
    for (var i = 0; i < GENRE_PRESETS.length; i++) {
      container.classList.remove(GENRE_PRESETS[i].className);
    }
  }

  var api = {
    GENRE_PRESETS: GENRE_PRESETS,
    list: list,
    resolve: resolve,
    apply: apply,
    clear: clear
  };

  root.GenrePresetRegistry = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
