// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    // グローバルオブジェクトが存在するか確認
    if (!window.ZenWriterStorage || !window.ZenWriterTheme || !window.ZenWriterEditor) {
        console.error('必要なスクリプトが読み込まれていません');
        return;
    }

    // ------- 複数ドキュメント管理 -------
    function ensureInitialDocument(){
        if (!window.ZenWriterStorage) return;
        const docs = window.ZenWriterStorage.loadDocuments();
        let cur = window.ZenWriterStorage.getCurrentDocId();
        if (!docs || docs.length === 0){
            // 既存の単一CONTENTを初回ドキュメントとして取り込む
            const initial = window.ZenWriterStorage.loadContent() || '';
            const created = window.ZenWriterStorage.createDocument('ドキュメント1', initial);
            window.ZenWriterStorage.setCurrentDocId(created.id);
            // エディタへ同期
            if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setContent === 'function'){
                window.ZenWriterEditor.setContent(initial);
            }
            updateDocumentTitle();
        } else {
            // カレントが無ければ先頭に設定
            if (!cur || !docs.some(d => d && d.id === cur)){
                const first = docs[0];
                window.ZenWriterStorage.setCurrentDocId(first.id);
                if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setContent === 'function'){
                    window.ZenWriterEditor.setContent(first.content || '');
                }
                updateDocumentTitle();
            }
        }
    }

    function renderDocList(){
        if (!docSelect || !window.ZenWriterStorage) return;
        const docs = (window.ZenWriterStorage.loadDocuments() || []).slice().sort((a,b)=> (b.updatedAt||0) - (a.updatedAt||0));
        const cur = window.ZenWriterStorage.getCurrentDocId();
        docSelect.innerHTML = '';
        if (!docs || docs.length === 0){
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = '(なし)';
            docSelect.appendChild(opt);
            if (docRenameBtn) docRenameBtn.disabled = true;
            if (docDeleteBtn) docDeleteBtn.disabled = true;
            return;
        }
        docs.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = d.name || '無題';
            docSelect.appendChild(opt);
        });
        docSelect.value = cur || docs[0].id;
        if (docRenameBtn) docRenameBtn.disabled = false;
        if (docDeleteBtn) docDeleteBtn.disabled = false;
    }

    function switchDocument(id){
        if (!id || !window.ZenWriterStorage) return;
        const docs = window.ZenWriterStorage.loadDocuments();
        const target = docs.find(d => d && d.id === id);
        if (!target) return;
        // 現在の内容を一度保存（現在ドキュメントに反映）
        if (editor && typeof window.ZenWriterStorage.saveContent === 'function'){
            window.ZenWriterStorage.saveContent(editor.value || '');
        }
        // カレント切替→内容適用（setContent 内で saveContent され、新カレントに反映）
        window.ZenWriterStorage.setCurrentDocId(id);
        if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setContent === 'function'){
            window.ZenWriterEditor.setContent(target.content || '');
        }
        if (docSelect) docSelect.value = id;
        updateDocumentTitle();
        if (window.ZenWriterEditor && typeof window.ZenWriterEditor.showNotification === 'function'){
            window.ZenWriterEditor.showNotification(`「${target.name || '無題'}」を開きました`, 1200);
        }
    }

    // タイトル更新（ドキュメント名 - Zen Writer）
    function updateDocumentTitle(){
        try {
            const docs = window.ZenWriterStorage.loadDocuments() || [];
            const cur = window.ZenWriterStorage.getCurrentDocId();
            const doc = docs.find(d => d && d.id === cur);
            const name = (doc && doc.name) ? doc.name : '';
            document.title = name ? `${name} - Zen Writer` : 'Zen Writer - 小説執筆ツール';
        } catch(_) {
            document.title = 'Zen Writer - 小説執筆ツール';
        }
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
    // 複数ドキュメント管理 UI
    const docSelect = document.getElementById('doc-select');
    const docCreateBtn = document.getElementById('doc-create');
    const docRenameBtn = document.getElementById('doc-rename');
    const docDeleteBtn = document.getElementById('doc-delete');
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
    const hudTestBtn = document.getElementById('hud-test');
    // スナップショットUI
    const snapNowBtn = document.getElementById('snapshot-now');
    const snapListEl = document.getElementById('snapshot-list');
    // 執筆目標
    const goalTargetInput = document.getElementById('goal-target');
    const goalDeadlineInput = document.getElementById('goal-deadline');

    function formatTs(ts){
        const d = new Date(ts);
        const p = (n)=> String(n).padStart(2,'0');
        return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    }

    function renderSnapshots(){
        if (!snapListEl || !window.ZenWriterStorage || !window.ZenWriterStorage.loadSnapshots) return;
        const list = window.ZenWriterStorage.loadSnapshots() || [];
        snapListEl.innerHTML = '';
        if (list.length === 0){
            const empty = document.createElement('div');
            empty.style.opacity = '0.7';
            empty.textContent = 'バックアップはありません';
            snapListEl.appendChild(empty);
            return;
        }
        list.forEach(s => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.alignItems = 'center';
            row.style.gap = '6px';
            row.style.margin = '4px 0';
            const meta = document.createElement('div');
            meta.textContent = `${formatTs(s.ts)} / ${s.len} 文字`;
            const actions = document.createElement('div');
            const restore = document.createElement('button');
            restore.className = 'small';
            restore.textContent = '復元';
            restore.addEventListener('click', () => {
                if (confirm('このバックアップで本文を置き換えます。よろしいですか？')){
                    window.ZenWriterEditor.setContent(s.content || '');
                    window.ZenWriterEditor.showNotification('バックアップから復元しました');
                }
            });
            const del = document.createElement('button');
            del.className = 'small';
            del.textContent = '削除';
            del.addEventListener('click', () => {
                if (confirm('このバックアップを削除しますか？')){
                    window.ZenWriterStorage.deleteSnapshot(s.id);
                    renderSnapshots();
                }
            });
            actions.appendChild(restore);
            actions.appendChild(del);
            row.appendChild(meta);
            row.appendChild(actions);
            snapListEl.appendChild(row);
        });
    }

    // サイドバーの表示/非表示を切り替え
    function toggleSidebar() {
        sidebar.classList.toggle('open');
    }

    // ツールバー表示/非表示の適用（保存・レイアウト反映を含む）
    function setToolbarVisibility(show) {
        if (!toolbar) return;
        // インライン style ではなく、ルート属性 + クラスで一元制御
        // これにより computedStyle の不整合や一時的な二重描画を回避
        if (showToolbarBtn) showToolbarBtn.style.display = show ? 'none' : 'inline-flex';
        document.body.classList.toggle('toolbar-hidden', !show);
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
        // ルート属性（early-boot と setToolbarVisibility が管理）に基づき判定
        const rootHidden = document.documentElement.getAttribute('data-toolbar-hidden') === 'true';
        const willShow = !!rootHidden;
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

        // 執筆目標の初期反映
        const goal = settings.goal || {};
        if (goalTargetInput) goalTargetInput.value = (typeof goal.target === 'number' ? goal.target : parseInt(goal.target,10) || 0);
        if (goalDeadlineInput) goalDeadlineInput.value = goal.deadline || '';
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
    if (newDocumentBtn) newDocumentBtn.addEventListener('click', () => {
        const name = prompt('新しいドキュメント名を入力', '無題');
        if (name === null) return;
        const doc = window.ZenWriterStorage.createDocument(name || '無題', '');
        window.ZenWriterStorage.setCurrentDocId(doc.id);
        if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setContent === 'function'){
            window.ZenWriterEditor.setContent('');
        }
        renderDocList();
        updateDocumentTitle();
        if (window.ZenWriterEditor && typeof window.ZenWriterEditor.showNotification === 'function'){
            window.ZenWriterEditor.showNotification('新規ドキュメントを作成しました', 1200);
        }
    });
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
    
    // 初期: ドキュメント管理セットアップ
    ensureInitialDocument();
    renderDocList();
    updateDocumentTitle();

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

    // ドキュメント管理: イベント
    if (docSelect){
        docSelect.addEventListener('change', (e)=> switchDocument(e.target.value));
    }
    if (docCreateBtn){
        docCreateBtn.addEventListener('click', ()=>{
            const name = prompt('新しいドキュメント名を入力', '無題');
            if (name === null) return;
            const doc = window.ZenWriterStorage.createDocument(name || '無題', '');
            window.ZenWriterStorage.setCurrentDocId(doc.id);
            if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setContent === 'function'){
                window.ZenWriterEditor.setContent('');
            }
            renderDocList();
            updateDocumentTitle();
            if (window.ZenWriterEditor && typeof window.ZenWriterEditor.showNotification === 'function'){
                window.ZenWriterEditor.showNotification('ドキュメントを作成しました', 1200);
            }
        });
    }
    if (docRenameBtn){
        docRenameBtn.addEventListener('click', ()=>{
            const cur = window.ZenWriterStorage.getCurrentDocId();
            if (!cur) return;
            const docs = window.ZenWriterStorage.loadDocuments();
            const d = docs.find(x => x && x.id === cur);
            const name = prompt('ドキュメント名を変更', d ? (d.name || '無題') : '無題');
            if (name === null) return;
            window.ZenWriterStorage.renameDocument(cur, name || '無題');
            renderDocList();
            updateDocumentTitle();
        });
    }
    if (docDeleteBtn){
        docDeleteBtn.addEventListener('click', ()=>{
            const cur = window.ZenWriterStorage.getCurrentDocId();
            if (!cur) return;
            if (!confirm('このドキュメントを削除しますか？この操作は元に戻せません。')) return;
            window.ZenWriterStorage.deleteDocument(cur);
            const docs = (window.ZenWriterStorage.loadDocuments() || []).slice().sort((a,b)=> (b.updatedAt||0) - (a.updatedAt||0));
            if (docs.length > 0){
                const next = docs[0];
                window.ZenWriterStorage.setCurrentDocId(next.id);
                if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setContent === 'function'){
                    window.ZenWriterEditor.setContent(next.content || '');
                }
            } else {
                const created = window.ZenWriterStorage.createDocument('ドキュメント1', '');
                window.ZenWriterStorage.setCurrentDocId(created.id);
                if (window.ZenWriterEditor && typeof window.ZenWriterEditor.setContent === 'function'){
                    window.ZenWriterEditor.setContent('');
                }
            }
            renderDocList();
            updateDocumentTitle();
            if (window.ZenWriterEditor && typeof window.ZenWriterEditor.showNotification === 'function'){
                window.ZenWriterEditor.showNotification('ドキュメントを削除しました', 1200);
            }
        });
    }

    // スナップショット: 今すぐ保存
    if (snapNowBtn) {
        snapNowBtn.addEventListener('click', () => {
            if (!window.ZenWriterStorage || !window.ZenWriterStorage.addSnapshot) return;
            const content = editor ? (editor.value || '') : '';
            window.ZenWriterStorage.addSnapshot(content);
            if (window.ZenWriterEditor && typeof window.ZenWriterEditor.showNotification === 'function') {
                window.ZenWriterEditor.showNotification('バックアップを保存しました');
            }
            renderSnapshots();
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
    if (hudTestBtn) {
        hudTestBtn.addEventListener('click', ()=>{
            if (window.ZenWriterHUD && typeof window.ZenWriterHUD.publish === 'function') {
                window.ZenWriterHUD.publish('テスト: 123 文字 / 45 語', 1200);
            }
        });
    }

    // ------- 執筆目標（goal） -------
    function saveGoalPatch(patch){
        const s = window.ZenWriterStorage.loadSettings();
        s.goal = { ...(s.goal || {}), ...patch };
        window.ZenWriterStorage.saveSettings(s);
        // 文字数表示を更新
        if (window.ZenWriterEditor && typeof window.ZenWriterEditor.updateWordCount === 'function') {
            window.ZenWriterEditor.updateWordCount();
        }
    }
    if (goalTargetInput){
        const clampTarget = (v)=> Math.max(0, parseInt(v,10) || 0);
        goalTargetInput.addEventListener('input', (e)=> saveGoalPatch({ target: clampTarget(e.target.value) }));
        goalTargetInput.addEventListener('change', (e)=> saveGoalPatch({ target: clampTarget(e.target.value) }));
    }
    if (goalDeadlineInput){
        goalDeadlineInput.addEventListener('change', (e)=> saveGoalPatch({ deadline: (e.target.value || '') || null }));
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
    // バックアップ一覧
    renderSnapshots();

    // 初期状態の整合性
    // applySettingsToUI() と head内の early-boot で反映済みのため、ここでの上書きは行わない
});
