/**
 * Handle client frontend.
 *
 * @module client
 * @class client
 */
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require('path');
const url = require('url');
/**
 * Create a windows for the client
 * @method createWindow
 *
 **/
function createWindow()
{
    global.mwin = new BrowserWindow({
      width: 800,
        height: 600,
        webPreferences: {
      nodeIntegration: true
    }

    });
    global.mwin.loadURL(url.format({
        pathname: path.join(__dirname, 'web_frontend/pages/index.html'),
        protocol: 'file:',
        slashes: true
    }));
    global.mwin.webContents.openDevTools();
    global.mwin.on('closed', function() {
        mainWindow = null;
    });
    global.mwin.on("ready-to-show", () => {
      global.mwin.show();
    });
}
/**
 * Load the client interface
 * @method load
 **/
function load()
{
    app.on('ready', createWindow);
    app.on('window-all-closed', function() {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });
    app.on('activate', function() {
        if (global.mwin === null) {
            createWindow();
        }
    });
}
module.exports = {
    load
};
