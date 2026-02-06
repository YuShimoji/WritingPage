// Pomodoro/集中タイマー機能
(function () {
  'use strict';

  /**
   * Pomodoroタイマークラス
   * - 25分作業、5分休憩のPomodoroタイマー
   * - カスタム時間設定の集中タイマー
   * - HUD連携による通知
   * - セッション履歴・統計の管理
   */
  class PomodoroTimer {
    constructor() {
      this.state = 'idle'; // 'idle' | 'running' | 'paused' | 'break'
      this.mode = 'pomodoro'; // 'pomodoro' | 'custom'
      this.remainingMs = 0;
      this.totalMs = 0;
      this.startTime = null;
      this.pausedAt = null;
      this.intervalId = null;
      this.sessions = []; // セッション履歴
      this.stats = {
        totalSessions: 0,
        totalMinutes: 0,
        todaySessions: 0,
        todayMinutes: 0
      };

      // デフォルト設定
      this.defaultWorkMinutes = 25;
      this.defaultBreakMinutes = 5;
      this.customMinutes = 25;

      // ストレージから設定と履歴を読み込み
      this.loadSettings();
      this.loadSessions();
      this.updateStats();

      // ページ離脱時に状態を保存
      window.addEventListener('beforeunload', () => {
        this.saveState();
      });

      // ページ可視性変更時にタイマーを調整
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.state === 'running') {
          // バックグラウンド時は一時停止
          this.pause();
        } else if (!document.hidden && this.state === 'paused' && this.pausedAt) {
          // フォアグラウンド復帰時は再開（オプション）
          // 自動再開はしない（ユーザー操作で再開）
        }
      });
    }

    /**
     * 設定を読み込み
     */
    loadSettings() {
      try {
        const storage = window.ZenWriterStorage;
        if (!storage || !storage.loadSettings) return;
        const settings = storage.loadSettings();
        const pomodoro = settings.pomodoro || {};
        this.defaultWorkMinutes = pomodoro.workMinutes || 25;
        this.defaultBreakMinutes = pomodoro.breakMinutes || 5;
        this.customMinutes = pomodoro.customMinutes || 25;
      } catch (e) {
        console.warn('Pomodoro設定の読み込みに失敗:', e);
      }
    }

    /**
     * 設定を保存
     */
    saveSettings() {
      try {
        const storage = window.ZenWriterStorage;
        if (!storage || !storage.saveSettings) return;
        const settings = storage.loadSettings();
        settings.pomodoro = {
          workMinutes: this.defaultWorkMinutes,
          breakMinutes: this.defaultBreakMinutes,
          customMinutes: this.customMinutes
        };
        storage.saveSettings(settings);
      } catch (e) {
        console.warn('Pomodoro設定の保存に失敗:', e);
      }
    }

    /**
     * セッション履歴を読み込み
     */
    loadSessions() {
      try {
        const raw = localStorage.getItem('zenWriter_pomodoro_sessions');
        if (raw) {
          this.sessions = JSON.parse(raw);
        }
      } catch (e) {
        console.warn('セッション履歴の読み込みに失敗:', e);
        this.sessions = [];
      }
    }

    /**
     * セッション履歴を保存
     */
    saveSessions() {
      try {
        localStorage.setItem('zenWriter_pomodoro_sessions', JSON.stringify(this.sessions));
      } catch (e) {
        console.warn('セッション履歴の保存に失敗:', e);
      }
    }

    /**
     * 状態を保存（一時停止・再開用）
     */
    saveState() {
      try {
        const state = {
          state: this.state,
          mode: this.mode,
          remainingMs: this.remainingMs,
          totalMs: this.totalMs,
          startTime: this.startTime,
          pausedAt: this.pausedAt
        };
        localStorage.setItem('zenWriter_pomodoro_state', JSON.stringify(state));
      } catch (e) {
        console.warn('タイマー状態の保存に失敗:', e);
      }
    }

    /**
     * 状態を復元
     */
    restoreState() {
      try {
        const raw = localStorage.getItem('zenWriter_pomodoro_state');
        if (raw) {
          const state = JSON.parse(raw);
          // 状態が古い場合は復元しない（1時間以上経過）
          if (state.startTime && Date.now() - state.startTime > 3600000) {
            this.reset();
            return;
          }
          this.state = state.state || 'idle';
          this.mode = state.mode || 'pomodoro';
          this.remainingMs = state.remainingMs || 0;
          this.totalMs = state.totalMs || 0;
          this.startTime = state.startTime;
          this.pausedAt = state.pausedAt;
          // 実行中だった場合は一時停止状態に
          if (this.state === 'running') {
            this.state = 'paused';
          }
        }
      } catch (e) {
        console.warn('タイマー状態の復元に失敗:', e);
      }
    }

    /**
     * Pomodoroタイマーを開始（25分作業）
     */
    startPomodoro() {
      this.mode = 'pomodoro';
      this.start(this.defaultWorkMinutes * 60 * 1000);
    }

    /**
     * 休憩タイマーを開始（5分休憩）
     */
    startBreak() {
      this.mode = 'pomodoro';
      this.start(this.defaultBreakMinutes * 60 * 1000, true);
    }

    /**
     * カスタムタイマーを開始
     */
    startCustom(minutes) {
      this.mode = 'custom';
      const ms = Math.max(1, Math.min(120, minutes || this.customMinutes)) * 60 * 1000;
      this.start(ms);
    }

    /**
     * タイマーを開始
     * @param {number} durationMs - タイマー時間（ミリ秒）
     * @param {boolean} isBreak - 休憩モードかどうか
     */
    start(durationMs, isBreak = false) {
      if (this.state === 'running') {
        this.stop();
      }
      this.remainingMs = durationMs;
      this.totalMs = durationMs;
      this.startTime = Date.now();
      this.pausedAt = null;
      this.state = isBreak ? 'break' : 'running';
      this.saveState();
      this.tick();
      this.intervalId = setInterval(() => this.tick(), 1000);
      this.notifyHUD('タイマー開始', 2000);
      this.dispatchEvent('start', { durationMs, isBreak });
    }

    /**
     * タイマーを一時停止
     */
    pause() {
      if (this.state !== 'running' && this.state !== 'break') return;
      this.pausedAt = Date.now();
      this.state = 'paused';
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      this.saveState();
      this.notifyHUD('一時停止', 2000);
      this.dispatchEvent('pause', { remainingMs: this.remainingMs });
    }

    /**
     * タイマーを再開
     */
    resume() {
      if (this.state !== 'paused') return;
      if (this.pausedAt) {
        // 一時停止中の経過時間を補正しない（残り時間はそのまま）
      }
      this.startTime = Date.now() - (this.totalMs - this.remainingMs);
      this.pausedAt = null;
      this.state = this.mode === 'pomodoro' && this.remainingMs === this.defaultBreakMinutes * 60 * 1000
        ? 'break'
        : 'running';
      this.saveState();
      this.tick();
      this.intervalId = setInterval(() => this.tick(), 1000);
      this.notifyHUD('再開', 2000);
      this.dispatchEvent('resume', { remainingMs: this.remainingMs });
    }

    /**
     * タイマーを停止
     */
    stop() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      const wasRunning = this.state === 'running' || this.state === 'break';
      this.state = 'idle';
      this.remainingMs = 0;
      this.totalMs = 0;
      this.startTime = null;
      this.pausedAt = null;
      this.saveState();
      if (wasRunning) {
        this.notifyHUD('タイマー停止', 2000);
        this.dispatchEvent('stop');
      }
    }

    /**
     * タイマーをリセット
     */
    reset() {
      this.stop();
      localStorage.removeItem('zenWriter_pomodoro_state');
      this.dispatchEvent('reset');
    }

    /**
     * タイマーの更新（1秒ごと）
     */
    tick() {
      if (this.state !== 'running' && this.state !== 'break') return;

      const now = Date.now();
      const elapsed = now - this.startTime;
      this.remainingMs = Math.max(0, this.totalMs - elapsed);

      if (this.remainingMs <= 0) {
        this.complete();
      } else {
        this.dispatchEvent('tick', {
          remainingMs: this.remainingMs,
          elapsedMs: elapsed,
          progress: (elapsed / this.totalMs) * 100
        });
      }
    }

    /**
     * タイマー完了
     */
    complete() {
      this.stop();
      const wasWork = this.state === 'running';
      const durationMinutes = Math.floor(this.totalMs / 60000);

      // セッション履歴に追加
      if (wasWork) {
        this.addSession({
          id: 'session_' + Date.now(),
          mode: this.mode,
          durationMinutes: durationMinutes,
          completedAt: Date.now()
        });
      }

      // 通知
      if (wasWork) {
        this.notifyHUD('作業時間が終了しました！休憩しましょう', 5000);
        // 音声通知（オプション）
        this.playNotificationSound();
      } else {
        this.notifyHUD('休憩時間が終了しました', 3000);
      }

      this.dispatchEvent('complete', {
        wasWork: wasWork,
        durationMinutes: durationMinutes
      });
    }

    /**
     * セッションを追加
     */
    addSession(session) {
      this.sessions.push(session);
      // 最新100件のみ保持
      if (this.sessions.length > 100) {
        this.sessions = this.sessions.slice(-100);
      }
      this.saveSessions();
      this.updateStats();
    }

    /**
     * 統計を更新
     */
    updateStats() {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayStartMs = todayStart.getTime();

      let totalMinutes = 0;
      let todayMinutes = 0;
      let todaySessions = 0;

      this.sessions.forEach(session => {
        totalMinutes += session.durationMinutes || 0;
        if (session.completedAt >= todayStartMs) {
          todayMinutes += session.durationMinutes || 0;
          todaySessions++;
        }
      });

      this.stats = {
        totalSessions: this.sessions.length,
        totalMinutes: totalMinutes,
        todaySessions: todaySessions,
        todayMinutes: todayMinutes
      };

      this.dispatchEvent('statsUpdated', this.stats);
    }

    /**
     * HUDに通知を送信
     */
    notifyHUD(message, duration = 2000) {
      try {
        if (window.ZenWriterHUD && typeof window.ZenWriterHUD.publish === 'function') {
          window.ZenWriterHUD.publish(message, duration);
        }
      } catch (e) {
        console.warn('HUD通知に失敗:', e);
      }
    }

    /**
     * 通知音を再生（オプション）
     */
    playNotificationSound() {
      try {
        // Web Audio APIで簡単な通知音を生成
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch (e) {
        // 音声通知が失敗しても続行
        console.warn('通知音の再生に失敗:', e);
      }
    }

    /**
     * イベントを発火
     */
    dispatchEvent(type, data = {}) {
      try {
        const event = new CustomEvent('pomodoro:' + type, {
          detail: data
        });
        window.dispatchEvent(event);
      } catch (e) {
        console.warn('イベント発火に失敗:', e);
      }
    }

    /**
     * 残り時間をフォーマット（MM:SS）
     */
    formatTime(ms) {
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    /**
     * 残り時間を取得
     */
    getRemainingTime() {
      return this.remainingMs;
    }

    /**
     * 進捗率を取得（0-100）
     */
    getProgress() {
      if (this.totalMs === 0) return 0;
      return ((this.totalMs - this.remainingMs) / this.totalMs) * 100;
    }

    /**
     * 現在の状態を取得
     */
    getState() {
      return {
        state: this.state,
        mode: this.mode,
        remainingMs: this.remainingMs,
        totalMs: this.totalMs,
        progress: this.getProgress(),
        stats: this.stats
      };
    }
  }

  // グローバルインスタンスを作成
  window.ZenWriterPomodoro = new PomodoroTimer();

  // ページ読み込み時に状態を復元
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ZenWriterPomodoro.restoreState();
    });
  } else {
    window.ZenWriterPomodoro.restoreState();
  }
})();
