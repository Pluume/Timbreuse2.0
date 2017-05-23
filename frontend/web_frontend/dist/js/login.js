const {
  ipcRenderer
} = require('electron');

function redAlert(msg) {
  var message = document.createElement("div");
  message.setAttribute("class", "alert alert-danger");
  message.setAttribute("id", "errorAlert");
  message.innerHTML = msg;
  document.getElementById("loginPanel").replaceChild(message, document.getElementById("errorAlert"));
  console.log(msg);
}

function login(user, pass) {
  ipcRenderer.once("login", (event, arg) => {
    if (arg === window.ERROR.UNKNOWN) {
      redAlert("Unable to contact the server...");
      return;
    }
    switch (arg.error) {
      case window.ERROR.OK:
        switch (arg.rank) {
          case window.RANK.PROF:
            ipcRenderer.send("redirect", window.PAGES.PROFS);
            break;
          case window.RANK.ADMIN:
            ipcRenderer.send("redirect", window.PAGES.ADMIN);
            break;
          case window.RANK.STUDENT:
            ipcRenderer.send("redirect", window.PAGES.STUDENT);
            break;
          default:
            redAlert("Ill formed request...");
        }
        break;
      case window.ERROR.WRONGCREDS:
        redAlert("Wrong username/password combinaison");
        break;
      case window.ERROR.UNKNOWN:
        redAlert("Unkown error...");
        break;
      default:
        redAlert("Ill formed request...");
    }
  });
  ipcRenderer.send("login", {
    user: user,
    pass: pass
  });
}
