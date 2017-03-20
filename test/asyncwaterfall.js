const async = require("async");
const wait = require("deasync").sleep(1000);
var sync = true;
var sqlite = require("sqlite3");
var handle = new sqlite.Database("Data.db");
async.waterfall([
    function(callback) {
        callback(null, 'one', 'two');
    },
    function(arg1, arg2, callback) {
        // arg1 now equals 'one' and arg2 now equals 'two'
        var fnc = function()
        {
          callback(null, 'three')
        };
        fnc();
    },
    function(arg1, callback) {
        // arg1 now equals 'three'
        callback(null,"errrrrrr");
    }
], function (err, result) {
    console.log(result);
    //sync = false;
});
handle.get("SELECT * FROM students;",(err,row) =>
{
  sync = false;
});
while(sync) {wait;}
console.log("Done");
