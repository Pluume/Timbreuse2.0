const moment = require("moment");
console.log("Now + 1d " + moment().add(1,"days").toISOString());
console.log("Now + 6h " + moment().add(6,"hours").toISOString());
console.log("Now + 3h " + moment().add(3,"hours").toISOString());
console.log("Now " + moment().toISOString());
console.log("Now - 3h " + moment().subtract(3,"hours").toISOString());
console.log("Now - 6h " + moment().subtract(6,"hours").toISOString());
console.log("Now - 1d " + moment().subtract(1,"days").toISOString());
