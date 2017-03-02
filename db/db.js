var knex = require('knex')({client: 'sqlite3',
  useNullAsDefault: true});
var sqlite = require("sqlite3");
var handle;
RANK = {
  STUDENT: 0,
  PROF: 1,
  ADMIN: 2
};
STATUS = {
  IN: 1,
  OUT: 2,
  ABS: 3
};
global.RANK = RANK;
global.STATUS = STATUS;
module.exports = {
  handle: handle,
  RANK: RANK,
  init: function() {
      handle = new sqlite.Database("Data.db");
      global.db = handle;
      handle.serialize(function() {
          handle.run(knex.schema.createTableIfNotExists("users", function(table) { //Users table
            table.increments("id").primary();
            table.string("username");
            table.string("password");
            table.integer("rank");
            table.string("fname");
            table.string("lname");
            table.string("dob");
            table.string("email");
            table.string("tag");
          }).toString());

          handle.run(knex.schema.createTableIfNotExists("students", function(table) {//Student table
            table.increments("id").primary();
            table.integer("userid");
            table.integer("profid");
            table.integer("timeDiff");
            table.integer("timeDiffToday");
            table.string("lastTagTime");
            table.integer("status");
            table.boolean("isBlocked");
            table.string("firstClass");
            table.string("project");
          }).toString());


          handle.run(knex.schema.createTableIfNotExists("timeoff", function(table) {//timeoff table
            table.increments("id").primary();
            table.string("date1");
            table.string("date2");
            table.string("desc");
          }).toString());
          //TODO Add timediff in the log table
          handle.run(knex.schema.createTableIfNotExists("logs", function(table) {//logs table
            table.increments("id").primary();
            table.string("tag");
            table.integer("studentid");
            table.integer("nstatus");
            table.string("date");
            table.string("class");
            table.string("description");
          }).toString());

          handle.run(knex.schema.createTableIfNotExists("notifications", function(table) {//notification table
            table.increments("id").primary();
            table.integer("userid");
            table.integer("type");
            table.string("date");
            table.string("message");
            table.boolean("read");
          }).toString());

          handle.run(knex.schema.createTableIfNotExists("class", function(table) {//class table
            table.increments("id").primary();
            table.integer("profid");
            table.string("name");
          }).toString());
      });
      handle.get("SELECT * FROM users WHERE rank=2",(err,data) => {
        if(data === undefined)
        {
          handle.run(knex("users").insert({username: "admin",password: "4194d1706ed1f408d5e02d672777019f4d5385c766a8c6ca8acba3167d36a7b9",rank: RANK.ADMIN, fname: "Administrator", lname: "", dob: "", email: ""}).toString()); //password: administrator
        }
      });

  }
};
