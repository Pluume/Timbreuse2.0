const log = require("./../utils/log.js");
const moment = require("moment");
const config = require("./../utils/config.js");
const net = require("net");
config.read();
var req = JSON.stringify({fnc: 1, tag: 56789, time: moment().toDate().toISOString(), class: global.config.class});
const client = net.createConnection({port: 703}, () => {
  //'connect' listener
  log.info('Connected to server!');
  client.write(req);
});
client.on("data", (data) => {
  console.log("\n" + data.toString("utf8") + "\n");
  log.info("Done");
  process.exit();
}
);
