import inf = require('./interfaces');
import fp = require('./fp');


export class Emitter<Out>
	implements inf.IEmitter<Out>
{
	name: string;
	private _receivers: Array<inf.IReceiverFunction<Out> | inf.IReceiver<Out> | inf.IWire<Out>>;
	private _currentValue: Out;

	constructor(initialValue: Out = undefined) {
		this._receivers = [];
		this._currentValue = initialValue;
	}

	plugReceiver(receiver: inf.IReceiverFunction<Out> | inf.IReceiver<Out> | inf.IWire<Out>): number {
		if (typeof receiver !== 'function' && (<inf.IReceiver<Out>>receiver).wire) {
			receiver = (<inf.IReceiver<Out>>receiver).wire(this);
		}
		this._receivers.push(receiver);
		this.dispatchToReceiver(this._currentValue, receiver);
		return this._receivers.length - 1;
	}

	unplugReceiver(
		receiverOrId: inf.IDisposable | inf.IReceiverFunction<Out> | inf.IReceiver<Out> | inf.IWire<Out>
	) {
		var index = this._getIndexOfReceiver(receiverOrId);
		this._receivers.splice(index, 1);
	}

	_getIndexOfReceiver(
		receiverOrId: inf.IDisposable | inf.IReceiverFunction<Out> | inf.IReceiver<Out> | inf.IWire<Out>
	): number {
		if (typeof receiverOrId === 'number') {
			return receiverOrId;
		}
		else {
			return this._receivers.indexOf(receiverOrId);
		}
	}

	dirtyCurrentValue() {
		return this._currentValue;
	}

	_emit(value: Out) {
		if (this._currentValue === value){
			return;
		}
		this.dispatchToReceivers(value);
		this._currentValue = value;
	}

	_impulse(value: Out) {
		if (this._currentValue === value) {
			return;
		}
		this.dispatchToReceivers(value);
		this.dispatchToReceivers(this._currentValue);
	}

	private dispatchToReceivers(value: Out) {
		var currentReceivers = this._receivers.slice()
		for (var receiver of currentReceivers) {
			this.dispatchToReceiver(value, receiver);
		}
	}

	private dispatchToReceiver(value: Out, receiver: any) {
		if (typeof receiver === 'function'){
			receiver(value);
		}
		else {
			receiver.receive(value);
		}
	}
}

class ManualEmitter<Out>
	extends Emitter<Out>
{
	emit = this._emit;
	impulse = this._impulse;
}


export function manual<T>(initialValue: T): ManualEmitter<T> {
	var e = new ManualEmitter(initialValue);
	e.name = 'manual emitter';
	return e;
}

export function constant<T>(value: T): inf.IEmitter<T> {
	var e = new Emitter(value);
	e.name = 'constant(' + value + ')';
	return e;
}

interface AddEventListenerFunction {
	(type: string, listener: (event: any) => void, useCapture?: boolean): void
}

export function fromEvent(
	target: {addEventListener: AddEventListenerFunction},
	type: string, useCapture = false
) {
	var e = new ManualEmitter(undefined);
	e.name = 'event(' + type + ' - ' + target + ')';
	target.addEventListener(
		type,
		(event: any) => {
			e.impulse(event);
		},
		useCapture
	);
	return e;
}

interface Promise<Of, Err> {
	then(
		onFulfilled: (value: Of) => void,
		onRejected: (err: Err) => void
	): any
}

export function fromPromise<Of, Err>(promise: Promise<Of, Err>) {
	var e = new ManualEmitter(undefined);
	e.name = 'promise(' + promise + ')';
	promise.then(
		(value: Of) => e.impulse(fp.either.right(value)),
		(err: Err) => e.impulse(fp.either.left(err))
	);
	return e;
}
