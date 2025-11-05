(function(){
  if (!window.ZenWriterPlugins) return;

  // テーマガジェット - UIを生成
  window.ZenWriterPlugins.register({
    id: 'theme-widget',
    name: 'テーマ',
    actions: [] // アクションはUIで
  });

  // ガジェット内でUIを生成するためのファクトリ関数
  function createThemeGadget(container) {
    const themePresets = document.createElement('div');
    themePresets.className = 'theme-presets';
    themePresets.style.marginTop = '8px';
    themePresets.innerHTML = `
      <button class="theme-preset" data-theme="light">ライト</button>
      <button class="theme-preset" data-theme="dark">ダーク</button>
      <button class="theme-preset" data-theme="sepia">セピア</button>
    `;
    container.appendChild(themePresets);

    // イベント
    themePresets.addEventListener('click', (e) => {
      const btn = e.target.closest('.theme-preset');
      if (btn) {
        window.ZenWriterTheme.applyTheme(btn.dataset.theme);
        window.ZenWriterTheme.clearCustomColors();
        // UI反映
        document.querySelectorAll('.theme-preset').forEach(b => {
          b.classList.toggle('active', b.dataset.theme === btn.dataset.theme);
        });
      }
    });

    // 初期反映
    const settings = window.ZenWriterStorage.loadSettings();
    document.querySelectorAll('.theme-preset').forEach(btn => {
      if (btn.dataset.theme === settings.theme) {
        btn.classList.add('active');
      }
    });
  }

  // フォントガジェット
  function createFontGadget(container) {
    const fontSection = document.createElement('div');
    fontSection.innerHTML = `
      <select id="font-family" style="width:100%; margin-bottom:1rem;">
        <option value="'Noto Serif JP', serif">Noto Serif JP</option>
        <option value="'Yu Mincho', 'YuMincho', serif">游明朝</option>
        <option value="'Hiragino Mincho ProN', serif">ヒラギノ明朝</option>
      </select>
      <label for="font-size">フォントサイズ: <span id="font-size-value">16</span>px</label>
      <input type="range" id="font-size" min="12" max="32" value="16" style="width:100%; margin-bottom:1rem;">
      <label for="line-height">行間: <span id="line-height-value">1.6</span></label>
      <input type="range" id="line-height" min="1" max="3" step="0.1" value="1.6" style="width:100%;">
    `;
    container.appendChild(fontSection);

    // イベント
    const familySelect = fontSection.querySelector('#font-family');
    const sizeInput = fontSection.querySelector('#font-size');
    const sizeValue = fontSection.querySelector('#font-size-value');
    const heightInput = fontSection.querySelector('#line-height');
    const heightValue = fontSection.querySelector('#line-height-value');

    function updateFont() {
      const family = familySelect.value;
      const size = parseFloat(sizeInput.value);
      const height = parseFloat(heightInput.value);
      window.ZenWriterTheme.applyFontSettings(family, size, height);
    }

    familySelect.addEventListener('change', updateFont);
    sizeInput.addEventListener('input', () => {
      sizeValue.textContent = sizeInput.value;
      updateFont();
    });
    heightInput.addEventListener('input', () => {
      heightValue.textContent = heightInput.value;
      updateFont();
    });

    // 初期反映
    const settings = window.ZenWriterStorage.loadSettings();
    familySelect.value = settings.fontFamily;
    sizeInput.value = settings.fontSize;
    sizeValue.textContent = settings.fontSize;
    heightInput.value = settings.lineHeight;
    heightValue.textContent = settings.lineHeight;
  }

  // HUD設定ガジェット
  function createHudGadget(container) {
    const hudSection = document.createElement('div');
    hudSection.innerHTML = `
      <label for="hud-position">表示位置</label>
      <select id="hud-position" style="width:100%; margin-bottom:1rem;">
        <option value="bottom-left">左下</option>
        <option value="bottom-right">右下</option>
        <option value="top-left">左上</option>
        <option value="top-right">右上</option>
      </select>
      <label for="hud-duration">表示時間（ms）</label>
      <input type="number" id="hud-duration" min="300" max="5000" step="100" value="1200" style="width:100%; margin-bottom:1rem;">
      <label for="hud-bg">背景色</label>
      <input type="color" id="hud-bg" value="#000000" style="width:100%; margin-bottom:1rem;">
      <label for="hud-fg">文字色</label>
      <input type="color" id="hud-fg" value="#ffffff" style="width:100%; margin-bottom:1rem;">
      <label for="hud-opacity">不透明度: <span id="hud-opacity-value">0.75</span></label>
      <input type="range" id="hud-opacity" min="0" max="1" step="0.05" value="0.75" style="width:100%; margin-bottom:1rem;">
      <button id="hud-test" class="small">HUDテスト表示</button>
    `;
    container.appendChild(hudSection);

    // イベント (app.jsのロジックをコピー)
    const posSelect = hudSection.querySelector('#hud-position');
    const durationInput = hudSection.querySelector('#hud-duration');
    const bgInput = hudSection.querySelector('#hud-bg');
    const fgInput = hudSection.querySelector('#hud-fg');
    const opacityRange = hudSection.querySelector('#hud-opacity');
    const opacityValue = hudSection.querySelector('#hud-opacity-value');
    const testBtn = hudSection.querySelector('#hud-test');

    function updateHudSettings(patch){
      const s = window.ZenWriterStorage.loadSettings();
      s.hud = { ...(s.hud || {}), ...patch };
      window.ZenWriterStorage.saveSettings(s);
      if (window.ZenWriterHUD && typeof window.ZenWriterHUD.updateFromSettings === 'function') {
        window.ZenWriterHUD.updateFromSettings();
      }
    }

    posSelect.addEventListener('change', (e)=> updateHudSettings({ position: e.target.value }));
    durationInput.addEventListener('input', (e)=> updateHudSettings({ duration: Math.max(300, Math.min(5000, parseInt(e.target.value,10)||1200)) }));
    durationInput.addEventListener('change', (e)=> updateHudSettings({ duration: Math.max(300, Math.min(5000, parseInt(e.target.value,10)||1200)) }));
    bgInput.addEventListener('change', (e)=> updateHudSettings({ bg: e.target.value }));
    fgInput.addEventListener('change', (e)=> updateHudSettings({ fg: e.target.value }));
    opacityRange.addEventListener('input', (e)=> {
      const val = Math.max(0, Math.min(1, parseFloat(e.target.value)));
      opacityValue.textContent = String(val);
      updateHudSettings({ opacity: val });
    });
    opacityRange.addEventListener('change', (e)=> {
      const val = Math.max(0, Math.min(1, parseFloat(e.target.value)));
      opacityValue.textContent = String(val);
      updateHudSettings({ opacity: val });
    });
    testBtn.addEventListener('click', ()=>{
      if (window.ZenWriterHUD && typeof window.ZenWriterHUD.publish === 'function') {
        window.ZenWriterHUD.publish('テスト: 123 文字 / 45 語', 1200);
      }
    });

    // 初期反映
    const settings = window.ZenWriterStorage.loadSettings();
    const hud = settings.hud || {};
    posSelect.value = hud.position || 'bottom-left';
    durationInput.value = hud.duration || 1200;
    bgInput.value = hud.bg || '#000000';
    fgInput.value = hud.fg || '#ffffff';
    opacityRange.value = (typeof hud.opacity === 'number') ? hud.opacity : 0.75;
    opacityValue.textContent = String((typeof hud.opacity === 'number') ? hud.opacity : 0.75);
  }

  // ガジェットファクトリをZWGadgetsに登録
  if (window.ZWGadgets) {
    window.ZWGadgets.register('Theme', createThemeGadget);
    window.ZWGadgets.register('Font', createFontGadget);
    window.ZWGadgets.register('HUD Settings', createHudGadget);
  }

})();
