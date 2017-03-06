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
  getTimeDelta: (date1,date2) => {
    return (Math.abs(date1 - date2)/1000);
  }
};
