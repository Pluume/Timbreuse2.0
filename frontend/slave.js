/**
 * Handle slave frontend.
 *
 * @module slave
 * @class slave
 */
const electron = require('electron');
const app = electron.app;
const ipcMain = electron.ipcMain;
const BrowserWindow = electron.BrowserWindow;
const globalShortcut = electron.globalShortcut;
const path = require('path');
const url = require('url');
const net = require("net");
const log = require("./../utils/log.js");
const csv = require("./../utils/csv.js");
const request = require("./../request.js");
const moment = require("moment");
var clone = require('clone');
var goingToClose = false;
var connected = false;
var slaveconn;
var slaves = [];
var oreqPile = [];
/**
 * Get the current time
 * @method getNow
 * @return {String} the current time in a ISO string
 **/
function getNow() {
  return moment().format();
}


/**
 * Execute the pile of saved request
 * @method executePile
 **/
function executePile() {
  if (oreqPile.length && connected) { //If connected to server, then send all the pile
    slaveconn.write(JSON.stringify(oreqPile) + "\0");
    oreqPile = []; //Empty the pile afterwards
  }
  for (var i = 0; i < slaves.length; i++) { //Iterate through connected slave
    if (slaves[i].pile.length && slaves[i].conn.connected) { //If connected to this slave, then send all the pile
      slaves[i].conn.write(JSON.stringify(slaves[i].pile) + "\0");
      slaves[i].pile = [];
    }

  }


}
/**
 * Tag an user
 * @method tag
 * @param {String} stag the user's tag.
 * @param {String} ntime the current time.
 **/
function tag(stag, ntime) {
  if (global.DEBUG) {
    log.info("Tag : " + stag + " Time : " + ntime);
  }
  stag = stag.replace(/\W/g, ''); //Replace bad characters
  var oreq = {
    fnc: request.REQUEST.TAG,
    error: request.ERROR.OK,
    tag: stag,
    time: ntime,
    class: global.config.class
  };
  csv.writeBruteLoggingToCSV(stag, ntime); //Write tag to CSV
  if (connected) { //If connected to server send it straight away. If not, store it for later
    slaveconn.write(JSON.stringify(request.toArray(oreq)) + "\0");
  } else {
    oreq.delayed = true;
    oreqPile.push(oreq);
  }
  var soreq = clone(oreq); //Clone the oreq to alter without altering the first element
  soreq.fnc = request.REQUEST.PROPAGATE_TAG;
  for (var i = 0; i < slaves.length; i++) { //Send to every other slave. If connected, directly, if not, at the next reconnexion
    if (slaves[i].conn.connected) {
      slaves[i].conn.write(JSON.stringify(request.toArray(soreq)) + "\0");
    } else {
      soreq.delayed = true;
      slaves[i].pile.push(soreq);
    }

  }
}

/**
 * Compile the complete request before using it
 * @method compileRequest
 * @param {Object} ireq The json request
 **/
function compileRequest(ireq) {
  slaveconn.currentBuf += ireq;
  if (slaveconn.currentBuf[slaveconn.currentBuf.length - 1] == "\0") { //Compil request separated with a null byte
    onSocketData(slaveconn.currentBuf.substring(0, slaveconn.currentBuf.length - 1).toString("utf8"));
    slaveconn.currentBuf = "";
  }
}
/**
 * Handle the incoming data from the outgoing socket
 * @method onSocketData
 * @param {Object} nireq The json request
 **/
function onSocketData(nireq) {
  var ireq;
  try {
    ireq = JSON.parse(nireq);
  } catch (err) {
    log.error("Error parsing : " + ireq);
  }

  if (ireq.fnc === undefined)
    return;

  switch (ireq.fnc) {
    case request.REQUEST.MASTER:
      global.mwin.webContents.send("CSV", false); //Display that CSV is being copied to screen
      csv.exportCSV(() => {
        global.mwin.webContents.send("CSV", true); //Display that CSV have been copied to the USB drive
      });
      break;
    case request.REQUEST.TAG:
      global.mwin.webContents.send("slaveStd", ireq.student); //Display the tagged user's informations
      break;
    default:
      break;
  }
}

/**
 * Make the slave always try to maintain a connection with the server
 * @method foreverConnect
 **/
function foreverConnect() {
  slaveconn = new net.Socket();
  slaveconn.currentBuf = "";
  var connectedToServer = function() { //Connect to server
    if (connected)
      return;
    connected = true;
    global.mwin.webContents.send("onlineServer", true); //Send to renderer process that socket is connected
    log.info('Connected to server!');
    slaveconn.on("data", compileRequest);
    executePile(); //Flush pile

  };
  var slavesConnect = function() { //Execute pile for newly connected slaves
    if (this.connected)
      return;
    this.connected = true;
    executePile();
    log.info("The Timbreuse " + this.class + " is online.");
  };
  var slavesClose = function(err) { //Handle when connection to a slave is lost
    this.connected = false;
    var tsock = this;
    tsock.removeAllListeners("connect");
    tsock.on("connect", slavesConnect);
    if (!goingToClose) {
      if (err) {
        log.warning("The connection to the Timbreuse " + this.class + " was closed with an error. Connecting back in 5 seconds");
        setTimeout(() => {
          tsock.connect({
            host: tsock.ip,
            port: 703
          });
        }, 5000); //Wait for 5 seconds
      } else {
        log.warning("The connection to the Timbreuse " + this.class + " was closed without an error. Connecting back in 5 seconds");
        setTimeout(() => {
          tsock.connect({
            host: tsock.ip,
            port: 703
          });
        }, 5000);
      }
    } else {
      log.info("Connection closed. (" + this.class + ")");
    }
  };
  for (var i = 0; i < slaves.length; i++) { //Iterate through slaves and connect to them
    slaves[i].conn = new net.Socket();
    slaves[i].conn.class = slaves[i].class;
    slaves[i].conn.connected = false;
    slaves[i].conn.on("close", slavesClose);
    slaves[i].conn.on("timeout", () => {
      log.error("Connection to the slave " + slaves[i].class + " timed out");
      slaves[i].conn.connected = false;
      slaves[i].conn.destroy();
    });
    slaves[i].conn.ip = slaves[i].ip;
    slaves[i].conn.setKeepAlive(true, 10000);
    slaves[i].conn.connect({
      host: slaves[i].ip,
      port: 703
    }, slavesConnect);

  }
  slaveconn.on("timeout", () => { //On timeout, destroy socket
    log.error("Connection to server timed out");
    connected = false;
    slaveconn.destroy();
  });
  slaveconn.on("close", (err) => { //On close, destroy socket and try to reconnect
    slaveconn.destroy();
    connected = false;
    global.mwin.webContents.send("onlineServer", false);
    if (!goingToClose) {
      if (err) {
        log.warning("The connection with the server was closed with an error. Connecting back in 5 seconds");
        setTimeout(() => {
          slaveconn.connect({
            host: global.config.server,
            port: 703
          }, connectedToServer);
        }, 5000);
      } else {
        log.warning("The connection with the server was closed without an error. Connecting back in 5 seconds");
        setTimeout(() => {
          slaveconn.connect({
            host: global.config.server,
            port: 703
          }, connectedToServer);
        }, 5000);
      }
    } else {
      log.info("Connection closed.");
    }

  });
  log.info("Connecting to server : " + global.config.server + ":703");
  slaveconn.connect({ //Connect to server
    host: global.config.server,
    port: 703
  }, connectedToServer);

}
/**
 * Create the slave frontend
 * @method createWindow
 **/
function createWindow() {

  global.mwin = new BrowserWindow({
    width: 800,
    height: 600,
    show: false
  });
  global.mwin.setMenu(null);
  global.mwin.hide();
  globalShortcut.register('CommandOrControl+W', () => {
    app.quit();
  });
  globalShortcut.register('CommandOrControl+I', () => {
    global.mwin.openDevTools();
  });
  global.mwin.loadURL(url.format({
    pathname: path.join(__dirname, 'web_frontend/pages/slave.html'),
    protocol: 'file:',
    slashes: true
  }));
  global.mwin.on('closed', function() {
    global.mwin = null;
  });
  global.mwin.webContents.on('did-finish-load', function() {
    global.mwin.show();
  });
  global.mwin.setAlwaysOnTop(true);
  global.mwin.on("blur", () => {
    global.mwin.focus();
    global.mwin.webContents.focus();
  });
  global.mwin.on("show", () => {
    global.mwin.maximize();
    global.mwin.setFullScreen(true);
    for (var i = 0; i < global.config.slaves.length; i++) {
      if (global.config.slaves[i].class != global.config.class) {
        slaves[i] = global.config.slaves[i];
        slaves[i].pile = [];
      }
    }
    foreverConnect();
  });
}
/**
 * Load the slave frontend
 * @method load
 **/
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
/**
 * Delete all the CSV of the slave
 * @method delCSV
 */
function delCSV() {
  csv.deleteAllCSV();
}
module.exports = {
  load,
  tag,
  getNow,
  delCSV
};
