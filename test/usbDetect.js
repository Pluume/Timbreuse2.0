console.log(process.platform);
const drivelist = require('drivelist');
const fs = require("fs");
if (process.platform == "linux") {
  fs.watch('/media', {
    encoding: 'string'
  }, (eventType, filename) => {
    if (filename)
      console.log(filename);
    console.log(eventType);
    drivelist.list((error, drives) => {
      if (error) {
        throw error;
      }

      console.log(drives);
    });
  });
}
