const csv = require("./utils/csv.js");
const log = require("./utils/log.js");
const path = require('path');
const moment = require("moment");
log.info("Loading configuration...");
const config = require("./utils/config.js");
log.info("Initializing database...");
const db = require("./db/db.js");
db.init();//Init the database
csv.exportDBtoCSV(() => {});
