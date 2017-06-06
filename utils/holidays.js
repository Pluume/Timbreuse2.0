/**
 * Handle the timeoff functions
 *
 * @module holidays
 * @class holidays
 */
var moment = require("moment");
var knex = require('knex')({
  client: 'sqlite3',
  useNullAsDefault: true
});

function isTodayOff(cb) {
  global.db.all(knex("timeoff").select().toString(), (err, rows) => {
    for (var i = 0; i < rows.length; i++) {
      var date1 = moment(rows[i].date1);
      var date2 = null;
      if (moment(rows[i].date2,moment.ISO_8601,true).isValid())
        date2 = moment(rows[i].date2);
      if (!date2) {
        if (moment().isSame(rows[i].date1, "day")) {
          cb(true);
          return;
        }
      } else {
        if ((moment().isAfter(rows[i].date1, "day") || moment().isSame(rows[i].date1, "day")) && (moment().isBefore(rows[i].date2, "day") || moment().isSame(rows[i].date2, "day"))) {
          cb(true);
          return;
        }
      }

    }


    cb(false);
  });
}
module.exports = {
  isTodayOff
}
