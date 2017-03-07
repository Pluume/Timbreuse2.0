/**
 * Handle mathematics functions needed by the server.
 *
 * @module csv
 * @class csv
 */
const moment = require("moment");
const fs = require("fs");
const path = require('path');
const config = require("./config.js");
const fsextra = require('fs-extra');
const drivelist = require('drivelist');
const log = require("./log");
const json2csv = require('json2csv');
const async = require('async');
var knex = require('knex')({
    client: 'sqlite3',
    useNullAsDefault: true
});
module.exports = {
    /**
     * Write to a CSV the tag and tag-time provided
     * @method writeBruteLoggingToCSV
     * @param {String} tag the tag.
     * @param {String} time the tag-time.
     **/
    writeBruteLoggingToCSV: (tag, time) => {
        var filename;
        var dirname = path.join(__dirname, "..", "CSV");
        if (!fs.existsSync(dirname)) {
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
    /**
     * Export all the server's CSV to a USB key.
     * @method exportCSV
     * @param {Function} cb a callback that will be called when all the file has been copied to the USB key.
     **/
    exportCSV: (cb) => {
        log.info("Master key detected. Detecting USB drive...");
        drivelist.list((error, drives) => {
            if (error) {
                log.error("Error while detecting USB drive. Aborting...");
                return;
            }
            drives.forEach((drive) => {
                if (!drive.system) {
                    var remotefolder = path.join(drive.mountpoints[0].path, global.config.class + "_" + moment().format('MMMM_Do_YYYY__HH_mm_ss'));
                    log.info("Copying CSV to " + drive.description + " in path " + remotefolder.toString());
                    if (fs.existsSync(remotefolder)) {
                        log.error("The folder already exists. Aborting");
                        return;
                    } else {
                        fs.mkdirSync(remotefolder);
                    }
                    var localfolder = path.join(__dirname, "..", "CSV");
                    if (!fs.existsSync(localfolder)) {
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
    },
    exportDBtoCSV: () => {
        async.waterfall([
            function(callback) {
                var data = [];
                global.db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, rows) => {
                    if (err)
                        callback(err, null);
                    for (var i = 0; i < rows.length; i++) {
                        data[i] = rows[i];
                        data[i].id = i;
                    }

                    callback(null, data);
                });
            },
            function(data, callback) {
                async.each(data, function(cur, callback2) {
                    global.db.all("pragma table_info(" + cur.name + ");", (err, rows) => {
                        data[cur.id].columns = [];
                        for (var i = 0; i < rows.length; i++) {
                            data[cur.id].columns[i] = rows[i].name;
                        }
                        callback2(err);
                    });
                }, function(err) {
                    if (err) {
                        log.error("Error happened during the database dump : " + err);
                        callback(err, null);
                    }
                    callback(null, data);
                });
            },
            function(data, callback) {

                async.each(data, function(cur, callback2) {
                    global.db.all(knex.select().from(cur.name).toString(), (err, rows) => {
                        data[cur.id].rows = [];
                        for (var i = 0; i < rows.length; i++) {
                            var keysbyindex = Object.keys(rows[i]);
                            var row = [];
                            console.log(rows[i]);
                            for (var ii = 0; ii < keysbyindex.length; ii  ++)
                            {
                              row[ii] = rows[i][keysbyindex[ii]];
                            }

                            data[cur.id].rows.push(row);
                            console.log(rows[i]);
                        }
                        callback2(err);

                    });
                }, function(err) {
                    if (err) {
                        log.error("Error happened during the database dump : " + err);
                        callback(err, data);
                    }
                    console.log(JSON.stringify(data, null, "\t"));
                    console.log("------");
                });

            }
        ], function(err, result) {
            if (err) {
                log.error("Error happened during the database dump : " + err);
            }
        });

    }
};
