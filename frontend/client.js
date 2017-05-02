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

var currentCb = function(err, data) {}; //Proto
var currentBuf = "";

function clientServer(data)
{
  try {
    var ireq = JSON.parse(data);
  } catch (err) {
    return;
  }
  if (ireq.fnc != undefined)
  {
    switch (ireq.fnc) {
      case request.REQUEST.UPDATE:
      global.mwin.webContents.send("update", ireq.data);
        break;
      default:
      //Do nothing
    }
  }
}

function incomingDataHandling(data) {
  currentBuf += data;
  if (currentBuf[currentBuf.length - 1] == "\0") {
    var tmp = currentBuf.substring(0, currentBuf.length - 1).toString("utf8");
    currentCb(null, tmp);
    clientServer(tmp);
    currentBuf = "";
  }
}

function connect(cb) {
  clientconn = new net.Socket();
  clientconn.once("error", (err) => {
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
    if (global.currentPage != request.PAGES.LOGIN)
      global.mwin.loadURL(url.format({
        pathname: path.join(__dirname, 'web_frontend/pages/login.html'),
        protocol: 'file:',
        slashes: true
      }));

    global.clientconn = null;
  });
  clientconn.on("data", incomingDataHandling);
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
    currentCb(err);
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
