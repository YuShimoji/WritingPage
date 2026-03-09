const { app, BrowserWindow, Menu, dialog, ipcMain, shell, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');

/* ---------- Auto-updater (graceful fallback if not installed) ---------- */
let autoUpdater = null;
try {
    autoUpdater = require('electron-updater').autoUpdater;
} catch (_) {
    /* electron-updater not available — skip auto-update */
}

/* ---------- Window state persistence ---------- */
const STATE_FILE = path.join(app.getPath('userData'), 'window-state.json');

function loadWindowState() {
    try {
        if (fs.existsSync(STATE_FILE)) {
            return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
        }
    } catch (_) { /* ignore */ }
    return { width: 1200, height: 800 };
}

function saveWindowState(win) {
    if (!win || win.isDestroyed()) return;
    const bounds = win.getBounds();
    const state = {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        isMaximized: win.isMaximized(),
        isFullScreen: win.isFullScreen(),
    };
    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify(state));
    } catch (_) { /* ignore */ }
}

/* ---------- Recent files ---------- */
const RECENT_FILE = path.join(app.getPath('userData'), 'recent-files.json');

function loadRecentFiles() {
    try {
        if (fs.existsSync(RECENT_FILE)) {
            return JSON.parse(fs.readFileSync(RECENT_FILE, 'utf-8'));
        }
    } catch (_) { /* ignore */ }
    return [];
}

function saveRecentFiles(files) {
    try {
        fs.writeFileSync(RECENT_FILE, JSON.stringify(files.slice(0, 10)));
    } catch (_) { /* ignore */ }
}

function addRecentFile(filePath) {
    const recent = loadRecentFiles().filter(f => f !== filePath);
    recent.unshift(filePath);
    saveRecentFiles(recent);
    buildMenu();
}

/* ---------- Current file tracking ---------- */
let currentFilePath = null;
let mainWindow = null;
const isDev = process.argv.includes('--dev');

/* ---------- Menu ---------- */
function buildMenu() {
    const recentFiles = loadRecentFiles();
    const recentSubmenu = recentFiles.length > 0
        ? [
            ...recentFiles.map(f => ({
                label: path.basename(f),
                sublabel: f,
                click: () => openFileByPath(f),
            })),
            { type: 'separator' },
            { label: '履歴をクリア', click: () => { saveRecentFiles([]); buildMenu(); } },
        ]
        : [{ label: '(なし)', enabled: false }];

    const template = [
        {
            label: 'ファイル(&F)',
            submenu: [
                { label: '新規作成(&N)', accelerator: 'CmdOrCtrl+N', click: () => sendToRenderer('menu:new-document') },
                { type: 'separator' },
                { label: '開く(&O)...', accelerator: 'CmdOrCtrl+O', click: () => handleFileOpen() },
                { label: '最近使ったファイル', submenu: recentSubmenu },
                { type: 'separator' },
                { label: '保存(&S)', accelerator: 'CmdOrCtrl+S', click: () => handleFileSave() },
                { label: '名前を付けて保存(&A)...', accelerator: 'CmdOrCtrl+Shift+S', click: () => handleFileSaveAs() },
                { type: 'separator' },
                {
                    label: 'エクスポート',
                    submenu: [
                        { label: 'テキスト (.txt)', click: () => sendToRenderer('menu:export', 'txt') },
                        { label: 'HTML (.html)', click: () => sendToRenderer('menu:export', 'html') },
                        { label: 'Markdown (.md)', click: () => sendToRenderer('menu:export', 'md') },
                    ],
                },
                { type: 'separator' },
                { label: '印刷(&P)...', accelerator: 'CmdOrCtrl+P', click: () => sendToRenderer('menu:print') },
                { type: 'separator' },
                { role: 'quit', label: '終了(&X)' },
            ],
        },
        {
            label: '編集(&E)',
            submenu: [
                { role: 'undo', label: '元に戻す(&U)' },
                { role: 'redo', label: 'やり直し(&R)' },
                { type: 'separator' },
                { role: 'cut', label: '切り取り(&T)' },
                { role: 'copy', label: 'コピー(&C)' },
                { role: 'paste', label: '貼り付け(&P)' },
                { role: 'selectAll', label: 'すべて選択(&A)' },
                { type: 'separator' },
                { label: '検索(&F)...', accelerator: 'CmdOrCtrl+F', click: () => sendToRenderer('menu:find') },
                { label: '検索と置換(&H)...', accelerator: 'CmdOrCtrl+H', click: () => sendToRenderer('menu:find-replace') },
            ],
        },
        {
            label: '表示(&V)',
            submenu: [
                { label: 'サイドバー(&S)', accelerator: 'CmdOrCtrl+B', click: () => sendToRenderer('menu:toggle-sidebar') },
                { label: 'ツールバー(&T)', click: () => sendToRenderer('menu:toggle-toolbar') },
                { type: 'separator' },
                { label: 'フォーカスモード(&F)', click: () => sendToRenderer('menu:toggle-focus') },
                { label: 'タイプライターモード(&Y)', click: () => sendToRenderer('menu:toggle-typewriter') },
                { label: '超ミニマルモード(&M)', accelerator: 'CmdOrCtrl+Shift+M', click: () => sendToRenderer('menu:toggle-minimal') },
                { type: 'separator' },
                { label: '分割ビュー(&P)', click: () => sendToRenderer('menu:toggle-split-view') },
                { type: 'separator' },
                { label: '拡大', accelerator: 'CmdOrCtrl+Plus', click: () => sendToRenderer('menu:zoom-in') },
                { label: '縮小', accelerator: 'CmdOrCtrl+-', click: () => sendToRenderer('menu:zoom-out') },
                { label: 'リセット', accelerator: 'CmdOrCtrl+0', click: () => sendToRenderer('menu:zoom-reset') },
                { type: 'separator' },
                { role: 'togglefullscreen', label: '全画面表示(&L)' },
                { type: 'separator' },
                ...(isDev ? [{ role: 'toggleDevTools', label: '開発者ツール' }] : []),
            ],
        },
        {
            label: 'ヘルプ(&H)',
            submenu: [
                {
                    label: 'バージョン情報',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'Zen Writer',
                            message: `Zen Writer v${app.getVersion()}`,
                            detail: 'Web小説・創作執筆のためのエディタ\nhttps://github.com/your-repo/WritingPage',
                        });
                    },
                },
                { type: 'separator' },
                {
                    label: 'GitHubを開く',
                    click: () => shell.openExternal('https://github.com/your-repo/WritingPage'),
                },
            ],
        },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

/* ---------- File operations ---------- */
const FILE_FILTERS = [
    { name: 'テキストファイル', extensions: ['txt', 'md'] },
    { name: 'HTMLファイル', extensions: ['html', 'htm'] },
    { name: 'すべてのファイル', extensions: ['*'] },
];

async function handleFileOpen() {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'ファイルを開く',
        filters: FILE_FILTERS,
        properties: ['openFile'],
    });
    if (result.canceled || result.filePaths.length === 0) return;
    const filePath = result.filePaths[0];
    await openFileByPath(filePath);
}

async function openFileByPath(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        currentFilePath = filePath;
        addRecentFile(filePath);
        updateTitle();
        sendToRenderer('file:opened', { path: filePath, content, name: path.basename(filePath) });
    } catch (e) {
        dialog.showErrorBox('ファイルを開けません', e.message);
    }
}

async function handleFileSave() {
    if (!currentFilePath) {
        return handleFileSaveAs();
    }
    sendToRenderer('file:request-content-for-save', currentFilePath);
}

async function handleFileSaveAs() {
    const result = await dialog.showSaveDialog(mainWindow, {
        title: '名前を付けて保存',
        filters: FILE_FILTERS,
        defaultPath: currentFilePath || 'untitled.txt',
    });
    if (result.canceled) return;
    currentFilePath = result.filePath;
    addRecentFile(currentFilePath);
    updateTitle();
    sendToRenderer('file:request-content-for-save', currentFilePath);
}

function updateTitle() {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const name = currentFilePath ? path.basename(currentFilePath) : '無題';
    mainWindow.setTitle(`${name} - Zen Writer`);
}

function sendToRenderer(channel, ...args) {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(channel, ...args);
    }
}

/* ---------- IPC handlers ---------- */
function setupIPC() {
    // File save (renderer -> main)
    ipcMain.on('file:save-content', (_event, { filePath, content }) => {
        try {
            fs.writeFileSync(filePath, content, 'utf-8');
            sendToRenderer('file:saved', { path: filePath, success: true });
        } catch (e) {
            dialog.showErrorBox('保存エラー', e.message);
            sendToRenderer('file:saved', { path: filePath, success: false, error: e.message });
        }
    });

    // Export file (renderer -> main)
    ipcMain.handle('file:export', async (_event, { content, defaultName, filters }) => {
        const result = await dialog.showSaveDialog(mainWindow, {
            title: 'エクスポート',
            defaultPath: defaultName,
            filters: filters || FILE_FILTERS,
        });
        if (result.canceled) return { success: false };
        try {
            fs.writeFileSync(result.filePath, content, 'utf-8');
            return { success: true, path: result.filePath };
        } catch (e) {
            return { success: false, error: e.message };
        }
    });

    // App info
    ipcMain.handle('app:get-info', () => ({
        version: app.getVersion(),
        name: app.getName(),
        platform: process.platform,
        userData: app.getPath('userData'),
    }));

    // Theme detection
    ipcMain.handle('app:get-theme', () => nativeTheme.shouldUseDarkColors ? 'dark' : 'light');

    nativeTheme.on('updated', () => {
        sendToRenderer('app:theme-changed', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
    });

    // Window control
    ipcMain.on('window:minimize', () => mainWindow?.minimize());
    ipcMain.on('window:maximize', () => {
        if (mainWindow?.isMaximized()) mainWindow.unmaximize();
        else mainWindow?.maximize();
    });
    ipcMain.on('window:close', () => mainWindow?.close());
    ipcMain.on('window:set-title', (_event, title) => mainWindow?.setTitle(title));

    // Window maximized state query
    ipcMain.handle('window:is-maximized', () => mainWindow?.isMaximized() ?? false);

    // Frameless mode toggle
    ipcMain.on('window:toggle-frameless', (_event, frameless) => {
        // Note: changing frame requires recreating the window in Electron
        // Store preference for next launch
        const state = loadWindowState();
        state.frameless = frameless;
        try {
            fs.writeFileSync(STATE_FILE, JSON.stringify(state));
        } catch (_) { /* ignore */ }
        sendToRenderer('window:frameless-changed', frameless);
    });
}

/* ---------- Auto-updater ---------- */
function setupAutoUpdater() {
    if (!autoUpdater) return;

    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('update-available', (info) => {
        sendToRenderer('updater:update-available', info);
    });

    autoUpdater.on('update-not-available', () => {
        sendToRenderer('updater:update-not-available');
    });

    autoUpdater.on('download-progress', (progress) => {
        sendToRenderer('updater:download-progress', progress);
    });

    autoUpdater.on('update-downloaded', (info) => {
        sendToRenderer('updater:update-downloaded', info);
    });

    autoUpdater.on('error', (err) => {
        sendToRenderer('updater:error', err.message);
    });

    ipcMain.on('updater:check', () => {
        autoUpdater.checkForUpdates().catch(() => {});
    });

    ipcMain.on('updater:download', () => {
        autoUpdater.downloadUpdate().catch(() => {});
    });

    ipcMain.on('updater:install', () => {
        autoUpdater.quitAndInstall();
    });

    // Check for updates 10 seconds after launch
    setTimeout(() => {
        autoUpdater.checkForUpdates().catch(() => {});
    }, 10000);
}

/* ---------- Window creation ---------- */
function createWindow() {
    const state = loadWindowState();

    mainWindow = new BrowserWindow({
        x: state.x,
        y: state.y,
        width: state.width || 1200,
        height: state.height || 800,
        minWidth: 600,
        minHeight: 400,
        frame: false,
        title: 'Zen Writer',
        icon: path.join(__dirname, '..', 'favicon.svg'),
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    if (state.isMaximized) mainWindow.maximize();
    if (state.isFullScreen) mainWindow.setFullScreen(true);

    // Show window when ready to avoid flash
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Load content
    if (isDev) {
        const port = process.env.PORT || 8080;
        mainWindow.loadURL(`http://127.0.0.1:${port}`);
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));
    }

    // Notify renderer of maximize/unmaximize
    mainWindow.on('maximize', () => sendToRenderer('window:maximized-changed', true));
    mainWindow.on('unmaximize', () => sendToRenderer('window:maximized-changed', false));

    // Save window state on resize/move
    ['resize', 'move'].forEach(evt => {
        mainWindow.on(evt, () => saveWindowState(mainWindow));
    });

    mainWindow.on('close', () => {
        saveWindowState(mainWindow);
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Build and set native menu
    buildMenu();
    updateTitle();
}

/* ---------- App lifecycle ---------- */
app.whenReady().then(() => {
    setupIPC();
    createWindow();
    setupAutoUpdater();
}).catch((err) => {
    console.error('App initialization error:', err);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
