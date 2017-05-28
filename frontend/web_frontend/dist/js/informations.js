/**
 * Handle the communication between electron's renderer process and electron's main process
 *
 * @module informations
 * @class informations
 */
const {
  ipcRenderer
} = require('electron');
/**
 * Create a random string
 * @method makeRdmString
 **/
function makeRdmString() //Thanks to http://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
{
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}
/**
 * Print a red notification on screen
 * @method redAlert
 * @param {String} msg The message to display
 **/
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
/**
 * Print a green notification on screen
 * @method greenAlert
 * @param {String} msg The message to display
 **/
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
  }, 5000);
  console.log(msg);
}
/**
 * Get the classes
 * @method getClass
 * @param {Function} cb Callback function
 **/
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
/**
 * Get the students' informations
 * @method getStudents
 * @param {String} tableId The bootstrap table in which to load the informations
 * @param {Function} cb Callback function
 **/
function getStudents(tableId, cb) {
  ipcRenderer.send("students", window.SCOPE.UNIQUE);
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
/**
 * Get all the students
 * @method getStudentsAll
 * @param {Function} cb Callback function
 **/
function getStudentsAll(cb) {
  ipcRenderer.send("students", window.SCOPE.ALL);
  ipcRenderer.once("students", (event, arg) => {
    if (arg === window.ERROR.UNKNOWN) {
      redAlert("Unable to contact the server...");
    }
    switch (arg.error) {
      case window.ERROR.OK:
        cb(arg.students);
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
/**
 * Get a student
 * @method getStudent
 * @param {Integer} id The student id
 * @param {Function} cb Callback function
 **/
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
/**
 * Create a student in the database
 * @method createStudent
 * @param {String} fname The student's first name
 * @param {String} lname The student's last name
 * @param {String} username The student's username
 * @param {String} email The student's email
 * @param {String} tag The student's tag
 * @param {String} tclass The student's class
 * @param {String} dob The student's date of birth
 * @param {String} project The student's current project
 * @param {String} tableid The bootstrap table id in which the informations will be loaded
 **/
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
      case window.ERROR.TAGEXISTS:
        redAlert("User already exists with this tag...");
        break;
      default:
        redAlert("Ill formed request...");
    }
  });
  ipcRenderer.send("createStudent", obj);
}
/**
 * Delete a student
 * @method deleteStudent
 * @param {Integer} id The student id
 * @param {String} tableid The bootstrap table to update
 **/
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
/**
 * Edit a student in the database
 * @method editStudent
 * @param {Interger} id The student's id
 * @param {String} fname The student's first name
 * @param {String} lname The student's last name
 * @param {String} username The student's username
 * @param {String} email The student's email
 * @param {String} tag The student's tag
 * @param {String} tclass The student's class
 * @param {String} dob The student's date of birth
 * @param {String} project The student's current project
 * @param {String} tableid The bootstrap table id in which the informations will be loaded
 **/
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
/**
 * Reset the time and last tag time of student to null
 * @method resetTime
 * @param  {Interger}  id The student's id
 */
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
/**
 * Add/Sub time to a student
 * @method modTime
 * @param  {Interger} id       The student's id
 * @param  {Interger} ntime    The time to add/sub
 * @param  {String} comments A description
 */
function modTime(id, ntime, comments) {
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
    time: ntime,
    comments: comments
  });
}
/**
 * Set the time of a student
 * @method setTime
 * @param  {Interger} id    The student's id
 * @param  {Interger} ntime The new time
 */
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
/**
 * Get the logs of student
 * @method getLogs
 * @param  {Interger}   id The student's id
 * @param  {Function} cb The callback function
 */
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
/**
 * Set an student as absent
 * @method setAbsent
 * @param  {Interger}  id       The student's id
 * @param  {String}  comments A description
 */
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
/**
 * Tag a student
 * @method tag
 * @param  {Interger} id       The student's id
 * @param  {String} comments A description
 */
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
/**
 * Toggle a student is fixed schedule or not
 * @method setFixed
 * @param  {Interger} id       The student's id
 * @param  {String} comments A description
 */
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
/**
 * Handle if the server sends update about the currently monitored students
 * @method onUpdate
 * @param  {Event} event The event object
 * @param  {Object} arg   The object containing the informations
 */
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
/**
 * Get the notifications
 * @method getNotifications
 * @param  {Interger}       tableId The table's id in which to put the informations
 * @param  {Function}       cb      The callback function to call
 */
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
/**
 * Toggle the read status of a notification
 * @method toggleNotification
 * @param  {Interger}           id The notification's id
 */
function toggleNotification(id) {
  ipcRenderer.send("notificationToggle", id);
}
/**
 * Handle the incomming notifications
 * @method onNotificationUpdate
 * @param  {Event}             event The event object
 * @param  {Object}             arg   The notification's informations
 */
function onNotificationUpdate(event, arg) {
  if (require('electron').remote.getGlobal('currentPage') == window.PAGES.NOTIFICATIONS && arg != undefined && arg.id != undefined) {
    $("#notifTable").bootstrapTable('updateByUniqueId', {
      id: arg.id,
      row: arg
    });
  }
}
/**
 * Append the notification at the beginning of the table
 * @method onNotificationInsert
 * @param  {Event}             event The event object
 * @param  {Object}             arg   The notification's informations
 */
function onNotificationInsert(event, arg) {
  if (require('electron').remote.getGlobal('currentPage') == window.PAGES.NOTIFICATIONS && arg != undefined) {
    var tmp = [];
    tmp.push(arg);
    $("#notifTable").bootstrapTable('prepend', tmp);
  }
}
/**
 * Delete an holidays object from the database
 * @method delHolidays
 * @param  {Interger}    id    The holidays id
 * @param  {Interger}    calId The calendar's id to update
 */
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
/**
 * Fetch the holidays from the server
 * @method getHolidays
 * @param  {Interger}    calendarId The calendar's id to update
 */
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
            document.getElementById("confirmDeleteEvent").onclick = function() {
              delHolidays(calEvent.id, calendarId);
            };
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
/**
 * Create a new holidays object in the database
 * @method addHolidays
 * @param  {Interger}    calendarId The calendar's id to update
 * @param  {String}    title      The event title
 * @param  {Date}    date1      The start date
 * @param  {Date}    date2      The end date
 */
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
/**
 * Get the professor object in the database
 * @method getProf
 * @param  {Interger}   tableId The table's id to update
 * @param  {Function} cb      The callback function
 */
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
/**
 * Create a new professor
 * @method createProf
 * @param  {String}   username The prof's username
 * @param  {String}   fname    The prof's first name
 * @param  {String}   lname    The prof's last name
 * @param  {String}   tag      The prof's tag
 * @param  {String}   tclass   The prof's class name
 * @param  {Date}   dob      The prof's date of birth
 * @param  {String}   email    The prof's email
 * @param  {Function} cb       The callback function
 */
function createProf(username, fname, lname, tag, tclass, dob, email, cb) {
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
/**
 * Delete a prof from the database
 * @method delProf
 * @param  {Interger}   id The prof'is
 * @param  {Function} cb The callback function
 */
function delProf(id, cb) {
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

function editProf(data, cb) {
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
/**
 * Change the current user's password
 * @method changePassword
 * @param  {Event}       event The event object
 * @param  {String}       data  The new password
 */
function changePassword(event, data) {
  ipcRenderer.send("changepassword", data);
  ipcRenderer.once("changepassword", (event, arg) => {
    if (arg === window.ERROR.UNKNOWN) {
      redAlert("Unable to contact the server...");
    }
    switch (arg.error) {
      case window.ERROR.OK:
        greenAlert("Password changed !");
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
/**
 * Get a list of all the class
 * @method getClassList
 * @param  {Function}   cb The callback function
 */
function getClassList(cb) {
  ipcRenderer.send("getclasslist", null);
  ipcRenderer.once("getclasslist", (event, arg) => {
    if (arg === window.ERROR.UNKNOWN) {
      redAlert("Unable to contact the server...");
    }
    switch (arg.error) {
      case window.ERROR.OK:
        if (arg.class == null)
          redAlert("There is no class configured");
        else
          cb(arg.class);

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
/**
 * Change the student's class
 * @method changeStudentClass
 * @param  {Interger}           stdid  The student's id
 * @param  {Interger}           profid The new prof's id
 */
function changeStudentClass(stdid, profid) {
  ipcRenderer.send("changestdclass", {
    stdid: stdid,
    profid: profid
  });
  ipcRenderer.once("changestdclass", (event, arg) => {
    if (arg === window.ERROR.UNKNOWN) {
      redAlert("Unable to contact the server...");
    }
    switch (arg.error) {
      case window.ERROR.OK:
        greenAlert("Student's class updated successfully");
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
/**
 * Create a new leave application
 * @method createLeaveRequest
 * @param  {Date}           sDate      The start Date
 * @param  {Date}           eDate      The end Date
 * @param  {Boolean}           missedTest 0 if no tests was missed, 1 otherwise
 * @param  {Interger}           reason     The reason code
 * @param  {String}           reasonDesc A description
 * @param  {Interger}           proof      The proof code
 * @param  {String}           where      Where the application was filled
 * @param  {Function}         cb         [description]
 * @param  {Interger}           id         (Optional) if a professor create a leave request for a student, this parameter is the student's id
 * @return {[type]}                      [description]
 */
function createLeaveRequest(sDate, eDate, missedTest, reason, reasonDesc, proof, where, cb, id) {
  var obj = {
    sDate: sDate,
    eDate: eDate,
    missedTest: missedTest,
    reason: reason,
    reasonDesc: reasonDesc,
    proof: proof,
    where: where
  };
  if (id != undefined)
    obj.id = id;
  ipcRenderer.send("createLR", obj);
  ipcRenderer.once("createLR", (event, arg) => {
    if (arg === window.ERROR.UNKNOWN) {
      redAlert("Unable to contact the server...");
    }
    switch (arg.error) {
      case window.ERROR.OK:
        greenAlert("Leave application created");
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
/**
 * Get the leave application for the connected student
 * @method getLRForStudent
 * @param  {String}        tableId The table's id
 * @param  {Function}      cb      A callback function
 */
function getLRForStudent(tableId, cb) {
  ipcRenderer.send("getLR");
  ipcRenderer.once("getLR", (event, arg) => {
    if (arg === window.ERROR.UNKNOWN) {
      redAlert("Unable to contact the server...");
    }
    switch (arg.error) {
      case window.ERROR.OK:
        var data = [];
        for (var i = 0; i < arg.data.length; i++) {
          data.push({
            id: arg.data[i].id,
            dateFrom: arg.data[i].dateFrom,
            dateTo: arg.data[i].dateTo,
            acpt: arg.data[i].acpt
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
/**
 * Get all the leave application
 * @method getLR
 * @param  {Interger}   tableId The table's id
 * @param  {Function} cb      A callback function
 */
function getLR(tableId, cb) {
  ipcRenderer.send("getLR", window.SCOPE.ALL);
  ipcRenderer.once("getLR", (event, arg) => {
    if (arg === window.ERROR.UNKNOWN) {
      redAlert("Unable to contact the server...");
    }
    switch (arg.error) {
      case window.ERROR.OK:
        var data = [];
        for (var i = 0; i < arg.data.length; i++) {
          data.push({
            id: arg.data[i].id,
            dateFrom: arg.data[i].dateFrom,
            dateTo: arg.data[i].dateTo,
            acpt: arg.data[i].acpt
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
ipcRenderer.on("update", onUpdate);
ipcRenderer.on("toggleNotification", onNotificationUpdate);
ipcRenderer.on("changepassword_index", changePassword);
ipcRenderer.on("updateNotification", onNotificationInsert);
