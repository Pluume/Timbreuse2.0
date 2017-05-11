function logout()
{
  ipcRenderer.send("logout");
  document.location.href="login.html";
}
function getNotificationsNumber()
{
  //TODO
  return 0;
}
function searchStudent(searchString)
{
  return searchString;
}
function searchSubmit(event)
{
  if(event.keyCode == 13)
  {
    this.form.submit();
    return false;
  } else {
    //TODO Call
  }
}
function validate(arrId)
{
  var res = true;
  for(var i = 0; i< arrId.length; i++)
  {
    var data = document.getElementById(arrId[i]).value;
    if(data == undefined || data == null || data == "")
    {
      try {
        document.getElementById("fg" + arrId[i]).setAttribute("class", "form-group has-error");
        document.getElementById(arrId[i]).setAttribute("placeholder", "This field is required");
      } catch(err)
      {
        //Do nothing
      }
      res = false;
    } else {
      try {
        document.getElementById("fg" + arrId[i]).setAttribute("class", "form-group has-success");
      } catch(err)
      {
        //Do nothing
      }
    }
  }
  return res;
}
function emptyInput(arrId)
{
  for(var i = 0; i< arrId.length; i++)
  {
      try {
        document.getElementById("fg" + arrId[i]).setAttribute("class", "form-group");
        document.getElementById(arrId[i]).setAttribute("placeholder", "");
        document.getElementById(arrId[i]).value = "";
      } catch(err)
      {
        //Do nothing
      }
  }
}
function loadPage(page)
{
  document.getElementById("MainIFrame").src = page;
}
function resizeToClient()
{
  document.getElementById("MainIFrame").style.height = document.body.clientHeight + "px";
}

function resizeIFrame() {
    document.getElementById("MainIFrame").style.height = (document.body.clientHeight - document.getElementById("MainIFrame").offsetTop) + "px";
}
window.onload = function () { resizeIFrame(); }
