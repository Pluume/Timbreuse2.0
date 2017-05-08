const moment = require("moment");
/**
 * Handle mathematics functions needed by the server.
 *
 * @module math
 * @class math
 */
module.exports = {
  /**
   * Compute the delta in seconds between two given time
   * @method getTimeDelta
   * @param {Date} date1 the start date.
   * @param {Date} date2 the end date.
   * @return {Integer} the difference in seconds between the date1 and the date2
   **/
  getTimeDelta: (date1, date2) => {
    return (Math.abs(date1 - date2) / 1000);
  },
  secondsToDate: (sec) => {
    return moment().startOf("day").add(sec, "seconds").format().toString()
  },
  /**
   * Convert seconds to H:M:S format
   * @method secondsToHms
   **/
  secondsToHms: function(nb) {
    if (nb == null)
      return "+ 00:00:00"

    function addZero(nb) {
      if (Math.abs(nb < 10)) {
        return "0" + nb.toString();
      } else {
        return nb.toString();
      }
    }
    var neg;
    (nb < 0) ? neg = true: neg = false;
    nb = Math.abs(Number(nb));
    var h = Math.floor(nb / 3600);
    if (Number.isNaN(h))
      h = 0;
    var m = Math.floor(Math.floor(nb % 3600) / 60);
    if (Number.isNaN(m))
      m = 0;
    var s = Math.floor(nb % 60);
    if (Number.isNaN(s))
      s = 0;
    return ((neg) ? "-" : "+") + " " + addZero(h) + ":" + addZero(m) + ":" + addZero(s);
  }
};
