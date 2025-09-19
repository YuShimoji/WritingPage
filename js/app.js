// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    // グローバルオブジェクトが存在するか確認
    if (!window.ZenWriterStorage || !window.ZenWriterTheme || !window.ZenWriterEditor) {
        console.error('必要なスクリプトが読み込まれていません');
        return;
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
    const themePresets = document.querySelectorAll('.theme-preset');
    const bgColorInput = document.getElementById('bg-color');
    const textColorInput = document.getElementById('text-color');
    const fontFamilySelect = document.getElementById('font-family');
    const fontSizeInput = document.getElementById('font-size');
    const fontSizeValue = document.getElementById('font-size-value');
    const lineHeightInput = document.getElementById('line-height');
    const lineHeightValue = document.getElementById('line-height-value');
    const editor = document.getElementById('editor');

    // サイドバーの表示/非表示を切り替え
    function toggleSidebar() {
        sidebar.classList.toggle('open');
    }

    // ツールバーの表示/非表示を切り替え
    function toggleToolbar() {
        toolbar.style.display = toolbar.style.display === 'none' ? 'flex' : 'none';
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
    }

    // イベントリスナーを設定
    if (toggleSidebarBtn) toggleSidebarBtn.addEventListener('click', toggleSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', toggleSidebar);
    if (toggleToolbarBtn) toggleToolbarBtn.addEventListener('click', toggleToolbar);
    if (fullscreenBtn) fullscreenBtn.addEventListener('click', toggleFullscreen);
    
    // ドキュメント操作
    if (newDocumentBtn) newDocumentBtn.addEventListener('click', () => window.ZenWriterEditor.newDocument());
    if (exportTxtBtn) exportTxtBtn.addEventListener('click', () => window.ZenWriterEditor.exportAsText());
    if (exportMdBtn) exportMdBtn.addEventListener('click', () => window.ZenWriterEditor.exportAsMarkdown());
    
    // テーマ設定
    themePresets.forEach(btn => {
        btn.addEventListener('click', () => {
            window.ZenWriterTheme.applyTheme(btn.dataset.theme);
            applySettingsToUI();
        });
    });
    
    // カラーピッカー
    if (bgColorInput) {
        bgColorInput.addEventListener('input', (e) => {
            window.ZenWriterTheme.applyCustomColors(e.target.value, textColorInput.value);
        });
    }
    
    if (textColorInput) {
        textColorInput.addEventListener('input', (e) => {
            window.ZenWriterTheme.applyCustomColors(bgColorInput.value, e.target.value);
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
    
    // エディタにフォーカス
    if (editor) {
        // マウスクリックでフォーカス
        document.addEventListener('click', (e) => {
            if (e.target !== editor && !sidebar.contains(e.target)) {
                editor.focus();
            }
        });
        
        // 初期フォーカス
        setTimeout(() => {
            editor.focus();
        }, 100);
    }
    
    // 設定をUIに反映
    applySettingsToUI();
});
