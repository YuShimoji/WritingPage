// Pomodoro/集中タイマーガジェット
(function () {
  'use strict';

  var ZWGadgets = window.ZWGadgets;
  if (!ZWGadgets) return;

  /**
   * Pomodoroタイマーガジェット
   */
  ZWGadgets.register('PomodoroTimer', function (el, _api) {
    try {
      var timer = window.ZenWriterPomodoro;
      if (!timer) {
        el.textContent = (window.UILabels && window.UILabels.POMODORO_UNAVAILABLE) || 'タイマーが利用できません';
        return;
      }

      // コンテナ
      var container = document.createElement('div');
      container.className = 'gadget-pomodoro';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '12px';

      // タイマー表示エリア
      var displayArea = document.createElement('div');
      displayArea.className = 'pomodoro-display';
      displayArea.style.textAlign = 'center';
      displayArea.style.padding = '16px';
      displayArea.style.borderRadius = '8px';
      displayArea.style.background = 'var(--sidebar-bg, #f5f5f5)';
      displayArea.style.border = '1px solid var(--border-color, #e0e0e0)';

      // 時間表示
      var timeDisplay = document.createElement('div');
      timeDisplay.className = 'pomodoro-time';
      timeDisplay.style.fontSize = '32px';
      timeDisplay.style.fontWeight = 'bold';
      timeDisplay.style.fontFamily = 'monospace';
      timeDisplay.style.marginBottom = '8px';
      timeDisplay.textContent = '25:00';

      // 状態表示
      var stateDisplay = document.createElement('div');
      stateDisplay.className = 'pomodoro-state';
      stateDisplay.style.fontSize = '14px';
      stateDisplay.style.opacity = '0.7';
      stateDisplay.textContent = '待機中';

      // 進捗バー
      var progressBar = document.createElement('div');
      progressBar.className = 'pomodoro-progress';
      progressBar.style.width = '100%';
      progressBar.style.height = '4px';
      progressBar.style.background = 'var(--border-color, #e0e0e0)';
      progressBar.style.borderRadius = '2px';
      progressBar.style.marginTop = '12px';
      progressBar.style.overflow = 'hidden';

      var progressFill = document.createElement('div');
      progressFill.className = 'pomodoro-progress-fill';
      progressFill.style.height = '100%';
      progressFill.style.width = '0%';
      progressFill.style.background = 'var(--ui-focus-color, #4a90e2)';
      progressFill.style.transition = 'width 0.3s ease';
      progressBar.appendChild(progressFill);

      displayArea.appendChild(timeDisplay);
      displayArea.appendChild(stateDisplay);
      displayArea.appendChild(progressBar);

      // コントロールボタン
      var controlsArea = document.createElement('div');
      controlsArea.className = 'pomodoro-controls';
      controlsArea.style.display = 'flex';
      controlsArea.style.flexDirection = 'column';
      controlsArea.style.gap = '8px';

      // モード選択
      var modeRow = document.createElement('div');
      modeRow.style.display = 'flex';
      modeRow.style.gap = '4px';

      var pomodoroBtn = document.createElement('button');
      pomodoroBtn.type = 'button';
      pomodoroBtn.className = 'small';
      pomodoroBtn.textContent = (window.UILabels && window.UILabels.POMODORO_MODE) || 'Pomodoro';
      pomodoroBtn.style.flex = '1';

      var customBtn = document.createElement('button');
      customBtn.type = 'button';
      customBtn.className = 'small';
      customBtn.textContent = (window.UILabels && window.UILabels.CUSTOM_MODE) || 'カスタム';
      customBtn.style.flex = '1';

      modeRow.appendChild(pomodoroBtn);
      modeRow.appendChild(customBtn);

      // カスタム時間入力
      var customInputRow = document.createElement('div');
      customInputRow.className = 'pomodoro-custom-input';
      customInputRow.style.display = 'none';
      customInputRow.style.gap = '4px';
      customInputRow.style.alignItems = 'center';

      var customLabel = document.createElement('label');
      customLabel.textContent = (window.UILabels && window.UILabels.CUSTOM_MINUTES) || '時間（分）:';
      customLabel.style.fontSize = '12px';

      var customInput = document.createElement('input');
      customInput.type = 'number';
      customInput.min = '1';
      customInput.max = '120';
      customInput.value = '25';
      customInput.style.width = '60px';
      customInput.style.padding = '2px 4px';

      customInputRow.appendChild(customLabel);
      customInputRow.appendChild(customInput);

      // メインコントロールボタン
      var mainControlsRow = document.createElement('div');
      mainControlsRow.style.display = 'flex';
      mainControlsRow.style.gap = '4px';

      var startBtn = document.createElement('button');
      startBtn.type = 'button';
      startBtn.className = 'small';
      startBtn.textContent = (window.UILabels && window.UILabels.START) || '開始';
      startBtn.style.flex = '1';

      var pauseBtn = document.createElement('button');
      pauseBtn.type = 'button';
      pauseBtn.className = 'small';
      pauseBtn.textContent = (window.UILabels && window.UILabels.PAUSE) || '一時停止';
      pauseBtn.style.flex = '1';
      pauseBtn.style.display = 'none';

      var resumeBtn = document.createElement('button');
      resumeBtn.type = 'button';
      resumeBtn.className = 'small';
      resumeBtn.textContent = (window.UILabels && window.UILabels.RESUME) || '再開';
      resumeBtn.style.flex = '1';
      resumeBtn.style.display = 'none';

      var stopBtn = document.createElement('button');
      stopBtn.type = 'button';
      stopBtn.className = 'small';
      stopBtn.textContent = (window.UILabels && window.UILabels.STOP) || '停止';
      stopBtn.style.flex = '1';
      stopBtn.style.display = 'none';

      mainControlsRow.appendChild(startBtn);
      mainControlsRow.appendChild(pauseBtn);
      mainControlsRow.appendChild(resumeBtn);
      mainControlsRow.appendChild(stopBtn);

      // 統計表示
      var statsArea = document.createElement('div');
      statsArea.className = 'pomodoro-stats';
      statsArea.style.fontSize = '12px';
      statsArea.style.opacity = '0.7';
      statsArea.style.marginTop = '8px';
      statsArea.style.paddingTop = '8px';
      statsArea.style.borderTop = '1px solid var(--border-color, #e0e0e0)';

      var statsText = document.createElement('div');
      statsText.className = 'pomodoro-stats-text';
      statsArea.appendChild(statsText);

      controlsArea.appendChild(modeRow);
      controlsArea.appendChild(customInputRow);
      controlsArea.appendChild(mainControlsRow);
      controlsArea.appendChild(statsArea);

      container.appendChild(displayArea);
      container.appendChild(controlsArea);
      el.appendChild(container);

      // 更新関数
      var updateDisplay = function () {
        var state = timer.getState();
        timeDisplay.textContent = timer.formatTime(state.remainingMs);
        var progress = state.progress;
        progressFill.style.width = progress + '%';

        // 状態表示
        var stateText = '';
        if (state.state === 'idle') {
          stateText = (window.UILabels && window.UILabels.POMODORO_IDLE) || '待機中';
        } else if (state.state === 'running') {
          stateText = (window.UILabels && window.UILabels.POMODORO_RUNNING) || '作業中';
        } else if (state.state === 'break') {
          stateText = (window.UILabels && window.UILabels.POMODORO_BREAK) || '休憩中';
        } else if (state.state === 'paused') {
          stateText = (window.UILabels && window.UILabels.POMODORO_PAUSED) || '一時停止';
        }
        stateDisplay.textContent = stateText;

        // ボタン表示制御
        if (state.state === 'idle') {
          startBtn.style.display = 'block';
          pauseBtn.style.display = 'none';
          resumeBtn.style.display = 'none';
          stopBtn.style.display = 'none';
        } else if (state.state === 'running' || state.state === 'break') {
          startBtn.style.display = 'none';
          pauseBtn.style.display = 'block';
          resumeBtn.style.display = 'none';
          stopBtn.style.display = 'block';
        } else if (state.state === 'paused') {
          startBtn.style.display = 'none';
          pauseBtn.style.display = 'none';
          resumeBtn.style.display = 'block';
          stopBtn.style.display = 'block';
        }

        // 統計更新
        var stats = state.stats;
        var statsMsg = '';
        if (stats.todaySessions > 0) {
          statsMsg = '今日: ' + stats.todaySessions + 'セッション、' + stats.todayMinutes + '分';
        } else {
          statsMsg = (window.UILabels && window.UILabels.POMODORO_NO_SESSIONS) || 'セッション履歴なし';
        }
        statsText.textContent = statsMsg;
      };

      // イベントリスナー
      var handleTimerEvent = function (_e) {
        updateDisplay();
      };

      window.addEventListener('pomodoro:start', handleTimerEvent);
      window.addEventListener('pomodoro:pause', handleTimerEvent);
      window.addEventListener('pomodoro:resume', handleTimerEvent);
      window.addEventListener('pomodoro:stop', handleTimerEvent);
      window.addEventListener('pomodoro:complete', handleTimerEvent);
      window.addEventListener('pomodoro:tick', handleTimerEvent);
      window.addEventListener('pomodoro:statsUpdated', handleTimerEvent);

      // ガジェット削除時にイベントリスナーを解除
      el.addEventListener('removed', function () {
        window.removeEventListener('pomodoro:start', handleTimerEvent);
        window.removeEventListener('pomodoro:pause', handleTimerEvent);
        window.removeEventListener('pomodoro:resume', handleTimerEvent);
        window.removeEventListener('pomodoro:stop', handleTimerEvent);
        window.removeEventListener('pomodoro:complete', handleTimerEvent);
        window.removeEventListener('pomodoro:tick', handleTimerEvent);
        window.removeEventListener('pomodoro:statsUpdated', handleTimerEvent);
      }, { once: true });

      // ボタンイベント
      var currentMode = 'pomodoro';
      pomodoroBtn.addEventListener('click', function () {
        currentMode = 'pomodoro';
        pomodoroBtn.style.background = 'var(--ui-focus-color, #4a90e2)';
        pomodoroBtn.style.color = '#fff';
        customBtn.style.background = '';
        customBtn.style.color = '';
        customInputRow.style.display = 'none';
      });
      pomodoroBtn.click(); // 初期状態

      customBtn.addEventListener('click', function () {
        currentMode = 'custom';
        customBtn.style.background = 'var(--ui-focus-color, #4a90e2)';
        customBtn.style.color = '#fff';
        pomodoroBtn.style.background = '';
        pomodoroBtn.style.color = '';
        customInputRow.style.display = 'flex';
      });

      startBtn.addEventListener('click', function () {
        if (currentMode === 'pomodoro') {
          timer.startPomodoro();
        } else {
          var minutes = parseInt(customInput.value, 10) || 25;
          timer.startCustom(minutes);
        }
        updateDisplay();
      });

      pauseBtn.addEventListener('click', function () {
        timer.pause();
        updateDisplay();
      });

      resumeBtn.addEventListener('click', function () {
        timer.resume();
        updateDisplay();
      });

      stopBtn.addEventListener('click', function () {
        if (confirm((window.UILabels && window.UILabels.POMODORO_STOP_CONFIRM) || 'タイマーを停止しますか？')) {
          timer.stop();
          updateDisplay();
        }
      });

      // 初期表示
      updateDisplay();

      // 1秒ごとに更新（tickイベントが発火しない場合のフォールバック）
      var updateInterval = setInterval(function () {
        if (timer.state === 'running' || timer.state === 'break') {
          updateDisplay();
        }
      }, 1000);

      el.addEventListener('removed', function () {
        clearInterval(updateInterval);
      }, { once: true });

    } catch (e) {
      console.error('PomodoroTimer gadget failed:', e);
      el.textContent = (window.UILabels && window.UILabels.POMODORO_INIT_FAILED) || 'タイマーガジェットの初期化に失敗しました';
    }
  }, {
    groups: ['settings'],
    title: (window.UILabels && window.UILabels.GADGET_POMODORO_TITLE) || 'Pomodoro/集中タイマー'
  });

  /**
   * Pomodoro設定ガジェット
   */
  ZWGadgets.registerSettings('PomodoroTimer', function (el, _ctx) {
    try {
      var timer = window.ZenWriterPomodoro;
      if (!timer) {
        el.textContent = (window.UILabels && window.UILabels.POMODORO_UNAVAILABLE) || 'タイマーが利用できません';
        return;
      }

      var container = document.createElement('div');
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '12px';

      // 作業時間設定
      var workRow = document.createElement('label');
      workRow.style.display = 'flex';
      workRow.style.alignItems = 'center';
      workRow.style.gap = '8px';
      workRow.textContent = (window.UILabels && window.UILabels.POMODORO_WORK_MINUTES) || '作業時間（分）:';

      var workInput = document.createElement('input');
      workInput.type = 'number';
      workInput.min = '1';
      workInput.max = '120';
      workInput.value = timer.defaultWorkMinutes;
      workInput.style.width = '60px';
      workInput.addEventListener('change', function () {
        var minutes = Math.max(1, Math.min(120, parseInt(workInput.value, 10) || 25));
        timer.defaultWorkMinutes = minutes;
        timer.saveSettings();
      });

      workRow.appendChild(workInput);
      container.appendChild(workRow);

      // 休憩時間設定
      var breakRow = document.createElement('label');
      breakRow.style.display = 'flex';
      breakRow.style.alignItems = 'center';
      breakRow.style.gap = '8px';
      breakRow.textContent = (window.UILabels && window.UILabels.POMODORO_BREAK_MINUTES) || '休憩時間（分）:';

      var breakInput = document.createElement('input');
      breakInput.type = 'number';
      breakInput.min = '1';
      breakInput.max = '60';
      breakInput.value = timer.defaultBreakMinutes;
      breakInput.style.width = '60px';
      breakInput.addEventListener('change', function () {
        var minutes = Math.max(1, Math.min(60, parseInt(breakInput.value, 10) || 5));
        timer.defaultBreakMinutes = minutes;
        timer.saveSettings();
      });

      breakRow.appendChild(breakInput);
      container.appendChild(breakRow);

      // カスタム時間のデフォルト設定
      var customRow = document.createElement('label');
      customRow.style.display = 'flex';
      customRow.style.alignItems = 'center';
      customRow.style.gap = '8px';
      customRow.textContent = (window.UILabels && window.UILabels.POMODORO_CUSTOM_DEFAULT) || 'カスタム時間のデフォルト（分）:';

      var customInput = document.createElement('input');
      customInput.type = 'number';
      customInput.min = '1';
      customInput.max = '120';
      customInput.value = timer.customMinutes;
      customInput.style.width = '60px';
      customInput.addEventListener('change', function () {
        var minutes = Math.max(1, Math.min(120, parseInt(customInput.value, 10) || 25));
        timer.customMinutes = minutes;
        timer.saveSettings();
      });

      customRow.appendChild(customInput);
      container.appendChild(customRow);

      el.appendChild(container);
    } catch (e) {
      console.error('PomodoroTimer settings failed:', e);
      el.textContent = (window.UILabels && window.UILabels.POMODORO_SETTINGS_FAILED) || '設定の読み込みに失敗しました';
    }
  });

})();
