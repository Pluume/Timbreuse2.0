/**
 * Declare the Timbreuse's server and handle the client connection management. Redirect any request to the module server_methods
 *
 * @module server
 * @class server
 */
const log = require("./utils/log.js");
net = require('net');
const method = require("./server_methods");
var clients = [];
/**
 * Remove a client from the client list
 * @method removeClient
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 **/
function removeClient(conn) {
    clients.splice(clients.indexOf(conn), 1);
}
/**
 * Add a client to the client list
 * @method addClient
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 **/
function addClient(conn) {
    clients.push(conn);
}
module.exports = {
  /**
   * Start the server routine and link all the event listener of the server.
   * @method start
   **/
  start: () => {
    global.server = net.createServer(function(socket) {
      var connection = {socket: socket, userid: -1};
      connection.currentBuf = "";
      addClient(connection);
      if(global.DEBUG)
      log.info(socket.address().address + " just connected");
        socket.on('error', function() {
            removeClient(connection);
        });
        socket.on('timeout', function() {
            removeClient(connection);
            socket.end();
        });
        socket.on('data', function(data) {
          method.compileRequest(connection,data.toString("utf8"));
        });
        socket.on('end', function() {
            removeClient(connection);
        });
        socket.on('close', function(hadError) {
            removeClient(connection);
            if(global.DEBUG)
            log.info(socket.address().address + " just disconnected");
        });
    }).listen(703).on('listening', function() {
      log.info("The server up on the port 703");
    });
  },
  /**
   * Stop the server.
   * @method stop
   **/
  stop: () => {
    //TODO
  }
};
