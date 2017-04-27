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
/**
 * Handle a tag request (When a student arrive or leave)
 * @method tagRequest
 **/
function tagRequest(item, index) {

  var oreq = getBaseReq(request.REQUEST.TAG);
  var ireq = item.ireq;
  var conn = item.connection;
  tagReqList.splice(index, 1); // Remove current item
  if (ireq.tag === undefined || ireq.time === undefined || ireq.class === undefined) {
    log.error("Request ill formed.");
    conn.socket.write(JSON.stringify(getBaseReq().error = request.ERROR.UNKNOWN) + "\0");
    return;
  }
  csv.writeBruteLoggingToCSV(ireq.tag.replace(/\s/g, ''), ireq.time);
  if (global.DEBUG)
    console.log("[TAG] : " + ireq.tag.replace(/\s/g, ''));
  global.db.serialize(() => {
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
      if (row.rank == global.RANK.ADMIN) { //Master card tagged

        oreq.fnc = request.REQUEST.MASTER;
        conn.socket.write(JSON.stringify(oreq) + "\0");
        return;
      }
      global.db.get(knex.select().from("students").where("userid", row.id).toString(), (err2, row2) => {
        if (err2) {
          log.error("Error while accessing the database...\n" + err);

          oreq.fnc = request.REQUEST.TAG;
          oreq.error = request.ERROR.SQLITE;
          if (!ireq.delayed)
            conn.socket.write(JSON.stringify(oreq) + "\0");
          return;
        }
        if (row2 === undefined) {
          log.error("No student corresponding to userid : " + row.id + "...");

          oreq.fnc = request.REQUEST.TAG;
          oreq.error = request.ERROR.SQLITE;
          if (!ireq.delayed)
            conn.socket.write(JSON.stringify(oreq) + "\0");
          return;
        }
        var nstatus;
        var nTimeDiffToday;
        var nlastTagTime;
        if (row2.status == global.STATUS.IN) //Departure
        {
          nstatus = global.STATUS.OUT;
          var delta = math.getTimeDelta(new Date(ireq.time).getTime(), new Date(row2.lastTagTime).getTime());
          nTimeDiffToday = row2.timeDiffToday + delta;
          var missedPause = Math.floor(delta / global.config.pause.interval); //Calculate the number of missedPause
          if (missedPause) {
            log.warning("USRID : " + row.id + " : regular break rule not respected " + missedPause + " time(s) !");
            log.save(global.LOGS.NOPAUSE, row2.id, ireq.class, ireq.time, "", row2.timeDiff, row2.timeDiffToday);
          }
          global.db.serialize(() => {
            global.db.run(knex("students").update({
              timeDiffToday: isNaN(nTimeDiffToday) ? row2.timeDiffToday : nTimeDiffToday,
              lastTagTime: ireq.time,
              status: nstatus,
              missedPause: isNaN(missedPause) ? (row2.missedPause) : (row2.missedPause + missedPause)
            }).where("userid", row.id).toString());

            global.db.get(knex.select().from("students").where("userid", row.id).toString(), (err3, row3) => {
              if (err3) {
                log.error("Error while accessing the database...\n" + err);

                oreq.fnc = request.REQUEST.TAG;
                oreq.error = request.ERROR.SQLITE;
                if (!ireq.delayed)
                  conn.socket.write(JSON.stringify(oreq) + "\0");
                return;
              }

              oreq.fnc = request.REQUEST.TAG;
              oreq.student = row3;
              oreq.student.user = row;
              delete oreq.student.user.password;
              if (!ireq.delayed)
                conn.socket.write(JSON.stringify(oreq) + "\0");
              log.save(global.LOGS.OUT, row3.id, ireq.class, ireq.time, "", row3.timeDiff, row3.timeDiffToday);
            });
          });



        } else { //Arrival
          nstatus = global.STATUS.IN;
          var delta = math.getTimeDelta(new Date(ireq.time).getTime(), new Date(row2.lastTagTime).getTime());
          var nTimeDiffToday = row2.timeDiffToday;
          delta = isNaN(delta) ? 0 : delta;
          if (delta < global.config.pause.minimum && delta > global.config.pause.minimum_error) //error < delta < minimum
          {
            nTimeDiffToday -= global.config.pause.minimum - delta; //TODO notification on illegal short pause
            log.warning("USRID : " + row.id + " : minimum pause rule not respected !");
            log.save(global.LOGS.MINIMUMPAUSE, row2.id, ireq.class, ireq.time, "", row2.timeDiff, row2.timeDiffToday);
          }

          var now = moment(ireq.time);
          var nowAtMidnight = moment(ireq.time).clone().startOf('day');
          var nowFromMidnight = now.diff(nowAtMidnight, 'seconds');
          var hadLunch = 0;
          var missedPause = row2.missedPause;
          if (nowFromMidnight > (global.config.lunch.begin + global.config.lunch.time) && nowFromMidnight < global.config.lunch.end) {
            var pauseDelta = math.getTimeDelta(moment(ireq.time).toDate().getTime(), new Date(row2.lastTagTime).getTime());
            if (pauseDelta >= global.config.lunch.time) {
              hadLunch = 1;
            }
          }
          var awayTime = math.getTimeDelta(new Date(ireq.time).getTime(), new Date(row2.lastTagTime).getTime());
          if (awayTime >= global.config.pause.time && row2.missedPause > 0) {
            missedPause -= Math.floor(awayTime / global.config.pause.time);
            missedPause = (missedPause < 0) ? 0 : missedPause;
          }
          global.db.serialize(() => {
            global.db.run(knex("students").update({
              status: nstatus,
              lastTagTime: ireq.time,
              hadLunch: hadLunch,
              timeDiffToday: nTimeDiffToday
            }).where("userid", row.id).toString());
            global.db.get(knex.select().from("students").where("userid", row.id).toString(), (err3, row3) => {
              if (err3) {
                log.error("Error while accessing the database...\n" + err);

                oreq.fnc = request.REQUEST.TAG;
                oreq.error = request.ERROR.SQLITE;
                if (!ireq.delayed)
                  conn.socket.write(JSON.stringify(oreq) + "\0");
                return;
              }

              oreq.fnc = request.REQUEST.TAG;
              oreq.student = row3;
              oreq.student.user = row;
              delete oreq.student.user.password;
              if (!ireq.delayed)
                conn.socket.write(JSON.stringify(oreq) + "\0");
              console.log(JSON.stringify(row3));
              log.save(global.LOGS.IN, row3.id, ireq.class, ireq.time, "", row3.timeDiff, row3.timeDiffToday);
            });
          });
        }
      });
    });
  });
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
      conn.socket.end(JSON.stringify(oreq));
      return;
    }
    if (row.password == ireq.pass) {
      conn.user = row;

      oreq.fnc = request.REQUEST.AUTH;
      oreq.error = request.ERROR.OK;
      oreq.rank = row.rank;
      conn.socket.write(JSON.stringify(oreq) + "\0");
      return;
    }

    oreq.fnc = request.REQUEST.AUTH;
    oreq.error = request.ERROR.WRONGCREDS;
    conn.socket.end(JSON.stringify(oreq));
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
  if (conn.user === undefined) {

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
    global.db.all(knex("students").select().toString(), (err, rows) => //Get the students
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
  if (conn.user === undefined) {

    oreq.error = request.ERROR.NOTLOGEDIN;
    oreq.fnc = request.REQUEST.AUTH;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }
  if (ireq.scope === undefined) {
    log.error("Request ill formed.");

    oreq.error = request.ERROR.UNKNOWN;
    oreq.fnc = request.REQUEST.AUTH;
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
        oreq.fnc = request.REQUEST.AUTH;
        conn.socket.write(JSON.stringify(oreq) + "\0");
        return;
      }
      if (row == undefined) {
        log.error("Error : " + err);

        oreq.error = request.ERROR.UNKNOWN;
        oreq.fnc = request.REQUEST.AUTH;
        conn.socket.write(JSON.stringify(oreq) + "\0");
        return;
      }

      oreq.class = row;
      oreq.fnc = request.REQUEST.AUTH;
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
  if (conn.user === undefined) {

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
        project: ireq.data.project
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
 * Delete a students
 * @method deleteStudent
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 * @param {Object} ireq a JSON object containing the request.
 **/
function deleteStudent(conn, ireq) {
  var oreq = getBaseReq(ireq.fnc);
  if (conn.user === undefined) {

    oreq.error = request.ERROR.NOTLOGEDIN;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }
  if (ireq.data === undefined) {

    oreq.error = request.ERROR.UNKNOWN;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }
  global.db.run(knex("users").where({
    id: knex("students").where("id", "in", ireq.data).select("userid")
  }).del().toString(), (err) => {
    if (err) {
      log.error("Error : " + err);

      oreq.error = request.ERROR.SQLITE;
      conn.socket.write(JSON.stringify(oreq) + "\0");
      return;
    }
    global.db.run(knex("students").where("id", "in", ireq.data).del().toString(), (err) => {
      if (err) {
        log.error("Error : " + err);

        oreq.error = request.ERROR.SQLITE;
        conn.socket.write(JSON.stringify(oreq) + "\0");
        return;
      }

      conn.socket.write(JSON.stringify(oreq) + "\0");
    });
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
  if (conn.user === undefined) {

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
  if (conn.user === undefined) {

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

    for (var i = 0; i < ireq.id.length; i++) {
      global.db.get(knex("students").select().where({
        id: ireq.id[i]
      }).toString(), (err, row) => {
        if (err) {
          log.error("Error when querrying the database : " + err);
          return;
        }
        log.save(global.LOGS.RESETTIME, ireq.id[i], "SERVER", moment().toISOString().toString(), ireq.comments, row.timeDiff, row.timeDiffToday);
      });

    }
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
  if (conn.user === undefined) {

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

    for (var i = 0; i < ireq.id.length; i++) {
      global.db.get(knex("students").select().where({
        id: ireq.id[i]
      }).toString(), (err, row) => {
        if (err) {
          log.error("Error when querrying the database : " + err);
          return;
        }
        log.save(global.LOGS.MODTIME, ireq.id[i], "SERVER", moment().toISOString().toString(), ireq.comments, row.timeDiff, row.timeDiffToday);
      });

    }
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
  if (conn.user === undefined) {

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

    for (var i = 0; i < ireq.id.length; i++) {
      global.db.get(knex("students").select().where({
        id: ireq.id[i]
      }).toString(), (err, row) => {
        if (err) {
          log.error("Error when querrying the database : " + err);
          return;
        }
        log.save(global.LOGS.SETTIME, ireq.id[i], "SERVER", moment().toISOString().toString(), ireq.comments, row.timeDiff, row.timeDiffToday);
      });

    }
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
  if (conn.user === undefined) {

    oreq.error = request.ERROR.NOTLOGEDIN;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }
  if (ireq.id === undefined) {

    oreq.error = request.ERROR.UNKNOWN;
    conn.socket.write(JSON.stringify(oreq) + "\0");
    return;
  }
  log.get(ireq.id,(err,data) =>
{
  if(err)
  {

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
