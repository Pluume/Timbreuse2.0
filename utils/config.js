/**
 * Handle the app config.
 *
 * @module config
 * @class config
 */
const fs = require("fs");
const path = require('path');
const jsonfile = require("jsonfile");
const log = require("./log.js");
var filename = path.join(__dirname, "..", "config.json");
var TYPE = {SERVER: {int: 0, string: "server"}, SLAVE: {int: 1, string: "slave"}, CLIENT: {int: 2, string: "client"}};

module.exports = {
  /**
   * Read the config
   * @method read
   **/
    read: () => {
        try {
            var data = jsonfile.readFileSync(filename);
            global.config = data;
        } catch (err) {
            log.error("Can't read from the file, aborting...\n Filename : " + filename);
            return;
        }
    },
    /**
     * Write the new config to disk
     * @method write
     * @param {Object} ndata the new JSON config.
     **/
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
    /**
     * Get the program type at startup. Whenether start the program as a client, slave or server and set it in the TYPE global variable.
     * @method getType
     **/
    getType: () => {
      var helpstring = "\nTo start as a server : --server\nTo start as a slave : --slave\nTo start in debug mode : --debug\nTo start as a client : no arguments.";

      if(process.argv.indexOf("-h")>-1 || process.argv.indexOf("--h")>-1)
      {
        console.log(helpstring);
        process.exit(0);
      }
      if(process.argv.indexOf("--debug")>-1)
      {
        global.DEBUG = true;
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
    },
    /**
     * Get the config for the day specified as parameter
     * @method loadDay
     * @param the number of the day in the week from 0 to 6 (0=sunday)
     **/
    loadDay: (d) => {
      return global.config.workDay[d];
    }

};
