const db = require("./db/db.js");
const config = require("./utils/config.js");
config.read();
db.init();
