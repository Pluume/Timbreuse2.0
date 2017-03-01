net = require('net');
const method = require("./server_methods");
var clients = [];

function removeClient(conn) {
    clients.splice(clients.indexOf(conn), 1);
}

function addClient(conn) {
    clients.push(conn);
}
module.exports = {
  start: () => {
    net.createServer(function(socket) {
      var connection = {socket: socket, userid: -1};
      addClient(connection);
        socket.on('error', function() {
            removeClient(connection);
        });
        socket.on('timeout', function() {
            removeClient(connection);
            socket.end();
        });
        socket.on('data', function(data) {
          method.sortRequest(connection,data.toString("utf8"));
        });
        socket.on('end', function() {
            removeClient(connection);
        });
        socket.on('close', function(hadError) {
            removeClient(connection);
        });
    }).listen(703).on('listening', function() {
      console.log("The server up on the port 703");
    });
  }
};
