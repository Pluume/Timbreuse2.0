const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require('path');
const url = require('url');
const net = require("net");
const log = require("./../utils/log.js");
const csv = require("./../utils/csv.js");
var goingToClose = false;
var slaveconn;
function tag(stag,ntime)
{

  csv.writeBruteLoggingToCSV(stag, ntime);
}
function foreverConnect() {
    slaveconn = net.createConnection({
      host:global.config.server,
        port: 703
    }, () => {
        log.info('Connected to server!');

    });
    slaveconn.on("close", (err) => {
        if (!goingToClose) {
            if (err) {
                log.warning("The connection was closed with an error. Connecting back in 5 seconds");
                setTimeout(foreverConnect, 5000);
            } else {
                log.warning("The connection was closed without an error. Connecting back in 5 seconds");
                setTimeout(foreverConnect, 5000);
            }
        } else {
            log.info("Connection closed.");
        }

    });
}

function createWindow() {
    global.mwin = new BrowserWindow({
        width: 800,
        height: 600,
        show: false
    });
    global.mwin.loadURL(url.format({
        pathname: path.join(__dirname, 'slave.html'),
        protocol: 'file:',
        slashes: true
    }));
    global.mwin.webContents.openDevTools();
    global.mwin.on('closed', function() {
        global.mwin = null;
    });
    global.mwin.on("ready-to-show", () => {
        global.mwin.show();
    });
    global.mwin.on("show", () => {
        foreverConnect();
    });
}

function load() {
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
