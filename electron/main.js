const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 600,
        minHeight: 400,
        title: 'Zen Writer',
        icon: path.join(__dirname, '..', 'favicon.svg'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    // 本番ビルド時は同梱の index.html をロード
    // 開発時は --dev 引数で devサーバーに接続可能
    const isDev = process.argv.includes('--dev');
    if (isDev) {
        const port = process.env.PORT || 8080;
        mainWindow.loadURL(`http://127.0.0.1:${port}`);
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));
    }

    // メニューバーを非表示（よりアプリらしい見た目に）
    mainWindow.setMenuBarVisibility(false);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
