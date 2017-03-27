const {
    ipcMain
} = require('electron');
const client = require("./client.js");
const request = require("../request.js")
const log = require("../utils/log.js")
const crypto = require("crypto-js");
function getStudents(event, arg) {
    event.sender.send("students", null);
}

function logIn(event, arg) {
  var passhash = crypto.SHA256(arg.pass).toString(crypto.enc.utf8);
    var oreq = [{
        fnc: request.REQUEST.AUTH,
        error: request.ERROR.OK,
        user: arg.user,
        pass: passhash
    }];
    client.connect((err) => {
        if (err !== null) {
            log.error("Error connecting to server : " + err);
            event.sender.send("login", request.ERROR.UNKNOWN);
            return;
        }
        client.send(JSON.stringify(oreq), (err,data) => {
            try {
                var ireq = JSON.parse(data);
                event.sender.send("login", ireq);
            } catch (err) {
                log.error("Error parsing request : " + err);
                event.sender.send("login", request.ERROR.UNKNOWN);
            }
        });
    });
}
function redirect(event,arg)
{
  console.log(arg);
  switch(arg)
  {
    case window.PAGES.PROFS:
    console.log(arg);
    global.mwin.loadURL("web_frontend/pages/profs.html")
    break;
  }
}
ipcMain.on("redirect",redirect);
ipcMain.on("students", getStudents);
ipcMain.on("login", logIn);
