import Emitter = require('./emitter');
import Wire = require('../wire');


export interface ReceiverFunction<T> {
	(value: T): void;
}

export interface ReceiverObject<T> {
	receiver(value: T): void;
}

export interface Receiver<T> {
	plugEmitter(emitter: Emitter<T>): number;
	wire(emitter: Emitter<T>): Wire<T>;
}
