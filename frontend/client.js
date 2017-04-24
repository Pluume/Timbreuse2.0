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

var currentCb = function(data) {}; //Proto
var currentBuf = "";
function incomingDataHandling(data)
{
  console.log("Test");
  currentBuf += data;
  if(currentBuf[currentBuf.length - 1] == "\0") {
    console.log("Test2");
    currentCb(null, currentBuf.substring(0, currentBuf.length - 1).toString("utf8"));
    currentBuf = "";
  }
}

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
    clientconn.on("data",incomingDataHandling);
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
    currentCb = cb;
    global.clientconn.removeAllListeners("error");
    global.clientconn.on("error", (err) => {
        currentCb(null);
    });
    global.clientconn.write(data + "\0");
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
