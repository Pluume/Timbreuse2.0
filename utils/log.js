const moment = require("moment");
const at = require("console-at");
var colors = require('colors');
var path = require("path");
var info = (msg) =>
{
  var stack = at(1);
  console.log("[" + process.uptime() + "] " + "[INFO] ".green + "(" + path.relative(".", stack.file) + ":" + stack.line + ") >> " + msg);
};
var error = (msg) =>
{
  var stack = at(1);
  console.error("[" + process.uptime() + "] " + "[ERROR] ".red + "(" + path.relative(".", stack.file) + ":" + stack.line + ") >> " + msg);
};
var warning = (msg) =>
{
  var stack = at(1);
  console.log("[" + process.uptime() + "] " + "[WARNING] ".magenta + "(" + path.relative(".", stack.file) + ":" + stack.line + ") >> " + msg);
};
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
