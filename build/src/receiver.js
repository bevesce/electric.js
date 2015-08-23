// import transformator = require('./transformator')
// export function hanging() {
// 	return new transformator.Transformator([]);
// }
// export function htmlReceiverById(id: string) {
// 		var element = document.getElementById(id);
// 		return function(html: any) {
// 			element.innerHTML = html;
// 		}
// 	}
function logReceiver(message) {
    if (!message) {
        message = '<<<';
    }
    return function (x) {
        console.log(message, x);
    };
}
exports.logReceiver = logReceiver;
function log(emitter) {
    emitter.plugReceiver(logReceiver(emitter.name + ' >>> '));
}
exports.log = log;
function collect(emitter) {
    var r = [];
    emitter.plugReceiver(function (x) {
        r.push(x);
    });
    return r;
}
exports.collect = collect;
