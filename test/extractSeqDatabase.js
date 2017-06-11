var knex = require('knex')({
  client: 'sqlite3',
  useNullAsDefault: true
});
var _ = require("lodash");
var path = require("path");
var sqlite = require("sqlite3");
var db = new sqlite.Database(path.join(__dirname, "..", "Data.db"));
const async = require("async");
async.waterfall([
  function(callback) {
    var res = [];
    db.each(knex("students").where("id", "in", ["10", "11", "12","8"]).toString(), (err, row) => {
      if (err)
        callback(err);
      else {
        delete row.details;
        res.push(row);
      }

    }, (err) => {
      callback(err, res);
    });
  },
  function(res, callback) {
    db.each(knex("users").where("id", "in", _.map(res, 'userid')).toString(), (err, row) => {
      if (err)
        callback(err);
      else{
        delete row.password;
        res[_.findIndex(res, ['userid', row.id])].user = row;
      }
        res[_.findIndex(res, ['userid', row.id])].user = row;
    }, (err) => {
      callback(err, res);
    });
  },
  function(res, callback) {
    var nres = [];
    db.each(knex("leavereq").where("studentid", "in", _.map(res, 'id')).toString(), (err, row) => {
      if (err)
        callback(err);
      else {
        row.student = res[_.findIndex(res, ['id', row.studentid])];
        nres.push(row);
      }
    }, (err) => {
      callback(err, nres);
    });
  }
], function(err, result) {
  console.log("Error : " + err);
  console.log("Res : " + JSON.stringify(result, null, 1));
});
