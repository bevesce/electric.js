/// <reference path="../../../d/http.d.ts" />
/// <reference path="../../../d/fs.d.ts" />
/// <reference path="../../../d/socket.io.d.ts" />
var http = require('http');
var socketIO = require('socket.io');
var fs = require('fs');
var electricSocket = require('../../../src/devices/electric-socket');
var electric = require('../../../src/electric');
var tasksDevice = require('./changes-device-server');
var Change = require('./change');
var server = http.createServer(handler);
var io = socketIO(server);
server.listen(8080);
function handler(req, res) {
    fs.readFile('./index.html', function (err, data) {
        if (err) {
            res.writeHead(500);
            return res.end('Error loading index.html');
        }
        res.writeHead(200);
        res.end(data);
    });
}
var inputs = {
    insert: electric.emitter.manualEvent(),
    check: electric.emitter.manualEvent(),
    toggle: electric.emitter.manualEvent(),
    retitle: electric.emitter.manualEvent(),
    del: electric.emitter.manualEvent(),
    clear: electric.emitter.manualEvent()
};
for (var name in inputs) {
    inputs[name].name = '|tr| ' + name + ' |>';
}
var tasks = tasksDevice([], inputs);
function forEach(inputsDict, f) {
    for (var name in inputsDict) {
        f(name, inputsDict[name]);
    }
}
io.on('connection', function (socket) {
    forEach(inputs, function (name, emitter) { return socket.on(name, emitter.impulse); });
    var initialTasks = tasks.all.dirtyCurrentValue();
    var initialChanges = initialTasks.map(Change.appendTask);
    socket.emit('changes', initialChanges);
    tasks.changes.plugReceiver(electricSocket.eventReceiver('changes', socket));
});
