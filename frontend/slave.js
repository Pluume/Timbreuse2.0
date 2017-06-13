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
  if (oreqPile.length && connected) {
    slaveconn.write(JSON.stringify(oreqPile) + "\0");
    oreqPile = [];
  }
  for (var i = 0; i < slaves.length; i++) {
    if (slaves[i].pile.length && slaves[i].conn.connected) {
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
  stag = stag.replace(/\W/g, '');
  var oreq = {
    fnc: request.REQUEST.TAG,
    error: request.ERROR.OK,
    tag: stag,
    time: ntime,
    class: global.config.class
  };
  csv.writeBruteLoggingToCSV(stag, ntime);
  if (connected) {
    slaveconn.write(JSON.stringify(request.toArray(oreq)) + "\0");
  } else {
    oreq.delayed = true;
    oreqPile.push(oreq);
  }
  var soreq = clone(oreq);
  soreq.fnc = request.REQUEST.PROPAGATE_TAG;
  for (var i = 0; i < slaves.length; i++) {
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
  if (slaveconn.currentBuf[slaveconn.currentBuf.length - 1] == "\0") {
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
  } catch(err)
  {
    log.error("Error parsing : " + ireq);
  }

  if (ireq.fnc === undefined)
    return;

  switch (ireq.fnc) {
    case request.REQUEST.MASTER:
      global.mwin.webContents.send("CSV", false);
      csv.exportCSV(() => {
        global.mwin.webContents.send("CSV", true);
      });
      break;
    case request.REQUEST.TAG:
      global.mwin.webContents.send("slaveStd", ireq.student);
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
  var connectedToServer = function() {
    if (connected)
      return;
    connected = true;
    global.mwin.webContents.send("onlineServer", true);
    log.info('Connected to server!');
    slaveconn.on("data", compileRequest);
    executePile();

  };
  var slavesConnect = function() {
    if (this.connected)
      return;
    this.connected = true;
    executePile();
    log.info("The Timbreuse " + this.class + " is online.");
  };
  var slavesClose = function(err) {
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
        }, 5000);
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
  for (var i = 0; i < slaves.length; i++) {
    slaves[i].conn = new net.Socket();
    slaves[i].conn.class = slaves[i].class;
    slaves[i].conn.connected = false;
    slaves[i].conn.on("close", slavesClose);
    slaves[i].on("timeout", () => {
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
  slaveconn.on("timeout", () => {
    log.error("Connection to server timed out");
    connected = false;
    slaveconn.destroy();
  });
  slaveconn.on("close", (err) => {
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
  slaveconn.connect({
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

function delCSV() {
  csv.deleteAllCSV();
}
module.exports = {
  load,
  tag,
  getNow,
  delCSV
};
