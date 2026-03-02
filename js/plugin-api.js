/**
 * ZWPlugin API — Zen Writer プラグインシステム Phase 1
 *
 * 使用方法:
 *   window.ZWPlugin.register({ id, name, version, type, init(api) { ... } });
 *
 * See: docs/design/PLUGIN_SYSTEM.md
 */
(function () {
    'use strict';

    var _plugins = {};
    var _ready = false;
    var _queue = [];

    /**
     * Storage API (プラグイン専用プレフィックス付き localStorage ラッパー)
     * @param {string} pluginId
     */
    function createStorageAPI(pluginId) {
        var prefix = 'zw_plugin_' + String(pluginId || 'unknown') + '_';
        return {
            get: function (key) {
                try {
                    var raw = localStorage.getItem(prefix + key);
                    return raw !== null ? JSON.parse(raw) : null;
                } catch (_) { return null; }
            },
            set: function (key, value) {
                try { localStorage.setItem(prefix + key, JSON.stringify(value)); } catch (_) { }
            },
            remove: function (key) {
                try { localStorage.removeItem(prefix + key); } catch (_) { }
            }
        };
    }

    /**
     * Events API (CustomEvent ラッパー)
     * @param {string} pluginId
     */
    function createEventsAPI(pluginId) {
        var ns = 'ZWPlugin:' + String(pluginId || 'unknown') + ':';
        return {
            on: function (eventName, handler) {
                try { window.addEventListener(ns + eventName, handler); } catch (_) { }
            },
            off: function (eventName, handler) {
                try { window.removeEventListener(ns + eventName, handler); } catch (_) { }
            },
            emit: function (eventName, detail) {
                try {
                    window.dispatchEvent(new CustomEvent(ns + eventName, { detail: detail || {} }));
                } catch (_) { }
            },
            /** グローバル Zen Writer イベントをリッスン */
            onZW: function (eventName, handler) {
                try { window.addEventListener(eventName, handler); } catch (_) { }
            }
        };
    }

    /**
     * Gadgets API
     */
    function createGadgetsAPI() {
        return {
            register: function (name, factory, options) {
                try {
                    if (window.ZWGadgets && typeof window.ZWGadgets.register === 'function') {
                        window.ZWGadgets.register(name, factory, options || {});
                    } else {
                        console.warn('[ZWPlugin] ZWGadgets not ready when registering:', name);
                    }
                } catch (e) {
                    console.error('[ZWPlugin] gadgets.register failed:', name, e);
                }
            },
            getSetting: function (name, key, def) {
                try {
                    return window.ZWGadgets && typeof window.ZWGadgets.getSetting === 'function'
                        ? window.ZWGadgets.getSetting(name, key, def)
                        : def;
                } catch (_) { return def; }
            },
            setSetting: function (name, key, val) {
                try {
                    if (window.ZWGadgets && typeof window.ZWGadgets.setSetting === 'function') {
                        window.ZWGadgets.setSetting(name, key, val);
                    }
                } catch (_) { }
            }
        };
    }

    /**
     * Themes API
     */
    function createThemesAPI() {
        return {
            register: function (themeId, palette) {
                try {
                    if (window.ThemeRegistry && typeof window.ThemeRegistry.register === 'function') {
                        window.ThemeRegistry.register(themeId, palette);
                    } else {
                        console.warn('[ZWPlugin] ThemeRegistry not available for theme:', themeId);
                    }
                } catch (e) {
                    console.error('[ZWPlugin] themes.register failed:', themeId, e);
                }
            }
        };
    }

    /**
     * Create full API object for a plugin
     * @param {string} pluginId
     */
    function createPluginAPI(pluginId) {
        return {
            gadgets: createGadgetsAPI(),
            themes: createThemesAPI(),
            storage: createStorageAPI(pluginId),
            events: createEventsAPI(pluginId)
        };
    }

    /**
     * Initialize a plugin (run its init function)
     * @param {Object} config - Plugin config object
     */
    function initPlugin(config) {
        try {
            var api = createPluginAPI(config.id);
            config.init(api);
            console.info('[ZWPlugin] Loaded:', config.id, config.version || '');
        } catch (e) {
            console.error('[ZWPlugin] init failed for plugin:', config.id, e);
        }
    }

    var ZWPlugin = {
        /**
         * Register a plugin
         * @param {Object} config
         * @param {string} config.id - Unique plugin ID
         * @param {string} config.name - Display name
         * @param {string} [config.version] - Version string
         * @param {string} [config.type] - Plugin type: gadget | theme | command | export
         * @param {Function} config.init - Init function that receives the API
         */
        register: function (config) {
            try {
                if (!config || !config.id || typeof config.init !== 'function') {
                    console.warn('[ZWPlugin] Invalid plugin config', config);
                    return;
                }
                if (_plugins[config.id]) {
                    console.warn('[ZWPlugin] Plugin already registered:', config.id);
                    return;
                }
                _plugins[config.id] = config;

                if (_ready) {
                    initPlugin(config);
                } else {
                    _queue.push(config);
                }
            } catch (e) {
                console.error('[ZWPlugin] register error:', e);
            }
        },

        /**
         * List all registered plugins
         * @returns {Array}
         */
        list: function () {
            return Object.values(_plugins).map(function (p) {
                return { id: p.id, name: p.name, version: p.version || '', type: p.type || 'gadget' };
            });
        },

        /**
         * Initialize all queued plugins (called internally after DOM ready)
         */
        _bootstrap: function () {
            _ready = true;
            _queue.forEach(function (config) {
                initPlugin(config);
            });
            _queue = [];
            // プラグイン準備完了イベント
            try {
                window.dispatchEvent(new CustomEvent('ZWPluginsReady', { detail: { count: Object.keys(_plugins).length } }));
            } catch (_) { }
        }
    };

    // DOM Ready 後に bootstrap
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            ZWPlugin._bootstrap();
        });
    } else {
        // すでにLoadedなら即時（少し遅延してGadgets等が初期化されるのを待つ）
        setTimeout(function () { ZWPlugin._bootstrap(); }, 100);
    }

    try { window.ZWPlugin = ZWPlugin; } catch (_) { }

})();
