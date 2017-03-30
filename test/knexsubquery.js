const knex = require('knex')({
    client: 'sqlite3',
    useNullAsDefault: true
});
var list = ["1","5","8","9"];
console.log(knex("users").where({id:knex("students").where("id","in",list).select("userid")}).del().toString());
