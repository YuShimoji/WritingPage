(function(){
  const plugins = [];

  function register(plugin){
    try {
      if (!plugin || !plugin.id) return;
      const p = {
        id: String(plugin.id),
        name: plugin.name ? String(plugin.name) : String(plugin.id),
        actions: Array.isArray(plugin.actions) ? plugin.actions : []
      };
      plugins.push(p);
    } catch(_) { /* ignore */ }
  }

  function list(){
    return plugins.slice();
  }

  function getAllActions(){
    const result = [];
    plugins.forEach(p => {
      (p.actions || []).forEach(a => {
        result.push({ ...a, pluginId: p.id });
      });
    });
    return result;
  }

  window.ZenWriterPlugins = {
    register,
    list,
    getAllActions
  };
})();
