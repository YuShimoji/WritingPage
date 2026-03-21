/**
 * SoundEffectController
 * Minimal SE foundation using Web Audio API synthesized sounds.
 * No external audio files required.
 * Built-in sounds: keystroke, click, whoosh, chime, ping.
 * SP-074 Phase 5.
 */
(function (root) {
  'use strict';

  var audioCtx = null;
  var enabled = true;
  var masterVolume = 0.3;

  function getContext() {
    if (!audioCtx && typeof AudioContext !== 'undefined') {
      audioCtx = new AudioContext();
    }
    if (!audioCtx && typeof webkitAudioContext !== 'undefined') {
      audioCtx = new webkitAudioContext(); // eslint-disable-line no-undef
    }
    return audioCtx;
  }

  /**
   * Resume AudioContext after user interaction (mobile requirement).
   */
  function resume() {
    var ctx = getContext();
    if (ctx && ctx.state === 'suspended') {
      return ctx.resume();
    }
    return Promise.resolve();
  }

  function isReducedMotion() {
    if (typeof document !== 'undefined' && document.documentElement.getAttribute('data-reduce-motion') === 'true') {
      return true;
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  }

  /**
   * Create a gain node with master volume applied.
   */
  function createGain(ctx, volume) {
    var gain = ctx.createGain();
    var vol = typeof volume === 'number' ? volume : 1;
    gain.gain.value = vol * masterVolume;
    gain.connect(ctx.destination);
    return gain;
  }

  /**
   * Built-in sound: keystroke — short tick/click for typing.
   */
  function playKeystroke() {
    var ctx = getContext();
    if (!ctx) return;
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = createGain(ctx, 0.15);
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);
    gain.gain.setValueAtTime(0.15 * masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Built-in sound: click — short UI click.
   */
  function playClick() {
    var ctx = getContext();
    if (!ctx) return;
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = createGain(ctx, 0.2);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.04);
    gain.gain.setValueAtTime(0.2 * masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * Built-in sound: whoosh — sweep for scroll reveal.
   */
  function playWhoosh() {
    var ctx = getContext();
    if (!ctx) return;
    var now = ctx.currentTime;

    // Noise burst via buffer
    var duration = 0.15;
    var sampleRate = ctx.sampleRate;
    var bufferSize = Math.ceil(sampleRate * duration);
    var buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    var source = ctx.createBufferSource();
    source.buffer = buffer;

    var filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(500, now + duration);
    filter.Q.value = 1;

    var gain = createGain(ctx, 0.2);
    gain.gain.setValueAtTime(0.2 * masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    source.start(now);
    source.stop(now + duration);
  }

  /**
   * Built-in sound: chime — pleasant notification tone.
   */
  function playChime() {
    var ctx = getContext();
    if (!ctx) return;
    var now = ctx.currentTime;
    var freqs = [523, 659, 784]; // C5, E5, G5

    for (var i = 0; i < freqs.length; i++) {
      (function (freq, offset) {
        var osc = ctx.createOscillator();
        var gain = createGain(ctx, 0.12);
        osc.type = 'sine';
        osc.frequency.value = freq;
        var t = now + offset;
        gain.gain.setValueAtTime(0.12 * masterVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.3);
      })(freqs[i], i * 0.08);
    }
  }

  /**
   * Built-in sound: ping — short alert ping.
   */
  function playPing() {
    var ctx = getContext();
    if (!ctx) return;
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = createGain(ctx, 0.25);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1047, now); // C6
    gain.gain.setValueAtTime(0.25 * masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  var SOUND_MAP = {
    keystroke: playKeystroke,
    click: playClick,
    whoosh: playWhoosh,
    chime: playChime,
    ping: playPing
  };

  var SOUND_NAMES = Object.keys(SOUND_MAP);

  /**
   * Play a built-in sound by name.
   * @param {string} name - Sound name (keystroke, click, whoosh, chime, ping)
   */
  function play(name) {
    if (!enabled || isReducedMotion()) return;
    var fn = SOUND_MAP[name];
    if (fn) {
      try { fn(); } catch (_e) { /* ignore audio errors */ }
    }
  }

  /**
   * Set master volume (0-1).
   */
  function setVolume(vol) {
    masterVolume = Math.max(0, Math.min(1, vol));
  }

  /**
   * Enable or disable all sound effects.
   */
  function setEnabled(val) {
    enabled = !!val;
  }

  var api = {
    resume: resume,
    play: play,
    setVolume: setVolume,
    setEnabled: setEnabled,
    SOUND_NAMES: SOUND_NAMES,
    isReducedMotion: isReducedMotion
  };

  root.SoundEffectController = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
