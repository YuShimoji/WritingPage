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
    // ガジェット初期化は app-gadgets-init.js に統一 (リトライ機構あり)
    // ここでは LoadoutUI と detach 復帰のみ実行

    // Loadout UI refresh
    if (window.ZWLoadoutUI && typeof window.ZWLoadoutUI.refresh === 'function') {
      window.ZWLoadoutUI.refresh();
    }

    // 切り離し済みガジェットの状態を復元
    if (window.ZWGadgets && typeof window.ZWGadgets.resumeDetachedGadgets === 'function') {
      window.ZWGadgets.resumeDetachedGadgets();
    }
  });

})();
