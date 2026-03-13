/**
 * ZWPluginManager — Plugin System Phase 2 (manifest-driven loader)
 *
 * Trusted local plugins only:
 * - Manifest: js/plugins/manifest.json
 * - Plugin scripts: js/plugins/*.js
 */
(function () {
    'use strict';

    var MANIFEST_PATH = 'js/plugins/manifest.json';
    var ENABLED_STORAGE_KEY = 'zw_plugin_manager_enabled';
    var _manifest = null;
    var _loaded = {};

    function safeParse(jsonText, fallback) {
        try { return JSON.parse(jsonText); } catch (_) { return fallback; }
    }

    function getEnabledMap() {
        try {
            return safeParse(localStorage.getItem(ENABLED_STORAGE_KEY) || '{}', {});
        } catch (_) {
            return {};
        }
    }

    function setEnabledMap(map) {
        try {
            localStorage.setItem(ENABLED_STORAGE_KEY, JSON.stringify(map || {}));
        } catch (_) { }
    }

    function isSafePluginPath(src) {
        return typeof src === 'string'
            && /^js\/plugins\/[a-zA-Z0-9._\-\/]+\.js$/.test(src)
            && src.indexOf('..') === -1;
    }

    function loadPluginScript(src) {
        return new Promise(function (resolve, reject) {
            if (!isSafePluginPath(src)) {
                reject(new Error('unsafe plugin path: ' + String(src)));
                return;
            }
            if (_loaded[src]) {
                resolve(false);
                return;
            }
            var s = document.createElement('script');
            s.src = src;
            s.async = false;
            s.onload = function () {
                _loaded[src] = true;
                resolve(true);
            };
            s.onerror = function () {
                reject(new Error('failed to load plugin: ' + src));
            };
            document.body.appendChild(s);
        });
    }

    function normalizeManifest(raw) {
        var list = [];
        var plugins = raw && Array.isArray(raw.plugins) ? raw.plugins : [];
        for (var i = 0; i < plugins.length; i++) {
            var p = plugins[i] || {};
            var id = String(p.id || '').trim();
            var src = String(p.src || '').trim();
            if (!id || !src) continue;
            list.push({
                id: id,
                src: src,
                enabled: p.enabled !== false
            });
        }
        return { plugins: list };
    }

    function isPluginEnabled(plugin) {
        var map = getEnabledMap();
        if (Object.prototype.hasOwnProperty.call(map, plugin.id)) {
            return !!map[plugin.id];
        }
        return !!plugin.enabled;
    }

    async function loadManifest(manifestPath) {
        var path = manifestPath || MANIFEST_PATH;
        var response = await fetch(path, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('manifest fetch failed: ' + response.status);
        }
        var raw = await response.json();
        _manifest = normalizeManifest(raw);
        return _manifest;
    }

    async function bootstrap() {
        try {
            var manifest = await loadManifest();
            var loadedCount = 0;
            for (var i = 0; i < manifest.plugins.length; i++) {
                var plugin = manifest.plugins[i];
                if (!isPluginEnabled(plugin)) continue;
                try {
                    var loadedNow = await loadPluginScript(plugin.src);
                    if (loadedNow) loadedCount += 1;
                } catch (e) {
                    console.error('[ZWPluginManager] plugin load failed:', plugin.id, e);
                }
            }
            try {
                window.dispatchEvent(new CustomEvent('ZWPluginManagerReady', {
                    detail: { loadedCount: loadedCount, total: manifest.plugins.length }
                }));
            } catch (_) { }
            return { loadedCount: loadedCount, total: manifest.plugins.length };
        } catch (e) {
            console.warn('[ZWPluginManager] bootstrap skipped:', e && e.message ? e.message : e);
            return { loadedCount: 0, total: 0 };
        }
    }

    var ZWPluginManager = {
        loadManifest: loadManifest,
        loadPluginScript: loadPluginScript,
        bootstrap: bootstrap,
        getManifest: function () { return _manifest; },
        getEnabledMap: getEnabledMap,
        setEnabled: function (pluginId, enabled) {
            var id = String(pluginId || '').trim();
            if (!id) return;
            var map = getEnabledMap();
            map[id] = !!enabled;
            setEnabledMap(map);
        },
        isLoaded: function (src) {
            return !!_loaded[src];
        }
    };

    try {
        window.ZWPluginManager = ZWPluginManager;
    } catch (_) { }

    // 非埋め込みモード時は自動 bootstrap
    // (動的 <script async=false> ロード後に確実に実行するため self-bootstrap)
    if (!/(?:^|[?&])embed=1(?:&|$)/.test(location.search)) {
        bootstrap();
    }
})();
