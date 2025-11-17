(function (global) {
  var tools = [
    {
      id: 'text-decoration',
      label: 'Text Decoration',
      icon: 'type',
      group: 'editor',
      gadgetId: 'font-decoration',
      entrypoints: {
        headerIcon: true,
        sidebarGadget: true,
        fabMenu: false,
      },
    },
    {
      id: 'text-animation',
      label: 'Text Animation',
      icon: 'sparkles',
      group: 'editor',
      gadgetId: 'text-animation',
      entrypoints: {
        headerIcon: true,
        sidebarGadget: true,
        fabMenu: false,
      },
    },
    {
      id: 'editor-layout',
      label: 'Editor Layout',
      icon: 'layout-template',
      group: 'editor',
      gadgetId: 'editor-layout',
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
      entrypoints: {
        headerIcon: false,
        sidebarGadget: true,
        fabMenu: true,
      },
    },
    {
      id: 'search-replace',
      label: 'Search & Replace',
      icon: 'search',
      group: 'editor',
      gadgetId: 'search-panel',
      entrypoints: {
        headerIcon: true,
        sidebarGadget: false,
        fabMenu: false,
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
