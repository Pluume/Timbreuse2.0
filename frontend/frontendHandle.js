const {
  ipcMain
} = require('electron');
const client = require("./client.js");
const request = require("../request.js")
const log = require("../utils/log.js")
const crypto = require("crypto-js");
const path = require('path');
const array = require('array')();

function getStudents(event, arg) {
  var oreq = [{
    fnc: request.REQUEST.GETSTUDENT,
    error: request.ERROR.OK,
    scope: arg
  }];
  client.send(JSON.stringify(oreq), (err, data) => {
    try {

      var ireq = JSON.parse(data);
      event.sender.send("students", ireq);
    } catch (err1) {
      log.error("Error parsing request : " + err1);
      log.error("Error details : " + err);
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
        log.info(data);
        var ireq = JSON.parse(data);
        event.sender.send("login", ireq);
      } catch (err1) {
        log.error("Error parsing request : " + err1);
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
    }
  });
}

function createStudent(event, arg) {
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
    }
  });
}

function deleteStudent(event, arg) {
  var oreq = [{
    fnc: request.REQUEST.DELSTUDENT,
    error: request.ERROR.OK,
    data: arg
  }];
  client.send(JSON.stringify(oreq), (err, data) => {
    try {
      var ireq = JSON.parse(data);
      event.sender.send("deleteStudent", ireq);
    } catch (err1) {
      log.error("Error parsing request : " + err1);
    }
  });
}

function editStudent(event, arg) {
  var oreq = [{
    fnc: request.REQUEST.EDITSTUDENT,
    error: request.ERROR.OK,
    data: arg
  }];
  client.send(JSON.stringify(oreq), (err, data) => {
    try {
      var ireq = JSON.parse(data);
      event.sender.send("editStudent", ireq);
    } catch (err1) {
      log.error("Error parsing request : " + err1);
    }
  });
}

function resetTime(event, arg) {
  var oreq = [{
    fnc: request.REQUEST.RESETTIME,
    error: request.ERROR.OK,
    id: arg,
    comments: arg.comments
  }];
  client.send(JSON.stringify(oreq), (err, data) => {
    try {
      var ireq = JSON.parse(data);
      event.sender.send("resetTime", ireq);
    } catch (err1) {
      log.error("Error parsing request : " + err1);
    }
  });
}

function modTime(event, arg) {
  var oreq = [{
    fnc: request.REQUEST.MODTIME,
    error: request.ERROR.OK,
    id: arg.id,
    time: arg.time,
    comments: arg.comments
  }];
  client.send(JSON.stringify(oreq), (err, data) => {
    try {

      var ireq = JSON.parse(data);

      event.sender.send("modTime", ireq);
    } catch (err1) {
      log.error("Error parsing request : " + err1);
    }
  });
}

function setTime(event, arg) {
  var oreq = [{
    fnc: request.REQUEST.SETTIME,
    error: request.ERROR.OK,
    id: arg.id,
    time: arg.time,
    comments: arg.comments
  }];
  client.send(JSON.stringify(oreq), (err, data) => {
    try {

      var ireq = JSON.parse(data);

      event.sender.send("setTime", ireq);
    } catch (err1) {
      log.error("Error parsing request : " + err1);
    }
  });
}



function getLogs(event, arg) {
  var oreq = [{
    fnc: request.REQUEST.LOGS,
    error: request.ERROR.OK,
    id: arg.id
  }];
  client.send(JSON.stringify(oreq), (err, data) => {
    try {

      var ireq = JSON.parse(data);
      ireq.format = log.format(ireq.data);
      event.sender.send("logs", ireq);
    } catch (err1) {
      log.error("Error parsing request : " + err1);
    }
  });
}
ipcMain.on("editStudent", editStudent);
ipcMain.on("deleteStudent", deleteStudent);
ipcMain.on("createStudent", createStudent);
ipcMain.on("class", getClass);
ipcMain.on("pages", setPage);
ipcMain.on("redirect", redirect);
ipcMain.on("students", getStudents);
ipcMain.on("login", logIn);
ipcMain.on("resetTime", resetTime);
ipcMain.on("modTime", modTime);
ipcMain.on("setTime", setTime);
ipcMain.on("logs", getLogs);
