/// <reference path="../d/http.d.ts" />
/// <reference path="../d/fs.d.ts" />
/// <reference path="../d/socket.io.d.ts" />
import http = require('http');
import socketIO = require('socket.io');
import fs = require('fs');

import electric = require('../src/electric');
import electricSocker = require('../src/devices/electric-socket');

var server = http.createServer(handler);
var io = socketIO(server);

server.listen(8002);

function handler(req: any, res: any) {
	res.writeHead(200);
	res.end();
}


io.on('connection', function(socket: any) {
	console.log('connected');
	socket.on('test', function(data: any) {
		console.log('test', data);
		socket.emit('test-response', 2 * data);
	});

	socket.on('test-event', function(data: any) {
		console.log('test-event', data);
		socket.emit('test-event-response', 2 * data);
	});
});
