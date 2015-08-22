import inf = require('./interfaces');
import fp = require('./fp');


export class Transformable<Out> {

}


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
		this._dispatchToReceiver(this._currentValue, receiver);
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

	dirtyCurrentValue(): Out {
		return this._currentValue;
	}

	stabilize() {
		this._emit = this._throwStabilized;
		this._impulse = this._throwStabilized;
		this._releaseResources();
	}

	setReleaseResources(releaseResources: () => void) {
		this._releaseResources = releaseResources;
	}

	private _releaseResources() {

	}

	private _throwStabilized(value: Out) {
		throw Error("can't emit <" + value + "> from " + this.name + ", it's stabilized");
	}

	protected _emit(value: Out) {
		if (this._equals(this._currentValue, value)) {
			return;
		}
		this._dispatchToReceivers(value);
		this._currentValue = value;
	}

	private _equals(x: Out, y: Out) {
		return x === y;
	}

	setEquals(equals: (x: Out, y: Out) => boolean) {
		this._equals = equals;
	}

	protected _impulse(value: Out) {
		if (this._currentValue === value) {
			return;
		}
		this._dispatchToReceivers(value);
		this._dispatchToReceivers(this._currentValue);
	}

	private _dispatchToReceivers(value: Out) {
		var currentReceivers = this._receivers.slice()
		for (var receiver of currentReceivers) {
			this._dispatchToReceiver(value, receiver);
		}
	}

	protected _dispatchToReceiver(value: Out, receiver: any) {
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
	stabilize() {
		super.stabilize();
		this.emit = this._emit;
		this.impulse = this._impulse;
	}
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

class Placeholder<Out>
	extends Emitter<Out>
	implements inf.IEmitter<Out>
{
	private _emitter: inf.IEmitter<Out>;
	private _actions: Array<((emitter: inf.IEmitter<Out>) => any)> = [];
	private _initialValue: Out;

	constructor(initialValue: Out) {
		super(initialValue);
		this._initialValue = initialValue;
	}

	is(emitter: inf.IEmitter<Out>) {
		this._emitter = emitter;
		for (var action of this._actions) {
			action(this._emitter);
		}
	}

	private _doOrQueue(
		action: (emitter: inf.IEmitter<Out>) => any,
		eventually?: () => void
	): any {
		if (this._emitter) {
			return action(this._emitter);
		}
		else {
			this._actions.push(action);
			if (eventually) {
				eventually();
			}
		}
	}

	plugReceiver(receiver: inf.IReceiverFunction<Out> | inf.IReceiver<Out> | inf.IWire<Out>): inf.IDisposable {
		return this._doOrQueue(
			(emitter) => emitter.plugReceiver(receiver),
			() => this._dispatchToReceiver(this._initialValue, receiver)
		);
	};

	unplugReceiver(index: inf.IDisposable): void {
		this._doOrQueue(
			(emitter) => emitter.unplugReceiver(index)
		);
	}

	dirtyCurrentValue(): Out {
		if (this._emitter) {
			return this._emitter.dirtyCurrentValue();
		}
		return this._initialValue;
	}

	stabilize(): void {
		this._doOrQueue(
			(emitter) => emitter.stabilize()
		);
	}

	setReleaseResources(releaseResources: () => void): void {
		this._doOrQueue(
			(emitter) => emitter.setReleaseResources(releaseResources)
		)
	}
}

export function placeholder<T>(initialValue: T) {
	return new Placeholder(initialValue);
}
