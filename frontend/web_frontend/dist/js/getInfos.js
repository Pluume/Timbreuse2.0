const {
    ipcRenderer
} = require('electron');

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
    document.getElementById("pageContainer").insertBefore(message, document.getElementById("pageContainer").firstChild);
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
        cb(null);
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
                        fname: arg.students[i].user.lname,
                        timeDiffToday: arg.students[i].timeDiffToday,
                        timeDiff: arg.students[i].timeDiff,
                        status: arg.students[i].status,
                        lastTagTime: arg.students[i].timeDiff
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
                getStudent(tableid, () => {});
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
    ipcRenderer.send("createStudent", obj);
}
