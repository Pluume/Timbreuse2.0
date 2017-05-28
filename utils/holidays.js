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
    for (var i = 0; i < rows.length; i++)
      if ((moment().isAfter(rows[i].date1, "day") || moment().isSame(rows[i].date1, "day")) && (moment().isBefore(rows[i].date2, "day") || moment().isSame(rows[i].date2, "day"))) {
        cb(true);
        return;
      }

    cb(false);
  });
}
module.exports = {
  isTodayOff
}
