/**
 * Handle slave frontend.
 *
 * @module slave
 * @class slave
 */
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require('path');
const url = require('url');
const net = require("net");
const log = require("./../utils/log.js");
const csv = require("./../utils/csv.js");
const request = require("./../request.js");
const moment = require("moment");
var goingToClose = false;
var connected = false;
var slaveconn;
var oreqPile = [];
/**
 * Get the current time
 * @method getNow
 * @return {String} the current time in a ISO string
 **/
function getNow()
{
  return moment().toDate().toISOString();
}
/**
 * Execute the pile of saved request
 * @method executePile
 **/
function executePile()
{
  var currreq = oreqPile.pop();
  while(currreq!==undefined)
  {
    slaveconn.write(currreq);
  }
}
/**
 * Tag an user
 * @method tag
 * @param {String} stag the user's tag.
 * @param {String} ntime the current time.
 **/
function tag(stag,ntime)
{
  var oreq = {fnc: request.REQUEST.TAG, error: request.ERROR.OK, tag: stag, time: ntime, class:global.config.class};
  csv.writeBruteLoggingToCSV(stag, ntime);
  if(connected)
  {
    slaveconn.write(JSON.stringify(oreq));
    //TODO Handle data incoming
    } else {
    oreqPile.push(oreq);
  }
  log.info("Tagging");
}
/**
 * Make the slave always try to maintain a connection with the server
 * @method foreverConnect
 **/
function foreverConnect() {
    slaveconn = net.createConnection({
      host:global.config.server,
        port: 703
    }, () => {
        log.info('Connected to server!');
        connected = true;
    });
    slaveconn.on("close", (err) => {
      connected = false;
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
    load,
    tag,
    getNow
};
