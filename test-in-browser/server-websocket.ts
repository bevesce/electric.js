import http = require('http');
import socketIO = require('socket.io');
import fs = require('fs');

import electric = require('../src/electric');
import electricSocker = require('../src/devices/electric-socket');

var server = http.createServer(handler);

var io = socketIO(server);

server.listen(8002);

function handler(req, res) {
	fs.readFile(__dirname + '/index.html',
		function(err, data) {
			if (err) {
				res.writeHead(500);
				return res.end('Error loading index.html');
			}

			res.writeHead(200);
			res.end(data);
		}
	);
}


var d = electricSocker.socketServerDevice(io, ['fromserver', 'feedback'], ['toserver']);
var e = electric.emitter.manual('e1');
var f = electric.emitter.manual('f1');
var r = electric.receiver.hanging();
d.plug({
	ins: { fromserver: e, feedback: f }, outs: { toserver: r }
});
// f.emit('f2');
r.plugReceiver(x => {
	if (x){
		f.emit('s: ' + x + ' ' + Date.now())
	}
});
io.on('connection', function(socket) {
	console.log('connected');
	socket.on('y', function(data) {
		console.log('Y', data);
	});
});
