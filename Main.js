/**
 * Main module. Makes all the other modules start by parsing the command line argument.
 *
 * @module main
 */
const fh = require("./frontend/frontendHandle.js");
const log = require("./utils/log.js");

const sinon = require("sinon");
log.info("Loading configuration...");
const config = require("./utils/config.js");
config.read();
config.getType();
global.mainPath = __dirname;
if(global.DEBUG)
{
  //clock = sinon.useFakeTimers(new Date("2017-04-28T06:10:32.571Z").getTime());
}


global.mwin = null;
const slaveHandle = require("./frontend/slave.js");
log.info("Starting as a " + global.TYPE.string);
//FIXME
log.info("Initializing database...");
const db = require("./db/db.js");
db.init();//Init the database
//FIXME
if (global.TYPE.int === config.TYPE.SERVER.int || global.TYPE.int === config.TYPE.SLAVE.int) { //Check if the app is starting as server or slave

    log.info("Starting server...");
    var tserver = require("./server.js");
    tserver.start();//Start the server
    if (global.TYPE.int === config.TYPE.SLAVE.int) {
        slaveHandle.load(); //Load the slave frontend
    } else {
      const scheduler = require("./utils/scheduler.js");
      scheduler.start();
    }
} else {
        const clientHandle = require("./frontend/client.js");
        clientHandle.load(); //Load the client frontend
}
