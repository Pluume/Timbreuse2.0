/**
 * Tiny module to know which page is currently displayed
 *
 * @module pages
 * @class pages
 */
/**
 * Set the current page
 * @method setPage
 * @param  {Interger} page The page's code
 */
function setPage(page) {
  const {
      ipcRenderer
  } = require('electron')
    ipcRenderer.send("pages", page);
}
