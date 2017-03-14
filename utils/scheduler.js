var CronJob = require('cron').CronJob;
var log = require("./log.js");
var job;
module.exports = {
    start: function() {
        job = new CronJob('00 30 23 * * 1-5', function() {
                //TODO
            }, function() {
                log.warning("The end-of-day scheduler has stopped !");
            },
            true);
    },
    stop: function() {
      try {
        job.stop();
      } catch(ex)
      {
        log.error("Error while stopping the end-of-day scheduler : " + ex);
      }

    }
};
