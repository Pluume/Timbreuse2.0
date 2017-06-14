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

function emptyInput(arrId) //TODO Delete
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

/**
 * Resize the webview to windows height
 * @method resizeIFrame
 */
function resizeIFrame() {
  try {
    document.getElementById("MainIFrame").style.height = (document.body.clientHeight - document.getElementById("MainIFrame").offsetTop) + "px";
  } catch(er)
  {

  }

}
window.onload = function () { resizeIFrame(); }
