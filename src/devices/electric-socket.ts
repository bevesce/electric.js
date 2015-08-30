import inf = require('../interfaces');
import electric = require('../electric');
import eevent = require('../electric-event');


export function receiver(name: string, socket: any) {
	return function(data: any) {
		socket.emit(name, data);
	}
}

export function eventReceiver(name: string, socket: any) {
	return function(data: eevent<any>) {
		if (data.happend) {
			socket.emit(name, data.value);
		}
	}
}

export function emitter(name: string, socket: any, initialValue: any = undefined) {
	var emitter = electric.emitter.manual(initialValue);
	socket.on(name, function(data: any) {
		emitter.emit(data);
	});
	emitter.name = '| socket: ' + name + ' |>';
	return emitter;
};

export function eventEmitter<T>(
	name: string, socket: { on(name: string, callback: (data: T) => void): void }
): inf.IEmitter<eevent<T>> {
	var emitter = <electric.emitter.EventEmitter<T>>electric.emitter.manualEvent();
	socket.on(name, function(x) {
		emitter.impulse(x)
	});
	emitter.name = '| event socket: ' + name + ' |>';
	return emitter;
};
