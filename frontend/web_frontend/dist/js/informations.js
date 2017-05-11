const {
  ipcRenderer
} = require('electron');

function makeRdmString() //Thanks to http://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
{
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function redAlert(msg) {
  var message = document.createElement("div");
  message.setAttribute("class", "alert alert-danger");
  message.innerHTML = msg;
  var closeMsg = document.createElement("button");
  closeMsg.setAttribute("type", "button");
  closeMsg.setAttribute("class", "close");
  closeMsg.setAttribute("data-dismiss", "alert");
  closeMsg.innerHTML = "x";
  message.appendChild(closeMsg);
  var id = "ALERT" + makeRdmString();
  message.setAttribute("id", id);
  document.getElementById("pageContainer").insertBefore(message, document.getElementById("pageContainer").firstChild);
  window.setTimeout(function() { //Thanks to http://stackoverflow.com/a/8141065/6687983
    $("#" + id).fadeTo(500, 0).slideUp(500, function() {
      $(this).remove();
    });
  }, 15000);
  console.log(msg);
}

function greenAlert(msg) {
  var message = document.createElement("div");
  message.setAttribute("class", "alert alert-success");
  message.innerHTML = msg;
  var closeMsg = document.createElement("button");
  closeMsg.setAttribute("type", "button");
  closeMsg.setAttribute("class", "close");
  closeMsg.setAttribute("data-dismiss", "alert");
  closeMsg.innerHTML = "x";
  message.appendChild(closeMsg);
  var id = "ALERT" + makeRdmString();
  message.setAttribute("id", id);
  document.getElementById("pageContainer").insertBefore(message, document.getElementById("pageContainer").firstChild);
  window.setTimeout(function() { //Thanks to http://stackoverflow.com/a/8141065/6687983
    $("#" + id).fadeTo(500, 0).slideUp(500, function() {
      $(this).remove();
    });
  }, 2000);
  console.log(msg);
}

function getClass(cb) {
  ipcRenderer.once("class", (event, arg) => {
    if (arg === window.ERROR.UNKNOWN) {
      redAlert("Unable to contact the server...");
      return;
    }
    switch (arg.error) {
      case window.ERROR.OK:
        cb(arg.class);
        return;
        break;
      case window.ERROR.NOTLOGEDIN:
        redAlert("Not logged in...");
        break;
      case window.ERROR.UNKNOWN:
        redAlert("Unkown error...");
        break;
      default:
        redAlert("Ill formed request...");
    }
  });
  ipcRenderer.send("class", window.SCOPE.UNIQUE);
}

function getStudents(tableId, cb) {
  ipcRenderer.send("students", window.SCOPE.ALL);
  ipcRenderer.once("students", (event, arg) => {
    if (arg === window.ERROR.UNKNOWN) {
      redAlert("Unable to contact the server...");
    }
    switch (arg.error) {
      case window.ERROR.OK:
        var data = [];
        for (var i = 0; i < arg.students.length; i++) {
          data.push({
            id: arg.students[i].id,
            lname: arg.students[i].user.lname,
            fname: arg.students[i].user.fname,
            username: arg.students[i].user.username,
            timeDiffToday: arg.students[i].timeDiffToday,
            timeDiff: arg.students[i].timeDiff,
            status: arg.students[i].status,
            lastTagTime: arg.students[i].lastTagTime
          });
        }
        $('#' + tableId).bootstrapTable('load', data);

        cb();
        break;
      case window.ERROR.NOTLOGEDIN:
        redAlert("Not logged in !");
        break;
      case window.ERROR.UNKNOWN:
        redAlert("Unkown error...");
        break;
      default:
        redAlert("Ill formed request...");
    }

  });
}

function getStudent(id, cb) {
  ipcRenderer.send("students", id);
  ipcRenderer.once("students", (event, arg) => {
    if (arg === window.ERROR.UNKNOWN) {
      redAlert("Unable to contact the server...");
    }
    switch (arg.error) {
      case window.ERROR.OK:
        cb(arg);
        break;
      case window.ERROR.NOTLOGEDIN:
        redAlert("Not logged in !");
        break;
      case window.ERROR.UNKNOWN:
        redAlert("Unkown error...");
        break;
      default:
        redAlert("Ill formed request...");
    }

  });
}

function createStudent(fname, lname, username, email, tag, tclass, dob, project, tableid) {
  var obj = {};
  obj.fname = fname;
  obj.lname = lname;
  obj.username = username;
  obj.tag = tag;
  obj.class = tclass;
  obj.dob = dob;
  obj.project = project;
  obj.email = email;
  ipcRenderer.once("createStudent", (event, arg) => {
    if (arg === window.ERROR.UNKNOWN) {
      redAlert("Unable to contact the server...");
    }
    switch (arg.error) {
      case window.ERROR.OK:
        getStudents(tableid, () => {});
        greenAlert("Student added !");
        break;
      case window.ERROR.NOTLOGEDIN:
        redAlert("Not logged in !");
        break;
      case window.ERROR.UNKNOWN:
        redAlert("Unkown error...");
        break;
      case window.ERROR.USEREXISTS:
        redAlert("User already exists with this username...");
        break;
      default:
        redAlert("Ill formed request...");
    }
  });
  ipcRenderer.send("createStudent", obj);
}

function deleteStudent(id, tableid) {

  ipcRenderer.once("deleteStudent", (event, arg) => {
    if (arg === window.ERROR.UNKNOWN) {
      redAlert("Unable to contact the server...");
    }
    switch (arg.error) {
      case window.ERROR.OK:
        getStudents("stdTable", () => {});
        greenAlert("Student deleted !");
        break;
      case window.ERROR.NOTLOGEDIN:
        redAlert("Not logged in !");
        break;
      case window.ERROR.UNKNOWN:
        redAlert("Unkown error...");
        break;
      default:
        redAlert("Ill formed request...");
    }
  });
  ipcRenderer.send("deleteStudent", id);
}

function editStudent(id, fname, lname, username, email, tag, dob, project, pass, tableid) {
  var obj = {};
  obj.id = id;
  obj.fname = fname;
  obj.lname = lname;
  obj.username = username;
  obj.tag = tag;
  obj.dob = dob;
  obj.project = project;
  obj.email = email;
  obj.pass = pass;
  ipcRenderer.once("editStudent", (event, arg) => {
    if (arg === window.ERROR.UNKNOWN) {
      redAlert("Unable to contact the server...");
    }
    switch (arg.error) {
      case window.ERROR.OK:
        getStudents("stdTable", () => {});
        greenAlert("Student(s) updated !");
        break;
      case window.ERROR.NOTLOGEDIN:
        redAlert("Not logged in !");
        break;
      case window.ERROR.UNKNOWN:
        redAlert("Unkown error...");
        break;
      default:
        redAlert("Ill formed request...");
    }
  });
  ipcRenderer.send("editStudent", obj);
}

function resetTime(id) {
  ipcRenderer.once("resetTime", (event, arg) => {
    if (arg === window.ERROR.UNKNOWN) {
      redAlert("Unable to contact the server...");
    }
    switch (arg.error) {
      case window.ERROR.OK:
        getStudents("stdTable", () => {});
        greenAlert("Student(s) updated !");
        break;
      case window.ERROR.NOTLOGEDIN:
        redAlert("Not logged in !");
        break;
      case window.ERROR.UNKNOWN:
        redAlert("Unkown error...");
        break;
      default:
        redAlert("Ill formed request...");
    }
  });
  ipcRenderer.send("resetTime", id);
}

function modTime(id, ntime) {
  ipcRenderer.once("modTime", (event, arg) => {
    if (arg === window.ERROR.UNKNOWN) {
      redAlert("Unable to contact the server...");
    }
    switch (arg.error) {
      case window.ERROR.OK:
        getStudents("stdTable", () => {});
        greenAlert("Student(s) updated !");
        break;
      case window.ERROR.NOTLOGEDIN:
        redAlert("Not logged in !");
        break;
      case window.ERROR.UNKNOWN:
        redAlert("Unkown error...");
        break;
      default:
        redAlert("Ill formed request...");
    }
  });
  ipcRenderer.send("modTime", {
    id: id,
    time: ntime
  });
}

function setTime(id, ntime) {
  ipcRenderer.once("setTime", (event, arg) => {
    if (arg === window.ERROR.UNKNOWN) {
      redAlert("Unable to contact the server...");
    }
    switch (arg.error) {
      case window.ERROR.OK:
        getStudents("stdTable", () => {});
        greenAlert("Student(s) updated !");
        break;
      case window.ERROR.NOTLOGEDIN:
        redAlert("Not logged in !");
        break;
      case window.ERROR.UNKNOWN:
        redAlert("Unkown error...");
        break;
      default:
        redAlert("Ill formed request...");
    }
  });
  ipcRenderer.send("setTime", {
    id: id,
    time: ntime
  });
}

function getLogs(id, cb) {
  ipcRenderer.once("logs", (event, arg) => {
    if (arg === window.ERROR.UNKNOWN) {
      redAlert("Unable to contact the server...");
    }
    switch (arg.error) {
      case window.ERROR.OK:
        if (arg.data.logs == undefined)
          cb(null);
        else
          cb(arg);
        break;
      case window.ERROR.NOTLOGEDIN:
        redAlert("Not logged in !");
        break;
      case window.ERROR.UNKNOWN:
        redAlert("Unkown error...");
        break;
      case window.ERROR.SQLITE:
        redAlert("Database error...");
        break;
      default:
        redAlert("Ill formed request...");
    }
  });
  ipcRenderer.send("logs", {
    id: id
  });
}

function setAbsent(id, comments) {
  ipcRenderer.once("absent", (event, arg) => {
    if (arg === window.ERROR.UNKNOWN) {
      redAlert("Unable to contact the server...");
    }
    switch (arg.error) {
      case window.ERROR.OK:
        greenAlert("Student set absent !");
        break;
      case window.ERROR.NOTLOGEDIN:
        redAlert("Not logged in !");
        break;
      case window.ERROR.UNKNOWN:
        redAlert("Unkown error...");
        break;
      case window.ERROR.SQLITE:
        redAlert("Database error...");
        break;
      default:
        redAlert("Ill formed request...");
    }
  });
  ipcRenderer.send("absent", {
    id: id,
    comments: comments
  });
}

function tag(id, comments) {
  ipcRenderer.once("tag", (event, arg) => {
    if (arg === window.ERROR.UNKNOWN) {
      redAlert("Unable to contact the server...");
    }
    switch (arg.error) {
      case window.ERROR.OK:
        greenAlert("Tagged successfully !");
        break;
      case window.ERROR.NOTLOGEDIN:
        redAlert("Not logged in !");
        break;
      case window.ERROR.UNKNOWN:
        redAlert("Unkown error...");
        break;
      case window.ERROR.SQLITE:
        redAlert("Database error...");
        break;
      default:
        redAlert("Ill formed request...");
    }
  });
  ipcRenderer.send("tag", {
    id: id,
    comments
  });
}

function setFixed(id, comments) {
  ipcRenderer.once("fixed", (event, arg) => {
    if (arg === window.ERROR.UNKNOWN) {
      redAlert("Unable to contact the server...");
    }
    switch (arg.error) {
      case window.ERROR.OK:
        greenAlert("Student set fixed !");
        break;
      case window.ERROR.NOTLOGEDIN:
        redAlert("Not logged in !");
        break;
      case window.ERROR.UNKNOWN:
        redAlert("Unkown error...");
        break;
      case window.ERROR.SQLITE:
        redAlert("Database error...");
        break;
      default:
        redAlert("Ill formed request...");
    }
  });
  ipcRenderer.send("fixed", {
    id: id,
    comments: comments
  });
}

function onUpdate(event, arg) {
  if (require('electron').remote.getGlobal('currentPage') == window.PAGES.PROFS && arg != undefined && arg.id != undefined) //FIXME
  {
    var formatData = {
      id: arg.id,
      lname: arg.user.lname,
      fname: arg.user.fname,
      username: arg.user.username,
      timeDiffToday: arg.timeDiffToday,
      timeDiff: arg.timeDiff,
      status: arg.status,
      lastTagTime: arg.lastTagTime
    };
    $("#stdTable").bootstrapTable('updateByUniqueId', {
      id: arg.id,
      row: arg
    });
  }

}

function getNotifications(tableId, cb) {
  ipcRenderer.send("notification", null);
  ipcRenderer.once("notification", (event, arg) => {
    if (arg === window.ERROR.UNKNOWN) {
      redAlert("Unable to contact the server...");
    }
    switch (arg.error) {
      case window.ERROR.OK:
        $('#' + tableId).bootstrapTable('load', arg.data);
        cb();
        break;
      case window.ERROR.NOTLOGEDIN:
        redAlert("Not logged in !");
        break;
      case window.ERROR.UNKNOWN:
        redAlert("Unkown error...");
        break;
      default:
        redAlert("Ill formed request...");
    }
  });
}

function toggleNotification(id) {
  ipcRenderer.send("notificationToggle", id);
}

function onNotificationUpdate(event, arg) {
  if (require('electron').remote.getGlobal('currentPage') == window.PAGES.NOTIFICATIONS && arg != undefined && arg.id != undefined) {
    $("#notifTable").bootstrapTable('updateByUniqueId', {
      id: arg.id,
      row: arg
    });
  }
}

function onNotificationInsert(event, arg) {
  if (require('electron').remote.getGlobal('currentPage') == window.PAGES.NOTIFICATIONS && arg != undefined) {
    var tmp = [];
    tmp.push(arg);
    $("#notifTable").bootstrapTable('prepend', tmp);
  }
}
function delHolidays(id, calId) {
  ipcRenderer.send("delHolidays", id);
  ipcRenderer.once("delHolidays", (event, arg) => {
    if (arg === window.ERROR.UNKNOWN) {
      redAlert("Unable to contact the server...");
    }
    switch (arg.error) {
      case window.ERROR.OK:
        $('#' + calId).fullCalendar('removeEvents', id);
        greenAlert("Event deleted successfully.");
        break;
      case window.ERROR.NOTLOGEDIN:
        redAlert("Not logged in !");
        break;
      case window.ERROR.UNKNOWN:
        redAlert("Unkown error...");
        break;
      default:
        redAlert("Ill formed request...");
    }
  });
}
function getHolidays(calendarId) {
  ipcRenderer.send("getHolidays", null);
  ipcRenderer.once("getHolidays", (event, arg) => {
    if (arg === window.ERROR.UNKNOWN) {
      redAlert("Unable to contact the server...");
    }
    switch (arg.error) {
      case window.ERROR.OK:
        var data = [];
        for (var i = 0; i < arg.data.length; i++) {
          data.push({
            allDay: true,
            id: arg.data[i].id,
            title: arg.data[i].desc,
            start: arg.data[i].date1,
            end: arg.data[i].date2,
          });
        }
        $('#' + calendarId).fullCalendar({
          header: {
            left: 'prev,next today',
            center: 'title',
            right: 'month'
          },
          navLinks: false, // can click day/week names to navigate views
          editable: false,
          defaultView: 'month',
          weekNumbers: true,
          eventLimit: true, // allow "more" link when too many events
          events: data,
          timeFormat: 'H:mm',
          firstDay: 1,
          weekNumbersWithinDays: true,
          eventClick: function(calEvent, jsEvent, view) {
            document.getElementById("confirmDeleteEvent").onclick = function() { delHolidays(calEvent.id,calendarId); };
            $("#delEventModal").modal("show");
          }
        });
        break;
      case window.ERROR.NOTLOGEDIN:
        redAlert("Not logged in !");
        break;
      case window.ERROR.UNKNOWN:
        redAlert("Unkown error...");
        break;
      default:
        redAlert("Ill formed request...");
    }

  });
}

function addHolidays(calendarId, title, date1, date2) {
  ipcRenderer.send("addHolidays", {
    title: title,
    date1: date1,
    date2: date2
  });
  ipcRenderer.once("addHolidays", (event, arg) => {
    if (arg === window.ERROR.UNKNOWN) {
      redAlert("Unable to contact the server...");
    }
    switch (arg.error) {
      case window.ERROR.OK:
        $('#' + calendarId).fullCalendar('renderEvent', {
          allDay: true,
          id: arg.data.id,
          title: arg.data.desc,
          start: arg.data.date1,
          end: arg.data.date2
        }, true);
        greenAlert("Event created !");
        break;
      case window.ERROR.NOTLOGEDIN:
        redAlert("Not logged in !");
        break;
      case window.ERROR.UNKNOWN:
        redAlert("Unkown error...");
        break;
      default:
        redAlert("Ill formed request...");
    }
  });
}
function getProf(tableId, cb) {
  ipcRenderer.send("getprof");
  ipcRenderer.once("getprof", (event, arg) => {
    if (arg === window.ERROR.UNKNOWN) {
      redAlert("Unable to contact the server...");
    }
    switch (arg.error) {
      case window.ERROR.OK:
        var data = [];
        for (var i = 0; i < arg.data.length; i++) {
          console.log(arg.data[i]);
          data.push({
            id: arg.data[i].id,
            lname: arg.data[i].lname,
            fname: arg.data[i].fname,
            username: arg.data[i].username,
            class: arg.data[i].class.name,
            dob: arg.data[i].dob,
            email: arg.data[i].email,
            tag: arg.data[i].tag
          });
        }
        $('#' + tableId).bootstrapTable('load', data);

        cb();
        break;
      case window.ERROR.NOTLOGEDIN:
        redAlert("Not logged in !");
        break;
      case window.ERROR.UNKNOWN:
        redAlert("Unkown error...");
        break;
      default:
        redAlert("Ill formed request...");
    }

  });
}
function createProf(username, fname, lname,tag,tclass,dob,email,cb) {
  ipcRenderer.send("addprof", {
    username: username,
    fname: fname,
    lname: lname,
    tag: tag,
    class: tclass,
    dob: dob,
    email: email
  });
  ipcRenderer.once("addprof", (event, arg) => {
    if (arg === window.ERROR.UNKNOWN) {
      redAlert("Unable to contact the server...");
    }
    switch (arg.error) {
      case window.ERROR.OK:
        greenAlert("Teacher created !");
        cb();
        break;
      case window.ERROR.NOTLOGEDIN:
        redAlert("Not logged in !");
        break;
      case window.ERROR.UNKNOWN:
        redAlert("Unkown error...");
        break;
      default:
        redAlert("Ill formed request...");
    }
  });
}
function delProf(id,cb) {
  ipcRenderer.send("delprof", id);
  ipcRenderer.once("delprof", (event, arg) => {
    if (arg === window.ERROR.UNKNOWN) {
      redAlert("Unable to contact the server...");
    }
    switch (arg.error) {
      case window.ERROR.OK:
        greenAlert("Teacher deleted !");
        cb();
        break;
      case window.ERROR.NOTLOGEDIN:
        redAlert("Not logged in !");
        break;
      case window.ERROR.UNKNOWN:
        redAlert("Unkown error...");
        break;
      default:
        redAlert("Ill formed request...");
    }
  });
}
function editProf(data,cb) {
  ipcRenderer.send("editprof", data);
  ipcRenderer.once("editprof", (event, arg) => {
    if (arg === window.ERROR.UNKNOWN) {
      redAlert("Unable to contact the server...");
    }
    switch (arg.error) {
      case window.ERROR.OK:
        greenAlert("Teacher updated !");
        cb();
        break;
      case window.ERROR.NOTLOGEDIN:
        redAlert("Not logged in !");
        break;
      case window.ERROR.UNKNOWN:
        redAlert("Unkown error...");
        break;
      default:
        redAlert("Ill formed request...");
    }
  });
}
ipcRenderer.on("update", onUpdate);
ipcRenderer.on("toggleNotification", onNotificationUpdate);
ipcRenderer.on("updateNotification", onNotificationInsert);
