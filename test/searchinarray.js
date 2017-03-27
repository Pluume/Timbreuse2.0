const lodash = require("lodash");
var arr = [
        {
            city: 'Berlin',
            title: 'This is Amsterdam!'
        },
        {
            city: 'Berlin',
            title: 'This is Berlin!'
        },
        {
            city: 'Budapest',
            title: 'This is Budapest!'
        }
];
var picked = lodash.filter(arr, { 'city': 'Berlin' } );
console.log(picked);
