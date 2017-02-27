var knex = require("knex")({});
var sqlite = require("sqlite3");
var handle;
var init = function() {
    handle = new sqlite.Database("Data.db");
    handle.serialize(function() {
        handle.run(knex.schema.createTableIfNotExists("users", function(table) { //Users table
          table.increment("id").primary();
          table.string("username");
          table.string("password");
          table.integer("type");
          table.string("fname");
          table.string("lname");
          table.string("dob");
          table.string("email");
        }).toString());

        handle.run(knex.schema.createTableIfNotExists("student", function(table) {//Student table
          table.increment("id").primary();
          table.integer("userid");
          table.integer("profid");
          table.integer("timeDiff");
          table.integer("status");
          table.boolean("isBlocked");
        }).toString());


        handle.run(knex.schema.createTableIfNotExists("timeoff", function(table) {//timeoff table
          table.increment("id").primary();
          table.string("date1");
          table.string("date2");
          table.string("desc");
        }).toString());

        handle.run(knex.schema.createTableIfNotExists("timeoff", function(table) {//logs table
          table.increment("id").primary();
          table.string("tag");
          table.integer("studentid");
          table.integer("nstatus");
          table.string("date");
          table.string("location");
        }).toString());
    });
};
