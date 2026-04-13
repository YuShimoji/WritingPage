(function (global) {
  var tools = [
    {
      id: 'editor-layout',
      label: 'Editor Layout',
      icon: 'layout-template',
      group: 'editor',
      gadgetId: 'editor-layout',
      // MD プレビューはサイドバー先頭の #toggle-preview（ヘッダ帯外）。動的ヘッダ生成は付けない。
      domId: 'toggle-preview',
      entrypoints: {
        headerIcon: false,
        sidebarGadget: true,
        fabMenu: false,
      },
    },
    {
      id: 'hud-control',
      label: 'HUD Control',
      icon: 'panel-top',
      group: 'system',
      gadgetId: 'hud-settings',
      domId: 'show-toolbar', // メインハブ（クイックツール）への補助 FAB（常時可視ではないため headerIcon は false）
      entrypoints: {
        headerIcon: false,
        sidebarGadget: true,
        fabMenu: true,
      },
    },
  ];

  function getTool(id) {
    for (var i = 0; i < tools.length; i += 1) {
      if (tools[i].id === id) {
        return tools[i];
      }
    }
    return null;
  }

  function listTools(filter) {
    if (!filter) {
      return tools.slice();
    }

    return tools.filter(function (tool) {
      if (filter.group && tool.group !== filter.group) {
        return false;
      }

      if (filter.entrypoint && tool.entrypoints) {
        if (tool.entrypoints[filter.entrypoint] !== true) {
          return false;
        }
      }

      return true;
    });
  }

  global.WritingTools = {
    tools: tools,
    getTool: getTool,
    listTools: listTools,
  };
})(window);
