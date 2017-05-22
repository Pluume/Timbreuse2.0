var moment = require("moment");
var knex = require('knex')({
  client: 'sqlite3',
  useNullAsDefault: true
});

function isTodayOff() {
  global.db.all(knex("timeoff").select().toString(), (err, rows) => {
    for (var i = 0; i < rows.length; i++) {
      if (moment().isAfter(rows[i].date1,"day") && moment().isBefore(rows[i].date2, "day"))
        return true;
      return false;
    }
  });
}
module.exports = {
  isTodayOff
}
