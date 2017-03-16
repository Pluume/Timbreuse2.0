var CronJob = require('cron').CronJob;
var log = require("./log.js");
var job;
var knex = require('knex')({
    client: 'sqlite3',
    useNullAsDefault: true
});
var moment = require("moment");
const config = require("./config.js");
/**
 * Convert seconds to H:M:S format
 * @method secondsToHms
 **/
function secondsToHms(d) {
    d = Number(d);

    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    return ((h > 0 ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (s < 10 ? "0" : "") + s);
}

/**
 * Function called when the end-of-day scheduler tick
 * @method endOfDay
 **/
function endOfDay() {
    var d = new Date();
    var dayConfig = config.loadDay(d.getDay());
    global.db.each(knex.select().from('students').toString(), (err, row) => {
        if (err) {
            log.error("Error while iterating through students in the database : " + err);
            return;
        }
        var ntimeDiff;
        if (row.status == global.STATUS.IN) {
            ntimeDiff = row.timeDiff + dayConfig.timeToDo;
        } else {
            ntimeDiff = row.timeDiff + (row.timeDiffToday - dayConfig.timeToDo);
        }
        ntimeDiff += (row.missedPause<=0) ? 0:(row.missedPause * (-20 * 60)); //20 minutes when missing a pause
        var ndetails;
        try {
            if (ndetails === undefined || ndetails === null)
                throw "Null";
            ndetails = JSON.parse(row.details);
        } catch (err2) {
            ndetails = {
                day: [],
                week: [],
                month: []
            };
        }
        ndetails.day.push({
            time: moment().toDate().toISOString(),
            timeDiff: ntimeDiff
        });
        if (moment(moment().format()).isSame(moment().endOf("week"), 'day')) {
            ndetails.week.push({
                time: moment.toDate().toISOString(),
                timeDiff: ntimeDiff
            });
        }
        if (moment(moment().format()).isSame(moment().endOf("month"), 'day')) {
            ndetails.month.push({
                time: moment.toDate().toISOString(),
                timeDiff: ntimeDiff
            });
        }

        //TODO Notification on student's status == IN at end of day
        global.db.run(knex("students").where("id", row.id).update({
            status: global.STATUS.OUT,
            timeDiff: ntimeDiff,
            timeDiffToday: 0,
            details: JSON.stringify(ndetails),
            hadLunch: 0,
            missedPause: -1
        }).toString());
    }, (err, nb) => {
        if (err) {
            log.error("Error : " + err);
            return;
        }
        log.info("Function done ! " + nb + " students treated.");
    });
}
module.exports = {
    /**
     * Start the end-of-day scheduler
     * @method start
     **/
    start: function() {
        job = new CronJob('* 30 16 * * 1-7', function() { //TODO * 30 23 * * *

                endOfDay();
                job.stop() //TODO REMOVE
            }, function() {
                log.warning("The end-of-day scheduler has stopped !");
            },
            true);
        log.info("Scheduler started !");
    },
    /**
     * Stop the end-of-day scheduler
     * @method stop
     **/
    stop: function() {
        try {
            job.stop();
        } catch (ex) {
            log.error("Error while stopping the end-of-day scheduler : " + ex);
        }

    }
};
