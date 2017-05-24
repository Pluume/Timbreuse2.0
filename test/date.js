const moment = require("moment");
var time = moment().startOf("day").add(41400, "seconds").format();
console.log(time);
console.log(moment().format());
console.log(moment().endOf("day").subtract(3605, "seconds").format());
