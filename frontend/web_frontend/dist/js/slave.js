function displayTaggedStudent(event, std) {
    var element = document.getElementById('taggedStudent');
    if (typeof(element) != 'undefined' && element != null) {
        element.parentNode.removeChild(element);
    }
    var panel = document.createElement("div");
    panel.setAttribute("id","taggedStudent");
    console.log(std);
    if (std.status == window.STATUS.IN) {
        panel.setAttribute("class", "panel panel-green");
    } else {
        panel.setAttribute("class", "panel panel-red");
    }
    var heading = document.createElement("div");
    heading.setAttribute("class","panel-heading");
    heading.innerHTML = std.user.fname + " " + std.user.lname;
    var body = document.createElement("div");
    body.setAttribute("class","panel-body");
    body.innerHTML = "Your daily timer is set to : " + std.timeDiffToday;
    body.innerHTML += "\nYour total timer is set to : " + std.timeDiff;
    var footer = document.createElement("div");
    footer.setAttribute("class","panel-footer");
    if (std.status == window.STATUS.IN) {
      footer.innerHTML = "Arriving";
    } else {
      footer.innerHTML = "Leaving";
    }
    panel.appendChild(heading);
    panel.appendChild(body);
    panel.appendChild(footer);
    document.getElementById("infoPane").appendChild(panel);
}
ipcRenderer.on("slaveStd", displayTaggedStudent);
