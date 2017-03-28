function setPage(page) {
  const {
      ipcRenderer
  } = require('electron')
    ipcRenderer.send("pages", page);
}
