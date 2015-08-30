var electric = require('../electric');
function receiver(name, socket) {
    return function (data) {
        socket.emit(name, data);
    };
}
exports.receiver = receiver;
function eventReceiver(name, socket) {
    return function (data) {
        if (data.happend) {
            socket.emit(name, data.value);
        }
    };
}
exports.eventReceiver = eventReceiver;
function emitter(name, socket, initialValue) {
    if (initialValue === void 0) { initialValue = undefined; }
    var emitter = electric.emitter.manual(initialValue);
    socket.on(name, function (data) {
        emitter.emit(data);
    });
    emitter.name = '| socket: ' + name + ' |>';
    return emitter;
}
exports.emitter = emitter;
;
function eventEmitter(name, socket) {
    var emitter = electric.emitter.manualEvent();
    socket.on(name, function (x) {
        emitter.impulse(x);
    });
    emitter.name = '| event socket: ' + name + ' |>';
    return emitter;
}
exports.eventEmitter = eventEmitter;
;
