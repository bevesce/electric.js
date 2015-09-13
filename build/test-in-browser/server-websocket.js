/// <reference path="../d/http.d.ts" />
/// <reference path="../d/fs.d.ts" />
/// <reference path="../d/socket.io.d.ts" />
var http = require('http');
var socketIO = require('socket.io');
var server = http.createServer(handler);
var io = socketIO(server);
server.listen(8002);
function handler(req, res) {
    res.writeHead(200);
    res.end();
}
io.on('connection', function (socket) {
    console.log('connected');
    socket.on('test', function (data) {
        console.log('test', data);
        socket.emit('test-response', 2 * data);
    });
    socket.on('test-event', function (data) {
        console.log('test-event', data);
        socket.emit('test-event-response', 2 * data);
    });
});
