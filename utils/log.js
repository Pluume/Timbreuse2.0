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
var access = fs.createWriteStream("Timbreuse.log",{ flags: 'w' });
/**
 * Print a user friendly information message to the console
 * @method info
 * @param {String} msg the message.
 **/
var info = (msg) =>
{
  var stack = at(1);
  var cmsg = "[" + moment().format("DD/MM/YYYY HH:mm:ss.SSS") + "] " + "[INFO] " + "(" + path.relative(".", stack.file) + ":" + stack.line + ") > " + msg;
  console.log(cmsg);
  access.write(cmsg + "\n");
};
/**
 * Print a user friendly error message to the console
 * @method error
 * @param {String} msg the message.
 **/
var error = (msg) =>
{
  var stack = at(1);
  var cmsg = "[" + moment().format("DD/MM/YYYY HH:mm:ss.SSS") + "] " + "[ERROR] " + "(" + path.relative(".", stack.file) + ":" + stack.line + ") > " + msg;
  console.log(cmsg);
  access.write(cmsg + "\n");
};
/**
 * Print a user friendly information warning to the console
 * @method warning
 * @param {String} msg the message.
 **/
var warning = (msg) =>
{
  var stack = at(1);
  var cmsg = "[" + moment().format("DD/MM/YYYY HH:mm:ss.SSS") + "] " + "[WARNING] " + "(" + path.relative(".", stack.file) + ":" + stack.line + ") > " + msg;
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
/**
 * On SIGINT (Ctrl + C), quit the app nicely
 * @method interruption
 **/
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
