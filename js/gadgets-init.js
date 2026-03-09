(function () {
  'use strict';

  // Depends on gadgets-utils.js, gadgets-loadouts.js, gadgets-core.js, gadgets-builtin.js
  var utils = window.ZWGadgetsUtils;
  var loadouts = window.ZWGadgetsLoadouts;
  var ZWGadgetsCore = window.ZWGadgetsCore;
  var ZWGadgets = window.ZWGadgets;
  if (!utils || !loadouts || !ZWGadgetsCore || !ZWGadgets) return;

  var ready = utils.ready;
  var GADGET_GROUPS = utils.GADGET_GROUPS;
  var getGroupPanel = utils.getGroupPanel;

  ready(function () {
    // フェーズC-1: データ属性ベースの安定セレクタを使用
    // Initialize gadget panels using data-gadget-group selectors
    Object.keys(GADGET_GROUPS).forEach(function (groupName) {
      // deprecated グループはスキップ（同パネルを空で上書きしてしまうため）
      if (GADGET_GROUPS[groupName] && GADGET_GROUPS[groupName].deprecated) return;
      var panel = getGroupPanel(groupName);
      if (panel) {
        ZWGadgets.init(panel, { group: groupName });
      }
    });

    // Loadout UI is now handled by gadgets-loadout.js
    // Refresh loadout UI if available
    if (window.ZWLoadoutUI && typeof window.ZWLoadoutUI.refresh === 'function') {
      window.ZWLoadoutUI.refresh();
    }

    // 切り離し済みガジェットの状態を復元
    if (window.ZWGadgets && typeof window.ZWGadgets.resumeDetachedGadgets === 'function') {
      window.ZWGadgets.resumeDetachedGadgets();
    }
  });

})();
