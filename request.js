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
function toArray(singleItem) {
    if (isArray(singleItem)) {
        return singleItem;
    }
    var somearray = [];
    somearray.push(singleItem);
    return somearray;
}
ERROR = { //Define errors
    OK: 0,
    UNKNOWN: 1,
    WRONGTAG: 2,
    SQLITE: 3,
    WRONGCREDS: 4,
    NOTLOGEDIN: 5,
    USEREXISTS: 6,
    TAGEXISTS: 7
};
REQUEST ={ //Define requests
    EXIT: -1,
    OK: 0,
    TAG: 1,
    AUTH: 2,
    MASTER: 3,
    PROPAGATE_TAG: 4,
    GETSTUDENT: 5,
    GETCLASS: 6,
    ADDSTUDENT: 7,
    DELSTUDENT: 8,
    EDITSTUDENT: 9,
    SETTIME: 10,
    MODTIME: 11,
    RESETTIME: 12,
    LOGS: 13,
    SETABSENT: 14,
    SETFIXED: 15,
    UPDATESTD: 16,
    GETNOTIFICATIONS: 17,
    TOGGLENOTIFICATION: 18,
    UPDATENOTIF: 19,
    GETHOLIDAYS: 20,
    ADDHOLIDAYS: 21,
    DELHOLIDAYS: 22,
    CREATEPROF: 23,
    DELPROF: 24,
    EDITPROF: 25,
    GETPROF: 26,
    CHANGEPASS: 27,
    GETCLASSLIST: 28,
    CHANGECLASS: 29,
    CREATELR: 30,
    GETLR: 31,
    TOGGLELR: 32,
    DELETELR: 33
};
PAGES ={ //Define pages
    LOGIN: 0,
    PROFS: 1,
    SLAVE: 2,
    NOTIFICATIONS: 3,
    HOLIDAYS: 4,
    ADMIN: 5,
    CLASS: 6,
    STUDENT: 7,
    LEAVEREQ_STUDENT: 8,
    LEAVEREQ_PROF: 9
};
SCOPE ={ //Define scopes
    UNIQUE: -1,
    ALL: "*"
};
global.ERROR = ERROR;
global.REQUEST = REQUEST;
global.PAGES = PAGES;
global.SCOPE = SCOPE;
module.exports = {
    toArray,
    ERROR: ERROR,
    REQUEST: REQUEST,
    PAGES: PAGES,
    SCOPE: SCOPE
};
