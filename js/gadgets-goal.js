(function () {
  'use strict';

  // Depends on gadgets-utils.js and gadgets-core.js
  var utils = window.ZWGadgetsUtils;
  var ZWGadgets = window.ZWGadgets;
  if (!utils || !ZWGadgets) return;

  // WritingGoal gadget (個別ファイル化)
  ZWGadgets.register('WritingGoal', function (el, api) {
    try {
      var storage = window.ZenWriterStorage;
      var editor = window.ZenWriterEditor;
      if (!storage) {
        var warn = document.createElement('p');
        warn.textContent = (window.UILabels && window.UILabels.GOAL_STORAGE_UNAVAILABLE) || 'ストレージが利用できません。';
        warn.style.opacity = '0.7'; warn.style.fontSize = '0.9rem';
        el.appendChild(warn);
        return;
      }

      var goal = api && typeof api.get === 'function' ? api.get('goal', {}) : {};
      // 初期状態をアプリ設定から上書き（存在すれば）
      try {
        var s0 = storage && typeof storage.loadSettings === 'function' ? storage.loadSettings() : null;
        if (s0 && s0.goal) {
          goal = Object.assign({}, goal, s0.goal);
        }
      } catch (_) { }

      var wrap = document.createElement('div');
      wrap.className = 'gadget-goal';
      wrap.style.display = 'flex';
      wrap.style.flexDirection = 'column';
      wrap.style.gap = '8px';

      var target = document.createElement('input');
      target.type = 'number'; target.min = '0'; target.placeholder = (window.UILabels && window.UILabels.GOAL_TARGET_PLACEHOLDER) || '例: 2000';
      target.value = (typeof goal.target === 'number' ? goal.target : parseInt(goal.target, 10) || 0);
      target.addEventListener('input', function (e) {
        var n = Math.max(0, parseInt(e.target.value, 10) || 0);
        var newGoal = Object.assign({}, goal, { target: n });
        if (api && typeof api.set === 'function') api.set('goal', newGoal);
        // アプリ設定へ同期
        try {
          var s = storage.loadSettings();
          s.goal = Object.assign({}, s.goal || {}, { target: n });
          storage.saveSettings(s);
        } catch (_) { }
        try { editor && editor.updateWordCount && editor.updateWordCount(); } catch (_) { }
      });

      var deadline = document.createElement('input');
      deadline.type = 'date'; deadline.value = goal.deadline || '';
      deadline.addEventListener('change', function (e) {
        var newGoal = Object.assign({}, goal, { deadline: e.target.value || '' });
        if (api && typeof api.set === 'function') api.set('goal', newGoal);
        // アプリ設定へ同期
        try {
          var s = storage.loadSettings();
          s.goal = Object.assign({}, s.goal || {}, { deadline: (e.target.value || '') });
          storage.saveSettings(s);
        } catch (_) { }
        try { editor && editor.updateWordCount && editor.updateWordCount(); } catch (_) { }
      }
      );

      var row1 = document.createElement('label'); row1.style.display = 'flex'; row1.style.flexDirection = 'column'; row1.style.gap = '4px'; row1.textContent = (window.UILabels && window.UILabels.GOAL_TARGET) || '目標文字数'; row1.appendChild(target);
      var row2 = document.createElement('label'); row2.style.display = 'flex'; row2.style.flexDirection = 'column'; row2.style.gap = '4px'; row2.textContent = (window.UILabels && window.UILabels.DEADLINE) || '締切日'; row2.appendChild(deadline);

      var reset = document.createElement('button'); reset.type = 'button'; reset.className = 'small'; reset.textContent = (window.UILabels && window.UILabels.CLEAR_GOAL) || '目標をクリア';
      reset.addEventListener('click', function () {
        if (confirm((window.UILabels && window.UILabels.CLEAR_GOAL_CONFIRM) || '執筆目標をクリアしますか？')) {
          if (api && typeof api.set === 'function') api.set('goal', {});
          try {
            var s = storage.loadSettings();
            s.goal = { target: 0, deadline: null };
            storage.saveSettings(s);
          } catch (_) { }
          target.value = 0; deadline.value = '';
          try { editor && editor.updateWordCount && editor.updateWordCount(); } catch (_) { }
        }
      });

      wrap.appendChild(row1);
      wrap.appendChild(row2);
      wrap.appendChild(reset);
      el.appendChild(wrap);
      // 初期同期（表示とroot属性の更新）
      try { editor && editor.updateWordCount && editor.updateWordCount(); } catch (_) { }
    } catch (e) {
      console.error('WritingGoal gadget failed:', e);
      try { el.textContent = (window.UILabels && window.UILabels.GOAL_INIT_FAILED) || '執筆目標ガジェットの初期化に失敗しました。'; } catch (_) { }
    }
  }, { groups: ['assist'], title: (window.UILabels && window.UILabels.GADGET_GOAL_TITLE) || '執筆目標' });

})();
