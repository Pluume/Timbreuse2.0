var lr = require("../utils/leaveReq.js");
var conf = require("../utils/config.js");
var moment = require("moment");
conf.read();
console.log("Now is " + moment().format("LLLL"));
var obj = {id: 1, studentid: 2, dateFrom: moment().subtract(10,"hours").format(),dateTo:moment().add(5,  "hours").format(),missedTest: 0, reason:1,reasonDesc:"blaw",proof: 0, where:"efw", accepted: 1};
console.log(lr.routine(obj));
