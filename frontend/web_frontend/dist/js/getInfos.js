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

function getStudents(tableId) {
    ipcRenderer.send("students", "*");
    ipcRenderer.once("students", (event, arg) => {
        if (arg === window.ERROR.UNKNOWN) {
            redAlert("Unable to contact the server...");
        }
        switch (arg.error) {
            case window.ERROR.OK:
            console.log(1);
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
                console.log(JSON.stringify(data));
                $('#' + tableId).bootstrapTable('load', data);
                break;
            case window.ERROR.NOTLOGEDIN:
            console.log(2);
                redAlert("Not logged in !");
                break;
            case window.ERROR.UNKNOWN:
            console.log(3);
                redAlert("Unkown error...");
                break;
            default:
                redAlert("Ill formed request...");
        }

    });
}
