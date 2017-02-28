const db = require("./db/db.js");
const config = require("./utils/config.js");
config.read();
db.init();
var test = require("./server.js");
test.start();
//const method = require("./server_method");

