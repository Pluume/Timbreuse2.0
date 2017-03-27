const {
    ipcRenderer
} = require('electron');
function redAlert(msg)
{
  var message = document.createElement("div");
  message.setAttribute("class", "alert alert-danger");
  message.setAttribute("id", "errorAlert");
  message.innerHTML = msg;
  document.getElementById("loginPanel").replaceChild(message,document.getElementById("errorAlert"));
  console.log(msg);
}
function login(user, pass) {
  console.log(0);
    ipcRenderer.once("login", (event, arg) => {
        if (arg === window.ERROR.UNKNOWN) {
            redAlert("Unable to contact the server...");
            console.log(1);
        }
        if(arg.error!==undefined)
        {
          console.log(2);
          if(arg.error==window.ERROR.OK)
          {
            console.log(3);
            if(arg.rank==undefined)
            {
              console.log(4);
              redAlert("Ill formed request...");
              return;
            }
            console.log(5);
            switch (arg.rank) {
              case window.RANK.PROF:
              ipcRenderer.send("redirect", window.PAGES.PROFS);
                break;
              default:
                redAlert("Ill formed request...");
            }
          } else if(arg.error==window.ERROR.WRONGCREDS)
          {
            console.log(6);
            redAlert("Wrong username/password combinaison");
            return;
          } else if(arg.error==window.ERROR.UNKNOWN){
            console.log(7);
            redAlert("Unkown error...");
            return;
          }
        } else {
          console.log(8
          redAlert("Ill formed request...");
          return;
        }
    });
    ipcRenderer.send("login", {
        user: user,
        pass: pass
    });
}
