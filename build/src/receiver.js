var transformator = require('./transformator');
function hanging() {
    return new transformator.Transformator([]);
}
exports.hanging = hanging;
function htmlReceiverById(id) {
    var element = document.getElementById(id);
    return function (html) {
        element.innerHTML = html;
    };
}
exports.htmlReceiverById = htmlReceiverById;
function logReceiver(message) {
    if (!message) {
        message = '';
    }
    return function (x) {
        console.log(message, x);
    };
}
exports.logReceiver = logReceiver;
function log(emitter) {
    emitter.plugReceiver(logReceiver(emitter.name));
}
exports.log = log;
