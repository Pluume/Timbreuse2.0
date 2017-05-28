/**
 * Some useful function for the frontend process
 *
 * @module frontendUtil
 * @class frontendUtil
 */
/**
 * Log out the current user
 * @method logout
 */
function logout()
{
  ipcRenderer.send("logout");
}
function searchSubmit(event) //TODO Delete
{
  if(event.keyCode == 13)
  {
    this.form.submit();
    return false;
  } else {
    //TODO Call
  }
}

function emptyInput(arrId) //Delete
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
/**
 * Load a new page
 * @method loadPage
 * @param  {Interger} page The page code
 */
function loadPage(page)
{
  document.getElementById("MainIFrame").src = page;
}

function resizeToClient() //TODO Delete
{
  document.getElementById("MainIFrame").style.height = document.body.clientHeight + "px";
}

function resizeIFrame() {//TODO Delete
    document.getElementById("MainIFrame").style.height = (document.body.clientHeight - document.getElementById("MainIFrame").offsetTop) + "px";
}
window.onload = function () { resizeIFrame(); }//TODO Delete
