const fs = require("fs");
const path = require('path');
const jsonfile = require("jsonfile");
const log = require("./log.js");
var filename = path.join(__dirname, "..", "config.json");
var TYPE = {SERVER: {int: 0, string: "server"}, SLAVE: {int: 1, string: "slave"}, CLIENT: {int: 2, string: "client"}};
module.exports = {
    read: () => {
        try {
            var data = jsonfile.readFileSync(filename);
            global.config = data;
        } catch (err) {
            log.error("Can't read from the file, aborting...\n Filename : " + filename);
            return;
        }
    },
    write: (ndata) => {
        try {
            jsonfile.writeFileSync(filename, ndata);
            global.config = ndata;
        } catch (err) {
            log.error("Can't write the file, aborting...\n Filename : " + filename);
            return;
        }
    },
    TYPE,
    getType: () => {
      var helpstring = "\nTo start as a server : --server\nTo start as a slave : --slave\nTo start as a client : no arguments.";
      if(process.argv.length > 3)
      {
        log.error("To many argument : \n" + helpstring);
        console.log(process.argv.length);
        process.exit(0);
      }
      if(process.argv.indexOf("-h")>-1 || process.argv.indexOf("--h")>-1)
      {
        console.log(helpstring);
        process.exit(0);
      }
      if(process.argv.indexOf("--server")>-1)
      {
        global.TYPE = TYPE.SERVER;
        return;
      }
      if(process.argv.indexOf("--slave")>-1)
      {
        global.TYPE = TYPE.SLAVE;
        return;
      }
      global.TYPE = TYPE.CLIENT;
    }

};
