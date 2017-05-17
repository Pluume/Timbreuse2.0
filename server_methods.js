/**
 * Handle the Timbreuse's server incoming data.
 *
 * @module server
 * @submodule server_methods
 * @class server_methods
 */
const log = require("./utils/log.js");
const math = require("./utils/math.js");
const csv = require("./utils/csv.js");
const crypto = require("crypto-js");
const lodash = require("lodash");
const request = require("./request.js");
const knex = require('knex')({
  client: 'sqlite3',
  useNullAsDefault: true
});
var tagReqList = require("array")();
var tagReqFncStarted = false;
const moment = require("moment");
const config = require("./utils/config.js");
const db = require("./db/db.js");
const async = require("async");
/**
 * Generate the a base for an outgoing request
 * @method getBaseReq
 * @return {Object} request base
 **/
function getBaseReq(fnc) {
  return {
    fnc: fnc,
    error: request.ERROR.OK
  };
}
/**
 * Save the propagated tag request into this Timbreuse's CSV
 * @method propagate_tag
 * @param {Object} ireq a JSON object containing the incoming request.
 **/
function propagate_tag(ireq) {
  csv.writeBruteLoggingToCSV(ireq.tag.replace(/\s/g, ''), ireq.time);
}
/**
 * Send a ping to server
 * @method pingRequest
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 **/
function pingRequest(conn) {
  socket.write("up");
  //TODO
}

function pushNotifications(profid, type, message) {
  var now = moment().format();
  global.db.run(knex("notifications").insert({
    userid: profid,
    type: type,
    message: message,
    date: now,
    read: 0
  }).toString(), function() {
    var arr = lodash.filter(global.clients, function(o) {
      try {
        return o.user.id == profid
      } catch (err) {
        return false;
      }
    });
    var oreq = getBaseReq(request.REQUEST.UPDATENOTIF);
    oreq.data = {
      id: this.lastID,
      type: type,
      message: message,
      date: now,
      read: 0
    };
    for (var i = 0; i < arr.length; i++) {
      arr[i].socket.write(JSON.stringify(oreq) + "\0");
    }
  });

}

function updateNotification(profid, notifid) {
  global.db.get(knex("notifications").select().where({
    id: notifid
  }).toString(), (err, row) => {
    if (err || row == undefined) {
      log.error("Error querrying the database : " + err);
      return;
    }
    var arr = lodash.filter(global.clients, function(o) {
      try {
        return o.user.id == profid
      } catch (err) {
        return false;
      }
    });
    var oreq = getBaseReq(request.REQUEST.TOGGLENOTIFICATION);
    oreq.data = row;
    for (var i = 0; i < arr.length; i++) {
      arr[i].socket.write(JSON.stringify(oreq) + "\0");
    }
  });

}

function sendUpdate(id, arg) {
  var arr = lodash.filter(global.clients, function(o) {
    try {
      return o.user.id == id
    } catch (err) {
      return false;
    }

  });
  var oreq = getBaseReq(request.REQUEST.UPDATESTD);
  oreq.data = arg;
  for (var i = 0; i < arr.length; i++) {
    arr[i].socket.write(JSON.stringify(oreq) + "\0");
  }
}

function tagRoutine(conn, user, ireq) {
  var oreq = getBaseReq(request.REQUEST.TAG);

  if (user.rank == global.RANK.PROF) { //Prof card tagged

    oreq.fnc = request.REQUEST.MASTER;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }
  global.db.get(knex.select().from("students").where("userid", user.id).toString(), (err2, row2) => {
    if (err2) {
      log.error("Error while accessing the database...\n" + err);

      oreq.fnc = request.REQUEST.TAG;
      oreq.error = request.ERROR.SQLITE;
      if (!ireq.delayed && ireq.client == undefined)
        conn.socket.write(JSON.stringify(oreq) + "\0");
      return;
    }
    if (row2 === undefined) {
      log.error("No student corresponding to userid : " + user.id + "...");

      oreq.fnc = request.REQUEST.TAG;
      oreq.error = request.ERROR.SQLITE;
      if (!ireq.delayed && ireq.client == undefined)
        conn.socket.write(JSON.stringify(oreq) + "\0");
      return;
    }
    var nstatus;
    var nTimeDiffToday;
    var nlastTagTime;
    if (row2.status == global.STATUS.IN) //Departure
    {
      nstatus = global.STATUS.OUT;
      var delta = math.getTimeDelta(new Date((ireq.time) ? ireq.time : moment().format().toString()).getTime(), new Date(row2.lastTagTime).getTime());
      nTimeDiffToday = row2.timeDiffToday + delta;
      var missedPause = Math.floor(delta / global.config.pause.interval); //Calculate the number of missedPause
      if (missedPause) {
        log.warning("USRID : " + user.id + " : regular break rule not respected " + missedPause + " time(s) !");
        log.save(global.LOGS.NOPAUSE, row2.id, ireq.class, (ireq.time) ? ireq.time : moment().format().toString(), "", row2.timeDiff, row2.timeDiffToday);
        pushNotifications(row2.profid, global.LOGS.NOPAUSE, user.fname + " " + user.lname + " hasn't take a pause in a " + delta + " session.");
      }
      global.db.serialize(() => {
        global.db.run(knex("students").update({
          timeDiffToday: isNaN(nTimeDiffToday) ? row2.timeDiffToday : nTimeDiffToday,
          lastTagTime: (ireq.time) ? ireq.time : moment().format().toString(),
          status: nstatus,
          missedPause: isNaN(missedPause) ? (row2.missedPause) : (row2.missedPause + missedPause)
        }).where("userid", user.id).toString());

        global.db.get(knex.select().from("students").where("userid", user.id).toString(), (err3, row3) => {
          if (err3) {
            log.error("Error while accessing the database...\n" + err);

            oreq.fnc = request.REQUEST.TAG;
            oreq.error = request.ERROR.SQLITE;
            if (!ireq.delayed && ireq.client == undefined)
              conn.socket.write(JSON.stringify(oreq) + "\0");
            return;
          }

          oreq.fnc = request.REQUEST.TAG;
          oreq.student = row3;
          oreq.student.user = user;
          delete oreq.student.user.password;
          if (!ireq.delayed && ireq.client == undefined)
            conn.socket.write(JSON.stringify(oreq) + "\0");
          sendUpdate(row3.profid, oreq.student);
          log.save(global.LOGS.OUT, row3.id, ireq.class, (ireq.time) ? ireq.time : moment().format().toString(), ((ireq.comments == undefined) ? "" : ireq.comments), row3.timeDiff, row3.timeDiffToday);
        });
      });



    } else { //Arrival
      nstatus = global.STATUS.IN;
      var delta = math.getTimeDelta(new Date((ireq.time) ? ireq.time : moment().format().toString()).getTime(), new Date(row2.lastTagTime).getTime());
      var nTimeDiffToday = row2.timeDiffToday;
      delta = isNaN(delta) ? 0 : delta;
      if (delta < global.config.pause.minimum && delta > global.config.pause.minimum_error) //error < delta < minimum
      {
        nTimeDiffToday -= global.config.pause.minimum - delta; //TODO notification on illegal short pause
        log.warning("USRID : " + user.id + " : minimum pause rule not respected !");
        log.save(global.LOGS.MINIMUMPAUSE, row2.id, ireq.class, (ireq.time) ? ireq.time : moment().format().toString(), "", row2.timeDiff, row2.timeDiffToday);
        pushNotifications(row2.profid, global.LOGS.MINIMUMPAUSE, user.fname + " " + user.lname + " has done a pause in less time than the minimum accepted.");
      }

      var now = moment((ireq.time) ? ireq.time : moment().format().toString());
      var nowAtMidnight = moment((ireq.time) ? ireq.time : moment().format().toString()).clone().startOf('day');
      var nowFromMidnight = now.diff(nowAtMidnight, 'seconds');
      var hadLunch = 0;
      var missedPause = row2.missedPause;
      if (nowFromMidnight > (global.config.lunch.begin + global.config.lunch.time) && nowFromMidnight < global.config.lunch.end) {
        var pauseDelta = math.getTimeDelta(moment((ireq.time) ? ireq.time : moment().format().toString()).toDate().getTime(), new Date(row2.lastTagTime).getTime());
        if (pauseDelta >= global.config.lunch.time)
          hadLunch = 1;
      }
      var awayTime = math.getTimeDelta(new Date((ireq.time) ? ireq.time : moment().format().toString()).getTime(), new Date(row2.lastTagTime).getTime());
      if (awayTime >= global.config.pause.time && row2.missedPause > 0) {
        missedPause -= Math.floor(awayTime / global.config.pause.time);
        missedPause = (missedPause < 0) ? 0 : missedPause;
      }
      global.db.serialize(() => {
        global.db.run(knex("students").update({
          status: nstatus,
          lastTagTime: (ireq.time) ? ireq.time : moment().format().toString(),
          hadLunch: hadLunch,
          timeDiffToday: nTimeDiffToday
        }).where("userid", user.id).toString());
        global.db.get(knex.select().from("students").where("userid", user.id).toString(), (err3, row3) => {
          if (err3) {
            log.error("Error while accessing the database...\n" + err);

            oreq.fnc = request.REQUEST.TAG;
            oreq.error = request.ERROR.SQLITE;
            if (!ireq.delayed && ireq.client == undefined)
              conn.socket.write(JSON.stringify(oreq) + "\0");
            return;
          }

          oreq.fnc = request.REQUEST.TAG;
          oreq.student = row3;
          oreq.student.user = user;
          delete oreq.student.user.password;
          if (!ireq.delayed && ireq.client == undefined)
            conn.socket.write(JSON.stringify(oreq) + "\0");
          sendUpdate(row3.profid, oreq.student);
          var d = new Date();
          var dayConfig = config.loadDay(d.getDay());
          log.save(global.LOGS.IN, row3.id, ireq.class, (ireq.time) ? ireq.time : moment().format().toString(), ((ireq.comments == undefined) ? "" : ireq.comments), row3.timeDiff, row3.timeDiffToday);
          if (moment((ireq.time) ? ireq.time : moment().format().toString()).isBefore(moment(row3.lastTagTime), "day")) { //First tag of the day
            if (row2.isBlocked) {
              if (dayConfig.scheduleFix.length > 0)
                if (new Date((ireq.time) ? ireq.time : moment().format().toString()) > new Date(math.secondsToDate(dayConfig.scheduleFix[0].begin))) {
                  log.warning("USRID " + user.id + " : Arrived late");
                  log.save(global.LOGS.TIMEERROR, row3.id, "", row3.lastTagTime, "Arrived late", row3.timeDiff, row3.timeDiffToday);
                  pushNotifications(row3.profid, global.LOGS.TIMEERROR, user.fname + " " + user.lname + " arrived late.");
                }
            } else {
              if (dayConfig.schedule.length > 0)
                if (new Date((ireq.time) ? ireq.time : moment().format().toString()) > new Date(math.secondsToDate(dayConfig.schedule[0].begin))) {
                  log.warning("USRID " + user.id + " : Arrived late");
                  log.save(global.LOGS.TIMEERROR, row3.id, "", row3.lastTagTime, "Arrived late", row3.timeDiff, row3.timeDiffToday);
                  pushNotifications(row3.profid, global.LOGS.TIMEERROR, user.fname + " " + user.lname + " arrived late.");
                }
            }
          }
        });
      });
    }
  });
}

/**
 * Handle a tag request (When a student arrive or leave)
 * @method tagRequest
 **/
function tagRequest(item, index) {

  var oreq = getBaseReq(request.REQUEST.TAG);
  var ireq = item.ireq;
  var conn = item.connection;
  tagReqList.splice(index, 1); // Remove current item
  if (ireq.tag != undefined && ireq.time != undefined)
    csv.writeBruteLoggingToCSV(ireq.tag.replace(/\s/g, ''), (ireq.time) ? ireq.time : moment().format().toString());
  if (global.DEBUG && ireq.tag != undefined)
    console.log("[TAG] : " + ireq.tag.replace(/\s/g, ''));
  if (ireq.tag != undefined) {
    global.db.get(knex.select().from("users").where("tag", ireq.tag.replace(/\s/g, '')).toString(), (err, row) => {
      if (err) {
        log.error("Error while accessing the database...\n" + err);

        oreq.fnc = request.REQUEST.TAG;
        oreq.error = request.ERROR.SQLITE;
        conn.socket.write(JSON.stringify(oreq) + "\0");
        return;
      }
      if (row === undefined) {
        log.error("No user with this tag...");

        oreq.fnc = request.REQUEST.TAG;
        oreq.error = request.ERROR.WRONGTAG;
        conn.socket.write(JSON.stringify(oreq) + "\0");
        return;
      }
      if (ireq.time === undefined || ireq.class === undefined) {
        log.error("Request ill formed.");
        oreq.error = request.ERROR.UNKNOWN;
        conn.socket.write(JSON.stringify(oreq) + "\0");
        return;
      }
      tagRoutine(conn, row, ireq);
    });
  } else if (ireq.id != undefined) {
    global.db.get(knex.select().from("students").where("id", ireq.id).toString(), (err, row0) => {
      if (err) {
        log.error("Error while accessing the database...\n" + err);
        oreq.fnc = request.REQUEST.TAG;
        oreq.error = request.ERROR.SQLITE;
        conn.socket.write(JSON.stringify(oreq) + "\0");
        return;
      }
      if (row0 === undefined) {
        log.error("No user with this tag...");

        oreq.fnc = request.REQUEST.TAG;
        oreq.error = request.ERROR.WRONGTAG;
        conn.socket.write(JSON.stringify(oreq) + "\0");
        return;
      }
      global.db.get(knex.select().from("users").where("id", row0.userid).toString(), (err, row) => {
        if (err) {
          log.error("Error while accessing the database...\n" + err);

          oreq.fnc = request.REQUEST.TAG;
          oreq.error = request.ERROR.SQLITE;
          conn.socket.write(JSON.stringify(oreq) + "\0");
          return;
        }
        if (row === undefined) {
          log.error("No user with this tag...");

          oreq.fnc = request.REQUEST.TAG;
          oreq.error = request.ERROR.WRONGTAG;
          conn.socket.write(JSON.stringify(oreq) + "\0");
          return;
        }
        tagRoutine(conn, row, ireq);
      });
    });
  } else {
    log.error("Request ill formed.");
    oreq.error = request.ERROR.UNKNOWN;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }

}
/**
 * Handle a login request
 * @method authenticate
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 * @param {Object} ireq a JSON object containing the incoming data.
 **/
function authenticate(conn, ireq) {
  var oreq = getBaseReq(ireq.fnc);
  if (ireq.user === undefined || ireq.pass === undefined) {
    log.error("Request ill formed.");
    oreq.error = request.ERROR.UNKNOWN;
    oreq.fnc = request.REQUEST.AUTH;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }
  conn.loading = true;
  global.db.get(knex("users").select().where({
    username: ireq.user
  }).toString(), (err, row) => {
    if (err) {
      log.error("Error while accessing the database...\n" + err);

      oreq.fnc = request.REQUEST.AUTH;
      oreq.error = request.ERROR.SQLITE;
      conn.socket.write(JSON.stringify(oreq) + "\0");
      return;
    }
    if (row == undefined) {

      oreq.fnc = request.REQUEST.AUTH;
      oreq.error = request.ERROR.WRONGCREDS;
      conn.socket.end(JSON.stringify(oreq) + "\0");
      return;
    }
    if (row.password == ireq.pass) {
      conn.user = row;
      oreq.fnc = request.REQUEST.AUTH;
      oreq.error = request.ERROR.OK;
      oreq.rank = row.rank;
      conn.socket.write(JSON.stringify(oreq) + "\0");
      if (conn.user.rank == global.RANK.PROF) {
        global.db.get(knex("class").select().where({
          profid: row.id
        }).toString(), (err, row1) => {
          if (err) {
            log.error("SQLITE Error : " + err);
            return;
          }
          if (row1 == undefined)
            return;
          else
            conn.user.class = row1;
        });
      }
      return;
    }

    oreq.fnc = request.REQUEST.AUTH;
    oreq.error = request.ERROR.WRONGCREDS;
    conn.socket.end(JSON.stringify(oreq) + "\0");
    return;
  });
}
/**
 * End the provided socket
 * @method socketExit
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 **/
function socketExit(conn) {
  if (conn.user !== undefined) {
    log.info("User " + conn.user.username + " logged out.");
  }
  conn.socket.end();
}
/**
 * Get one or multiple students
 * @method getStudent
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 * @param {Object} ireq a JSON object containing the request.
 **/
function getStudent(conn, ireq) {
  var oreq = getBaseReq(ireq.fnc);
  if (conn.user === undefined || conn.user.rank != global.RANK.PROF) {

    oreq.error = request.ERROR.NOTLOGEDIN;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }
  if (ireq.scope === undefined) {
    log.error("Request ill formed.");

    oreq.error = request.ERROR.UNKNOWN;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }

  oreq.student = [];
  if (ireq.scope == request.SCOPE.ALL) {
    var index = 0;
    global.db.all(knex("students").select().where({
        profid: conn.user.id
      }).toString(), (err, rows) => //Get the students
      {
        if (err) {
          log.error("Error : " + err);

          oreq.error = request.ERROR.SQLITE;
          oreq.fnc = request.REQUEST.GETSTUDENT;
          conn.socket.write(JSON.stringify(oreq) + "\0");
          return;
        }
        var finalArray = [];
        global.db.all(knex("users").select("id", "username", "rank", "fname", "lname", "dob", "email", "tag").toString(), (err, rows2) => {
          for (var ii = 0; ii < rows2.length; ii++) {
            var tmp = lodash.filter(rows, {
              "userid": rows2[ii].id
            });
            if (tmp[0] === undefined)
              continue;
            tmp[0].user = rows2[ii];
            delete tmp[0].user.password;
            finalArray.push(tmp[0]);
          }

          oreq.error = request.ERROR.OK;
          oreq.students = finalArray;
          oreq.fnc = request.REQUEST.GETSTUDENT;
          conn.socket.write(JSON.stringify(oreq) + "\0");
          return;
        });
      });
  } else {
    global.db.get(knex("students").select().where({
        id: ireq.scope
      }).toString(), function(err, row) //Get the student
      {
        if (err) {
          log.error("Error : " + err);

          oreq.error = request.ERROR.SQLITE;
          oreq.fnc = request.REQUEST.GETSTUDENT;
          conn.socket.write(JSON.stringify(oreq) + "\0");
          return;
        }
        global.db.get(knex("users").select().where({
          id: row.userid
        }).toString(), (err, row2) => {

          oreq.error = request.ERROR.OK;
          row.user = row2;
          oreq.students = row;
          oreq.fnc = request.REQUEST.GETSTUDENT;
          conn.socket.write(JSON.stringify(oreq) + "\0");
          return;
        });
      });
  }
}
/**
 * Get the class associated with the profs
 * @method getClass
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 * @param {Object} ireq a JSON object containing the request.
 **/
function getClass(conn, ireq) {
  var oreq = getBaseReq(ireq.fnc);
  if (conn.user === undefined || conn.user.rank != global.RANK.PROF) {

    oreq.error = request.ERROR.NOTLOGEDIN;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }
  if (ireq.scope === undefined) {
    log.error("Request ill formed.");

    oreq.error = request.ERROR.UNKNOWN;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }
  if (ireq.scope == request.SCOPE.UNIQUE) {
    global.db.get(knex("class").select().where({
      profid: conn.user.id
    }).toString(), (err, row) => {
      if (err) {
        log.error("Error : " + err);

        oreq.error = request.ERROR.SQLITE;
        conn.socket.write(JSON.stringify(oreq) + "\0");
        return;
      }
      if (row == undefined) {
        log.error("Error : " + err);

        oreq.error = request.ERROR.UNKNOWN;
        conn.socket.write(JSON.stringify(oreq) + "\0");
        return;
      }

      oreq.class = row;
      conn.socket.write(JSON.stringify(oreq) + "\0");
      return;
    });
  }
}
/**
 * Create a new students
 * @method createStudent
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 * @param {Object} ireq a JSON object containing the request.
 **/
function createStudent(conn, ireq) {
  var oreq = getBaseReq(ireq.fnc);
  if (conn.user === undefined || conn.user.rank != global.RANK.PROF) {

    oreq.error = request.ERROR.NOTLOGEDIN;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }
  if (ireq.data === undefined) {

    oreq.error = request.ERROR.UNKNOWN;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }
  global.db.get(knex("users").select().where({
    username: ireq.data.username
  }).toString(), (err, res) => {
    if (err) {
      log.error("Error : " + err);

      oreq.error = request.ERROR.SQLITE;
      conn.socket.write(JSON.stringify(oreq) + "\0");
      return;
    }
    if (res != undefined) {

      oreq.error = request.ERROR.USEREXISTS;
      conn.socket.write(JSON.stringify(oreq) + "\0");
      return;
    }
    global.db.run(knex('users').insert({
      username: ireq.data.username,
      password: crypto.SHA256(global.config.defaultPass).toString(crypto.enc.utf8),
      fname: ireq.data.fname,
      lname: ireq.data.lname,
      dob: ireq.data.dob,
      rank: global.RANK.STUDENT,
      email: ireq.data.email,
      tag: ireq.data.tag.replace(/\s/g, '')
    }).returning('*').toString(), function(err) {
      if (err) {
        log.error("Error : " + err);

        oreq.error = request.ERROR.SQLITE;
        conn.socket.write(JSON.stringify(oreq) + "\0");
        return;
      }
      global.db.run(knex('students').insert({
        userid: this.lastID,
        profid: conn.user.id,
        project: ireq.data.project,
        firstClass: (conn.user.class != undefined) ? conn.user.class.name : "";
      }).returning('*').toString(), (err) => {
        if (err) {
          log.error("Error : " + err);

          oreq.error = request.ERROR.SQLITE;
          conn.socket.write(JSON.stringify(oreq) + "\0");
          return;
        }
        conn.socket.write(JSON.stringify(oreq) + "\0");
        return;
      });
    });
  });

}
/**
 * Delete a student
 * @method deleteStudent
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 * @param {Object} ireq a JSON object containing the request.
 **/
function deleteStudent(conn, ireq) {
  var oreq = getBaseReq(ireq.fnc);
  if (conn.user === undefined || conn.user.rank != global.RANK.PROF) {

    oreq.error = request.ERROR.NOTLOGEDIN;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }
  if (ireq.data === undefined) {

    oreq.error = request.ERROR.UNKNOWN;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }
  db.wipeStudents(ireq.data, (err) => {
    conn.socket.write(JSON.stringify(oreq) + "\0");
  });
}
/**
 * Edit a students
 * @method editStudent
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 * @param {Object} ireq a JSON object containing the request.
 **/
function editStudent(conn, ireq) { //FIXME Handle when someone as the same tag or username
  var oreq = getBaseReq(ireq.fnc);
  if (conn.user === undefined || conn.user.rank != global.RANK.PROF) {

    oreq.error = request.ERROR.NOTLOGEDIN;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }
  if (ireq.data === undefined) {

    oreq.error = request.ERROR.UNKNOWN;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }
  global.db.get(knex("students").select("userid", "project").where({
    id: ireq.data.id
  }).toString(), (err, row0) => {
    if (err || row0 == undefined) {
      log.error("Error : " + err);

      oreq.error = request.ERROR.SQLITE;
      conn.socket.write(JSON.stringify(oreq) + "\0");
      return;
    }
    global.db.get(knex("users").select().where({
      id: row0.userid
    }).toString(), (err, row) => {
      if (err || row == undefined) {
        log.error("Error : " + err);

        oreq.error = request.ERROR.SQLITE;
        conn.socket.write(JSON.stringify(oreq) + "\0");
        return;
      }
      global.db.serialize(function() {
        global.db.run(knex("users").update({
          username: (ireq.data.username == "") ? row.username : ireq.data.username,
          email: (ireq.data.email == "") ? row.email : ireq.data.email,
          tag: (ireq.data.tag.replace(/\s/g, '') == "") ? row.tag : ireq.data.tag.replace(/\s/g, ''),
          dob: (ireq.data.dob == "") ? row.dob : ireq.data.dob,
          fname: (ireq.data.fname == "") ? row.fname : ireq.data.fname,
          lname: (ireq.data.lname == "") ? row.lname : ireq.data.lname,
          password: (ireq.data.pass) ? global.config.defaultPass : row.password
        }).where({
          id: row.id
        }).toString());
        global.db.run(knex("students").update({
          project: (ireq.data.project == "") ? row0.project : ireq.data.project
        }).where({
          id: ireq.data.id
        }).toString(), (err) => {
          if (err) {
            log.error("Error : " + err);

            oreq.error = request.ERROR.SQLITE;
            conn.socket.write(JSON.stringify(oreq) + "\0");
            return;
          }

          conn.socket.write(JSON.stringify(oreq) + "\0");
        });
      });
    });
  });

}

/**
 * Clean an user's account
 * @method resetTime
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 * @param {Object} ireq a JSON object containing the request.
 **/
function resetTime(conn, ireq) {
  var oreq = getBaseReq(ireq.fnc);
  if (conn.user === undefined || conn.user.rank != global.RANK.PROF) {

    oreq.error = request.ERROR.NOTLOGEDIN;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }
  if (ireq.id === undefined) {

    oreq.error = request.ERROR.UNKNOWN;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }
  global.db.run(knex("students").update({
    hadLunch: null,
    missedPause: null,
    lastTagTime: null,
    timeDiffToday: null,
    timeDiff: null,
    status: null
  }).where("id", "in", ireq.id).toString(), (err) => {
    if (err) {
      log.error("Error : " + err);

      oreq.error = request.ERROR.SQLITE;
      conn.socket.write(JSON.stringify(oreq) + "\0");
      return;
    }

    global.db.each(knex("students").select().where("id", "in", ireq.id).toString(), (err, row) => {
      if (err) {
        log.error("Error when querrying the database : " + err);
        oreq.error = request.ERROR.SQLITE;
        conn.socket.write(JSON.stringify(oreq) + "\0");
        return;
      }
      log.save(global.LOGS.RESETTIME, row.id, "SERVER", moment().format().toString(), math.secondsToHms(ireq.time) + (ireq.comments == undefined) ? "" : " - " + ireq.comments, row.timeDiff, row.timeDiffToday);
    });
    conn.socket.write(JSON.stringify(oreq) + "\0");
  });
}

/**
 * Modify the time of students
 * @method resetTime
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 * @param {Object} ireq a JSON object containing the request.
 **/
function modTime(conn, ireq) {
  var oreq = getBaseReq(ireq.fnc);
  if (conn.user === undefined || conn.user.rank != global.RANK.PROF) {

    oreq.error = request.ERROR.NOTLOGEDIN;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }
  if (ireq.time === undefined) {

    oreq.error = request.ERROR.UNKNOWN;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }
  global.db.run(knex("students").increment("timeDiff", ireq.time).where("id", "in", ireq.id).toString(), (err) => {
    if (err) {
      log.error("Error : " + err);

      oreq.error = request.ERROR.SQLITE;
      conn.socket.write(JSON.stringify(oreq) + "\0");
      return;
    }

    global.db.each(knex("students").select().where("id", "in", ireq.id).toString(), (err, row) => {
      if (err) {
        log.error("Error when querrying the database : " + err);
        oreq.error = request.ERROR.SQLITE;
        conn.socket.write(JSON.stringify(oreq) + "\0");
        return;
      }
      log.save(global.LOGS.MODTIME, row.id, "SERVER", moment().format().toString(), math.secondsToHms(ireq.time) + (ireq.comments == undefined) ? "" : " - " + ireq.comments, row.timeDiff, row.timeDiffToday);
    });
    conn.socket.write(JSON.stringify(oreq) + "\0");
  });
  return;
}

/**
 * Set the time of students
 * @method setTime
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 * @param {Object} ireq a JSON object containing the request.
 **/
function setTime(conn, ireq) {
  var oreq = getBaseReq(ireq.fnc);
  if (conn.user === undefined || conn.user.rank != global.RANK.PROF) {

    oreq.error = request.ERROR.NOTLOGEDIN;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }
  if (ireq.time === undefined) {

    oreq.error = request.ERROR.UNKNOWN;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }
  global.db.run(knex("students").update({
    timeDiff: ireq.time
  }).where("id", "in", ireq.id).toString(), (err) => {
    if (err) {
      log.error("Error : " + err);

      oreq.error = request.ERROR.SQLITE;
      conn.socket.write(JSON.stringify(oreq) + "\0");
      return;
    }

    global.db.each(knex("students").select().where("id", "in", ireq.id).toString(), (err, row) => {
      if (err) {
        log.error("Error when querrying the database : " + err);
        oreq.error = request.ERROR.SQLITE;
        conn.socket.write(JSON.stringify(oreq) + "\0");
        return;
      }
      log.save(global.LOGS.SETTIME, row.id, "SERVER", moment().format().toString(), math.secondsToHms(ireq.time) + (ireq.comments == undefined) ? "" : " - " + ireq.comments, row.timeDiff, row.timeDiffToday);
    });
    conn.socket.write(JSON.stringify(oreq) + "\0");
  });
}

/**
 * Get the logs of the students
 * @method getLogs
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 * @param {Object} ireq a JSON object containing the request.
 **/
function getLogs(conn, ireq) {
  var oreq = getBaseReq(ireq.fnc);
  if (conn.user === undefined || conn.user.rank != global.RANK.PROF) {

    oreq.error = request.ERROR.NOTLOGEDIN;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }
  if (ireq.id === undefined) {

    oreq.error = request.ERROR.UNKNOWN;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }
  log.get(ireq.id, (err, data) => {
    if (err) {

      oreq.error = err;
      conn.socket.write(JSON.stringify(oreq) + "\0");
      return;
    }

    oreq.error = request.ERROR.OK;
    oreq.data = data;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  });
}
/**
 * Set a students as absent
 * @method setAbsent
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 * @param {Object} ireq a JSON object containing the request.
 **/
function setAbsent(conn, ireq) {
  var oreq = getBaseReq(ireq.fnc);
  if (conn.user === undefined || conn.user.rank != global.RANK.PROF) {

    oreq.error = request.ERROR.NOTLOGEDIN;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }
  if (ireq.id === undefined) {

    oreq.error = request.ERROR.UNKNOWN;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }
  global.db.run(knex("students").update({
    status: global.STATUS.ABS
  }).where("id", "in", ireq.id).toString(), (err) => {
    if (err) {
      log.error("Error when querrying the database : " + err);
      oreq.error = request.ERROR.SQLITE;
      conn.socket.write(JSON.stringify(oreq) + "\0");
      return;
    }
    for (var i = 0; i < ireq.id.length; i++) {
      log.save(global.LOGS.ABSENT, ireq.id[i], "SERVER", moment().format(), ireq.comments, "", "");
    }
    conn.socket.write(JSON.stringify(oreq) + "\0");
  });
}

/**
 * Toggle a student isBlocked value.
 * @method setFixed
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 * @param {Object} ireq a JSON object containing the request.
 **/
function setFixed(conn, ireq) {
  var oreq = getBaseReq(ireq.fnc);
  if (conn.user === undefined || conn.user.rank != global.RANK.PROF) {

    oreq.error = request.ERROR.NOTLOGEDIN;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }
  if (ireq.id === undefined) {

    oreq.error = request.ERROR.UNKNOWN;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }
  var toggle1 = [];
  var toggle2 = [];
  global.db.all(knex("students").where("id", "in", ireq.id).toString(), (err, rows) => {
    if (err) {
      log.error("Error when querrying the database : " + err);
      oreq.error = request.ERROR.SQLITE;
      conn.socket.write(JSON.stringify(oreq) + "\0");
      return;
    }
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].isBlocked)
        toggle1.push(rows[i].id);
      else
        toggle2.push(rows[i].id);
    }
    global.db.run(knex("students").update({
      isBlocked: 0
    }).where("id", "in", toggle1).toString(), (err) => {
      if (err) {
        log.error("Error when querrying the database : " + err);
        oreq.error = request.ERROR.SQLITE;
        conn.socket.write(JSON.stringify(oreq) + "\0");
        return;
      }
      for (var i = 0; i < toggle1.length; i++) {
        log.save(global.LOGS.UNBLOCKED, toggle1[i], "SERVER", moment().format(), ireq.comments, "", "");
      }
      global.db.run(knex("students").update({
        isBlocked: 1
      }).where("id", "in", toggle2).toString(), (err) => {
        if (err) {
          log.error("Error when querrying the database : " + err);
          oreq.error = request.ERROR.SQLITE;
          conn.socket.write(JSON.stringify(oreq) + "\0");
          return;
        }
        for (var ii = 0; ii < toggle2.length; ii++) {
          log.save(global.LOGS.BLOCKED, toggle2[ii], "SERVER", moment().format(), ireq.comments, "", "");
        }
        conn.socket.write(JSON.stringify(oreq) + "\0");
      });
    });
  });
}

/**
 * Get all the notification for a logged user
 * @method getNotifications
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 * @param {Object} ireq a JSON object containing the request.
 **/
function getNotifications(conn, ireq) {
  var oreq = getBaseReq(ireq.fnc);
  if (conn.user === undefined || conn.user.rank != global.RANK.PROF) {

    oreq.error = request.ERROR.NOTLOGEDIN;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }
  global.db.all(knex("notifications").select().where({
    userid: conn.user.id
  }).toString(), (err, rows) => {
    if (err) {
      log.error("Error when querrying the database : " + err);
      oreq.error = request.ERROR.SQLITE;
      conn.socket.write(JSON.stringify(oreq) + "\0");
      return;
    }
    oreq.data = rows;
    conn.socket.write(JSON.stringify(oreq) + "\0");
  });

}

/**
 * Change the read status of a notifications
 * @method toggleNotification
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 * @param {Object} ireq a JSON object containing the request.
 **/
function toggleNotification(conn, ireq) {
  if (conn.user === undefined || conn.user.rank != global.RANK.PROF) {

    log.error("Not logged in");
    return;
  }
  if (ireq.id === undefined) {

    log.error("Unkown error");
    return;
  }
  global.db.get(knex("notifications").select().where({
    id: ireq.id
  }).toString(), (err, row) => {
    if (err) {
      log.error("Error when querrying the database : " + err);
      return;
    }
    if (row.read)
      global.db.run(knex("notifications").update({
        read: 0
      }).where({
        id: ireq.id
      }).toString());
    else
      global.db.run(knex("notifications").update({
        read: 1
      }).where({
        id: ireq.id
      }).toString());
    updateNotification(conn.user.id, ireq.id);
  });

}
/**
 * Return the holidays to the connected user
 * @method getHolidays
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 * @param {Object} ireq a JSON object containing the request.
 **/
function getHolidays(conn, ireq) {
  var oreq = getBaseReq(ireq.fnc);
  if (conn.user === undefined || conn.user.rank != global.RANK.PROF) {

    log.error("Not logged in");
    return;
  }
  oreq.data = [];
  global.db.all(knex("timeoff").select().toString(), (err, rows) => {
    if (err) {
      log.error("Error when querrying the database : " + err);
      return;
    }
    if (rows == undefined) {
      conn.socket.write(JSON.stringify(oreq) + "\0");
      return;
    }
    oreq.data = rows;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  });

}

/**
 * Change the read status of a notifications
 * @method toggleNotification
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 * @param {Object} ireq a JSON object containing the request.
 **/
function toggleNotification(conn, ireq) {
  if (conn.user === undefined || conn.user.rank != global.RANK.PROF) {

    log.error("Not logged in");
    return;
  }
  if (ireq.id === undefined) {

    log.error("Unkown error");
    return;
  }
  global.db.get(knex("notifications").select().where({
    id: ireq.id
  }).toString(), (err, row) => {
    if (err) {
      log.error("Error when querrying the database : " + err);
      return;
    }
    if (row.read)
      global.db.run(knex("notifications").update({
        read: 0
      }).where({
        id: ireq.id
      }).toString());
    else
      global.db.run(knex("notifications").update({
        read: 1
      }).where({
        id: ireq.id
      }).toString());
    updateNotification(conn.user.id, ireq.id);
  });

}
/**
 * Create a new holidays
 * @method addHolidays
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 * @param {Object} ireq a JSON object containing the request.
 **/
function addHolidays(conn, ireq) {
  var oreq = getBaseReq(ireq.fnc);
  if (conn.user === undefined || conn.user.rank != global.RANK.PROF) {

    log.error("Not logged in");
    return;
  }
  if (ireq.data.date1 == undefined || ireq.data.date1 == null) {
    log.error("Unkown error");
    return;
  }
  oreq.data = [];
  var date1 = moment(ireq.data.date1, "DD-MM-YYYY").format();
  var date2;
  if (ireq.data.date2 != null)
    date2 = moment(ireq.data.date2, "DD-MM-YYYY").add(1, "days").format();
  else
    date2 = null;
  global.db.run(knex("timeoff").insert({
    desc: ireq.data.title,
    date1: date1,
    date2: date2
  }).toString(), function(err) {
    if (err) {
      log.error("Error when querrying the database : " + err);
      oreq.error = request.ERROR.SQLITE;
      conn.socket.write(JSON.stringify(oreq) + "\0");
      return;
    }
    global.db.get(knex("timeoff").select().where({
      id: this.lastID
    }).toString(), (err, row) => {
      if (err) {
        log.error("Error when querrying the database : " + err);
        oreq.error = request.ERROR.SQLITE;
        conn.socket.write(JSON.stringify(oreq) + "\0");
        return;
      }
      oreq.data = row;
      conn.socket.write(JSON.stringify(oreq) + "\0");
      return;
    });

  });

}

/**
 * Delete an holidays
 * @method delHolidays
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 * @param {Object} ireq a JSON object containing the request.
 **/
function delHolidays(conn, ireq) {
  var oreq = getBaseReq(ireq.fnc);
  if (conn.user === undefined || conn.user.rank != global.RANK.PROF) {

    log.error("Not logged in");
    return;
  }
  if (typeof ireq.id != "number") {
    log.error("Unkown error");
    return;
  }

  global.db.run(knex("timeoff").del().where({
    id: ireq.id
  }).toString(), function(err) {
    if (err) {
      log.error("Error when querrying the database : " + err);
      oreq.error = request.ERROR.SQLITE;
      conn.socket.write(JSON.stringify(oreq) + "\0");
      return;
    }
    conn.socket.write(JSON.stringify(oreq) + "\0");
  });

}

/**
 * Return all the teachers' info the connected administrator
 * @method getProf
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 * @param {Object} ireq a JSON object containing the request.
 **/
function getProf(conn, ireq) {
  var oreq = getBaseReq(ireq.fnc);
  oreq.data = [];
  if (conn.user === undefined || conn.user.rank != global.RANK.ADMIN) {
    log.error("Not logged in");
    return;
  }
  global.db.all(knex("users").select().where({
    rank: global.RANK.PROF
  }).toString(), (err, rows) => {
    if (err) {
      log.error("Error when querrying the database : " + err);
      oreq.error = request.ERROR.SQLITE;
      conn.socket.write(JSON.stringify(oreq) + "\0");
      return;
    }
    if (rows == undefined) {
      conn.socket.write(JSON.stringify(oreq) + "\0");
      return;
    }
    global.db.all(knex("class").select().toString(), (err2, rows2) => {
      if (err) {
        log.error("Error when querrying the database : " + err);
        oreq.error = request.ERROR.SQLITE;
        conn.socket.write(JSON.stringify(oreq) + "\0");
        return;
      }
      if (rows2 == undefined) {
        conn.socket.write(JSON.stringify(oreq) + "\0");
        return;
      }
      for (var i = 0; i < rows2.length; i++) {
        var tmp = lodash.filter(rows, {
          "id": rows2[i].profid
        });
        tmp[0].class = rows2[i];
        delete tmp[0].password;
        oreq.data.push(tmp[0]);
      }
      conn.socket.write(JSON.stringify(oreq) + "\0");
    });
  });
}

/**
 * Create a new teacher
 * @method createProf
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 * @param {Object} ireq a JSON object containing the request.
 **/
function createProf(conn, ireq) {
  var oreq = getBaseReq(ireq.fnc);
  if (conn.user === undefined || conn.user.rank != global.RANK.ADMIN) {

    log.error("Not logged in");
    return;
  }
  if (ireq.data == undefined) {
    log.error("Ill formed request");
    return;
  }
  if (ireq.data.username == undefined || ireq.data.fname == undefined || ireq.data.lname == undefined || ireq.data.tag == undefined || ireq.data.class == undefined) {
    log.error("Ill formed request");
    return;
  }
  global.db.run(knex("users").insert({
    username: ireq.data.username,
    fname: ireq.data.fname,
    lname: ireq.data.lname,
    tag: ireq.data.tag,
    dob: ireq.data.dob,
    email: ireq.data.email,
    rank: global.RANK.PROF,
    password: crypto.SHA256(global.config.defaultPass).toString(crypto.enc.utf8)
  }).toString(), function(err) {
    if (err) {
      log.error("Error when querrying the database : " + err);
      oreq.error = request.ERROR.SQLITE;
      conn.socket.write(JSON.stringify(oreq) + "\0");
      return;
    }
    var lastID = this.lastID;
    global.db.serialize(function() {
      global.db.run(knex("class").del().where({
        profid: lastID
      }).toString());
      global.db.run(knex("class").insert({
        profid: lastID,
        name: ireq.data.class
      }).toString(), (err) => {
        conn.socket.write(JSON.stringify(oreq) + "\0");
      });
    });

  });

}

/**
 * Delete a teacher and all his students at once
 * @method delProf
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 * @param {Object} ireq a JSON object containing the request.
 **/
function delProf(conn, ireq) {
  var oreq = getBaseReq(ireq.fnc);
  if (conn.user === undefined || conn.user.rank != global.RANK.ADMIN) {
    log.error("Not logged in");
    return;
  }
  if (typeof ireq.id != "number") {
    log.error("Ill formed request");
    return;
  }
  global.db.all(knex("students").select("id").where({
    profid: ireq.id
  }).toString(), (err, rows) => {
    if (err) {
      log.error("Error when querrying the database : " + err);
      oreq.error = request.ERROR.SQLITE;
      conn.socket.write(JSON.stringify(oreq) + "\0");
      return;
    }
    global.db.run(knex("users").del().where({
      id: ireq.id
    }).toString(), (err) => {
      if (err) {
        log.error("Error when querrying the database : " + err);
        oreq.error = request.ERROR.SQLITE;
        conn.socket.write(JSON.stringify(oreq) + "\0");
        return;
      }
      global.db.run(knex("class").del().where({
        profid: ireq.id
      }).toString(), (err) => {
        if (err) {
          log.error("Error when querrying the database : " + err);
          oreq.error = request.ERROR.SQLITE;
          conn.socket.write(JSON.stringify(oreq) + "\0");
          return;
        }
        var idList = [];
        for (var i = 0; i < rows.length; i++)
          idList.push(rows[i].id);
        db.wipeStudents(idList, (err) => {
          conn.socket.write(JSON.stringify(oreq) + "\0");
        });
      });
    });
  });
}
/**
 * Edit a teacher
 * @method editProf
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 * @param {Object} ireq a JSON object containing the request.
 **/
function editProf(conn, ireq) {
  var oreq = getBaseReq(ireq.fnc);
  if (conn.user === undefined || conn.user.rank != global.RANK.ADMIN) {
    log.error("Not logged in");
    return;
  }
  if (typeof ireq.data.id != "number") {
    log.error("Ill formed request");
    return;
  }
  async.waterfall([
    function(callback) {
      global.db.get(knex("users").select().where({
        id: ireq.data.id
      }).toString(), callback);
    },
    function(row, callback) {
      global.db.run(knex("users").update({
        username: (ireq.data.username == "") ? row.username : ireq.data.username,
        email: (ireq.data.email == "") ? row.email : ireq.data.email,
        tag: (ireq.data.tag.replace(/\s/g, '') == "") ? row.tag : ireq.data.tag.replace(/\s/g, ''),
        dob: (ireq.data.dob == "") ? row.dob : ireq.data.dob,
        fname: (ireq.data.fname == "") ? row.fname : ireq.data.fname,
        lname: (ireq.data.lname == "") ? row.lname : ireq.data.lname,
        password: (ireq.data.pass) ? global.config.defaultPass : row.password
      }).where({
        id: row.id
      }).toString(), callback);
    },
    function(callback) {
      if (ireq.data.class == "") {
        console.log("here");
        callback();
        return;
      }
      global.db.run(knex("class").update({
        name: ireq.data.class
      }).where({
        profid: ireq.data.id
      }).toString(), callback);
    }
  ], function(err) {
    if (err) {
      log.error("Error : " + err);

      oreq.error = request.ERROR.SQLITE;
      conn.socket.write(JSON.stringify(oreq) + "\0");
      return;
    }

    conn.socket.write(JSON.stringify(oreq) + "\0");
  });
}
/**
 * Change the user's password
 * @method changePassword
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 * @param {Object} ireq a JSON object containing the request.
 **/
function changePassword(conn, ireq) {
  var oreq = getBaseReq(ireq.fnc);
  if (conn.user === undefined) {
    log.error("Not logged in");
    return;
  }
  global.db.run(knex("users").update({
    password: ireq.data
  }).toString(), (err) => {
    if (err) {
      log.error("Error : " + err);

      oreq.error = request.ERROR.SQLITE;
      conn.socket.write(JSON.stringify(oreq) + "\0");
      return;
    }
    conn.socket.write(JSON.stringify(oreq) + "\0");
  });
}
/**
 * Sort the incoming request. Redirect the request to the correct function.
 * @method sortRequest
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 * @param {Object} data raw data from the client.
 **/
function sortRequest(connection, data) {
  var oreq = getBaseReq(request.REQUEST.PING);
  var ireq;
  try {
    if (global.DEBUG) {
      log.info(data);
    }
    ireq = JSON.parse(data);
  } catch (err) {
    log.error("Request ill formed.");

    oreq.error = request.ERROR.UNKNOWN;
    connection.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }
  var toRm = [];
  for (var i = 0; i < ireq.length; i++) {
    if (ireq[i].fnc == request.REQUEST.TAG) {
      tagReqList.push({
        connection: connection,
        ireq: ireq[i]
      });
      toRm.push(i);
    }
  }
  for (var i = 0; i < toRm.length; i++) {
    ireq.splice(toRm[i], 1);
  }
  for (var i = 0; i < ireq.length; i++) {
    if (ireq[i].fnc === undefined) {
      log.error("fnc param not specified in request.");

      oreq.error = request.ERROR.UNKNOWN;
      connection.socket.write(JSON.stringify(oreq) + "\0");
      return;
    }

    switch (ireq[i].fnc) {
      case request.REQUEST.EXIT:
        socketExit(connection);
        break;
      case request.REQUEST.PING:
        pingRequest(connection);
        break;
      case request.REQUEST.AUTH:
        authenticate(connection, ireq[i]);
        break;
      case request.REQUEST.PROPAGATE_TAG:
        propagate_tag(ireq[i]);
        break;
      case request.REQUEST.GETSTUDENT:
        getStudent(connection, ireq[i]);
        break;
      case request.REQUEST.GETCLASS:
        getClass(connection, ireq[i]);
        break;
      case request.REQUEST.ADDSTUDENT:
        createStudent(connection, ireq[i]);
        break;
      case request.REQUEST.DELSTUDENT:
        deleteStudent(connection, ireq[i]);
        break;
      case request.REQUEST.EDITSTUDENT:
        editStudent(connection, ireq[i]);
        break;
      case request.REQUEST.RESETTIME:
        resetTime(connection, ireq[i]);
        break;
      case request.REQUEST.MODTIME:
        modTime(connection, ireq[i]);
        break;
      case request.REQUEST.SETTIME:
        setTime(connection, ireq[i]);
        break;
      case request.REQUEST.LOGS:
        getLogs(connection, ireq[i]);
        break;
      case request.REQUEST.SETABSENT:
        setAbsent(connection, ireq[i]);
        break;
      case request.REQUEST.SETFIXED:
        setFixed(connection, ireq[i]);
        break;
      case request.REQUEST.GETNOTIFICATIONS:
        getNotifications(connection, ireq[i]);
        break;
      case request.REQUEST.TOGGLENOTIFICATION:
        toggleNotification(connection, ireq[i]);
        break;
      case request.REQUEST.GETHOLIDAYS:
        getHolidays(connection, ireq[i]);
        break;
      case request.REQUEST.ADDHOLIDAYS:
        addHolidays(connection, ireq[i]);
        break;
      case request.REQUEST.DELHOLIDAYS:
        delHolidays(connection, ireq[i]);
        break;
      case request.REQUEST.CREATEPROF:
        createProf(connection, ireq[i]);
        break;
      case request.REQUEST.DELPROF:
        delProf(connection, ireq[i]);
        break;
      case request.REQUEST.EDITPROF:
        editProf(connection, ireq[i]);
        break;
      case request.REQUEST.GETPROF:
        getProf(connection, ireq[i]);
        break;
      case request.REQUEST.CHANGEPASS:
        changePassword(connection, ireq[i]);
        break;
    }
  }

}

module.exports = {

  compileRequest: (connection, data) => {
    connection.currentBuf += data;
    if (connection.currentBuf[connection.currentBuf.length - 1] == "\0") {
      sortRequest(connection, connection.currentBuf.substring(0, connection.currentBuf.length - 1).toString("utf8"));
      connection.currentBuf = "";
    }
  },
  initialize: () => {
    tagReqList.on("add", tagRequest);
    log.info("Methods initiated.");
  }
};
