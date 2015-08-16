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
function log(message) {
    if (!message) {
        message = '';
    }
    return function (x) {
        console.log(message, x);
    };
}
exports.log = log;
