const moment = require("moment");

console.log(moment(moment().add(7,"hours")).format("HH:mm"));
console.log(moment(moment().add(7,"hours")).format("DD/MM/YY"));
