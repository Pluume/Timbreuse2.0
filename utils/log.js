const moment = require("moment");
const at = require("console-at");
var path = require("path");
const fs = require("fs");
var access = fs.createWriteStream("Timbreuse.log",{ flags: 'w' });
var info = (msg) =>
{
  var stack = at(1);
  var cmsg = "[" + process.uptime() + "] " + "[INFO] " + "(" + path.relative(".", stack.file) + ":" + stack.line + ") > " + msg;
  console.log(cmsg);
  access.write(cmsg + "\n");
};
var error = (msg) =>
{
  var stack = at(1);
  var cmsg = "[" + process.uptime() + "] " + "[ERROR] " + "(" + path.relative(".", stack.file) + ":" + stack.line + ") > " + msg;
  console.log(cmsg);
  access.write(cmsg + "\n");
};
var warning = (msg) =>
{
  var stack = at(1);
  var cmsg = "[" + process.uptime() + "] " + "[WARNING] " + "(" + path.relative(".", stack.file) + ":" + stack.line + ") > " + msg;
  console.log(cmsg);
  access.write(cmsg + "\n");
};
process.on('uncaughtException', function(err) {
  error((err && err.stack) ? err.stack : err);
});
process.on("exit",(code) => {
  info("Exiting with code " + code);
  access.end();
});
module.exports = {
  info,
  error,
  warning
};
function interruption()
{
  warning("Interruption caught !");
  try {
    test.stop();
  } catch(err) {
    //Don't handle error.
  }
  process.exit();
}
if (process.platform === "win32") {
  var rl = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on("SIGINT", function () {
    interruption();
  });
}

process.on("SIGINT", function () {
  interruption();
});
