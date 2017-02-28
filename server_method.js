const math = require("./utils/math.js");
var knex = require('knex')({client: 'sqlite3'});
ERROR = {
  OK:0,
  UNKNOWN: 1,
  WRONGTAG: 2,
  SQLITE: 3
};
REQUEST = {
  PING: 0,
  TAG: 1
};
function getBaseReq()
{
  return {fnc:REQUEST.PING, error:ERROR.OK};
}
function pingRequest(conn) {
    socket.write(".");
}

function tagRequest(conn,ireq) {
  var oreq;
  if (ireq.tag === undefined || ireq.time === undefined || ireq.class === undefined) {
      console.log("Request ill formed. Closing socket.");
      conn.socket.end();
      return;
  }
  console.log("verify ok");
  global.db.serialize(() => {
    global.db.get(knex.select().from("students").where("tag",ireq.tag).toString(), (err, row) => {
      if(err) {
        console.log("Error while fetching data from the database... Aborting.\n" + err);
        oreq = getBaseReq();
        oreq.fnc = REQUEST.TAG;
        oreq.error = ERROR.SQLITE;
        conn.socket.write(JSON.stringify(oreq));
        return;
      }
      if(row === undefined)
      {
        console.log("No student with this tag... Aborting.\n" + err);
        oreq = getBaseReq();
        oreq.fnc = REQUEST.TAG;
        oreq.error = ERROR.WRONGTAG;
        conn.socket.write(JSON.stringify(oreq));
        return;
      }
      console.log("verify2 ok");
      var nstatus;
      var nTimeDiffToday;
      var nlastTagTime;
      console.log("row " + row);
      if(row.status == db.STATUS.IN) //Departure
      {
        nstatus = db.STATUS.OUT;
        nTimeDiffToday = row.timeDiffToday + math.getTimeDelta(moment().toDate(), row.lastTagTime + "Z");
        nlastTagTime = moment().toDate();
      } //TODO UPDATE

      if(row.status == db.STATUS.OUT || row.status == db.STATUS.ABS || row.status == "")//Arrival
      {
        nstatus = db.STATUS.IN;
      }
    });
  });
}

module.exports = {
    sortRequest: (connection, data) => {
      var oreq;
      var ireq;
      try {
        ireq = JSON.parse(data);
      } catch(err) {
        console.log("Request ill formed. Closing socket.");
        oreq = getBaseReq();
        oreq.error = ERROR.UNKNOWN;
        connection.socket.write(JSON.stringify(oreq));
        connection.socket.end();
        return;
      }
        if (ireq.fnc === undefined) {
            console.log("fnc param not specified in request. Aborting.");
            oreq = getBaseReq();
            oreq.error = ERROR.UNKNOWN;
            connection.socket.write(JSON.stringify(oreq));
            connection.socket.end();
            return;
        }
        console.log("fnc " + ireq.fnc);
        switch (ireq.fnc) {
            case REQUEST.PING:
                pingRequest(connection);
                break;
            case REQUEST.TAG:
                tagRequest(connection,ireq);
                break;
        }
    }
};
