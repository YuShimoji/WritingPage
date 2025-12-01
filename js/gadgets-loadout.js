/**
 * gadgets-loadout.js
 * ロードアウト管理UIモジュール
 * サイドバー上部に配置されるロードアウト選択・管理機能
 */
(function () {
  'use strict';

  /**
   * ロードアウトUIを初期化
   * @param {string} containerSelector - コンテナのセレクタ（デフォルト: .sidebar-loadout）
   */
  function initLoadoutUI(containerSelector) {
    var container = document.querySelector(containerSelector || '.sidebar-loadout');
    if (!container) return;

    // 既存のコンテンツをクリア
    container.innerHTML = '';

    // UI要素を動的に生成
    var label = document.createElement('label');
    label.setAttribute('for', 'loadout-select');
    label.textContent = (window.UILabels && window.UILabels.LOADOUT_LABEL) || 'ロードアウト';
    label.setAttribute('data-i18n', 'LOADOUT_LABEL');

    var controls = document.createElement('div');
    controls.className = 'loadout-controls';

    var select = document.createElement('select');
    select.id = 'loadout-select';
    select.setAttribute('aria-label', (window.UILabels && window.UILabels.LOADOUT_SELECT_ARIA) || 'ロードアウトを選択');

    var nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'loadout-name';
    nameInput.placeholder = (window.UILabels && window.UILabels.PRESET_NAME_PLACEHOLDER) || 'プリセット名';
    nameInput.setAttribute('data-i18n-placeholder', 'PRESET_NAME_PLACEHOLDER');
    nameInput.setAttribute('aria-label', (window.UILabels && window.UILabels.LOADOUT_NAME_ARIA) || 'ロードアウト名');

    var buttons = document.createElement('div');
    buttons.className = 'loadout-buttons';

    function createButton(id, i18nKey, defaultText) {
      var btn = document.createElement('button');
      btn.id = id;
      btn.className = 'small';
      btn.type = 'button';
      btn.textContent = (window.UILabels && window.UILabels[i18nKey]) || defaultText;
      btn.setAttribute('data-i18n', i18nKey);
      return btn;
    }

    var saveBtn = createButton('loadout-save', 'SAVE', '保存');
    var duplicateBtn = createButton('loadout-duplicate', 'DUPLICATE', '複製');
    var applyBtn = createButton('loadout-apply', 'APPLY', '適用');
    var deleteBtn = createButton('loadout-delete', 'DELETE', '削除');

    buttons.appendChild(saveBtn);
    buttons.appendChild(duplicateBtn);
    buttons.appendChild(applyBtn);
    buttons.appendChild(deleteBtn);

    controls.appendChild(select);
    controls.appendChild(nameInput);
    controls.appendChild(buttons);

    container.appendChild(label);
    container.appendChild(controls);

    // イベントリスナーを設定
    setupEventListeners(select, nameInput, saveBtn, duplicateBtn, applyBtn, deleteBtn);

    // 初期ロードアウトリストを設定
    refreshLoadoutSelect(select);
  }

  /**
   * ロードアウト選択を更新
   * @param {HTMLSelectElement} select
   */
  function refreshLoadoutSelect(select) {
    if (!select || !window.ZWGadgets) return;
    select.innerHTML = '';
    var loadouts = window.ZWGadgets.listLoadouts ? window.ZWGadgets.listLoadouts() : [];
    loadouts.forEach(function (l) {
      var opt = document.createElement('option');
      opt.value = l.name;
      opt.textContent = l.label || l.name;
      select.appendChild(opt);
    });
    // 現在のアクティブロードアウトを選択
    var active = window.ZWGadgets._loadouts && window.ZWGadgets._loadouts.active;
    if (active && select.querySelector('option[value="' + active + '"]')) {
      select.value = active;
    }
  }

  /**
   * イベントリスナーを設定
   */
  function setupEventListeners(select, nameInput, saveBtn, duplicateBtn, applyBtn, deleteBtn) {
    if (!window.ZWGadgets) return;

    // 選択変更
    select.addEventListener('change', function () {
      var selected = select.value;
      if (selected) {
        var loadouts = window.ZWGadgets.listLoadouts ? window.ZWGadgets.listLoadouts() : [];
        var entry = loadouts.find(function (l) { return l.name === selected; });
        if (entry && nameInput) {
          nameInput.value = entry.label || '';
        }
      }
    });

    // 保存
    saveBtn.addEventListener('click', function () {
      var name = select.value;
      var label = nameInput.value.trim();
      if (!label) {
        alert((window.UILabels && window.UILabels.LOADOUT_NAME_PROMPT) || 'ロードアウト名を入力してください');
        return;
      }
      if (!name) {
        name = 'loadout_' + Date.now().toString(36);
      }
      var config = window.ZWGadgets.captureCurrentLoadout ? window.ZWGadgets.captureCurrentLoadout(label) : { label: label, groups: {} };
      if (window.ZWGadgets.defineLoadout) {
        window.ZWGadgets.defineLoadout(name, config);
      }
      alert((window.UILabels && window.UILabels.LOADOUT_SAVED) || 'ロードアウトを保存しました');
      refreshLoadoutSelect(select);
      select.value = name;
    });

    // 複製
    duplicateBtn.addEventListener('click', function () {
      var selected = select.value;
      if (!selected) {
        alert((window.UILabels && window.UILabels.LOADOUT_SELECT_TO_DUPLICATE) || '複製するロードアウトを選択してください');
        return;
      }
      var loadouts = window.ZWGadgets.listLoadouts ? window.ZWGadgets.listLoadouts() : [];
      var entry = loadouts.find(function (l) { return l.name === selected; });
      if (!entry) return;
      var newName = 'loadout_' + Date.now().toString(36);
      var newLabel = (nameInput.value.trim() || entry.label) + ((window.UILabels && window.UILabels.LOADOUT_DUPLICATE_SUFFIX) || ' (複製)');
      if (window.ZWGadgets.defineLoadout) {
        window.ZWGadgets.defineLoadout(newName, { label: newLabel, groups: entry.groups || {} });
      }
      alert((window.UILabels && window.UILabels.LOADOUT_DUPLICATED) || 'ロードアウトを複製しました');
      refreshLoadoutSelect(select);
      select.value = newName;
    });

    // 適用
    applyBtn.addEventListener('click', function () {
      var selected = select.value;
      if (!selected) return;
      if (window.ZWGadgets.applyLoadout) {
        window.ZWGadgets.applyLoadout(selected);
      }
      alert((window.UILabels && window.UILabels.LOADOUT_APPLIED) || 'ロードアウトを適用しました');
    });

    // 削除
    deleteBtn.addEventListener('click', function () {
      var selected = select.value;
      if (!selected) return;
      if (!confirm((window.UILabels && window.UILabels.LOADOUT_DELETE_CONFIRM) || 'このロードアウトを削除しますか？')) return;
      if (window.ZWGadgets.removeLoadout) {
        window.ZWGadgets.removeLoadout(selected);
      }
      alert((window.UILabels && window.UILabels.LOADOUT_DELETED) || 'ロードアウトを削除しました');
      refreshLoadoutSelect(select);
    });
  }

  // グローバルに公開
  window.ZWLoadoutUI = {
    init: initLoadoutUI,
    refresh: function () {
      var select = document.getElementById('loadout-select');
      if (select) refreshLoadoutSelect(select);
    }
  };

  // DOMContentLoaded で自動初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initLoadoutUI('.sidebar-loadout');
    });
  } else {
    initLoadoutUI('.sidebar-loadout');
  }
})();
