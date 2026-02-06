// 高度なテーマバンドル（フォント/色の組み合わせ）
(function () {
  const STORAGE_KEY = 'zenWriter_themeBundles';

  function loadBundles() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { bundles: [], currentId: null };
    } catch (e) {
      console.error('テーマバンドル読込エラー', e);
      return { bundles: [], currentId: null };
    }
  }

  function saveBundles(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.error('テーマバンドル保存エラー', e);
      return false;
    }
  }

  function getCurrentSettings() {
    const s = window.ZenWriterStorage.loadSettings();
    return {
      id: `bundle-${Date.now()}`,
      name: '',
      theme: s.theme,
      fontFamily: s.fontFamily,
      fontSize: s.fontSize,
      lineHeight: s.lineHeight,
      useCustomColors: !!s.useCustomColors,
      bgColor: s.bgColor,
      textColor: s.textColor,
    };
  }

  function applyBundle(bundle) {
    if (!bundle) return;
    window.ZenWriterTheme.applyTheme(bundle.theme || 'light');
    if (bundle.useCustomColors && bundle.bgColor && bundle.textColor) {
      window.ZenWriterTheme.applyCustomColors(
        bundle.bgColor,
        bundle.textColor,
        true,
      );
    } else {
      window.ZenWriterTheme.clearCustomColors();
    }
    window.ZenWriterTheme.applyFontSettings(
      bundle.fontFamily,
      parseFloat(bundle.fontSize),
      parseFloat(bundle.lineHeight),
    );
  }

  function renderSelect(state) {
    const sel = document.getElementById('theme-bundle-select');
    if (!sel) return;
    sel.innerHTML = '';
    state.bundles.forEach((b) => {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = b.name || '(名称未設定)';
      sel.appendChild(opt);
    });
    if (state.currentId) sel.value = state.currentId;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const state = loadBundles();
    const sel = document.getElementById('theme-bundle-select');
    const nameInput = document.getElementById('theme-bundle-name');
    const saveBtn = document.getElementById('save-theme-bundle');
    const applyBtn = document.getElementById('apply-theme-bundle');
    const deleteBtn = document.getElementById('delete-theme-bundle');
    if (!sel || !saveBtn || !applyBtn || !deleteBtn) return;

    renderSelect(state);

    saveBtn.addEventListener('click', () => {
      const b = getCurrentSettings();
      b.name = (nameInput && nameInput.value.trim()) || '新しいテーマ';
      state.bundles.push(b);
      state.currentId = b.id;
      saveBundles(state);
      renderSelect(state);
      if (nameInput) nameInput.value = '';
    });

    applyBtn.addEventListener('click', () => {
      const id = sel.value;
      const b = state.bundles.find((x) => x.id === id);
      if (b) {
        state.currentId = b.id;
        saveBundles(state);
        applyBundle(b);
      }
    });

    deleteBtn.addEventListener('click', () => {
      const id = sel.value;
      const idx = state.bundles.findIndex((x) => x.id === id);
      if (idx >= 0) {
        state.bundles.splice(idx, 1);
        state.currentId = state.bundles[0] ? state.bundles[0].id : null;
        saveBundles(state);
        renderSelect(state);
      }
    });
  });
})();
