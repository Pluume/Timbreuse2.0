const log = require("./../utils/log.js");
const moment = require("moment");
const config = require("./../utils/config.js");
const net = require("net");
const csv = require("./../utils/csv.js");
config.read();
var tag, time;
tag = "1234";
time = moment().toDate().toISOString();
var req = JSON.stringify({
    fnc: 1,
    tag: tag,
    time: time,
    class: global.config.class
});
const client = net.createConnection({
    port: 703
}, () => {
    //'connect' listener
    log.info('Connected to server!');
    csv.writeBruteLoggingToCSV(tag, time);
    client.write(req);
});
client.on("data", (data) => {
    console.log("\n" + data.toString("utf8") + "\n");
    var nstatus;
    var jsondata = JSON.parse(data.toString("utf8"));
    if (jsondata.student.status == 1)
        nstatus = "IN";
    else
        nstatus = "OUT";
    log.info("NEW STATUS : " + nstatus);
    log.info("NEW TIME DIFF : " + jsondata.student.timeDiffToday);
    log.info("Done");
    process.exit();
});
