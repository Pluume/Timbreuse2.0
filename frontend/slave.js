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
var slaves = [];
var oreqPile = [];
/**
 * Get the current time
 * @method getNow
 * @return {String} the current time in a ISO string
 **/
function getNow() {
    return moment().toDate().toISOString();
}


/**
 * Execute the pile of saved request
 * @method executePile
 **/
function executePile() { //TODO refaire pour gerer le cas par cas
    if (oreqPile.length) {
        slaveconn.write(JSON.stringify(oreqPile));
        for (var i = 0; i < slaves.length; i++) {
            slaves[i].conn.write(JSON.stringify(oreqPile));
        }
        oreqPile = [];
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
    var oreq = {
        fnc: request.REQUEST.TAG,
        error: request.ERROR.OK,
        tag: stag,
        time: ntime,
        class: global.config.class
    };
    csv.writeBruteLoggingToCSV(stag, ntime);
    if (connected) {
        slaveconn.write(JSON.stringify(request.toArray(oreq)));
        //TODO Handle data incoming
    } else {
        oreq.delayed = true;
        oreqPile.push(oreq);
    }
    for (var i = 0; i < slaves.length; i++) {
        if (slaves[i].conn.connected) {
            slaves[i].conn.write(JSON.stringify(request.toArray(oreq)));
        } else {
            oreq.delayed = true;
            slaves[i].pile.push(oreq);
        }

    }
}
//TODO Function that handle master card

/**
 * Export all the CSV to USB key on master key
 * @method onSocketData
 * @param {Object} ireq The json request 
 **/
function onSocketData(ireq) {
  for(var i = 0; i<ireq.length;i++)
  {
    switch(ireq[i].fnc)
    {
      case MASTER:
      csv.exportCSV(()=>{});
      break;
    }
  }
}

/**
 * Make the slave always try to maintain a connection with the server
 * @method foreverConnect
 **/
function foreverConnect() {
    slaveconn = new net.Socket();
    var connectedToServer = function() {
        log.info('Connected to server!');
        executePile();
        connected = true;
    };
    var slavesConnect = function() {
        this.connected = true;
        executePile();
        log.info("The Timbreuse " + this.class + " is online.");
    };
    var slavesClose = function(err) {
        this.connected = false;
        if (!goingToClose) {
            if (err) {
                log.warning("The connection to the Timbreuse " + this.class + " was closed with an error. Connecting back in 5 seconds");
                setTimeout(foreverConnect, 5000);
            } else {
                log.warning("The connection to the Timbreuse " + this.class + " was closed without an error. Connecting back in 5 seconds");
                setTimeout(foreverConnect, 5000);
            }
        } else {
            log.info("Connection closed. (" + this.class + ")");
        }
    };
    for (var i = 0; i < slaves.length; i++) {
        slaves[i].conn = new net.Socket();
        slaves[i].conn.class = slaves[i].class;
        slaves[i].conn.connected = false;
        slaves[i].conn.connect({
            host: slaves.ip,
            port: 704 //TODO REAL is 703
        }, slavesConnect);
        slaves[i].conn.on("close", slavesClose);
    }
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
    slaveconn.connect({
        host: global.config.server,
        port: 703
    });
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
        for (var i = 0; i < global.config.slaves.length; i++) {
            //if (global.config.slaves[i].class != global.config.class) { //TODO Uncomment in final version
            slaves.push(global.config.slaves[i]);

            slaves[i].pile = [];
            //}
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
module.exports = {
    load,
    tag,
    getNow
};
