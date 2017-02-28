
module.exports = {
  getTimeDelta: (date1,date2) => {
    return (Math.abs(date1 - date2)/1000);
  }
};
