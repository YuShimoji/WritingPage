(function () {
  'use strict';

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function getStatusText(plugin, pendingEnabled) {
    var enabled = typeof pendingEnabled === 'boolean' ? pendingEnabled : !!plugin.enabled;
    if (!enabled && plugin.loaded) return '再読み込みで停止';
    if (!enabled) return '停止中';
    if (plugin.loaded) return '読み込み済み';
    return '再読み込みで有効化';
  }

  function renderPluginManager(root, api) {
    root.innerHTML = '';
    root.classList.add('plugin-manager-gadget');

    var manager = window.ZWPluginManager;
    var title = el('div', 'plugin-manager-gadget__title', 'ローカルMod');
    root.appendChild(title);

    var reloadRow = el('div', 'plugin-manager-gadget__actions');
    var reloadButton = el('button', 'small plugin-manager-gadget__reload', '再読み込み');
    reloadButton.type = 'button';
    reloadButton.hidden = true;
    reloadButton.addEventListener('click', function () {
      try { window.location.reload(); } catch (_) { }
    });
    reloadRow.appendChild(reloadButton);

    var manifestReady = !!(manager && typeof manager.getManifest === 'function' && manager.getManifest());
    if (!manager || typeof manager.getPluginList !== 'function' || !manifestReady) {
      root.appendChild(el('p', 'plugin-manager-gadget__empty', 'ローカルMod情報を読み込み中'));
      root.appendChild(reloadRow);
      var readyHandler = function () { renderPluginManager(root, api); };
      window.addEventListener('ZWPluginManagerReady', readyHandler);
      if (api && typeof api.addCleanup === 'function') {
        api.addCleanup(function () { window.removeEventListener('ZWPluginManagerReady', readyHandler); });
      }
      return;
    }

    var list = manager.getPluginList();
    if (!list.length) {
      root.appendChild(el('p', 'plugin-manager-gadget__empty', 'ローカルModなし'));
      root.appendChild(reloadRow);
      return;
    }

    var listEl = el('div', 'plugin-manager-gadget__list');
    listEl.setAttribute('data-plugin-manager-list', 'true');
    list.forEach(function (plugin) {
      var row = el('label', 'plugin-manager-gadget__row');
      row.setAttribute('data-plugin-id', plugin.id);

      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = !!plugin.enabled;
      checkbox.setAttribute('data-plugin-toggle', plugin.id);

      var body = el('span', 'plugin-manager-gadget__body');
      var name = el('span', 'plugin-manager-gadget__name', plugin.name || plugin.id);
      var meta = el('span', 'plugin-manager-gadget__meta', plugin.id + ' / ' + (plugin.type || 'plugin'));
      var path = el('span', 'plugin-manager-gadget__path', plugin.src || '');
      body.appendChild(name);
      body.appendChild(meta);
      body.appendChild(path);

      var status = el('span', 'plugin-manager-gadget__status', getStatusText(plugin));
      status.setAttribute('data-plugin-status', plugin.id);

      checkbox.addEventListener('change', function () {
        var enabled = !!checkbox.checked;
        manager.setEnabled(plugin.id, enabled);
        status.textContent = getStatusText(plugin, enabled);
        reloadButton.hidden = false;
      });

      row.appendChild(checkbox);
      row.appendChild(body);
      row.appendChild(status);
      listEl.appendChild(row);
    });

    root.appendChild(listEl);
    root.appendChild(reloadRow);
  }

  function register() {
    if (!window.ZWGadgets || typeof window.ZWGadgets.register !== 'function') return;
    window.ZWGadgets.register('PluginManager', renderPluginManager, {
      title: 'ローカルMod',
      groups: ['settings'],
      description: 'manifest に登録されたローカルModの有効状態を管理します。',
      defaultCollapsed: false,
      kind: 'admin'
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', register);
  } else {
    register();
  }
})();
