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
      var panel = getGroupPanel(groupName);
      if (panel) {
        ZWGadgets.init(panel, { group: groupName });
      }
    });

    // Add tabs (ラベルは GADGET_GROUPS から取得)
    ['structure', 'typography', 'wiki', 'assist'].forEach(function (groupName) {
      var group = GADGET_GROUPS[groupName];
      if (group) {
        ZWGadgets.addTab(groupName, group.label);
      }
    });

    // Loadout UI is now handled by gadgets-loadout.js
    // Refresh loadout UI if available
    if (window.ZWLoadoutUI && typeof window.ZWLoadoutUI.refresh === 'function') {
      window.ZWLoadoutUI.refresh();
    }
  });

})();
