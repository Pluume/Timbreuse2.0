const log = require("./utils/log.js");
log.info("Loading configuration...");
const config = require("./utils/config.js");
config.read();
config.getType();
log.info("Starting as a " + global.TYPE.string);
log.info("Initializing database...");
const db = require("./db/db.js");

db.init();
log.info("Starting server...");
var test = require("./server.js");
test.start();

//const method = require("./server_method");
