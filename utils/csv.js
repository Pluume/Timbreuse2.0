const moment = require("moment");
const fs = require("fs");
const path = require('path');
const config = require("./config.js");
const fsextra = require('fs-extra');
const drivelist = require('drivelist');
const log = require("./log");
module.exports = {
    writeBruteLoggingToCSV: (tag, time) => {
        var filename;
        var dirname = path.join(__dirname,"..", "CSV");
        if(!fs.existsSync(dirname))
        {
          fs.mkdirSync(dirname);
        }
        if (global.config.csvFreq) {
            filename = moment().format("DD_MM_YYYY") + ".csv";
        } else {
            filename = "week_" + moment().week() + ".csv";
        }
        var npath = path.join(path.join(dirname, global.config.class + "_" + filename).toString());
        var fd;
        if (!fs.existsSync(npath)) {
            try {
                fd = fs.openSync(npath, "a");
                fs.writeSync(fd, "tag,time\n");
                fs.writeSync(fd, tag + "," + time + "\n");
                fs.closeSync(fd);
                return;
            } catch (err) {
                log.error("Can't write to the file, aborting...\n Filename : " + npath);
                return;
            }
        }
        try {
            fd = fs.openSync(npath, "a");
            fs.writeSync(fd, tag + "," + time + "\n");
            fs.closeSync(fd);
            return;
        } catch (err) {
            log.error("Can't write to the file, aborting...\n Filename : " + npath);
            return;
        }

    },
    exportCSV: (cb) => {
        log.info("Master key detected. Detecting USB drive...");
        drivelist.list((error, drives) => {
            if (error) {
                log.error("Error while detecting USB drive. Aborting...");
                return;
            }
            drives.forEach((drive) => {
                if (!drive.system) {
                    var remotefolder = path.join(drive.mountpoints[0].path, moment().format('MMMM_Do_YYYY__HH_mm_ss'));
                    log.info("Copying CSV to " + drive.description + " in path " + remotefolder.toString());
                    if (fs.existsSync(remotefolder)) {
                        log.error("The folder already exists. Aborting");
                        return;
                    } else {
                      fs.mkdirSync(remotefolder);
                    }
                    var localfolder = path.join(__dirname, "..", "CSV");
                    if(!fs.existsSync(localfolder))
                    {
                      fs.mkdirSync(localfolder);
                    }
                    var filelist = fs.readdirSync(localfolder);
                    for (var i = 0; i < filelist.length; i++) {
                        try {
                            log.info("Copying CSV file " + filelist[i]);
                            fsextra.copySync(path.join(localfolder, filelist[i]), path.join(remotefolder, filelist[i]));
                        } catch (err) {
                            log.error("Error copying CSV files : " + err);
                            return;
                        }
                    }
                    cb();
                }
            });
        });
    }
};
