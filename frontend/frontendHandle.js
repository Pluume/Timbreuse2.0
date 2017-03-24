const {ipcMain} = require('electron');
var knex = require('knex')({
        client: 'sqlite3',
        useNullAsDefault: true
    });
function getStudents(event,arg)
{
  if(arg === "*")
  {
    global.db.all(knex("students").select().toString(),(err, rows) =>
  {
    var data = {};
    data.err = err;
    data.data = rows;
    console.log(rows);
    event.sender.send("students",data);
  });
  }
}
ipcMain.on("students",getStudents);
