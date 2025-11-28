(function () {
  'use strict';

  // Depends on gadgets-utils.js, gadgets-loadouts.js, gadgets-core.js, gadgets-builtin.js
  var utils = window.ZWGadgetsUtils;
  var loadouts = window.ZWGadgetsLoadouts;
  var ZWGadgetsCore = window.ZWGadgetsCore;
  var ZWGadgets = window.ZWGadgets;
  if (!utils || !loadouts || !ZWGadgetsCore || !ZWGadgets) return;

  var ready = utils.ready;
  var loadPrefs = loadouts.loadPrefs;
  var savePrefs = loadouts.savePrefs;

  ready(function () {
    // Initialize gadget panels
    ZWGadgets.init('#assist-gadgets-panel', { group: 'assist' });
    ZWGadgets.init('#structure-gadgets-panel', { group: 'structure' });
    ZWGadgets.init('#typography-gadgets-panel', { group: 'typography' });

    // Add tabs
    ZWGadgets.addTab('assist', '支援', 'assist-gadgets-panel');
    ZWGadgets.addTab('structure', '構造', 'structure-gadgets-panel');
    ZWGadgets.addTab('typography', 'タイポ', 'typography-gadgets-panel');

    // Initialize wiki panel (tabs are added by app.js)
    ZWGadgets.init('#wiki-gadgets-panel', { group: 'wiki' });

    // Initialize loadout UI
    var loadoutSelect = document.getElementById('loadout-select');
    var loadoutName = document.getElementById('loadout-name');
    var loadoutSave = document.getElementById('loadout-save');
    var loadoutDuplicate = document.getElementById('loadout-duplicate');
    var loadoutApply = document.getElementById('loadout-apply');
    var loadoutDelete = document.getElementById('loadout-delete');

    // Loadout select change
    if (loadoutSelect) {
      loadoutSelect.addEventListener('change', function () {
        var selected = loadoutSelect.value;
        if (selected && loadoutName) {
          var loadouts = ZWGadgets.listLoadouts();
          var entry = loadouts.find(function (l) { return l.name === selected; });
          if (entry) {
            loadoutName.value = entry.label || '';
          }
        }
      });
    }

    // Loadout save
    if (loadoutSave) {
      loadoutSave.addEventListener('click', function () {
        var name = loadoutSelect.value;
        var label = loadoutName.value.trim();
        if (!label) {
          alert((window.UILabels && window.UILabels.LOADOUT_NAME_PROMPT) || 'ロードアウト名を入力してください');
          return;
        }
        if (!name) {
          name = 'loadout_' + Date.now().toString(36);
        }
        var config = ZWGadgets.captureCurrentLoadout(label);
        ZWGadgets.defineLoadout(name, config);
        alert((window.UILabels && window.UILabels.LOADOUT_SAVED) || 'ロードアウトを保存しました');
        // Update select
        if (loadoutSelect) {
          loadoutSelect.innerHTML = '';
          var loadouts = ZWGadgets.listLoadouts();
          loadouts.forEach(function (l) {
            var opt = document.createElement('option');
            opt.value = l.name;
            opt.textContent = l.label;
            loadoutSelect.appendChild(opt);
          });
          loadoutSelect.value = name;
        }
      });
    }

    // Loadout duplicate
    if (loadoutDuplicate) {
      loadoutDuplicate.addEventListener('click', function () {
        var selected = loadoutSelect.value;
        if (!selected) {
          alert((window.UILabels && window.UILabels.LOADOUT_SELECT_TO_DUPLICATE) || '複製するロードアウトを選択してください');
          return;
        }
        var loadouts = ZWGadgets.listLoadouts();
        var entry = loadouts.find(function (l) { return l.name === selected; });
        if (!entry) return;
        var newName = 'loadout_' + Date.now().toString(36);
        var newLabel = (loadoutName.value.trim() || entry.label) + ((window.UILabels && window.UILabels.LOADOUT_DUPLICATE_SUFFIX) || ' (複製)');
        ZWGadgets.defineLoadout(newName, { label: newLabel, groups: entry.groups || utils.normaliseGroups({}) });
        alert((window.UILabels && window.UILabels.LOADOUT_DUPLICATED) || 'ロードアウトを複製しました');
        // Update select
        if (loadoutSelect) {
          loadoutSelect.innerHTML = '';
          var loadouts2 = ZWGadgets.listLoadouts();
          loadouts2.forEach(function (l) {
            var opt = document.createElement('option');
            opt.value = l.name;
            opt.textContent = l.label;
            loadoutSelect.appendChild(opt);
          });
          loadoutSelect.value = newName;
          if (loadoutName) loadoutName.value = newLabel;
        }
      });
    }

    // Loadout apply
    if (loadoutApply) {
      loadoutApply.addEventListener('click', function () {
        var selected = loadoutSelect.value;
        if (!selected) {
          alert((window.UILabels && window.UILabels.LOADOUT_SELECT_TO_APPLY) || '適用するロードアウトを選択してください');
          return;
        }
        var success = ZWGadgets.applyLoadout(selected);
        if (success) {
          alert((window.UILabels && window.UILabels.LOADOUT_APPLIED) || 'ロードアウトを適用しました');
        } else {
          alert((window.UILabels && window.UILabels.LOADOUT_APPLY_FAILED) || 'ロードアウトの適用に失敗しました');
        }
      });
    }

    // Loadout delete
    if (loadoutDelete) {
      loadoutDelete.addEventListener('click', function () {
        var selected = loadoutSelect.value;
        if (!selected) {
          alert((window.UILabels && window.UILabels.LOADOUT_SELECT_TO_DELETE) || '削除するロードアウトを選択してください');
          return;
        }
        if (!confirm((window.UILabels && window.UILabels.LOADOUT_DELETE_CONFIRM) || 'このロードアウトを削除しますか？この操作は元に戻せません。')) {
          return;
        }
        var success = ZWGadgets.deleteLoadout(selected);
        if (success) {
          alert((window.UILabels && window.UILabels.LOADOUT_DELETED) || 'ロードアウトを削除しました');
          // Update select
          if (loadoutSelect) {
            loadoutSelect.innerHTML = '';
            var loadouts = ZWGadgets.listLoadouts();
            loadouts.forEach(function (l) {
              var opt = document.createElement('option');
              opt.value = l.name;
              opt.textContent = l.label;
              loadoutSelect.appendChild(opt);
            });
          }
        } else {
          alert((window.UILabels && window.UILabels.LOADOUT_DELETE_FAILED) || 'ロードアウトの削除に失敗しました');
        }
      });
    }

    // Initialize loadout select
    if (loadoutSelect) {
      var loadouts = ZWGadgets.listLoadouts();
      loadouts.forEach(function (l) {
        var opt = document.createElement('option');
        opt.value = l.name;
        opt.textContent = l.label;
        loadoutSelect.appendChild(opt);
      });
      var active = ZWGadgets.getActiveLoadout();
      if (active) {
        loadoutSelect.value = active.name;
        if (loadoutName) loadoutName.value = active.label;
      }
    }
  });

})();
