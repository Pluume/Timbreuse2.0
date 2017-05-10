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
      if (ireq.fnc != oreq[0].fnc)
        return;
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
        var ireq = JSON.parse(data);
        if (ireq.fnc != oreq[0].fnc)
          return;
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
      if (ireq.fnc != oreq[0].fnc)
        return;
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
      if (ireq.fnc != oreq[0].fnc)
        return;
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
      if (ireq.fnc != oreq[0].fnc)
        return;
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
      if (ireq.fnc != oreq[0].fnc)
        return;
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
      if (ireq.fnc != oreq[0].fnc)
        return;
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
      if (ireq.fnc != oreq[0].fnc)
        return;
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
      if (ireq.fnc != oreq[0].fnc)
        return;
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
      if (ireq.fnc != oreq[0].fnc)
        return;
      ireq.format = log.format(ireq.data);
      event.sender.send("logs", ireq);
    } catch (err1) {
      log.error("Error parsing request : " + err1);
    }
  });
}

function setAbsent(event, arg) {
  var oreq = [{
    fnc: request.REQUEST.SETABSENT,
    error: request.ERROR.OK,
    id: arg.id,
    comments: arg.comments
  }];
  client.send(JSON.stringify(oreq), (err, data) => {
    try {

      var ireq = JSON.parse(data);
      if (ireq.fnc != oreq[0].fnc)
        return;
      event.sender.send("absent", ireq);
    } catch (err1) {
      log.error("Error parsing request : " + err1);
    }
  });
}

function setFixed(event, arg) {
  var oreq = [{
    fnc: request.REQUEST.SETFIXED,
    error: request.ERROR.OK,
    id: arg.id,
    comments: arg.comments
  }];
  client.send(JSON.stringify(oreq), (err, data) => {
    try {

      var ireq = JSON.parse(data);
      if (ireq.fnc != oreq[0].fnc)
        return;
      event.sender.send("fixed", ireq);
    } catch (err1) {
      log.error("Error parsing request : " + err1);
    }
  });
}

function tag(event, arg) {
  var oreq = [{
    fnc: request.REQUEST.TAG,
    error: request.ERROR.OK,
    id: arg.id,
    comments: arg.comments
  }];
  client.send(JSON.stringify(oreq), (err, data) => {
    try {

      var ireq = JSON.parse(data);
      if (ireq.fnc != oreq[0].fnc)
        return;
      event.sender.send("tag", ireq);
    } catch (err1) {
      log.error("Error parsing request : " + err1);
    }
  });
}

function getNotifications(event, arg) {
  var oreq = [{
    fnc: request.REQUEST.GETNOTIFICATIONS,
    error: request.ERROR.OK
  }];
  client.send(JSON.stringify(oreq), (err, data) => {
    try {
      var ireq = JSON.parse(data);
      if (ireq.fnc != oreq[0].fnc)
        return;
      event.sender.send("notification", ireq);
    } catch (err1) {
      log.error("Error parsing request : " + err1);
    }
  });
}

function toggleNotification(event, arg) {
  var oreq = [{
    fnc: request.REQUEST.TOGGLENOTIFICATION,
    error: request.ERROR.OK,
    id: arg
  }];

  client.send(JSON.stringify(oreq), (err, data) => {});
}
function getHolidays(event, arg) {
  var oreq = [{
    fnc: request.REQUEST.GETHOLIDAYS,
    error: request.ERROR.OK
  }];

  client.send(JSON.stringify(oreq), (err, data) => {
    try {
      var ireq = JSON.parse(data);
      if (ireq.fnc != oreq[0].fnc)
        return;
      event.sender.send("getHolidays", ireq);
    } catch (err1) {
      log.error("Error parsing request : " + err1);
    }
  });
}

function addHolidays(event, arg) {
  var oreq = [{
    fnc: request.REQUEST.ADDHOLIDAYS,
    error: request.ERROR.OK,
    data: {
      title: arg.title,
      date1: arg.date1,
      date2: arg.date2
    }
  }];

  client.send(JSON.stringify(oreq), (err, data) => {
    try {
      var ireq = JSON.parse(data);
      if (ireq.fnc != oreq[0].fnc)
        return;
      event.sender.send("addHolidays", ireq);
    } catch (err1) {
      log.error("Error parsing request : " + err1);
    }
  });
}
function delHolidays(event, arg) {
  var oreq = [{
    fnc: request.REQUEST.DELHOLIDAYS,
    error: request.ERROR.OK,
    id: arg
  }];

  client.send(JSON.stringify(oreq), (err, data) => {
    try {
      var ireq = JSON.parse(data);
      if (ireq.fnc != oreq[0].fnc)
        return;
      event.sender.send("delHolidays", ireq);
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
ipcMain.on("absent", setAbsent);
ipcMain.on("fixed", setFixed);
ipcMain.on("tag", tag);
ipcMain.on("notification", getNotifications);
ipcMain.on("notificationToggle", toggleNotification);
ipcMain.on("getHolidays", getHolidays);
ipcMain.on("addHolidays", addHolidays);
ipcMain.on("delHolidays", delHolidays);
