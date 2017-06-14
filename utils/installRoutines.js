
const app = require('electron').app;
/**
 * Function that handle when application is launched to install
 * @method handleSquirrelEvent
 */
function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }

  const ChildProcess = require('child_process');
  const path = require('path');

  const appFolder = path.resolve(process.execPath, '..');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe')); //Get update.exe service
  const exeName = path.basename(process.execPath);

  const spawn = function(command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, {detached: true}); //Launch update.exe
    } catch (error) {}

    return spawnedProcess;
  };

  const spawnUpdate = function(args) {
    return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      spawnUpdate(['--createShortcut', exeName]); //Installing, updating

      setTimeout(app.quit, 1000); //Quit to let squirell install
      return true;

    case '--squirrel-uninstall':
      spawnUpdate(['--removeShortcut', exeName]); //Uninstalling

      setTimeout(app.quit, 1000);//Quit to let squirell uninstall
      return true;

    case '--squirrel-obsolete': //If app is obsolete, then quit
      app.quit();
      return true;
  }
};
module.exports = {
  handleSquirrelEvent
};
