/// <reference path="../../../d/http.d.ts" />
/// <reference path="../../../d/fs.d.ts" />
/// <reference path="../../../d/socket.io.d.ts" />

import http = require('http');
import socketIO = require('socket.io');
import fs = require('fs');

import electricSocket = require('../../../src/devices/electric-socket');
import electric = require('../../../src/electric');
import eevent = require('../../../src/electric-event');
import tasksDevice = require('./changes-device-server');
import Change = require('./change');

var server = http.createServer(handler);
var io = socketIO(server);

server.listen(8080);

function handler(req: any, res: any) {
	fs.readFile('./index.html',
		function(err: any, data: any) {
			if (err) {
				res.writeHead(500);
				return res.end('Error loading index.html');
			}

			res.writeHead(200);
			res.end(data);
		}
	);
}


var inputs = {
	insert: electric.emitter.manualEvent(),
	check: electric.emitter.manualEvent(),
	toggle: electric.emitter.manualEvent(),
	retitle: electric.emitter.manualEvent(),
	del: electric.emitter.manualEvent(),
	clear: electric.emitter.manualEvent()
}

for (var name in inputs) {
	(<any>inputs)[name].name = '|tr| ' + name + ' |>'
}

var tasks = tasksDevice([], <any>inputs);

function forEach(
	inputsDict: any,
	f: (name: string, value: any) => void)
{
	for (var name in inputsDict) {
		f(name, inputsDict[name]);
	}
}

io.on('connection', function(socket: any) {
	forEach(
		inputs,
		(name: string, emitter: electric.emitter.EventEmitter<any>) => socket.on(name, emitter.impulse)
	);
	var initialTasks = tasks.all.dirtyCurrentValue();
	var initialChanges = initialTasks.map(Change.appendTask);
	socket.emit('changes', initialChanges);

	tasks.changes.plugReceiver(
		electricSocket.eventReceiver('changes', socket)
	);
});

