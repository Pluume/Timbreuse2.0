const moment = require("moment");
var time = moment().startOf("day").add(60000, "seconds").utcOffset(moment().utcOffset()).toISOString().toString();
console.log(time);
console.log(moment().toISOString().toString());
