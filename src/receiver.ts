import inf = require('./interfaces');


export function logReceiver(message: string) {
	if (!message) {
		message = '<<<'
	}
	return function(x: any) {
		console.log(message, x);
	}
}

export function log(emitter: inf.IEmitter<any>) {
	emitter.plugReceiver((x: any) => {
		console.log(emitter.name + ' >>> ' + x);
	});
}

export function collect(emitter: inf.IEmitter<any>) {
	var r: any[] = [];
	emitter.plugReceiver((x: any) => {
		r.push(x);
	});
	return r;
}
