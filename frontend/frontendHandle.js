/**
 * Handle the communication between electron's main process and electron's renderer process
 *
 * @module frontendHandle
 * @class frontendHandle
 */
const {
  ipcMain
} = require('electron');
const client = require("./client.js");
const request = require("../request.js");
const log = require("../utils/log.js");
const crypto = require("crypto-js");
const path = require('path');
const array = require('array')();
/**
 * Get the students from the server
 * @method getStudents
 * @param {Event} event The event object
 * @param {Object} arg The scope of the search (see the server_methods.js)
 **/
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
/**
 * Log into the server
 * @method logIn
 * @param {Event} event The event object
 * @param {Object} arg Raw credentials entered by the user
 **/
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
/**
 * Redirect the renderer process to another page
 * @method redirect
 * @param {Event} event The event object
 * @param {Integer} arg Which page to redirect to
 **/
function redirect(event, arg) {
  switch (arg) {
    case request.PAGES.PROFS:
      global.mwin.loadURL("file://" + path.join(__dirname, 'web_frontend/pages/index.html'));
      break;
    case request.PAGES.ADMIN:
      global.mwin.loadURL("file://" + path.join(__dirname, 'web_frontend/pages/indexAdmin.html'));
      break;
    case request.PAGES.STUDENT:
      global.mwin.loadURL("file://" + path.join(__dirname, 'web_frontend/pages/indexStudent.html'));
      break;
  }
}
/**
 * Set the global variable to the current page
 * @method setPage
 * @param {Event} event The event object
 * @param {Object} arg The page ID
 **/
function setPage(event, arg) {
  global.currentPage = arg;
}
/**
 * Get the current class object
 * @method getClass
 * @param {Event} event The event object
 * @param {Object} arg The scope (see server_methods.js)
 **/
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
/**
 * Create a new students
 * @method createStudent
 * @param {Event} event The event object
 * @param {Object} arg Validated data entered by the user
 **/
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
/**
 * Delete a student from the database
 * @method deleteStudent
 * @param {Event} event The event object
 * @param {Object} arg Validated data entered by the user
 **/
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
/**
 * Edit a student
 * @method editStudent
 * @param {Event} event The event object
 * @param {Object} arg Validated data entered by the user
 **/
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
/**
 * Reset the time and last tagged time of student
 * @method resetTime
 * @param {Event} event The event object
 * @param {Object} arg Validated data entered by the user
 **/
function resetTime(event, arg) {
  var oreq = [{
    fnc: request.REQUEST.RESETTIME,
    error: request.ERROR.OK,
    id: arg.id,
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
/**
 * Add/Sub time to a student
 * @method modTime
 * @param {Event} event The event object
 * @param {Object} arg Validated data entered by the user
 **/
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
/**
 * Set the time of a student
 * @method setTime
 * @param {Event} event The event object
 * @param {Object} arg Validated data entered by the user
 **/
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
/**
 * Get the logs of a student
 * @method getLogs
 * @param {Event} event The event object
 * @param {Object} arg Validated data entered by the user
 **/
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
/**
 * Toggle the absent status of a student
 * @method setAbsent
 * @param {Event} event The event object
 * @param {Object} arg Validated data entered by the user
 **/
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
/**
 * Toggle the status blocked of student. If blocked the student must comply to the fixed schedule
 * @method setFixed
 * @param {Event} event The event object
 * @param {Object} arg Validated data entered by the user
 **/
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
/**
 * Tag a student
 * @method tag
 * @param {Event} event The event object
 * @param {Object} arg Validated data entered by the user
 **/
function tag(event, arg) {
  var oreq = [{
    fnc: request.REQUEST.TAG,
    error: request.ERROR.OK,
    id: arg.id,
    comments: arg.comments,
    client: true
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
/**
 * Get alls the notification relative to a student
 * @method getNotifications
 * @param {Event} event The event object
 * @param {Object} arg Validated data entered by the user
 **/
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
/**
 * Change the status (either read or unread) of notification
 * @method toggleNotification
 * @param {Event} event The event object
 * @param {Integer} arg The notification id
 **/
function toggleNotification(event, arg) {
  var oreq = [{
    fnc: request.REQUEST.TOGGLENOTIFICATION,
    error: request.ERROR.OK,
    id: arg
  }];

  client.send(JSON.stringify(oreq), (err, data) => {});
}
/**
 * Get the holidays
 * @method getHolidays
 * @param {Event} event The event object
 * @param {Object} arg Validated data entered by the user
 **/
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
/**
 * Create a new holidays object in the database
 * @method addHolidays
 * @param {Event} event The event object
 * @param {Object} arg Validated data entered by the user
 **/
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
/**
 * Delete holidays in the database
 * @method delHolidays
 * @param {Event} event The event object
 * @param {Object} arg Validated data entered by the user
 **/
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
/**
 * Log out of the server
 * @method logout
 * @param {Event} event The event object
 * @param {Object} arg Nothing
 **/
function logout(event, arg) {
  client.disconnect();
}
/**
 * Get all the informations relative to the professor currently connected if any
 * @method getProf
 * @param {Event} event The event object
 * @param {Object} arg Validated data entered by the user
 **/
function getProf(event, arg) {
  var oreq = [{
    fnc: request.REQUEST.GETPROF,
    error: request.ERROR.OK
  }];
  client.send(JSON.stringify(oreq), (err, data) => {
    try {
      var ireq = JSON.parse(data);
      if (ireq.fnc != oreq[0].fnc)
        return;
      event.sender.send("getprof", ireq);
    } catch (err1) {
      log.error("Error parsing request : " + err1);
      log.error("Error details : " + err);
    }
  });
}
/**
 * Create a new professor
 * @method addProf
 * @param {Event} event The event object
 * @param {Object} arg Validated data entered by the user
 **/
function addProf(event, arg) {
  var oreq = [{
    fnc: request.REQUEST.CREATEPROF,
    error: request.ERROR.OK,
    data: arg
  }];
  client.send(JSON.stringify(oreq), (err, data) => {
    try {
      var ireq = JSON.parse(data);
      if (ireq.fnc != oreq[0].fnc)
        return;
      event.sender.send("addprof", ireq);
    } catch (err1) {
      log.error("Error parsing request : " + err1);
      log.error("Error details : " + err);
    }
  });
}
/**
 * Delete a professor object from the database
 * @method delProf
 * @param {Event} event The event object
 * @param {Object} arg Validated data entered by the user
 **/
function delProf(event, arg) {
  var oreq = [{
    fnc: request.REQUEST.DELPROF,
    error: request.ERROR.OK,
    id: arg
  }];
  client.send(JSON.stringify(oreq), (err, data) => {
    try {
      var ireq = JSON.parse(data);
      if (ireq.fnc != oreq[0].fnc)
        return;
      event.sender.send("delprof", ireq);
    } catch (err1) {
      log.error("Error parsing request : " + err1);
      log.error("Error details : " + err);
    }
  });
}
/**
 * Edit a professor object
 * @method editProf
 * @param {Event} event The event object
 * @param {Object} arg Validated data entered by the user
 **/
function editProf(event, arg) {
  var oreq = [{
    fnc: request.REQUEST.EDITPROF,
    error: request.ERROR.OK,
    data: arg
  }];
  client.send(JSON.stringify(oreq), (err, data) => {
    try {
      var ireq = JSON.parse(data);
      if (ireq.fnc != oreq[0].fnc)
        return;
      event.sender.send("editprof", ireq);
    } catch (err1) {
      log.error("Error parsing request : " + err1);
      log.error("Error details : " + err);
    }
  });
}
/**
 * Change the password of the currently connected user if any
 * @method changePassword
 * @param {Event} event The event object
 * @param {Object} arg The new raw password
 **/
function changePassword(event, arg) {
  var oreq = [{
    fnc: request.REQUEST.CHANGEPASS,
    error: request.ERROR.OK,
    data: crypto.SHA256(arg).toString(crypto.enc.utf8)
  }];
  client.send(JSON.stringify(oreq), (err, data) => {
    try {
      var ireq = JSON.parse(data);
      if (ireq.fnc != oreq[0].fnc)
        return;
      event.sender.send("changepassword", ireq);
    } catch (err1) {
      log.error("Error parsing request : " + err1);
      log.error("Error details : " + err);
    }
  });
}
/**
 * Get a list of all the existings classes
 * @method getClassList
 * @param {Event} event The event object
 * @param {Object} arg Validated data entered by the user
 **/
function getClassList(event, arg) {
  var oreq = [{
    fnc: request.REQUEST.GETCLASSLIST,
    error: request.ERROR.OK
  }];
  client.send(JSON.stringify(oreq), (err, data) => {
    try {
      var ireq = JSON.parse(data);
      if (ireq.fnc != oreq[0].fnc)
        return;
      event.sender.send("getclasslist", ireq);
    } catch (err1) {
      log.error("Error parsing request : " + err1);
      log.error("Error details : " + err);
    }
  });
}
/**
 * Change a student's class
 * @method changeStudentClass
 * @param {Event} event The event object
 * @param {Object} arg Validated data entered by the user
 **/
function changeStudentClass(event, arg) {
  var oreq = [{
    fnc: request.REQUEST.CHANGECLASS,
    error: request.ERROR.OK,
    stdid: arg.stdid,
    profid: arg.profid
  }];
  client.send(JSON.stringify(oreq), (err, data) => {
    try {
      var ireq = JSON.parse(data);
      if (ireq.fnc != oreq[0].fnc)
        return;
      event.sender.send("changestdclass", ireq);
    } catch (err1) {
      log.error("Error parsing request : " + err1);
      log.error("Error details : " + err);
    }
  });
}
/**
 * Create a new leave request in the database
 * @method getLogs
 * @param {Event} event The event object
 * @param {Object} arg Validated data entered by the user
 **/
function createLeaveRequest(event, arg) {
  var oreq = [{
    fnc: request.REQUEST.CREATELR,
    error: request.ERROR.OK,
    sDate: arg.sDate,
    eDate: arg.eDate,
    missedTest: arg.missedTest,
    reason: arg.reason,
    reasonDesc: arg.reasonDesc,
    proof: arg.proof,
    where: arg.where
  }];
  if(arg.id!=undefined)
  oreq[0].id = arg.id;
  client.send(JSON.stringify(oreq), (err, data) => {
    try {
      var ireq = JSON.parse(data);
      if (ireq.fnc != oreq[0].fnc)
        return;
      event.sender.send("createLR", ireq);
    } catch (err1) {
      log.error("Error parsing request : " + err1);
      log.error("Error details : " + err);
    }
  });
}
/**
 * Get all the leaves request accessible for the currently connected user if any
 * @method getLogs
 * @param {Event} event The event object
 * @param {Object} arg Nothing
 **/
function getLeaveRequest(event, arg) {
  var oreq = [{
    fnc: request.REQUEST.GETLR,
    error: request.ERROR.OK
  }];
  if (arg != undefined)
    oreq[0].scope = arg;
  client.send(JSON.stringify(oreq), (err, data) => {
    try {
      var ireq = JSON.parse(data);
      if (ireq.fnc != oreq[0].fnc)
        return;
      event.sender.send("getLR", ireq);
    } catch (err1) {
      log.error("Error parsing request : " + err1);
      log.error("Error details : " + err);
    }
  });
}
/**
 * Toggle the accepted status of a leave application's
 * @method toggleLR
 * @param {Event} event The event object
 * @param {Object} arg The id and the new value of the status
 **/
function toggleLR(event, arg) {
  var oreq = [{
    fnc: request.REQUEST.TOGGLELR,
    error: request.ERROR.OK,
    id: arg.id,
    status: arg.status
  }];
  if (arg != undefined)
    oreq[0].scope = arg;
  client.send(JSON.stringify(oreq), (err, data) => {
    try {
      var ireq = JSON.parse(data);
      if (ireq.fnc != oreq[0].fnc)
        return;
      event.sender.send("toggleLR", ireq);
    } catch (err1) {
      log.error("Error parsing request : " + err1);
      log.error("Error details : " + err);
    }
  });
}
ipcMain.on("toggleLR",toggleLR);
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
ipcMain.on("logout", logout);
ipcMain.on("getprof", getProf);
ipcMain.on("addprof", addProf);
ipcMain.on("delprof", delProf);
ipcMain.on("editprof", editProf);
ipcMain.on("changepassword", changePassword);
ipcMain.on("getclasslist", getClassList);
ipcMain.on("changestdclass", changeStudentClass);
ipcMain.on("createLR", createLeaveRequest);
ipcMain.on("getLR", getLeaveRequest);
