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
/**
 * Check if today is holidays
 * @method isTodayOff
 * @param  {Function} cb Callback with boolean result
 */
function isTodayOff(cb) {
  global.db.all(knex("timeoff").select().toString(), (err, rows) => { //Get all holidays from db
    for (var i = 0; i < rows.length; i++) {
      var date1 = moment(rows[i].date1); //Parse first date
      var date2 = null;
      if (moment(rows[i].date2,moment.ISO_8601,true).isValid()) //Check if second date is valid
        date2 = moment(rows[i].date2);
      if (!date2) {
        if (moment().isSame(rows[i].date1, "day")) { //Check if the start day periode is the same as the first holidays date
          cb(true);
          return;
        }
      } else {
        if ((moment().isAfter(rows[i].date1, "day") || moment().isSame(rows[i].date1, "day")) && (moment().isBefore(rows[i].date2, "day") || moment().isSame(rows[i].date2, "day"))) {
          cb(true); //Check if now if after ou same start day and before or same end day
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
