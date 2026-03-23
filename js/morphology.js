/**
 * morphology.js — Shared Japanese morphological analysis service.
 *
 * Wraps kuromoji.js tokenizer with lazy initialization and
 * proper noun extraction. Designed for reuse by:
 *   - Story Wiki auto-detection (SP-050 Step 4)
 *   - Future: spell checking, ruby annotation
 *
 * Usage:
 *   ZenMorphology.init().then(() => {
 *     const nouns = ZenMorphology.extractProperNouns(text);
 *   });
 */
(function () {
  'use strict';

  var tokenizer = null;
  var initPromise = null;

  /**
   * Lazily initialize the kuromoji tokenizer.
   * Returns a Promise that resolves when ready.
   * Subsequent calls return the cached promise.
   */
  function init() {
    if (tokenizer) return Promise.resolve(tokenizer);
    if (initPromise) return initPromise;

    if (typeof kuromoji === 'undefined') {
      return Promise.reject(new Error('kuromoji library not loaded'));
    }

    // Determine dictionary path relative to the page
    var dicPath = 'vendor/kuromoji-dict/';

    initPromise = new Promise(function (resolve, reject) {
      kuromoji.builder({ dicPath: dicPath }).build(function (err, _tokenizer) {
        if (err) {
          console.warn('[ZenMorphology] Failed to initialize:', err.message);
          initPromise = null;
          reject(err);
          return;
        }
        tokenizer = _tokenizer;
        console.log('[ZenMorphology] Tokenizer initialized');
        resolve(tokenizer);
      });
    });

    return initPromise;
  }

  /**
   * Tokenize text into morphemes.
   * Returns empty array if tokenizer is not initialized.
   * @param {string} text
   * @returns {Array} kuromoji token objects
   */
  function tokenize(text) {
    if (!tokenizer) return [];
    return tokenizer.tokenize(text);
  }

  /**
   * Extract proper nouns from text with POS-based categorization.
   * Merges consecutive proper noun tokens into compound names.
   * @param {string} text
   * @returns {Array<{surface: string, detail2: string, reading: string}>}
   */
  function extractProperNouns(text) {
    if (!tokenizer) return [];
    var tokens = tokenizer.tokenize(text);
    var results = [];
    var i = 0;

    while (i < tokens.length) {
      var t = tokens[i];
      if (t.pos === '名詞' && t.pos_detail_1 === '固有名詞') {
        // Merge consecutive proper noun tokens (e.g. 田中 + 太郎 → 田中太郎)
        var surface = t.surface_form;
        var detail2 = t.pos_detail_2; // 人名 / 地域 / 組織 / 一般
        var reading = t.reading || '';
        var j = i + 1;
        while (j < tokens.length &&
               tokens[j].pos === '名詞' &&
               tokens[j].pos_detail_1 === '固有名詞') {
          surface += tokens[j].surface_form;
          reading += tokens[j].reading || '';
          // Keep the most specific detail2
          if (tokens[j].pos_detail_2 !== '一般') {
            detail2 = tokens[j].pos_detail_2;
          }
          j++;
        }
        results.push({
          surface: surface,
          detail2: detail2,
          reading: reading
        });
        i = j;
      } else {
        i++;
      }
    }

    return results;
  }

  /**
   * Map kuromoji pos_detail_2 to Story Wiki category.
   * @param {string} detail2 - e.g. '人名', '地域', '組織', '一般'
   * @returns {string} Wiki category ID
   */
  function posToCategory(detail2) {
    switch (detail2) {
      case '人名': return 'character';
      case '地域': return 'location';
      case '組織': return 'organization';
      default: return 'term';
    }
  }

  /** @returns {boolean} Whether the tokenizer is initialized and ready */
  function isReady() {
    return tokenizer !== null;
  }

  window.ZenMorphology = {
    init: init,
    tokenize: tokenize,
    extractProperNouns: extractProperNouns,
    posToCategory: posToCategory,
    isReady: isReady
  };
})();
