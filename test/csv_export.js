const csv = require("./../utils/csv.js");
const log = require("./../utils/log.js");
const path = require('path');
const moment = require("moment");
log.info("Loading configuration...");
const config = require("./../utils/config.js");
csv.exportCSV(() => {
  log.info("Done.");
  process.exit();
});
