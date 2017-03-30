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
const moment = require("moment");
/**
 * Generate the a base for an outgoing request
 * @method getBaseReq
 * @return {Object} request base
 **/
function getBaseReq() {
    return {
        fnc: request.REQUEST.PING,
        error: request.ERROR.OK
    };
}
/**
 * Save the propagated tag request into this Timbreuse's CSV
 * @method propagate_tag
 * @param {Object} ireq a JSON object containing the incoming request.
 **/
function propagate_tag(ireq) {
    csv.writeBruteLoggingToCSV(ireq.tag, ireq.time);
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
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 * @param {Object} ireq a JSON object containing the incoming data.
 **/
function tagRequest(conn, ireq) {
    var oreq;
    if (ireq.tag === undefined || ireq.time === undefined || ireq.class === undefined) {
        log.error("Request ill formed.");
        conn.socket.write(JSON.stringify(getBaseReq().error = request.ERROR.UNKNOWN));
        return;
    }
    csv.writeBruteLoggingToCSV(ireq.tag, ireq.time);
    global.db.serialize(() => {
        global.db.get(knex.select().from("users").where("tag", ireq.tag).toString(), (err, row) => {
            if (err) {
                log.error("Error while accessing the database...\n" + err);
                oreq = getBaseReq();
                oreq.fnc = request.REQUEST.TAG;
                oreq.error = request.ERROR.SQLITE;
                conn.socket.write(JSON.stringify(oreq));
                return;
            }
            if (row === undefined) {
                log.error("No user with this tag...");
                oreq = getBaseReq();
                oreq.fnc = request.REQUEST.TAG;
                oreq.error = request.ERROR.WRONGTAG;
                conn.socket.write(JSON.stringify(oreq));
                return;
            }
            if (row.rank == global.RANK.ADMIN) { //Master card tagged
                oreq = getBaseReq();
                oreq.fnc = request.REQUEST.MASTER;
                conn.socket.write(JSON.stringify(oreq));
                return;
            }
            global.db.get(knex.select().from("students").where("userid", row.id).toString(), (err2, row2) => {
                if (err2) {
                    log.error("Error while accessing the database...\n" + err);
                    oreq = getBaseReq();
                    oreq.fnc = request.REQUEST.TAG;
                    oreq.error = request.ERROR.SQLITE;
                    conn.socket.write(JSON.stringify(oreq));
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
                                oreq = getBaseReq();
                                oreq.fnc = request.REQUEST.TAG;
                                oreq.error = request.ERROR.SQLITE;
                                conn.socket.write(JSON.stringify(oreq));
                                return;
                            }
                            oreq = getBaseReq();
                            oreq.fnc = request.REQUEST.TAG;
                            oreq.student = row3;
                            conn.socket.write(JSON.stringify(oreq));

                        });
                    });



                } else { //Arrival
                    nstatus = global.STATUS.IN;
                    nlastTagTime = moment().toDate().toISOString();
                    var delta = math.getTimeDelta(new Date(row2.lastTagTime).getTime(), new Date(nlastTagTime).getTime());
                    var nTimeDiffToday = row2.timeDiffToday;
                    delta = isNaN(delta) ? 0 : delta;
                    if (delta < global.config.pause.minimum && delta > global.config.pause.minimum_error) //error < delta < minimum
                    {
                        nTimeDiffToday -= global.config.pause.minimum - delta; //TODO notification on illegal short pause
                        log.warning("USRID : " + row.id + " : minimum pause rule not respected !");
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
                    if (math.getTimeDelta(row2.lastTagTime, nlastTagTime) >= global.config.pause.time && row2.missedPause > 0)
                        missedPause--;
                    global.db.serialize(() => {
                        global.db.run(knex("students").update({
                            status: nstatus,
                            lastTagTime: nlastTagTime,
                            hadLunch: hadLunch,
                            timeDiffToday: nTimeDiffToday
                        }).where("userid", row.id).toString());
                        global.db.get(knex.select().from("students").where("userid", row.id).toString(), (err3, row3) => {
                            if (err3) {
                                log.error("Error while accessing the database...\n" + err);
                                oreq = getBaseReq();
                                oreq.fnc = request.REQUEST.TAG;
                                oreq.error = request.ERROR.SQLITE;
                                conn.socket.write(JSON.stringify(oreq));
                                return;
                            }
                            oreq = getBaseReq();
                            oreq.fnc = request.REQUEST.TAG;
                            oreq.student = row3;
                            conn.socket.write(JSON.stringify(oreq));
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
    var oreq;
    if (ireq.user === undefined || ireq.pass === undefined) {
        log.error("Request ill formed.");
        var oreq = getBaseReq();
        oreq.error = request.ERROR.UNKNOWN;
        conn.socket.write(JSON.stringify(oreq));
        return;
    }
    conn.loading = true;
    global.db.get(knex("users").select().where({
        username: ireq.user
    }).toString(), (err, row) => {
        if (err) {
            log.error("Error while accessing the database...\n" + err);
            oreq = getBaseReq();
            oreq.fnc = request.REQUEST.AUTH;
            oreq.error = request.ERROR.SQLITE;
            conn.socket.write(JSON.stringify(oreq));
            return;
        }
        if (row == undefined) {
            oreq = getBaseReq();
            oreq.fnc = request.REQUEST.AUTH;
            oreq.error = request.ERROR.WRONGCREDS;
            conn.socket.end(JSON.stringify(oreq));
            return;
        }
        if (row.password == ireq.pass) {
            conn.user = row;
            oreq = getBaseReq();
            oreq.fnc = request.REQUEST.AUTH;
            oreq.error = request.ERROR.OK;
            oreq.rank = row.rank;
            conn.socket.write(JSON.stringify(oreq));
            return;
        }
        oreq = getBaseReq();
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
    var oreq;
    if (conn.user === undefined) {
        oreq = getBaseReq();
        oreq.error = request.ERROR.NOTLOGEDIN;
        conn.socket.write(JSON.stringify(oreq));
        return;
    }
    if (ireq.scope === undefined) {
        log.error("Request ill formed.");
        oreq = getBaseReq();
        oreq.error = request.ERROR.UNKNOWN;
        conn.socket.write(JSON.stringify(oreq));
        return;
    }
    oreq = getBaseReq();
    oreq.student = [];
    if (ireq.scope == request.SCOPE.ALL) {
        var index = 0;
        global.db.all(knex("students").select().toString(), (err, rows) => //Get the students
            {
                if (err) {
                    log.error("Error : " + err);
                    oreq = getBaseReq();
                    oreq.error = request.ERROR.SQLITE;
                    conn.socket.write(JSON.stringify(oreq));
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
                    oreq = getBaseReq();
                    oreq.error = request.ERROR.OK;
                    oreq.students = finalArray;
                    conn.socket.write(JSON.stringify(oreq));
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
    var oreq;
    if (conn.user === undefined) {
        oreq = getBaseReq();
        oreq.error = request.ERROR.NOTLOGEDIN;
        conn.socket.write(JSON.stringify(oreq));
        return;
    }
    if (ireq.scope === undefined) {
        log.error("Request ill formed.");
        oreq = getBaseReq();
        oreq.error = request.ERROR.UNKNOWN;
        conn.socket.write(JSON.stringify(oreq));
        return;
    }
    if (ireq.scope == request.SCOPE.UNIQUE) {
        global.db.get(knex("class").select().where({
            profid: conn.user.id
        }).toString(), (err, row) => {
            if (err) {
                log.error("Error : " + err);
                oreq = getBaseReq();
                oreq.error = request.ERROR.SQLITE;
                conn.socket.write(JSON.stringify(oreq));
                return;
            }
            if (row == undefined) {
                log.error("Error : " + err);
                oreq = getBaseReq();
                oreq.error = request.ERROR.UNKNOWN;
                conn.socket.write(JSON.stringify(oreq));
                return;
            }
            oreq = getBaseReq();
            oreq.class = row;
            console.log(JSON.stringify(row));
            conn.socket.write(JSON.stringify(oreq));
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
    var oreq;
    if (conn.user === undefined) {
        oreq = getBaseReq();
        oreq.error = request.ERROR.NOTLOGEDIN;
        conn.socket.write(JSON.stringify(oreq));
        return;
    }
    if (ireq.data === undefined) {
        oreq = getBaseReq();
        oreq.error = request.ERROR.UNKNOWN;
        conn.socket.write(JSON.stringify(oreq));
        return;
    }
    global.db.get(knex("users").select().where({
        username: ireq.data.username
    }).toString(), (err, res) => {
        if (err) {
            log.error("Error : " + err);
            oreq = getBaseReq();
            oreq.error = request.ERROR.SQLITE;
            conn.socket.write(JSON.stringify(oreq));
            return;
        }
        if (res != undefined) {
            oreq = getBaseReq();
            oreq.error = request.ERROR.USEREXISTS;
            conn.socket.write(JSON.stringify(oreq));
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
            tag: ireq.data.tag
        }).returning('*').toString(), function(err) {
            if (err) {
                log.error("Error : " + err);
                oreq = getBaseReq();
                oreq.error = request.ERROR.SQLITE;
                conn.socket.write(JSON.stringify(oreq));
                return;
            }
            global.db.run(knex('students').insert({
                userid: this.lastID,
                profid: conn.user.id,
                project: ireq.data.project
            }).returning('*').toString(), (err) => {
                if (err) {
                    log.error("Error : " + err);
                    oreq = getBaseReq();
                    oreq.error = request.ERROR.SQLITE;
                    conn.socket.write(JSON.stringify(oreq));
                    return;
                }

                oreq = getBaseReq();
                conn.socket.write(JSON.stringify(oreq));
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
    var oreq;
    if (conn.user === undefined) {
        oreq = getBaseReq();
        oreq.error = request.ERROR.NOTLOGEDIN;
        conn.socket.write(JSON.stringify(oreq));
        return;
    }
    if (ireq.data === undefined) {
        oreq = getBaseReq();
        oreq.error = request.ERROR.UNKNOWN;
        conn.socket.write(JSON.stringify(oreq));
        return;
    }
    global.db.run(knex("users").where({
        id: knex("students").where("id", "in", ireq.data).select("userid")
    }).del().toString(), (err) => {
        if (err) {
            log.error("Error : " + err);
            oreq = getBaseReq();
            oreq.error = request.ERROR.SQLITE;
            conn.socket.write(JSON.stringify(oreq));
            return;
        }
        global.db.run(knex("students").where("id", "in", ireq.data).del().toString(), (err) => {
            if (err) {
                log.error("Error : " + err);
                oreq = getBaseReq();
                oreq.error = request.ERROR.SQLITE;
                conn.socket.write(JSON.stringify(oreq));
                return;
            }
            oreq = getBaseReq();
            conn.socket.write(JSON.stringify(oreq));
        });
    });
}
module.exports = {
    /**
     * Sort the incoming request. Redirect the request to the correct function.
     * @method sortRequest
     * @param {Object} conn a JSON object containing a socket connection and an userid variable.
     * @param {Object} data raw data from the client.
     **/
    sortRequest: (connection, data) => {
        var oreq;
        var ireq;
        try {
            if (global.DEBUG) {
                console.log(data);
            }
            ireq = JSON.parse(data);
        } catch (err) {
            log.error("Request ill formed.");
            oreq = getBaseReq();
            oreq.error = request.ERROR.UNKNOWN;
            connection.socket.write(JSON.stringify(oreq));
            return;
        }
        for (var i = 0; i < ireq.length; i++) {
            if (ireq[i].fnc === undefined) {
                log.error("fnc param not specified in request.");
                oreq = getBaseReq();
                oreq.error = request.ERROR.UNKNOWN;
                connection.socket.write(JSON.stringify(oreq));
                return;
            }
            switch (ireq[i].fnc) {
                case request.REQUEST.EXIT:
                    socketExit(connection);
                    break;
                case request.REQUEST.PING:
                    pingRequest(connection);
                    break;
                case request.REQUEST.TAG:
                    tagRequest(connection, ireq[i]);
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
            }
        }

    }
};
