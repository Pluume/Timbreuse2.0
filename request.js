/**
 * Define some global enumeration used in network methods.
 *
 * @module request
 */
module.exports = {
  ERROR: {
    OK: 0,
    UNKNOWN: 1,
    WRONGTAG: 2,
    SQLITE: 3
},
REQUEST: {
    EXIT: -1,
    PING: 0,
    TAG: 1,
    AUTH: 2
}
};
