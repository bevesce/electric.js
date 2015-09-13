import Emitter = require('./interfaces/emitter');
import ElectricEvent = require('./electric-event');


export function logReceiver(message: string) {
	if (!message) {
		message = '<<<'
	}
	return function(x: any) {
		console.log(message, x);
	}
}

export function log(emitter: Emitter<any>) {
	emitter.plugReceiver((x: any) => {
		console.log(emitter.name, '>>>', x);
	});
}

export function logEvents(emitter: Emitter<ElectricEvent<any>>) {
	emitter.plugReceiver((x: any) => {
		if (!x.happend) {
			return;
		}
		console.log(emitter.name, '>>>', x.value);
	});
}

export function collect(emitter: Emitter<any>) {
	var r: any[] = [];
	emitter.plugReceiver((x: any) => {
		r.push(x);
	});
	return r;
}
