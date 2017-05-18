var sqlite = require("sqlite3");
var handle = new sqlite.Database("Data.db");
const knex = require('knex')({
    client: 'sqlite3',
    useNullAsDefault: true
});
handle.serialize(function() {
  handle.run(knex.schema.createTableIfNotExists("test", function(table) { //Users table
    table.increments("id").primary();
    table.integer("rank");
  }).toString());
  handle.run(knex("test").insert({rank:0}).toString());
  handle.run(knex("test").increment("rank",15).toString());
  handle.run(knex("test").increment("rank",-5).toString());
  handle.get(knex("test").select().toString(), (err,row) =>
  {
    console.log(err);
    console.log(JSON.stringify(row));
  });
});
