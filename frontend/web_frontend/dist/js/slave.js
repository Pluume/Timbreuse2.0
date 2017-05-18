function displayTaggedStudent(event, std) { //TODO Handle std = undefined
  var element = document.getElementById('infoPanel');
  if (typeof(element) != 'undefined' && element != null) {
    element.parentNode.removeChild(element);
  }
  var panel = document.createElement("div");
  panel.setAttribute("id", "infoPanel");
  console.log(std);
  if (std.status == window.STATUS.IN) {
    panel.setAttribute("class", "panel panel-green bigText");
  } else {
    panel.setAttribute("class", "panel panel-red bigText");
  }
  var heading = document.createElement("div");
  heading.setAttribute("class", "panel-heading");
  heading.innerHTML = std.user.fname + " " + std.user.lname;
  var body = document.createElement("div");
  body.setAttribute("class", "panel-body ");
  body.innerHTML = "Your daily timer is set to : <b>" + require("../../../utils/math.js").secondsToHms(std.timeDiffToday) + "</b>";
  body.innerHTML += "<br />Your total timer is set to : <b>" + require("../../../utils/math.js").secondsToHms(std.timeDiff) + "</b>";
  body.innerHTML += "<br />You have : <b>" + (std.missedPause < 0 ? 0 : std.missedPause) + "</b> missed pause";
  body.innerHTML += "<br /><span class='glyphicon glyphicon-cutlery black'/>  ";
  if (std.hadLunch)
    body.innerHTML += "<span class='glyphicon glyphicon-ok green'/>";
  else
    body.innerHTML += "<span class='glyphicon glyphicon-remove red'/>";

  var footer = document.createElement("div");
  footer.setAttribute("class", "panel-footer clearfix");
  var statusGroup = document.createElement("div");
  statusGroup.setAttribute("class", "btn-group pull-left");
  if (std.status == window.STATUS.IN) {
    statusGroup.innerHTML = "<b>Arriving</b>";
  } else {
    statusGroup.innerHTML = "<b>Leaving</b>";
  }
  var dissmissGroup = document.createElement("div");
  dissmissGroup.setAttribute("class", "btn-group pull-right");
  var dissmissButton = document.createElement("a");
  dissmissButton.setAttribute("href", "#");
  dissmissButton.setAttribute("class", "btn btn-default btn-sm bigText");
  dissmissButton.setAttribute("onclick", "dissmissInfoPane();");
  dissmissButton.innerHTML = "Close";
  dissmissGroup.appendChild(dissmissButton);
  footer.appendChild(statusGroup);
  footer.appendChild(dissmissGroup);
  panel.appendChild(heading);
  panel.appendChild(body);
  panel.appendChild(footer);
  document.getElementById("infoPane").appendChild(panel);
}

function displayCSV(event, val) {
  var element = document.getElementById('infoPanel');
  if (typeof(element) != 'undefined' && element != null) {
    element.parentNode.removeChild(element);
  }
  var panel = document.createElement("div");
  panel.setAttribute("id", "infoPanel");
  panel.setAttribute("class", "panel panel-green bigText");

  var heading = document.createElement("div");
  heading.setAttribute("class", "panel-heading");
  heading.innerHTML = "CSV";
  var body = document.createElement("div");
  body.setAttribute("class", "panel-body ");
  if (val) {
    body.innerHTML = "The CSV have been copied to the remote mass storage devices successfully";
  } else {
    body.innerHTML = "The CSV are being copied to the mass storage devices";
  }
  var footer = document.createElement("div");
  footer.setAttribute("class", "panel-footer clearfix");
  var statusGroup = document.createElement("div");
  statusGroup.setAttribute("class", "btn-group pull-left");
  if (val) {
    statusGroup.innerHTML = "<b>Copying</b>";
  } else {
    statusGroup.innerHTML = "<b>Done</b>";
  }
  var dissmissGroup = document.createElement("div");
  dissmissGroup.setAttribute("class", "btn-group pull-right");
  var deleteButton = document.createElement("a");
  deleteButton.setAttribute("href", "#");
  deleteButton.setAttribute("class", "btn btn-danger btn-sm bigText");
  deleteButton.setAttribute("onclick", "delCSV();");
  deleteButton.innerHTML = "Delete CSV";
  var dissmissButton = document.createElement("a");
  dissmissButton.setAttribute("href", "#");
  dissmissButton.setAttribute("class", "btn btn-default btn-sm bigText");
  dissmissButton.setAttribute("onclick", "dissmissInfoPane();");
  dissmissButton.innerHTML = "Close";
  dissmissGroup.appendChild(dissmissButton);
  footer.appendChild(statusGroup);
  footer.appendChild(dissmissGroup);
  panel.appendChild(heading);
  panel.appendChild(body);
  panel.appendChild(footer);
  document.getElementById("infoPane").appendChild(panel);
}
function showOnline(event, val) {
  if(!val)
  {
    var element = document.getElementById('infoPanel');
    if (typeof(element) != 'undefined' && element != null) {
      element.parentNode.removeChild(element);
    }
    var panel = document.createElement("div");
    panel.setAttribute("id", "infoPanel");
    panel.setAttribute("class", "panel panel-yellow bigText");

    var heading = document.createElement("div");
    heading.setAttribute("class", "panel-heading");
    heading.innerHTML = "Disconnected from server";
    var body = document.createElement("div");
    body.setAttribute("class", "panel-body ");
    var loading = document.createElement("img");
    var imgPath = require('electron').remote.require("path").join(require('electron').remote.getGlobal('mainPath'),"graphics","unpluged.png");
    loading.setAttribute("src",imgPath);
    body.appendChild(loading);
    var footer = document.createElement("div");
    footer.setAttribute("class", "panel-footer clearfix");
    var statusGroup = document.createElement("div");
    statusGroup.setAttribute("class", "btn-group pull-left");
      statusGroup.innerHTML = "<b>Disconnected from server</b>";
    footer.appendChild(statusGroup);
    panel.appendChild(heading);
    panel.appendChild(body);
    panel.appendChild(footer);
    document.getElementById("infoPane").appendChild(panel);
  } else {
    var element = document.getElementById('infoPanel');
    if (typeof(element) != 'undefined' && element != null) {
      element.parentNode.removeChild(element);
    }
  }

}
ipcRenderer.on("onlineServer", showOnline);
ipcRenderer.on("CSV", displayCSV);
ipcRenderer.on("slaveStd", displayTaggedStudent);
