import inf = require('./interfaces');
import transformator = require('./transformator')


export function hanging() {
	return new transformator.Transformator([]);
}

export function htmlReceiverById(id: string) {
		var element = document.getElementById(id);
		return function(html: string) {
			element.innerHTML = html;
		}
	}

export function logReceiver(message: string) {
	if (!message) {
		message = ''
	}
	return function(x: any) {
		console.log(message, x);
	}
}

export function log(emitter: inf.IEmitter<any>) {
	emitter.plugReceiver(logReceiver(emitter.name));
}