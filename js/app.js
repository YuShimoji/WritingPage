// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    // グローバルオブジェクトが存在するか確認
    if (!window.ZenWriterStorage || !window.ZenWriterTheme || !window.ZenWriterEditor) {
        console.error('必要なスクリプトが読み込まれていません');
        return;
    }

    // 印刷処理
    function printDocument(){
        const pv = document.getElementById('print-view');
        if (!pv || !editor) return;
        const text = editor.value || '';
        pv.innerHTML = '';
        const norm = text.replace(/\r\n/g, '\n');
        const blocks = norm.split(/\n{2,}/);
        blocks.forEach(seg => {
            const p = document.createElement('p');
            p.textContent = seg;
            pv.appendChild(p);
        });
        window.print();
    }

    // 要素を取得
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const sidebar = document.querySelector('.sidebar');
    const toggleToolbarBtn = document.getElementById('toggle-toolbar');
    const toolbar = document.querySelector('.toolbar');
    const fullscreenBtn = document.getElementById('fullscreen');
    const newDocumentBtn = document.getElementById('new-document');
    const exportTxtBtn = document.getElementById('export-txt');
    const exportMdBtn = document.getElementById('export-md');
    const importBtn = document.getElementById('import-file');
    const fileInput = document.getElementById('file-input');
    const printBtn = document.getElementById('print-document');
    const themePresets = document.querySelectorAll('.theme-preset');
    const bgColorInput = document.getElementById('bg-color');
    const textColorInput = document.getElementById('text-color');
    const fontFamilySelect = document.getElementById('font-family');
    const fontSizeInput = document.getElementById('font-size');
    const fontSizeValue = document.getElementById('font-size-value');
    const lineHeightInput = document.getElementById('line-height');
    const lineHeightValue = document.getElementById('line-height-value');
    const editor = document.getElementById('editor');
    const showToolbarBtn = document.getElementById('show-toolbar');
    const editorContainer = document.querySelector('.editor-container');
    const resetColorsBtn = document.getElementById('reset-colors');
    const toolsFab = document.getElementById('fab-tools');
    const fontPanel = document.getElementById('floating-font-panel');
    const closeFontPanelBtn = document.getElementById('close-font-panel');
    const globalFontRange = document.getElementById('global-font-size');
    const globalFontNumber = document.getElementById('global-font-size-number');
    // HUD 設定UI
    const hudPosSelect = document.getElementById('hud-position');
    const hudDurationInput = document.getElementById('hud-duration');
    const hudBgInput = document.getElementById('hud-bg');
    const hudFgInput = document.getElementById('hud-fg');
    const hudOpacityRange = document.getElementById('hud-opacity');
    const hudOpacityValue = document.getElementById('hud-opacity-value');

    // サイドバーの表示/非表示を切り替え
    function toggleSidebar() {
        sidebar.classList.toggle('open');
    }

    // ツールバー表示/非表示の適用（保存・レイアウト反映を含む）
    function setToolbarVisibility(show) {
        if (!toolbar) return;
        toolbar.style.display = show ? 'flex' : 'none';
        if (showToolbarBtn) showToolbarBtn.style.display = show ? 'none' : 'inline-flex';
        document.body.classList.toggle('toolbar-hidden', !show);
        // 早期CSS適用のため、ルート要素にもフラグを反映
        if (!show) {
            document.documentElement.setAttribute('data-toolbar-hidden', 'true');
        } else {
            document.documentElement.removeAttribute('data-toolbar-hidden');
        }
    }

    // ツールバーの表示/非表示を切り替え（状態保存）
    let lastToolbarToggle = 0;
    function toggleToolbar() {
        const now = Date.now();
        if (now - lastToolbarToggle < 150) return; // debounce 二重発火防止
        lastToolbarToggle = now;
        const willShow = getComputedStyle(toolbar).display === 'none';
        setToolbarVisibility(willShow);
        // 状態保存
        const s = window.ZenWriterStorage.loadSettings();
        s.toolbarVisible = willShow;
        window.ZenWriterStorage.saveSettings(s);
        // ツールバーを表示にしたらHUDを隠す
        if (willShow && window.ZenWriterHUD && typeof window.ZenWriterHUD.hide === 'function') {
            window.ZenWriterHUD.hide();
        }
    }

    // フルスクリーン切り替え
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error('フルスクリーンエラー:', err);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    // 設定をUIに反映
    function applySettingsToUI() {
        const settings = window.ZenWriterStorage.loadSettings();
        
        // テーマプリセットを選択
        document.querySelectorAll('.theme-preset').forEach(btn => {
            if (btn.dataset.theme === settings.theme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // カラーピッカーを設定
        if (bgColorInput) bgColorInput.value = settings.bgColor;
        if (textColorInput) textColorInput.value = settings.textColor;
        
        // フォント設定を設定
        if (fontFamilySelect) fontFamilySelect.value = settings.fontFamily;
        if (fontSizeInput) {
            fontSizeInput.value = settings.fontSize;
            fontSizeValue.textContent = settings.fontSize;
        }
        if (lineHeightInput) {
            lineHeightInput.value = settings.lineHeight;
            lineHeightValue.textContent = settings.lineHeight;
        }
        // ツールバー表示状態
        if (typeof settings.toolbarVisible !== 'undefined') {
            setToolbarVisibility(!!settings.toolbarVisible);
        }

        // HUD 設定の初期反映
        const hud = settings.hud || {};
        if (hudPosSelect) hudPosSelect.value = hud.position || 'bottom-left';
        if (hudDurationInput) hudDurationInput.value = hud.duration || 1200;
        if (hudBgInput) hudBgInput.value = hud.bg || '#000000';
        if (hudFgInput) hudFgInput.value = hud.fg || '#ffffff';
        if (hudOpacityRange) hudOpacityRange.value = (typeof hud.opacity === 'number') ? hud.opacity : 0.75;
        if (hudOpacityValue) hudOpacityValue.textContent = String((typeof hud.opacity === 'number') ? hud.opacity : 0.75);
    }

    // イベントリスナーを設定
    if (toggleSidebarBtn) toggleSidebarBtn.addEventListener('click', toggleSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', toggleSidebar);
    if (toggleToolbarBtn) toggleToolbarBtn.addEventListener('click', toggleToolbar);
    if (showToolbarBtn) showToolbarBtn.addEventListener('click', toggleToolbar);
    if (fullscreenBtn) fullscreenBtn.addEventListener('click', toggleFullscreen);
    // キーボードショートカット: Alt+W でツールバー表示切替
    document.addEventListener('keydown', (e) => {
        const targetTag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        const inFormControl = ['input','select','textarea','button'].includes(targetTag);
        if (!inFormControl && e.altKey && (e.key === 'w' || e.key === 'W')) {
            if (e.repeat) return; // 長押しの自動リピートで連続トグルしない
            e.preventDefault();
            toggleToolbar();
        }
    });
    
    // ドキュメント操作
    if (newDocumentBtn) newDocumentBtn.addEventListener('click', () => window.ZenWriterEditor.newDocument());
    if (exportTxtBtn) exportTxtBtn.addEventListener('click', () => window.ZenWriterEditor.exportAsText());
    if (exportMdBtn) exportMdBtn.addEventListener('click', () => window.ZenWriterEditor.exportAsMarkdown());
    if (importBtn && fileInput) {
        importBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                const text = reader.result || '';
                window.ZenWriterEditor.setContent(text);
                window.ZenWriterEditor.showNotification('ファイルを読み込みました');
                // 使い終わったら値をクリアして同じファイルでも再度選択可能に
                fileInput.value = '';
            };
            reader.onerror = () => {
                console.error('ファイル読み込みエラー');
                window.ZenWriterEditor.showNotification('読み込みに失敗しました');
            };
            reader.readAsText(file, 'utf-8');
        });
    }
    if (printBtn) {
        printBtn.addEventListener('click', printDocument);
    }
    
    // テーマ設定
    themePresets.forEach(btn => {
        btn.addEventListener('click', () => {
            window.ZenWriterTheme.applyTheme(btn.dataset.theme);
            // テーマプリセット選択時はカスタムカラー上書きを解除
            window.ZenWriterTheme.clearCustomColors();
            applySettingsToUI();
        });
    });
    
    // カラーピッカー
    if (bgColorInput) {
        bgColorInput.addEventListener('input', (e) => {
            const text = textColorInput ? textColorInput.value : '#333333';
            window.ZenWriterTheme.applyCustomColors(e.target.value, text, true);
        });
    }
    
    if (textColorInput) {
        textColorInput.addEventListener('input', (e) => {
            const bg = bgColorInput ? bgColorInput.value : '#ffffff';
            window.ZenWriterTheme.applyCustomColors(bg, e.target.value, true);
        });
    }

    // カスタム色リセット
    if (resetColorsBtn) {
        resetColorsBtn.addEventListener('click', () => {
            window.ZenWriterTheme.clearCustomColors();
            applySettingsToUI();
        });
    }

    // フローティングツール（フォントパネル）
    function toggleFontPanel(forceShow = null) {
        if (!fontPanel) return;
        const willShow = forceShow !== null ? !!forceShow : fontPanel.style.display === 'none';
        fontPanel.style.display = willShow ? 'block' : 'none';
        if (willShow) {
            // 現在設定をUIへ反映
            const s = window.ZenWriterStorage.loadSettings();
            if (globalFontRange) globalFontRange.value = s.fontSize;
            if (globalFontNumber) globalFontNumber.value = s.fontSize;
        }
    }
    if (toolsFab) toolsFab.addEventListener('click', () => toggleFontPanel());
    if (closeFontPanelBtn) closeFontPanelBtn.addEventListener('click', () => toggleFontPanel(false));

    // フォントパネルのコントロール
    function updateGlobalFontFrom(value) {
        const size = parseFloat(value);
        if (!isNaN(size)) {
            window.ZenWriterEditor.setGlobalFontSize(size);
        }
    }
    if (globalFontRange) {
        globalFontRange.addEventListener('input', (e) => {
            updateGlobalFontFrom(e.target.value);
        });
    }
    if (globalFontNumber) {
        globalFontNumber.addEventListener('input', (e) => {
            updateGlobalFontFrom(e.target.value);
        });
    }
    
    // フォント設定
    if (fontFamilySelect) {
        fontFamilySelect.addEventListener('change', (e) => {
            window.ZenWriterTheme.applyFontSettings(
                e.target.value,
                parseFloat(fontSizeInput.value),
                parseFloat(lineHeightInput.value)
            );
        });
    }
    
    if (fontSizeInput) {
        fontSizeInput.addEventListener('input', (e) => {
            fontSizeValue.textContent = e.target.value;
            window.ZenWriterTheme.applyFontSettings(
                fontFamilySelect.value,
                parseFloat(e.target.value),
                parseFloat(lineHeightInput.value)
            );
        });
    }
    
    if (lineHeightInput) {
        lineHeightInput.addEventListener('input', (e) => {
            lineHeightValue.textContent = e.target.value;
            window.ZenWriterTheme.applyFontSettings(
                fontFamilySelect.value,
                parseFloat(fontSizeInput.value),
                parseFloat(e.target.value)
            );
        });
    }

    // ------- HUD 設定のイベント -------
    function updateHudSettings(patch){
        const s = window.ZenWriterStorage.loadSettings();
        s.hud = { ...(s.hud || {}), ...patch };
        window.ZenWriterStorage.saveSettings(s);
        if (window.ZenWriterHUD && typeof window.ZenWriterHUD.updateFromSettings === 'function') {
            window.ZenWriterHUD.updateFromSettings();
        }
    }
    if (hudPosSelect) {
        hudPosSelect.addEventListener('change', (e)=> updateHudSettings({ position: e.target.value }));
    }
    if (hudDurationInput) {
        const clamp = (n)=> Math.max(300, Math.min(5000, parseInt(n,10)||1200));
        hudDurationInput.addEventListener('input', (e)=> updateHudSettings({ duration: clamp(e.target.value) }));
        hudDurationInput.addEventListener('change', (e)=> updateHudSettings({ duration: clamp(e.target.value) }));
    }
    if (hudBgInput) {
        hudBgInput.addEventListener('change', (e)=> updateHudSettings({ bg: e.target.value }));
    }
    if (hudFgInput) {
        hudFgInput.addEventListener('change', (e)=> updateHudSettings({ fg: e.target.value }));
    }
    if (hudOpacityRange) {
        const setOpacity = (v)=>{
            const val = Math.max(0, Math.min(1, parseFloat(v)));
            if (hudOpacityValue) hudOpacityValue.textContent = String(val);
            updateHudSettings({ opacity: val });
        };
        hudOpacityRange.addEventListener('input', (e)=> setOpacity(e.target.value));
        hudOpacityRange.addEventListener('change', (e)=> setOpacity(e.target.value));
    }
    
    // エディタにフォーカス（エディタ領域をクリックしたときのみ）
    if (editor && editorContainer) {
        editorContainer.addEventListener('click', () => {
            editor.focus();
        });

        // 初期フォーカス
        setTimeout(() => {
            editor.focus();
        }, 100);
    }
    
    // 設定をUIに反映
    applySettingsToUI();

    // 初期状態の整合性（設定反映後に再度確認）
    if (toolbar) {
        const s = window.ZenWriterStorage.loadSettings();
        setToolbarVisibility(s.toolbarVisible !== false);
    }
});
