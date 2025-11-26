(function () {
  'use strict';

  // Depends on gadgets-utils.js and gadgets-core.js
  var utils = window.ZWGadgetsUtils;
  var ZWGadgetsCore = window.ZWGadgetsCore;
  if (!utils || !ZWGadgetsCore) return;

  var ZWGadgetsInstance = new ZWGadgetsCore();

  // HUDSettings gadget (個別ファイル化)
  ZWGadgetsInstance.register('HUDSettings', function (el) {
    try {
      el.innerHTML = '';
      el.style.display = 'flex';
      el.style.flexDirection = 'column';
      el.style.gap = '12px';

      var storage = window.ZenWriterStorage;
      if (!storage || !storage.loadSettings) {
        el.textContent = (window.UILabels && window.UILabels.STORAGE_UNAVAILABLE) || 'ストレージが利用できません';
        return;
      }

      var settings = storage.loadSettings();
      var hud = settings.hud || {};
      var mergedHud = Object.assign({}, {
        position: 'bottom-left',
        duration: 1200,
        bg: '#000000',
        fg: '#ffffff',
        opacity: 0.75,
        message: '',
        pinned: false,
        width: 240,
        fontSize: 14
      }, hud);

      // 位置選択
      var posLabel = document.createElement('label');
      posLabel.textContent = (window.UILabels && window.UILabels.HUD_POSITION) || '位置:';
      var posSelect = document.createElement('select');
      posSelect.style.width = '100%';
      posSelect.style.padding = '4px';
      posSelect.style.border = '1px solid var(--border-color)';
      posSelect.style.borderRadius = '4px';
      posSelect.style.background = 'var(--bg-color)';
      posSelect.style.color = 'var(--text-color)';

      ['bottom-left', 'bottom-right', 'top-left', 'top-right'].forEach(function (pos) {
        var opt = document.createElement('option');
        opt.value = pos;
        var labelKey = 'POSITION_' + pos.replace('-', '_').toUpperCase();
        opt.textContent = (window.UILabels && window.UILabels[labelKey]) || pos.replace('-', ' ');
        if (mergedHud.position === pos) opt.selected = true;
        posSelect.appendChild(opt);
      });

      // 表示時間
      var durLabel = document.createElement('label');
      durLabel.textContent = (window.UILabels && window.UILabels.HUD_DURATION) || 'フェード時間 (ms):';
      var durInput = document.createElement('input');
      durInput.type = 'number';
      durInput.min = '500';
      durInput.max = '5000';
      durInput.step = '100';
      durInput.value = mergedHud.duration;
      durInput.style.width = '100%';
      durInput.style.padding = '4px';
      durInput.style.border = '1px solid var(--border-color)';
      durInput.style.borderRadius = '4px';

      // 背景色
      var bgLabel = document.createElement('label');
      bgLabel.textContent = (window.UILabels && window.UILabels.HUD_BACKGROUND) || '背景色:';
      var bgInput = document.createElement('input');
      bgInput.type = 'color';
      bgInput.value = mergedHud.bg;
      bgInput.style.width = '100%';
      bgInput.style.height = '32px';

      // 文字色
      var fgLabel = document.createElement('label');
      fgLabel.textContent = (window.UILabels && window.UILabels.HUD_TEXT_COLOR) || '文字色:';
      var fgInput = document.createElement('input');
      fgInput.type = 'color';
      fgInput.value = mergedHud.fg;
      fgInput.style.width = '100%';
      fgInput.style.height = '32px';

      // 不透明度
      var opLabel = document.createElement('label');
      opLabel.textContent = (window.UILabels && window.UILabels.HUD_OPACITY_PREFIX) || '不透明度:';
      var opInput = document.createElement('input');
      opInput.type = 'range';
      opInput.min = '0.1';
      opInput.max = '1.0';
      opInput.step = '0.05';
      opInput.value = mergedHud.opacity;
      opInput.style.width = '100%';

      var opValue = document.createElement('span');
      opValue.textContent = Math.round(mergedHud.opacity * 100) + '%';
      opValue.style.fontSize = '12px';
      opValue.style.marginLeft = '8px';

      opInput.addEventListener('input', function () {
        opValue.textContent = Math.round(this.value * 100) + '%';
      });

      // 幅
      var widthLabel = document.createElement('label');
      widthLabel.textContent = (window.UILabels && window.UILabels.HUD_WIDTH) || '幅 (px):';
      var widthInput = document.createElement('input');
      widthInput.type = 'number';
      widthInput.min = '120';
      widthInput.max = '800';
      widthInput.step = '10';
      widthInput.value = mergedHud.width;
      widthInput.style.width = '100%';
      widthInput.style.padding = '4px';
      widthInput.style.border = '1px solid var(--border-color)';
      widthInput.style.borderRadius = '4px';

      // フォントサイズ
      var fsLabel = document.createElement('label');
      fsLabel.textContent = (window.UILabels && window.UILabels.HUD_FONT_SIZE) || 'フォントサイズ (px):';
      var fsInput = document.createElement('input');
      fsInput.type = 'number';
      fsInput.min = '10';
      fsInput.max = '24';
      fsInput.step = '1';
      fsInput.value = mergedHud.fontSize;
      fsInput.style.width = '100%';
      fsInput.style.padding = '4px';
      fsInput.style.border = '1px solid var(--border-color)';
      fsInput.style.borderRadius = '4px';

      // メッセージ
      var msgLabel = document.createElement('label');
      msgLabel.textContent = (window.UILabels && window.UILabels.HUD_MESSAGE_LABEL) || 'メッセージ:';
      var msgInput = document.createElement('input');
      msgInput.type = 'text';
      msgInput.placeholder = (window.UILabels && window.UILabels.HUD_MESSAGE_PLACEHOLDER) || 'HUDに表示するメッセージ';
      msgInput.value = mergedHud.message;
      msgInput.style.width = '100%';
      msgInput.style.padding = '4px';
      msgInput.style.border = '1px solid var(--border-color)';
      msgInput.style.borderRadius = '4px';

      // ピン留め
      var pinLabel = document.createElement('label');
      pinLabel.style.display = 'flex';
      pinLabel.style.alignItems = 'center';
      pinLabel.style.gap = '8px';
      var pinInput = document.createElement('input');
      pinInput.type = 'checkbox';
      pinInput.checked = mergedHud.pinned;
      pinLabel.appendChild(pinInput);
      pinLabel.appendChild(document.createTextNode((window.UILabels && window.UILabels.HUD_PINNED_LABEL) || '常に表示'));

      // 保存ボタン
      var saveBtn = document.createElement('button');
      saveBtn.className = 'small';
      saveBtn.textContent = (window.UILabels && window.UILabels.BTN_SAVE_SETTINGS) || '設定を保存';
      saveBtn.addEventListener('click', function () {
        var updatedHud = {
          position: posSelect.value,
          duration: parseInt(durInput.value) || 1200,
          bg: bgInput.value,
          fg: fgInput.value,
          opacity: parseFloat(opInput.value) || 0.75,
          message: msgInput.value.trim(),
          pinned: pinInput.checked,
          width: parseInt(widthInput.value) || 240,
          fontSize: parseInt(fsInput.value) || 14
        };

        settings.hud = updatedHud;
        storage.saveSettings(settings);

        // HUDに即時反映
        if (window.ZenWriterHUD && window.ZenWriterHUD.applyConfig) {
          window.ZenWriterHUD.applyConfig(updatedHud);
        }

        alert((window.UILabels && window.UILabels.HUD_SAVED_MESSAGE) || 'HUD設定を保存しました');
      });

      // レイアウト
      el.appendChild(posLabel);
      el.appendChild(posSelect);
      el.appendChild(durLabel);
      el.appendChild(durInput);
      el.appendChild(bgLabel);
      el.appendChild(bgInput);
      el.appendChild(fgLabel);
      el.appendChild(fgInput);

      var opRow = document.createElement('div');
      opRow.style.display = 'flex';
      opRow.style.alignItems = 'center';
      opRow.appendChild(opLabel);
      opRow.appendChild(opValue);
      el.appendChild(opRow);
      el.appendChild(opInput);

      el.appendChild(widthLabel);
      el.appendChild(widthInput);
      el.appendChild(fsLabel);
      el.appendChild(fsInput);
      el.appendChild(msgLabel);
      el.appendChild(msgInput);
      el.appendChild(pinLabel);
      el.appendChild(saveBtn);

    } catch (e) {
      console.error('HUDSettings gadget failed:', e);
      el.textContent = (window.UILabels && window.UILabels.HUD_INIT_FAILED) || 'HUD設定ガジェットの初期化に失敗しました。';
    }
  }, { groups: ['assist'], title: (window.UILabels && window.UILabels.GADGET_HUD_TITLE) || 'HUD設定' });

})();
