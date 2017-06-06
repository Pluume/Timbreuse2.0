/**
 * Handle logging functions.
 *
 * @module log
 * @class log
 */
const moment = require("moment");
const at = require("console-at");
var path = require("path");
const fs = require("fs");
const math = require("./math.js");
/**
 * Create a new log file
 * @method createNewLogFile
 */
function createNewLogFile() {
  var basePath = (global.TYPE.int === global.TYPE_LIST.CLIENT.int ? "./":path.join(__dirname,".."));
  if (fs.existsSync(path.join(basePath, "Timbreuse.10.log")))
    fs.unlinkSync(path.join(basePath, "Timbreuse.10.log"));
  for (var i = 9; i > 0; i--)
    if (fs.existsSync(path.join(basePath, "Timbreuse." + i + ".log")))
      fs.renameSync(path.join(basePath, "Timbreuse." + i + ".log"), path.join(basePath, "Timbreuse." + (i + 1) + ".log"));
  if (fs.existsSync(path.join(basePath, "Timbreuse.log")))
    fs.renameSync(path.join(basePath, "Timbreuse.log"), path.join(basePath, "Timbreuse.1.log"));
  global.logFile = fs.createWriteStream(path.join(basePath, "Timbreuse.log"), {
    flags: 'w'
  });
}
const knex = require('knex')({
  client: 'sqlite3',
  useNullAsDefault: true
});
/**
 * Print a user friendly information message to the console
 * @method info
 * @param {String} msg the message.
 **/
var info = (msg) => {
  var stack = at(1);
  var cmsg = "[" + moment().format("DD/MM/YYYY HH:mm:ss.SSS") + "] " + "[INFO] " + "(" + path.relative(".", stack.file) + ":" + stack.line + ") > " + msg;
  console.log(cmsg);
  global.logFile.write(cmsg + "\n");
};
/**
 * Print the stacj
 * @method stack
 */
var printStack = function() {
  console.error(new Error().stack);
};
/**
 * Print a user friendly error message to the console
 * @method error
 * @param {String} msg the message.
 **/
var error = (msg) => {
  var stack = at(1);
  var cmsg = "[" + moment().format("DD/MM/YYYY HH:mm:ss.SSS") + "] " + "[ERROR] " + "(" + path.relative(".", stack.file) + ":" + stack.line + ") > " + msg;
  console.log(cmsg);
  printStack();
  global.logFile.write(cmsg + "\n");
};

/**
 * Print a user friendly information warning to the console
 * @method warning
 * @param {String} msg the message.
 **/
var warning = (msg) => {
  var stack = at(1);
  var cmsg = "[" + moment().format("DD/MM/YYYY HH:mm:ss.SSS") + "] " + "[WARNING] " + "(" + path.relative(".", stack.file) + ":" + stack.line + ") > " + msg;
  console.log(cmsg);
  global.logFile.write(cmsg + "\n");
};
process.on('uncaughtException', function(err) {
  error((err && err.stack) ? err.stack : err);
});
process.on("exit", (code) => {
  info("Exiting with code " + code);
  global.logFile.end();
});

var save = function(type, stdid, tclass, time, comments, td, tdT) {
  global.db.run(knex("logs").insert({
    type: type,
    studentid: stdid,
    date: time,
    class: tclass,
    description: comments,
    timeDiff: td,
    timeDiffToday: tdT
  }).toString());
};
var get = function(stdid, cb) {
  var obj = {};
  global.db.all(knex("logs").select().where({
    studentid: stdid
  }).toString(), (err, rows) => {
    if (err || rows == undefined || rows == []) {
      error("SQLITE Error : " + err);
      cb(global.ERROR.SQLITE);
      return;
    }
    obj.logs = rows;
    global.db.get(knex("students").select().where({
      id: stdid
    }).toString(), (err, row0) => {
      if (err) {
        error("SQLITE Error : " + err);
        cb(global.ERROR.SQLITE);
        return;
      }
      obj.student = row0;
      global.db.get(knex("users").select().where({
        id: row0.userid
      }).toString(), (err, row) => {
        if (err) {
          error("SQLITE Error : " + err);
          cb(global.ERROR.SQLITE);
          return;
        }
        obj.user = row;
        cb(null, obj);
      })
    });

  });
};

function format(data) {
  var obj = [];
  for (var i = 0; i < data.logs.length; i++) {
    var curr = {};

    switch (data.logs[i].type) {
      case global.LOGS.IN:
        curr.title = "IN";
        curr.start = data.logs[i].date;
        if (data.logs[i].description)
          curr.title += " - " + data.logs[i].description
        curr.color = "rgb(25, 124, 67)";
        curr.textColor = "rgb(255, 255, 255)"
        break;
      case global.LOGS.OUT:
        curr.title = "OUT";
        curr.start = data.logs[i].date;
        if (data.logs[i].description)
          curr.title += " - " + data.logs[i].description
        curr.color = "rgb(193, 57, 43)"
        curr.textColor = "rgb(255, 255, 255)"
        break;
      case global.LOGS.ABSENT:
        curr.title = "ABSENT";
        curr.start = data.logs[i].date;
        if (data.logs[i].description)
          curr.title += " - " + data.logs[i].description
        curr.color = "rgb(53, 113, 133)"
        curr.textColor = "rgb(255, 255, 255)"
        break;
      case global.LOGS.SETTIME:
        curr.title = "TIME SET";
        curr.start = data.logs[i].date;
        if (data.logs[i].description)
          curr.title += " - " + data.logs[i].description
        curr.color = "rgb(170, 13, 159)"
        curr.textColor = "rgb(255, 255, 255)"
        break;
      case global.LOGS.MODTIME:
        curr.title = "TIME ALTERED";
        curr.start = data.logs[i].date;
        if (data.logs[i].description)
          curr.title += " - " + data.logs[i].description
        curr.color = "rgb(170, 13, 159)"
        curr.textColor = "rgb(255, 255, 255)"
        break;
      case global.LOGS.RESETTIME:
        curr.title = "ACCOUNT RESET";
        curr.start = data.logs[i].date;
        if (data.logs[i].description)
          curr.title += " - " + data.logs[i].description
        curr.color = "rgb(170, 13, 159)"
        curr.textColor = "rgb(255, 255, 255)"
        break;
      case global.LOGS.MINIMUMPAUSE:
        curr.title = "MINIMUMPAUSE RULE BROKEN";
        curr.start = data.logs[i].date;
        if (data.logs[i].description)
          curr.title += " - " + data.logs[i].description
        curr.color = "rgb(233, 119, 0)"
        curr.textColor = "rgb(255, 255, 255)"
        break;
      case global.LOGS.NOPAUSE:
        curr.title = "NO PAUSE TAKEN";
        curr.start = data.logs[i].date;
        if (data.logs[i].description)
          curr.title += " - " + data.logs[i].description
        curr.color = "rgb(233, 119, 0)"
        curr.textColor = "rgb(255, 255, 255)"
        break;
      case global.LOGS.NOLUNCH:
        curr.title = "NO LUNCH TAKEN";
        curr.start = data.logs[i].date;
        if (data.logs[i].description)
          curr.title += " - " + data.logs[i].description
        curr.color = "rgb(233, 119, 0)"
        curr.textColor = "rgb(255, 255, 255)"
        break;
      case global.LOGS.TIMEERROR:
        curr.title = "TIME RULE BROKEN";
        curr.start = data.logs[i].date;
        if (data.logs[i].description)
          curr.title += " - " + data.logs[i].description
        curr.color = "rgb(233, 119, 0)"
        curr.textColor = "rgb(255, 255, 255)"
        break;
      case global.LOGS.BLOCKED:
        curr.title = "SCHEDULE BLOCKED";
        curr.start = data.logs[i].date;
        if (data.logs[i].description)
          curr.title += " - " + data.logs[i].description
        curr.color = "rgb(0, 0, 0)"
        curr.textColor = "rgb(255, 255, 255)"
        break;
      case global.LOGS.UNBLOCKED:
        curr.title = "SCHEDULE UNBLOCKED";
        curr.start = data.logs[i].date;
        if (data.logs[i].description)
          curr.title += " - " + data.logs[i].description
        curr.color = "rgb(0, 0, 0)"
        curr.textColor = "rgb(255, 255, 255)"
        break;
        case global.LOGS.ENDOFDAY:
          curr.title = "END OF DAY >" + math.secondsToHms(data.logs[i].timeDiff) + "< ";
          curr.start = data.logs[i].date;
          if (data.logs[i].description)
            curr.title += " - " + data.logs[i].description
          curr.color = "rgb(223, 222, 179)"
          curr.textColor = "rgb(0, 0, 0)"
          break;
      default:
        continue;
    }
    obj.push(curr);
  }
  obj.today = moment().toString();
  return obj;
}
module.exports = {
  info,
  error,
  warning,
  save,
  get,
  format,
  createNewLogFile
};
/**
 * On SIGINT (Ctrl + C), quit the app nicely
 * @method interruption
 **/
function interruption() {
  warning("Interruption caught !");
  try {
    test.stop();
  } catch (err) {
    //Don't handle error.
  }
  process.exit();
}
if (process.platform === "win32") {
  var rl = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on("SIGINT", function() {
    interruption();
  });
}

process.on("SIGINT", function() {
  interruption();
});
