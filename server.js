/**
 * Declare the Timbreuse's server and handle the client connection management. Redirect any request to the module server_methods
 *
 * @module server
 * @class server
 */
const log = require("./utils/log.js");
net = require('net');
const method = require("./server_methods");
/**
 * Remove a client from the client list
 * @method removeClient
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 **/
function removeClient(conn) {
    global.clients.splice(clients.indexOf(conn), 1);
}
/**
 * Add a client to the client list
 * @method addClient
 * @param {Object} conn a JSON object containing a socket connection and an userid variable.
 **/
function addClient(conn) {
    global.clients.push(conn);
}
module.exports = {
  /**
   * Start the server routine and link all the event listener of the server.
   * @method start
   **/
  start: () => {
    global.clients = [];
    method.initialize();
    global.server = net.createServer(function(socket) {
      var connection = {socket: socket, userid: -1};
      connection.currentBuf = "";
      addClient(connection); //Add client to client list
      socket.setKeepAlive(true,60000);
      if(global.DEBUG)
      log.info(socket.remoteAddress + " just connected");
        socket.on('error', function() { //On error remove the connection from the connection list
            removeClient(connection);
        });
        socket.on('timeout', function() {//On timeout remove the connection from the connection list and end the connection
          log.warning(socket.remoteAddress +" timed out")
            removeClient(connection);
            socket.end();
        });
        socket.on('data', function(data) {//On data, compile the request
          method.compileRequest(connection,data.toString("utf8"));
        });
        socket.on('end', function() {//On end remove the connection from the connection list
            removeClient(connection);
        });
        socket.on('close', function(hadError) {//On close remove the connection from the connection list
            removeClient(connection);
            if(global.DEBUG)
            log.info(socket.remoteAddress + " just disconnected");
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
