const log = require("./utils/log.js");
const math = require("./utils/math.js");
const csv = require("./utils/csv.js");
const knex = require('knex')({
    client: 'sqlite3',
    useNullAsDefault: true
});
const moment = require("moment");
ERROR = {
    OK: 0,
    UNKNOWN: 1,
    WRONGTAG: 2,
    SQLITE: 3
};
REQUEST = {
    EXIT: -1,
    PING: 0,
    TAG: 1,
    AUTH: 2
};

function getBaseReq() {
    return {
        fnc: REQUEST.PING,
        error: ERROR.OK
    };
}

function pingRequest(conn) {
    socket.write("up");
}

function tagRequest(conn, ireq) {
    var oreq;
    if (ireq.tag === undefined || ireq.time === undefined || ireq.class === undefined) {
        log.error("Request ill formed. Closing socket.");
        conn.socket.write(JSON.stringify(getBaseReq().error = ERROR.UNKNOWN));
        return;
    }
    global.db.serialize(() => {
        global.db.get(knex.select().from("users").where("tag", ireq.tag).toString(), (err, row) => {
            if (err) {
                log.error("Error while accessing the database... Aborting.\n" + err);
                oreq = getBaseReq();
                oreq.fnc = REQUEST.TAG;
                oreq.error = ERROR.SQLITE;
                conn.socket.write(JSON.stringify(oreq));
                return;
            }
            if (row === undefined) {
                log.error("No user with this tag... Aborting.\n" + err);
                oreq = getBaseReq();
                oreq.fnc = REQUEST.TAG;
                oreq.error = ERROR.WRONGTAG;
                conn.socket.write(JSON.stringify(oreq));
                return;
            }
            if (row.rank == global.RANK.ADMIN) { //Master card tagged
                csv.exportCSV(() => {
                  oreq = getBaseReq();
                  oreq.fnc = REQUEST.TAG;
                  conn.socket.write(JSON.stringify(oreq));
                }); //TODO Callback to GUI
                return;
            }
            global.db.get(knex.select().from("students").where("userid", row.id).toString(), (err2, row2) => {
                if (err2) {
                    log.error("Error while accessing the database... Aborting.\n" + err);
                    oreq = getBaseReq();
                    oreq.fnc = REQUEST.TAG;
                    oreq.error = ERROR.SQLITE;
                    conn.socket.write(JSON.stringify(oreq));
                    return;
                }
                var nstatus;
                var nTimeDiffToday;
                var nlastTagTime;
                if (row2.status == global.STATUS.IN) //Departure
                {
                    nstatus = global.STATUS.OUT;
                    nTimeDiffToday = row2.timeDiffToday + math.getTimeDelta(moment().toDate(), new Date(row2.lastTagTime));
                    nlastTagTime = moment().toDate().toISOString();
                    global.db.serialize(() => {
                        global.db.run(knex("students").update({
                            timeDiffToday: nTimeDiffToday,
                            lastTagTime: nlastTagTime,
                            status: nstatus
                        }).where("userid", row.id).toString());
                        global.db.get(knex.select().from("students").where("userid", row.id).toString(), (err3, row3) => {
                            if (err3) {
                                log.error("Error while accessing the database... Aborting.\n" + err);
                                oreq = getBaseReq();
                                oreq.fnc = REQUEST.TAG;
                                oreq.error = ERROR.SQLITE;
                                conn.socket.write(JSON.stringify(oreq));
                                return;
                            }
                            oreq = getBaseReq();
                            oreq.fnc = REQUEST.TAG;
                            oreq.student = row3;
                            conn.socket.write(JSON.stringify(oreq));

                        });
                    });



                } else { //Arrival
                    nstatus = global.STATUS.IN;
                    nlastTagTime = moment().toDate().toISOString();
                    global.db.serialize(() => {
                        global.db.run(knex("students").update({
                            status: nstatus,
                            lastTagTime: nlastTagTime
                        }).where("userid", row.id).toString());
                        global.db.get(knex.select().from("students").where("userid", row.id).toString(), (err3, row3) => {
                            if (err3) {
                                log.error("Error while accessing the database... Aborting.\n" + err);
                                oreq = getBaseReq();
                                oreq.fnc = REQUEST.TAG;
                                oreq.error = ERROR.SQLITE;
                                conn.socket.write(JSON.stringify(oreq));
                                return;
                            }
                            oreq = getBaseReq();
                            oreq.fnc = REQUEST.TAG;
                            oreq.student = row3;
                            conn.socket.write(JSON.stringify(oreq));
                        });
                    });

                }
            });
        });
    });
}

function authenticate(conn, ireq) {
    var oreq;
    if (ireq.user === undefined || ireq.pass === undefined) {
        log.error("Request ill formed. Closing socket.");
        conn.socket.write(JSON.stringify(getBaseReq().error = ERROR.UNKNOWN));
        return;
    }
}

function socketExit(conn) {
    conn.socket.end();
}
module.exports = {
    sortRequest: (connection, data) => {
        var oreq;
        var ireq;
        try {
            ireq = JSON.parse(data);
        } catch (err) {
            log.error("Request ill formed. Closing socket.");
            oreq = getBaseReq();
            oreq.error = ERROR.UNKNOWN;
            connection.socket.write(JSON.stringify(oreq));
            return;
        }
        if (ireq.fnc === undefined) {
            log.error("fnc param not specified in request. Aborting.");
            oreq = getBaseReq();
            oreq.error = ERROR.UNKNOWN;
            connection.socket.write(JSON.stringify(oreq));
            return;
        }
        switch (ireq.fnc) {
            case REQUEST.EXIT:
                socketExit(connection);
                break;
            case REQUEST.PING:
                pingRequest(connection);
                break;
            case REQUEST.TAG:
                tagRequest(connection, ireq);
                break;
            case REQUEST.AUTH:
                authenticate(connection, ireq);
                break;
        }
    }
};
