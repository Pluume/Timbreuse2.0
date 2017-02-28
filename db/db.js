var knex = require('knex')({client: 'sqlite3'});
var sqlite = require("sqlite3");
var handle;
RANK = {
  STUDENT: 0,
  PROF: 1,
  ADMIN: 2
};
module.exports = {
  handle: handle,
  RANK: RANK,
  init: function() {
      handle = new sqlite.Database("Data.db");
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
          }).toString());

          handle.run(knex.schema.createTableIfNotExists("student", function(table) {//Student table
            table.increments("id").primary();
            table.integer("userid");
            table.integer("profid");
            table.integer("timeDiff");
            table.integer("status");
            table.boolean("isBlocked");
          }).toString());


          handle.run(knex.schema.createTableIfNotExists("timeoff", function(table) {//timeoff table
            table.increments("id").primary();
            table.string("date1");
            table.string("date2");
            table.string("desc");
          }).toString());

          handle.run(knex.schema.createTableIfNotExists("timeoff", function(table) {//logs table
            table.increments("id").primary();
            table.string("tag");
            table.integer("studentid");
            table.integer("nstatus");
            table.string("date");
            table.string("location");
          }).toString());
      });
      handle.get("SELECT * FROM users WHERE rank=2",(err,data) => {
        if(data === undefined)
        {
          handle.run(knex("users").insert({username: "admin",password: "password",rank: RANK.ADMIN, fname: "Administrator", lname: "", dob: "", email: ""}).toString());
        }
      });

  }
};
