const knex = require('knex')({
    client: 'sqlite3',
    useNullAsDefault: true
});
var list = ["1","5","8","9"];
console.log(knex("users").where({
    id: knex("students").where({
        id: 1
    }).select("userid").toString()
}).update({
    username: "username",
    password: (0) ? crypto.SHA256("bla").toString(crypto.enc.utf8) : knex("users").where({
        id: knex("students").where({
            id: 1
        }).select("userid").toString()
    }).select("password").toString(),
    fname: "fname",
    lname: "lname",
    dob: "dob",
    email: "email",
    tag: "tag",

}).toString());
