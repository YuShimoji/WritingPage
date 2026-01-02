/**
 * gadgets-loadout.js
 * ロードアウト管理ガジェット
 * ZWGadgetsフレームワークを使用してロードアウト機能を実装
 */
(function () {
  'use strict';

  if (!window.ZWGadgets || !window.ZWGadgets.register) return;

  ZWGadgets.register('LoadoutManager', function (el, api) {
    // コンテナ作成（既存スタイル継承のため sidebar-loadout クラス付与）
    var container = document.createElement('div');
    container.className = 'sidebar-loadout gadget-loadout-manager';
    container.style.marginTop = '0'; // ガジェット内の余白調整
    container.style.padding = '0';   // パディング調整

    // UI要素構築
    var label = document.createElement('label');
    label.setAttribute('for', 'loadout-select');
    label.textContent = (window.UILabels && window.UILabels.LOADOUT_LABEL) || 'ロードアウト';
    label.setAttribute('data-i18n', 'LOADOUT_LABEL');

    var controls = document.createElement('div');
    controls.className = 'loadout-controls';

    var select = document.createElement('select');
    select.id = 'loadout-select'; // app.jsとの互換性のため
    select.setAttribute('data-gadget-id', 'gadget-loadout-select'); // ガジェット用の識別子
    select.setAttribute('aria-label', (window.UILabels && window.UILabels.LOADOUT_SELECT_ARIA) || 'ロードアウトを選択');
    select.style.width = '100%';

    var nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'loadout-name'; // app.jsとの互換性のため
    nameInput.setAttribute('data-gadget-id', 'gadget-loadout-name'); // ガジェット用の識別子
    nameInput.placeholder = (window.UILabels && window.UILabels.PRESET_NAME_PLACEHOLDER) || 'プリセット名';
    nameInput.setAttribute('data-i18n-placeholder', 'PRESET_NAME_PLACEHOLDER');
    nameInput.setAttribute('aria-label', (window.UILabels && window.UILabels.LOADOUT_NAME_ARIA) || 'ロードアウト名');
    nameInput.style.width = '100%';

    var buttons = document.createElement('div');
    buttons.className = 'loadout-buttons';

    function createButton(i18nKey, defaultText, id) {
      var btn = document.createElement('button');
      btn.className = 'small';
      btn.type = 'button';
      if (id) btn.id = id;
      btn.textContent = (window.UILabels && window.UILabels[i18nKey]) || defaultText;
      btn.setAttribute('data-i18n', i18nKey);
      return btn;
    }

    var saveBtn = createButton('LOADOUT_SAVE', '保存', 'loadout-save');
    var duplicateBtn = createButton('LOADOUT_DUPLICATE', '複製', 'loadout-duplicate');
    var applyBtn = createButton('LOADOUT_APPLY', '適用', 'loadout-apply');
    var deleteBtn = createButton('LOADOUT_DELETE', '削除', 'loadout-delete');

    buttons.appendChild(saveBtn);
    buttons.appendChild(duplicateBtn);
    buttons.appendChild(applyBtn);
    buttons.appendChild(deleteBtn);

    controls.appendChild(select);
    controls.appendChild(nameInput);
    controls.appendChild(buttons);

    container.appendChild(label);
    container.appendChild(controls);
    el.appendChild(container);

    // ヘルパー関数: リスト更新
    function refreshList() {
      if (!window.ZWGadgets) return;
      select.innerHTML = '';
      var loadouts = window.ZWGadgets.listLoadouts ? window.ZWGadgets.listLoadouts() : [];
      loadouts.forEach(function (l) {
        var opt = document.createElement('option');
        opt.value = l.name;
        opt.textContent = l.label || l.name;
        select.appendChild(opt);
      });
      var active = window.ZWGadgets._loadouts && window.ZWGadgets._loadouts.active;
      if (active && select.querySelector('option[value="' + active + '"]')) {
        select.value = active;
      }
      // 名前入力欄も更新
      updateNameInput();
    }

    function updateNameInput() {
      var selected = select.value;
      if (selected) {
        var loadouts = window.ZWGadgets.listLoadouts ? window.ZWGadgets.listLoadouts() : [];
        var entry = loadouts.find(function (l) { return l.name === selected; });
        if (entry) {
          nameInput.value = entry.label || '';
        }
      } else {
        nameInput.value = '';
      }
    }

    // イベントリスナー
    select.addEventListener('change', updateNameInput);

    saveBtn.addEventListener('click', function () {
      var name = select.value;
      var labelVal = nameInput.value.trim();
      if (!labelVal) {
        alert((window.UILabels && window.UILabels.LOADOUT_NAME_PROMPT) || 'ロードアウト名を入力してください');
        return;
      }
      if (!name) name = 'loadout_' + Date.now().toString(36);
      
      var config = window.ZWGadgets.captureCurrentLoadout ? window.ZWGadgets.captureCurrentLoadout(labelVal) : { label: labelVal, groups: {} };
      if (window.ZWGadgets.defineLoadout) {
        window.ZWGadgets.defineLoadout(name, config);
      }
      alert((window.UILabels && window.UILabels.LOADOUT_SAVED) || 'ロードアウトを保存しました');
      refreshList();
      select.value = name;
    });

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
      refreshList();
      select.value = newName;
    });

    applyBtn.addEventListener('click', function () {
      var selected = select.value;
      if (!selected) return;
      if (window.ZWGadgets.applyLoadout) {
        window.ZWGadgets.applyLoadout(selected);
      }
      alert((window.UILabels && window.UILabels.LOADOUT_APPLIED) || 'ロードアウトを適用しました');
    });

    deleteBtn.addEventListener('click', function () {
      var selected = select.value;
      if (!selected) return;
      if (!confirm((window.UILabels && window.UILabels.LOADOUT_DELETE_CONFIRM) || 'このロードアウトを削除しますか？')) return;
      if (window.ZWGadgets.removeLoadout) {
        window.ZWGadgets.removeLoadout(selected);
      }
      alert((window.UILabels && window.UILabels.LOADOUT_DELETED) || 'ロードアウトを削除しました');
      refreshList();
    });

    // 初期化実行
    refreshList();

    // 外部からの更新用フック（必要なら）
    el.refresh = refreshList;

    // app.jsとの互換性のため、window.ZWLoadoutUIを設定
    if (!window.ZWLoadoutUI) {
      window.ZWLoadoutUI = {
        refresh: refreshList
      };
    }

  }, {
    groups: ['structure'], // Structureグループに配置
    title: (window.UILabels && window.UILabels.GADGET_LOADOUT_TITLE) || 'ロードアウト管理',
    description: 'ロードアウトの保存・適用・管理を行います',
    icon: 'save'
  });
})();
