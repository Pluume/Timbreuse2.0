/**
 * Handle the leave applications function
 *
 * @module leavereq
 * @class leavereq
 */
var log = require("./log.js");
var moment = require("moment");

const async = require("async");
const config = require("./config.js");
const math = require("./math.js");
var knex = require('knex')({
  client: 'sqlite3',
  useNullAsDefault: true
});
/**
 * Create a leave request in the database
 * @method create
 * @param {Integer} studentid The id of the student in the database.
 * @param {Date} dateFrom The date from which the student wants to leave.
 * @param {Date} dateTo The date until when the student wants to leave.
 * @param {Boolean} missedTest true if he has missed a test.
 * @param {Integer} reason A reason from an enumeration in the db/db.js file.
 * @param {String} reasonDesc If the reason is set to other, a description.
 * @param {Integer} proof the proof provided.
 * @param {String} where the place it has been made.
 **/
function create(studentid, dateFrom, dateTo, missedTest, reason, reasonDesc, proof, where) {
  global.db.handle.run(knex("leavereq").insert({ //Insert in db
    studentid: studentid,
    dateFrom: dateFrom,
    dateTo: dateTo,
    missedTest: missedTest,
    reason: reason,
    reasonDesc: reasonDesc,
    proof: proof,
    where: where
  }).returning("*").toString());
}
/**
 * Compare two dates
 * @method compareDate
 * @param {Date} dateTimeA The first date.
 * @param {Date} dateTimeB The second date.
 * @return 1 if A>B, 0 if A=B and -1 if A<B
 **/
function compareDate(dateTimeA, dateTimeB) {
  var momentA = moment(dateTimeA, "DD/MM/YYYY");
  var momentB = moment(dateTimeB, "DD/MM/YYYY");
  if (momentA > momentB) return 1; //See the momentjs lib for documentation about date comparaison
  else if (momentA < momentB) return -1;
  else return 0;
}
/**
 * Get the number of second to add to the student because he had justified his missing time.
 * @method routine
 * @param {Object} res The result of the row corresponding to the query SELECT * FROM leavereq WHERE 'studentid' = x LIMIT 1;.
 * @return The number of seconds to add to this student
 **/
function routine(res) {
  var sync = true;
  var diff = 0;
  var smmt = moment(res.dateFrom); //Start date
  var smmtMidnight = smmt.clone().startOf('day'); //Start date's midnights
  var ssecs = smmt.diff(smmtMidnight, 'seconds'); //Start date : number of second since midnight
  var emmt = moment(res.dateTo); //End date
  var esecs = emmt.diff(smmtMidnight, 'seconds'); //End date : number of seconds sinces start date's midnight
  if (esecs > 86400) //If the end time of the leavereq is more than a day
    esecs -= emmt.diff(smmtMidnight, 'days') * 86400;
  var today = config.loadDay(new Date().getDay());
  if (compareDate(moment().format("DD/MM/YYYY"), moment(res.dateFrom).format("DD/MM/YYYY")) === -1) // If for the future
  {
    return diff; //Return nothing
  }
  if (compareDate(moment().format("DD/MM/YYYY"), moment(res.dateTo).format("DD/MM/YYYY")) === 1) // If has passed
  {
    return diff; //Return nothing
  }
  if (compareDate(moment().format("DD/MM/YYYY"), moment(res.dateFrom).format("DD/MM/YYYY")) === 1) // If has started precedently
  {
    ssecs = today.scheduleFix[0].begin - 1; //Set the start date just before the scheduleFix's begin
  }
  if (compareDate(moment().format("DD/MM/YYYY"), moment(res.dateTo).format("DD/MM/YYYY")) === -1) // If it will not end today but in the future
  {
    esecs = today.scheduleFix[today.scheduleFix.length - 1].end + 1; //Set the end date just after the scheduleFix's end
  }
  for (var i = 0; i < today.scheduleFix.length; i++) { //Iterating through the scheduleFix of the day

    if (ssecs <= today.scheduleFix[i].begin) { //The start time is before start scheduleFix

      if (esecs >= today.scheduleFix[i].begin && esecs <= today.scheduleFix[i].end) //End time in scheduleFix
        diff += esecs - today.scheduleFix[i].begin; //diff equal from the scheduleFix between to esecs
      if (esecs <= today.scheduleFix[i].end) //But the end is before this scheduleFix end
        break;
      else {
        diff += today.scheduleFix[i].end - today.scheduleFix[i].begin; //The begin and end of the leavereq is out of the scheduleFix so we add all to the diff
        continue;
      }
    }
    if (ssecs > today.scheduleFix[i].begin && ssecs < today.scheduleFix[i].end) { //The start of the leavereq is superior to the scheduleFix begin but inferior to it's end
      if (esecs < today.scheduleFix[i].end) { //But the end of the leavereq is inferior to the end of the scheduleFix.
        diff += esecs - ssecs; //So we diff from these two dates
        break;
      }

      diff += today.scheduleFix[i].end - ssecs; //However is the end of the leavereq is superior to the end of the scheduleFix, we diff from the start of the leavereq to the end of the scheduleFix
      continue;

    }
  }
  if (diff > today.timeToDo)
    diff = today.timeToDo; //Never give more than the maximum
  return diff;
}
/**
 * Update a leave request in the database
 * @method update
 * @param {Integer} id The id of the leavereq object.
 * @param {Integer} studentid The id of the student in the database.
 * @param {Date} dateFrom The date from which the student wants to leave.
 * @param {Date} dateTo The date until when the student wants to leave.
 * @param {Boolean} missedTest true if he has missed a test.
 * @param {Integer} reason A reason from an enumeration in the db/db.js file.
 * @param {String} reasonDesc If the reason is set to other, a description.
 * @param {Integer} proof the proof provided.
 * @param {String} where the place it has been made.
 **/
function update(id, studentid, dateFrom, dateTo, missedTest, reason, reasonDesc, proof, where) {
  global.db.handle.run(knex("leavereq").where({ //Update in db
    id: id
  }).update({
    studentid: studentid,
    dateFrom: dateFrom,
    dateTo: dateTo,
    missedTest: missedTest,
    reason: reason,
    reasonDesc: reasonDesc,
    proof: proof,
    where: where
  }).toString());
}
/**
 * Delete a leave request in the database
 * @method erase
 * @param {Integer} id The id of the leavereq in the database.
 **/
function erase(id) {
  global.db.handle.run(knex("leavereq").where({
    id: id
  }).del().toString()); //Del leavereq
}

function createPDF(studentid, dateFrom, dateTo, missedTest, reason, reasonDesc, proof, where) //TODO
{

}
/**
 * Return if a student is in a leavereq's range
 * @method checkIfInLeaveReq
 * @param {Integer} stdid The id a student.
 * @param {Moment} time The time we want to check for.
 **/
function checkIfInLeaveReq(stdid, time) {
  global.db.all(knex("students").where({
    id: stdid
  }).toString(), (err, rows) => {
    if (err) {
      log.error(err);
      return false;
    }
    if (rows == undefined)
      return false;
    for (var i = 0; i < rows.length; i++) {
      var momentA = moment(rows[i].dateFrom);
      var momentB = moment(rows[i].dateTo);
      if (compareDate(momentA, time) <= 0 && compareDate(momentB, time) >= 0) //Check if time in leaveReq
        return true;
      else
        return false;
    }
  });
}
/**
 * Get the number of second the server needs to give back to a student that has justified his absence
 * @method getTimeToRefund
 * @param {Integer} stdid The id a student.
 * @param {Function} cb Callback called when the function is done processing, with one argument : the number of seconds to refund.
 **/
function getTimeToRefund(stdid, cb) {
  var res = 0;
  var today = config.loadDay(new Date().getDay());
  global.db.all(knex("leavereq").select().where({ //Get all leavereq for student
    studentid: stdid,
    acpt: 1
  }).toString(), (err, rows) => {
    if (err) {
      log.error(err);
      cb(0);
    }
    if (rows == undefined)
      cb(0);
    for (var i = 0; i < rows.length; i++) //Iterate through leavereq
    {
      res += routine(rows[i]); //Add "to be refunded" time to result
    }

    if (res > today.timeToDo) // Do give more than the time to do for this day
      res = today.timeToDo;
    cb(res);
  });
}


module.exports = {
  getTimeToRefund,
  checkIfInLeaveReq,
  routine
};
