
const wait = require("deasync").sleep(1000);
var sync = true;
var sqlite = require("sqlite3");
var handle = new sqlite.Database("Data.db");
handle.get("SELECT * FROM students;",(err,row) =>
{

});
sync = false;
while(sync) {wait;}
console.log("Done");
