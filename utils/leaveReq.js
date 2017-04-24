var log = require("./log.js");
var moment = require("moment");

const wait = require("deasync").sleep(10);
const async = require("async");
const config = require("./config.js");
const math = require("./math.js");
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
    global.db.handle.run(knex("leavereq").insert({
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
    if (momentA > momentB) return 1;
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
    var smmt = moment(res.dateFrom);
    var smmtMidnight = smmt.clone().startOf('day');
    var ssecs = smmt.diff(smmtMidnight, 'seconds');
    var emmt = moment(res.dateTo);
    var esecs = emmt.diff(smmtMidnight, 'seconds');
    if (esecs > 86400) //If the end time of the leavereq is more than a day
        esecs -= emmt.diff(smmtMidnight, 'days') * 86400;
    var today = config.loadDay(new Date().getDay());
    if (compareDate(moment().format("DD/MM/YYYY"), moment(res.dateFrom).format("DD/MM/YYYY")) === -1) // If for the future
    {
        return diff;
    }
    if (compareDate(moment().format("DD/MM/YYYY"), moment(res.dateTo).format("DD/MM/YYYY")) === 1) // If has passed
    {
        //TODO DELETE THIS RECORD
        return diff;
    }
    if (compareDate(moment().format("DD/MM/YYYY"), moment(res.dateFrom).format("DD/MM/YYYY")) === 1) // If has started precedently
    {
        ssecs = today.schedule[0].begin - 1;
    }
    if (compareDate(moment().format("DD/MM/YYYY"), moment(res.dateTo).format("DD/MM/YYYY")) === -1) // If has started precedently
    {
        esecs = today.schedule[today.schedule.length - 1].end + 1;
    }
    for (var i = 0; i < today.schedule.length; i++) { //Iterating through the schedule of the day

        if (ssecs <= today.schedule[i].begin) { //The start time is before start schedule

            if (esecs >= today.schedule[i].begin && esecs <= today.schedule[i].end)
                diff += esecs - today.schedule[i].begin;

            if (esecs <= today.schedule[i].end) //But the end is before this schedule end
                break;
            else {
                diff += today.schedule[i].end - today.schedule[i].begin; //The begin and end of the leavereq is out of the schedule so we add all to the diff
                continue;
            }
        }

        if (ssecs > today.schedule[i].begin && ssecs < today.schedule[i].end) { //The start of the leavereq is superior to the schedule begin but inferior to it's end
            if (esecs < today.schedule[i].end) { //But the end of the leavereq is inferior to the end of the schedule.
                diff += esecs - ssecs; //So we diff from these two dates
                break;
            }
            diff += today.schedule[i].end - ssecs; //However is the end of the leavereq is superior to the end of the schedule, we diff from the start of the leavereq to the end of the schedule
            continue;
        }
    }
    if (diff > today.timeToDo)
        diff = today.timeToDo;
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
    global.db.handle.run(knex("leavereq").where({
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
    }).del().toString());
}

function createPDF(studentid, dateFrom, dateTo, missedTest, reason, reasonDesc, proof, where) //FIXME
{

}
module.exports = {
    //isToday
};
