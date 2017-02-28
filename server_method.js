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
  if (ireq.tag === undefined || ireq.time === undefined || ireq.class === undefined) {
      console.log("Request ill formed. Closing socket.");
      conn.socket.end();
      return;
  }
  console.log("verify ok");
  global.db.serialize(() => {
    global.db.get(knex.select().from("students").where("tag",ireq.tag).toString(), (err, row) => {
      if(err) {
        console.log("Error while fetching data from the database... Aborting.\nError : " + err);
        let response = getBaseReq();
        response.fnc = REQUEST.TAG;
        response.error = ERROR.SQLITE;
        conn.write(response);
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

      if(row.status == db.STATUS.OUT || row.status == db.STATUS.ABS)//Arrival
      {
        nstatus = db.STATUS.IN;
      }
    });
  });
}

module.exports = {
    sortRequest: (connection, data) => {
        var ireq = JSON.parse(data);
        if (ireq.fnc === undefined) {
            console.log("Request ill formed. Closing socket.");
            connection.socket.write(getBaseReq().error = ERROR.UNKNOWN);
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
