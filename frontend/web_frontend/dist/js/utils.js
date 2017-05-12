function logout()
{
  ipcRenderer.send("logout");
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
