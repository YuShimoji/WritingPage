(function () {
  'use strict';

  // Depends on gadgets-utils.js, gadgets-loadouts.js, gadgets-core.js, gadgets-builtin.js
  var utils = window.ZWGadgetsUtils;
  var loadouts = window.ZWGadgetsLoadouts;
  var ZWGadgetsCore = window.ZWGadgetsCore;
  var ZWGadgets = window.ZWGadgets;
  if (!utils || !loadouts || !ZWGadgetsCore || !ZWGadgets) return;

  var ready = utils.ready;

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

    // Loadout UI is now handled by gadgets-loadout.js
    // Refresh loadout UI if available
    if (window.ZWLoadoutUI && typeof window.ZWLoadoutUI.refresh === 'function') {
      window.ZWLoadoutUI.refresh();
    }
  });

})();
