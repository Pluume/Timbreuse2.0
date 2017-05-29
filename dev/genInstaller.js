const path = require("path");
const electronInstaller = require("electron-winstaller");
var packager = require('electron-packager')
packager({
  dir: path.join(__dirname, ".."),
  overwrite: true,
  out: path.join(__dirname, "..","dist"),
  asar: true,
  win32metadata: {
    ProductName: "Timbreuse"
  },
  name: "Timbreuse"
}, function done_callback(err, appPaths) {
  if (err) {
    console.error("Error : " + err);
    return;
  }
  console.log("App written to disk !\nPackaging to installer..");
  resultPromise = electronInstaller.createWindowsInstaller({
    appDirectory: appPaths[0],
    outputDirectory: path.join(__dirname, "..", "dist"),
    authors: 'Francis Le Roy',
    exe: 'timbreuse.exe',
    loadingGif: path.join(__dirname, "..", "graphics", "loading.gif"),
    noMsi: true,
    iconUrl: path.join(__dirname, "..", "graphics", "ico.png")
  });

  resultPromise.then(() => console.log("Installer generated"), (e) => console.log(`Error : ${e.message}`));

})
