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
  hd.isTodayOff((isTodayOff) => { //Check if today is holidays
    global.db.each(knex.select().from('students').toString(), (err, row) => { //Iterate through students
      if (err) {
        log.error("Error while iterating through students in the database : " + err);
        return;
      }
      var updateStdForTheDay = function(id, status, ntimeDiff, details) { //Function that update the students informations passed in parameter in the database

        if (isNaN(ntimeDiff)) {
          log.error("New time diff is NaN");
          ntimeDiff = row.timeDiff;
        }
        global.db.run(knex("students").where("id", id).update({
          status: (status == global.STATUS.ABS) ? global.STATUS.ABS : global.STATUS.OUT,
          timeDiff: ntimeDiff,
          timeDiffToday: 0,
          details: JSON.stringify(details),
          hadLunch: 0,
          missedPause: -1
        }).toString());
      };
      var updateDetails = function(ndetails, ntimeDiff) { //Function that update student's details in the database
        ndetails.day.push({ //Days points
          time: moment().format(),
          timeDiff: ntimeDiff
        });
        if (moment(moment().format()).isSame(moment().endOf("week"), 'day')) { //Week points

          ndetails.week.push({
            time: moment().format(),
            timeDiff: ntimeDiff
          });
        }
        if (moment(moment().format()).isSame(moment().endOf("month"), 'day')) { //Month points
          ndetails.month.push({
            time: moment().format(),
            timeDiff: ntimeDiff
          });
        }
      };
      var ntimeDiff;
      if (row.status == global.STATUS.IN) { //Student's last status, is IN.
        ntimeDiff = row.timeDiff - dayConfig.timeToDo; //Substract the time to do
        log.save(global.LOGS.TIMEERROR, row.id, "", row.lastTagTime, "Last status of the day was IN", row.timeDiff, row.timeDiffToday);
      } else if (row.status == global.STATUS.ABS) {//ABSENT : Do nothing
        ntimeDiff = row.timeDiff
      } else if (!isTodayOff) { //Is not holidays
        ntimeDiff = row.timeDiff + (row.timeDiffToday - dayConfig.timeToDo);
        if (row.isBlocked) { //Check if student is blocked
          if (dayConfig.scheduleFix.length > 0) //Is today a work day ?
            if (new Date(row.lastTagTime) < new Date(math.secondsToDate(dayConfig.scheduleFix[dayConfig.scheduleFix.length - 1].end))) { //Last tag was before last schedule end time
              log.warning("USRID " + row.id + " : Left early. The accepted leaving time is " + math.secondsToHms(dayConfig.scheduleFix[dayConfig.scheduleFix.length - 1].end));
              log.save(global.LOGS.TIMEERROR, row.id, "", row.lastTagTime, "Left early (at " + moment(row.lastTagTime).format("H:mm:ss") + ")", row.timeDiff, row.timeDiffToday);
            }
        } else {
          if (dayConfig.schedule.length > 0)//Is today a work day ?
            if (new Date(row.lastTagTime) < new Date(math.secondsToDate(dayConfig.schedule[dayConfig.schedule.length - 1].end))) {//Last tag was before last schedule end time
              log.warning("USRID " + row.id + " : Left early. The accepted leaving time is " + math.secondsToHms(dayConfig.schedule[dayConfig.schedule.length - 1].end));
              log.save(global.LOGS.TIMEERROR, row.id, "", row.lastTagTime, "Left early (at " + moment(row.lastTagTime).format("H:mm:ss") + ")", row.timeDiff, row.timeDiffToday);
            }
        }

      }
      if (!row.hadLunch && row.status != global.STATUS.ABS && dayConfig.lunch && !isTodayOff) //Has he lunched ? is today a lunch day ?
      {
        log.info("USRID " + row.id + " : Missed lunch");
        log.save(global.LOGS.NOLUNCH, row.id, "SERVER", null, "", row.timeDiff, row.timeDiffToday);
      }

      var ndetails;
      try {
        ndetails = JSON.parse(row.details); //Parse details
        if (ndetails == null) {
          ndetails.day = [];
          ndetails.week = [];
          ndetails.month = []
        };
      } catch (err2) {

        ndetails = {
          day: [],
          week: [],
          month: []
        };
      }
      if (isTodayOff) { //Is Holidays
        ntimeDiff = row.timeDiff + row.timeDiffToday;
        ntimeDiff += (row.missedPause <= 0) ? 0 : (Math.floor(row.missedPause) * (-20 * 60));
        log.save(global.LOGS.ENDOFDAY, row.id, "", moment().format(), "Function executed (Holidays) ", ntimeDiff, 0);
      } else {
        if (row.status != global.STATUS.ABS) { //Check for leave req

          ntimeDiff -= (row.missedPause <= 0) ? 0 : (Math.floor(row.missedPause) * (20 * 60));
          lr.getTimeToRefund(row.id, (res) => { //Get time to be refunded
            ntimeDiff += res;
            if (dayConfig.lunch && !res)
              ntimeDiff -= (row.hadLunch) ? 0 : global.config.lunch.time; //Substract time in case of missed lunch
            if (res) {
              log.info("Time refunded to student " + row.id + " : " + res + " seconds");
              log.save(global.LOGS.LEAVEREQ, row.id, "", moment().format(), "Time refunded " + math.secondsToHms(res) , ntimeDiff, 0);
            }
            log.save(global.LOGS.ENDOFDAY, row.id, "", moment().format(), "Function executed", ntimeDiff, 0);
            updateDetails(ndetails, ntimeDiff);
            updateStdForTheDay(row.id, row.status, ntimeDiff, ndetails);
          });
          return;
        } else {

          log.save(global.LOGS.ENDOFDAY, row.id, "", moment().format(), "Function executed (Absent)", ntimeDiff, 0);
        }

      }
        updateDetails(ndetails, ntimeDiff);
      updateStdForTheDay(row.id, row.status, ntimeDiff, ndetails);
    }, (err, nb) => {
      if (err) {
        log.error("Error : " + err);
        return;
      }
      log.info("Function done ! " + nb + " students treated.");
    });
  });

}
module.exports = {
  /**
   * Start the end-of-day scheduler
   * @method start
   **/
  start: function() {
    job = new CronJob('00 00 23 * * 1-7', function() { //Execute the endOfDay function every day at 23:00
        endOfDay();
      }, function() {
        log.info("Scheduler stopped !");
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
