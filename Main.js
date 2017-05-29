/**
 * Main module. Makes all the other modules start by parsing the command line argument.
 *
 * @module main
 */
const inst = require("./utils/installRoutines.js");
if (inst.handleSquirrelEvent())
  return 0;
const fh = require("./frontend/frontendHandle.js");
const log = require("./utils/log.js");
const sinon = require("sinon");
log.info("Loading configuration...");
const config = require("./utils/config.js");
const db = require("./db/db.js");
config.read();
config.getType();
global.mainPath = __dirname;
if (global.DEBUG && global.TYPE.int === config.TYPE.SERVER.int) {
  //clock = sinon.useFakeTimers(new Date("2017-05-23T22:59:54+02:00").getTime());
  console.log("Today date is : " + new Date());
}


global.mwin = null;
const slaveHandle = require("./frontend/slave.js");
log.info("Starting as a " + global.TYPE.string);

if (global.TYPE.int === config.TYPE.SERVER.int || global.TYPE.int === config.TYPE.SLAVE.int) { //Check if the app is starting as server or slave
  log.info("Initializing database...");

  db.init(); //Init the database
  log.info("Starting server...");
  var tserver = require("./server.js");
  tserver.start(); //Start the server
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
