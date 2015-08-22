var electric = require('../electric');
function socketReceiver(name, socket) {
    return function (data) {
        socket.emit(name, data);
    };
}
exports.socketReceiver = socketReceiver;
function socketEmitter(name, socket, initialValue) {
    if (initialValue === void 0) { initialValue = undefined; }
    var emitter = electric.emitter.manual(initialValue);
    socket.on(name, function (data) {
        emitter.emit(data);
    });
    emitter.name = 'socket(' + name + ')';
    return emitter;
}
exports.socketEmitter = socketEmitter;
;
function socketServerDevice(io, insNames, outsNames) {
    return electric.device.create('server socker', function (input, output) {
        var insReceivers = {};
        for (var i = 0; i < insNames.length; i++) {
            insReceivers[insNames[i]] = electric.receiver.hanging();
        }
        console.log(insReceivers);
        ins(insReceivers);
        var outsEmitters = {};
        for (var i = 0; i < outsNames.length; i++) {
            outsEmitters[outsNames[i]] = electric.receiver.hanging();
        }
        console.log(outsEmitters);
        outs(outsEmitters);
        io.on('connection', function (socket) {
            console.log('device connected');
            for (var i = 0; i < insNames.length; i++) {
                insReceivers[insNames[i]].plugReceiver(socketReceiver(insNames[i], socket));
            }
            for (var i = 0; i < outsNames.length; i++) {
                outsEmitters[outsNames[i]].plugEmitter(socketEmitter(outsNames[i], socket));
            }
        });
    });
}
exports.socketServerDevice = socketServerDevice;
;
