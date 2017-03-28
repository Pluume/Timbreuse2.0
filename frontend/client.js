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
const net = require("net");
const request = require("../request.js");

function connect(cb) {
    clientconn = new net.Socket();
    clientconn.once("error", (err) => {
      console.log(global.currentPage);
        if (global.currentPage != request.PAGES.LOGIN)
            global.mwin.loadURL(url.format({
                pathname: path.join(__dirname, 'web_frontend/pages/login.html'),
                protocol: 'file:',
                slashes: true
            }));
        global.clientconn = null;
        cb(err);
    });
    clientconn.once("close", () => {
      console.log(global.currentPage);
        if (global.currentPage != request.PAGES.LOGIN)
            global.mwin.loadURL(url.format({
                pathname: path.join(__dirname, 'web_frontend/pages/login.html'),
                protocol: 'file:',
                slashes: true
            }));

        global.clientconn = null;
    });
    clientconn.connect({
        host: global.config.server,
        port: 703
    }, () => {
        global.clientconn = clientconn;
        cb(null);

    });
}

function disconnect(cb) {
    try {
        global.clientconn.end();
        cb(null);
    } catch (err) {
        cb(err);
    }
}

function send(data, cb) {
    global.clientconn.once("data", (buf) => {
        cb(null, buf.toString("utf8"));
    });
    global.clientconn.once("error", (err) => {
        cb(err, null);
    });
    global.clientconn.write(data);

}
/**
 * Create a windows for the client
 * @method createWindow
 *
 **/
function createWindow() {
    global.mwin = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntergrationInWorker: true
        }

    });
    global.mwin.loadURL(url.format({
        pathname: path.join(__dirname, 'web_frontend/pages/login.html'),
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
function load() {
    global.clientconn = null;
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
    load,
    connect,
    disconnect,
    send
};
