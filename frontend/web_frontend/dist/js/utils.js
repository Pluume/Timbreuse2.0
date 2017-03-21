function logout()
{
  //TODO
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
function loadPage(page)
{
  document.getElementById("MainIFrame").src = page;
}
function resizeToClient()
{
  document.getElementById("MainIFrame").style.height = document.body.clientHeight + "px";
}
