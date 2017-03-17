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
                    var missedPause = Math.floor(delta / global.config.pause.interval);
                    if(missedPause)
                    {
                        log.warning("USRID : " + row.id + " : regular break rule not respected " + missedPause +" time(s) !");
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
                    if (delta < global.config.pause.minimum && delta > global.config.pause.minimum_error)
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
        conn.socket.write(JSON.stringify(getBaseReq().error = ERROR.UNKNOWN));
        return;
    }

}
/**
 * End the provided socket
 * @method socketExit
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 **/
function socketExit(conn) {
    conn.socket.end();
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
            oreq.error = ERROR.UNKNOWN;
            connection.socket.write(JSON.stringify(oreq));
            return;
        }
        for (var i = 0; i < ireq.length; i++) {
            if (ireq[i].fnc === undefined) {
                log.error("fnc param not specified in request.");
                oreq = getBaseReq();
                oreq.error = ERROR.UNKNOWN;
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
            }
        }

    }
};
