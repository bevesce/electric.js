import electric = require('../electric');


export function receiver(name: string, socket: any) {
	return function(data: any) {
		socket.emit(name, data);
	}
}

export function eventReceiver(name: string, socket: any) {
	return function(data: electric.event<any>) {
		if (data.happened) {
			socket.emit(name, data.value);
		}
	}
}

export function emitter(name: string, socket: any, initialValue: any = undefined) {
	var emitter = electric.emitter.manual(initialValue);
	socket.on(name, function(data: any) {
		emitter.emit(data);
	});
	emitter.name = `socket(${name})`;
	return emitter;
};

export function eventEmitter<T>(
	name: string, socket: { on(name: string, callback: (data: T) => void): void }
): electric.emitter.Emitter<electric.event<T>> {
	var emitter = electric.emitter.manualEvent(<T>null);
	socket.on(name, function(x) {
		emitter.impulse(x)
	});
	emitter.name = `eventSocket(${name})`;
	return emitter;
};
