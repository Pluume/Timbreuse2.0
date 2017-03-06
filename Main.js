/**
 * Main module. Makes all the other modules start by parsing the command line argument.
 *
 * @module main
 */
const log = require("./utils/log.js");
log.info("Loading configuration...");
const config = require("./utils/config.js");
config.read();
config.getType();
log.info("Starting as a " + global.TYPE.string);

if (global.TYPE.int === config.TYPE.SERVER.int) {
    log.info("Initializing database...");
    const db = require("./db/db.js");
    db.init();
    log.info("Starting server...");
    var tserver = require("./server.js");
    tserver.start();
} else {

    global.mwin = null;
    if (global.TYPE.int === config.TYPE.SLAVE.int) {
        const slaveHandle = require("./frontend/slave.js");
        slaveHandle.load();

    } else {
        const clientHandle = require("./frontend/client.js");
        clientHandle.load();
    }
}
