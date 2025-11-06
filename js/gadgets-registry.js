// Gadgets Registry: ガジェット定義の管理
window.ZWGadgetsRegistry = {
    gadgets: {},

    register(name, definition) {
        this.gadgets[name] = definition;
    },

    get(name) {
        return this.gadgets[name];
    },

    getAll() {
        return this.gadgets;
    }
};
