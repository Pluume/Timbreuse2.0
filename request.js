/**
 * Define some global enumeration used in network methods.
 *
 * @module request
 */


function isArray(obj) {
    return toString.call(obj) === "[object Array]";
}
/**
 * Create single-item array from a json object
 * @method toArray
 * @param {String} singleItem the item to turn into an arrays.
 **/
function toArray(singleItem)
{
  if(isArray(singleItem))
  {
    return singleItem;
  }
  var somearray = [];
  somearray.push(singleItem);
  return somearray;
}
module.exports = {
  toArray,
  ERROR: {
    OK: 0,
    UNKNOWN: 1,
    WRONGTAG: 2,
    SQLITE: 3,
    WRONGCREDS: 4,
    NOTLOGEDIN: 5,
    USEREXISTS: 6
},
REQUEST: {
    EXIT: -1,
    PING: 0,
    TAG: 1,
    AUTH: 2,
    MASTER: 3,
    PROPAGATE_TAG: 4,
    GETSTUDENT: 5,
    GETCLASS: 6,
    ADDSTUDENT: 7,
    DELSTUDENT: 8,
    EDITSTUDENT: 9
},
PAGES: {
  LOGIN: 0,
  PROFS: 1
},
SCOPE: {
  UNIQUE: 1,
  ALL: "*"
}
};
