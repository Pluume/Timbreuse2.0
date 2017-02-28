const moment = require("moment");
const fs = require("fs");
const path = require('path');
const config = require("./config.js");
module.exports = {
    writeBruteLoggingToCSV: (tag, time) => {
        var filename = path.join(__dirname, "..", "CSV", config.data().hostname + "_" + moment().format("DDMMYYYY") + ".csv");//TODO HOSTNAME in config file
        var fd;
        if (!fs.existsSync(filename))
        {
            try {
                fd = fs.openSync(filename, "w+");
                fs.writeSync(fd, "tag,time\n");
                fs.writeSync(fd, tag + "," + time + "\n");
                fs.closeSync(fd);
                return;
            } catch (err) {
                console.log("Can't write to the file, aborting... (utils/csv.js)\n Filename : " + filename);
                return;
            }
        }
        try {
            fd = fs.openSync(filename, "a");
            fs.writeSync(fd, tag + "," + time + "\n");
            fs.closeSync(fd);
            return;
        } catch (err) {
            console.log("Can't write to the file, aborting... (utils/csv.js)\n Filename : " + filename);
            return;
        }

    },
    exportCSV: () => {

    }
};
