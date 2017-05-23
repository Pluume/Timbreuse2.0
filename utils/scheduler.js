var CronJob = require('cron').CronJob;
var log = require("./log.js");
var job;
var knex = require('knex')({
  client: 'sqlite3',
  useNullAsDefault: true
});
var moment = require("moment");
var math = require("./math.js");
const config = require("./config.js");
const lr = require("./leaveReq.js");
const hd = require("./holidays.js");
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
      ntimeDiff = row.timeDiff - dayConfig.timeToDo;
      log.save(global.LOGS.TIMEERROR, row.id, "", row.lastTagTime, "Last status of the day was IN", row.timeDiff, row.timeDiffToday);
    } else if (row.status == global.STATUS.ABS) {
      ntimeDiff = row.timeDiff
    } else {
      ntimeDiff = row.timeDiff + (row.timeDiffToday - dayConfig.timeToDo);

      if (row.isBlocked) {

        if (dayConfig.scheduleFix.length > 0)
          if (new Date(row.lastTagTime) < new Date(math.secondsToDate(dayConfig.scheduleFix[dayConfig.scheduleFix.length - 1].end))) {
            log.warning("USRID " + row.id + " : Left early");
            log.save(global.LOGS.TIMEERROR, row.id, "", row.lastTagTime, "Left early (at " + moment(row.lastTagTime).format("H:MM:SS") + ")", row.timeDiff, row.timeDiffToday);
          }
      } else {

        if (dayConfig.schedule.length > 0)
          if (new Date(row.lastTagTime) < new Date(math.secondsToDate(dayConfig.schedule[dayConfig.schedule.length - 1].end))) {
            log.warning("USRID " + row.id + " : Left early");
            log.save(global.LOGS.TIMEERROR, row.id, "", row.lastTagTime, "Left early (at " + moment(row.lastTagTime).format("H:MM:SS") + ")", row.timeDiff, row.timeDiffToday);
          }
      }

    }
    if (!row.hadLunch && row.status != global.STATUS.ABS && dayConfig.lunch && !hd.isTodayOff)
      log.save(global.LOGS.NOLUNCH, row.id, "SERVER", null, "", row.timeDiff, row.timeDiffToday);
    var ndetails;
    try {
      ndetails = JSON.parse(row.details);
    } catch (err2) {
      ndetails = {
        day: [],
        week: [],
        month: []
      };
    }
    if (hd.isTodayOff) {
      ntimeDiff = row.timeDiff + row.timeDiffToday;
      ntimeDiff += (row.missedPause <= 0) ? 0 : (row.missedPause * (-20 * 60));
      log.save(global.LOGS.ENDOFDAY, row.id, "", moment().format(), "END of DAY Function executed (Holidays) ", ntimeDiff, 0);
    } else {
      ndetails.day.push({
        time: moment().format(),
        timeDiff: ntimeDiff
      });
      if (moment(moment().format()).isSame(moment().endOf("week"), 'day')) {
        ndetails.week.push({
          time: moment().format(),
          timeDiff: ntimeDiff
        });
      }
      if (moment(moment().format()).isSame(moment().endOf("month"), 'day')) {
        ndetails.month.push({
          time: moment().format(),
          timeDiff: ntimeDiff
        });
      }
      if (row.status != global.STATUS.ABS)
      {
        ntimeDiff -= (row.missedPause <= 0) ? 0 : (row.missedPause * (20 * 60));
        ntimeDiff += lr.getTimeToRefund(row.id);
        if (dayConfig.lunch)
          ntimeDiff -= (row.hadLunch) ? 0 : global.config.lunch.time; //Substract time in case of missed lunch
          log.save(global.LOGS.ENDOFDAY, row.id, "", moment().format(), "END of DAY Function executed", ntimeDiff, 0);
      } else {
        log.save(global.LOGS.ENDOFDAY, row.id, "", moment().format(), "END of DAY Function executed (Absent)", ntimeDiff, 0);
      }

    }
    //TODO Notification on student's status == IN at end of day
    global.db.run(knex("students").where("id", row.id).update({
      status: (row.status == global.STATUS.ABS) ? global.STATUS.ABS : global.STATUS.OUT,
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
    job = new CronJob('00 00 23 * * 1-7', function() {
        endOfDay();
      }, function() {

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

  },
  endOfDay
};
