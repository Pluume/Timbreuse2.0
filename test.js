/**
 * Main module. Makes all the other modules start by parsing the command line argument.
 *
 * @module main
 */
const log = require("./utils/log.js");
log.info("Loading configuration...");
const config = require("./utils/config.js");
const leavereq = require("./utils/leaveReq.js");
var knex = require('knex')({
    client: 'sqlite3',
    useNullAsDefault: true
});
config.read();
config.getType();
global.mwin = null;
const slaveHandle = require("./frontend/slave.js");
log.info("Starting as a " + global.TYPE.string);

if (global.TYPE.int === config.TYPE.SERVER.int || global.TYPE.int === config.TYPE.SLAVE.int) { //Check if the app is starting as server or slave
    log.info("Initializing database...");
    const db = require("./db/db.js");
    db.init();//Init the database
    log.info("Starting server...");
    var tserver = require("./server.js");
    tserver.start();//Start the server
    if (global.TYPE.int === config.TYPE.SLAVE.int) {
        slaveHandle.load(); //Load the slave frontend
    } else {
      const scheduler = require("./utils/scheduler.js");
      scheduler.start();
    }
    //console.log(leavereq.isToday(1));

    global.db.get(knex.select().from("leavereq").where({
        studentid: 1
    }).toString(), (err, row) => {
        if (err) {
            log.error("Error : " + err);
            return;
        }
        console.log(leavereq.isToday(row));
    });
} else {
        const clientHandle = require("./frontend/client.js");
        clientHandle.load(); //Load the client frontend
}
