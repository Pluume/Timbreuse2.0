const {
    ipcMain
} = require('electron');
const client = require("./client.js");
const request = require("../request.js")
const log = require("../utils/log.js")
const crypto = require("crypto-js");
const path = require('path');

function getStudents(event, arg) {
    var oreq = [{
        fnc: request.REQUEST.GETSTUDENT,
        error: request.ERROR.OK,
        scope: request.SCOPE.ALL
    }];
    client.send(JSON.stringify(oreq), (err, data) => {
        try {
            var ireq = JSON.parse(data);
            event.sender.send("students", ireq);
        } catch (err1) {
            log.error("Error parsing request : " + err1);
            event.sender.send("students", request.ERROR.UNKNOWN);
        }
    });
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
        client.send(JSON.stringify(oreq), (err, data) => {
            try {
                var ireq = JSON.parse(data);
                event.sender.send("login", ireq);
            } catch (err1) {
                log.error("Error parsing request : " + err1);
                event.sender.send("login", request.ERROR.UNKNOWN);
            }
        });
    });
}

function redirect(event, arg) {
    switch (arg) {
        case request.PAGES.PROFS:
            global.mwin.loadURL("file://" + path.join(__dirname, 'web_frontend/pages/index.html'))
            break;
    }
}

function setPage(event, arg) {
    global.currentPage = arg;
}
function getClass(event, arg) {
  var oreq = [{
      fnc: request.REQUEST.GETCLASS,
      error: request.ERROR.OK,
      scope: arg
  }];

      client.send(JSON.stringify(oreq), (err, data) => {
          try {
              var ireq = JSON.parse(data);
              event.sender.send("class", ireq);
          } catch (err1) {
              log.error("Error parsing request : " + err1);
              event.sender.send("class", request.ERROR.UNKNOWN);
          }
      });
}
function createStudent(event, arg)
{
  var oreq = [{
      fnc: request.REQUEST.ADDSTUDENT,
      error: request.ERROR.OK,
      data: arg
  }];

      client.send(JSON.stringify(oreq), (err, data) => {
          try {
              var ireq = JSON.parse(data);
              event.sender.send("createStudent", ireq);
          } catch (err1) {
              log.error("Error parsing request : " + err1);
              event.sender.send("createStudent", request.ERROR.UNKNOWN);
          }
      });
}
ipcMain.on("createStudent", createStudent);
ipcMain.on("class", getClass);
ipcMain.on("pages", setPage);
ipcMain.on("redirect", redirect);
ipcMain.on("students", getStudents);
ipcMain.on("login", logIn);
