const {ipcRenderer} = require('electron') ;
function getStudents(tableId)
{
  ipcRenderer.send("students","*");
  ipcRenderer.once("students",(event,data) =>
{
  if(data.err)
  {
    var errEl = document.createElement("div");
    errEl.innerHTML = data.err;
    errEl.setAttribute("class","alert alert-danger alert-dismissable");
    var close = document.createElement("button");
    close.innerHTML = "×";
    close.setAttribute("type", "button");
    close.setAttribute("class", "close");
    close.setAttribute("data-dismiss", "alert");
    close.setAttribute("aria-hidden", "true");
    errEl.appendChild(close);
    var link = document.appendChild("a");
    link.setAttribute("href", "#");
    link.setAttribute("class", "alert-link");
    link.innerHTML = "Details >>";
    errEl.appendChild(link);
    document.body.appendChild(errEl);
    return;
  }
  $('#' + tableId).bootstrapTable('load', data.data);
});
}
