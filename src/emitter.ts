import inf = require('./interfaces');
import scheduler = require('./scheduler');
import transformators = require('./transformator-helpers');
import eevent = require('./electric-event');
import Wire = require('./wire');
export import placeholder = require('./placeholder');


function en(name: string) {
	return '| ' + name + ' |>'
}


export class Emitter<T>
	implements inf.IEmitter<T>
{
	name: string;
	private _receivers: Array<inf.IReceiverFunction<T> | inf.IReceiver<T> | inf.IWire<T>>;
	private _currentValue: T;

	constructor(initialValue: T = undefined) {
		this._receivers = [];
		this._currentValue = initialValue;
		this.name = en(this.name);
	}

	// when reveiver is plugged current value is not emitted to him
	// instantaneously, but instead it's done asynchronously
	plugReceiver(receiver: inf.IReceiverFunction<T> | inf.IReceiver<T> | inf.IWire<T>): number {
		if (typeof receiver !== 'function' && (<inf.IReceiver<T>>receiver).wire) {
			receiver = (<inf.IReceiver<T>>receiver).wire(this);
		}
		this._receivers.push(receiver);
		this._ayncDispatchToReceiver(receiver, this._currentValue);
		return this._receivers.length - 1;
	}

	_dirtyPlugReceiver(receiver: inf.IReceiverFunction<T> | inf.IReceiver<T> | inf.IWire<T>): number {
		if (typeof receiver !== 'function' && (<inf.IReceiver<T>>receiver).wire) {
			receiver = (<inf.IReceiver<T>>receiver).wire(this);
		}
		this._receivers.push(receiver);
		// this._ayncDispatchToReceiver(receiver, this._currentValue);
		return this._receivers.length - 1;
	}

	unplugReceiver(
		receiverOrId: inf.IDisposable | inf.IReceiverFunction<T> | inf.IReceiver<T> | inf.IWire<T>
	) {
		var index = this._getIndexOfReceiver(receiverOrId);
		this._receivers.splice(index, 1);
	}

	_getIndexOfReceiver(
		receiverOrId: inf.IDisposable | inf.IReceiverFunction<T> | inf.IReceiver<T> | inf.IWire<T>
	): number {
		if (typeof receiverOrId === 'number') {
			return receiverOrId;
		}
		else {
			return this._receivers.indexOf(receiverOrId);
		}
	}

	dirtyCurrentValue(): T {
		return this._currentValue;
	}

	stabilize() {
		this.emit = this._throwStabilized;
		this.impulse = this._throwStabilized;
		this._releaseResources();
	}

	setReleaseResources(releaseResources: () => void) {
		this._releaseResources = releaseResources;
	}

	private _releaseResources() {
		// should be overwritten in more specific emitters
	}

	private _throwStabilized(value: T) {
		throw Error("can't emit <" + value + "> from " + this.name + ", it's stabilized");
	}

	// let's say that f = constant(y).emit(x) is called at t_e
	// then f(t) = x for t >= t_e, and f(t) = y for t < t_e
	emit(value: T) {
		if (this._equals(this._currentValue, value)) {
			return;
		}
		this._dispatchToReceivers(value);
		this._currentValue = value;
	}

	// let's say that f constant(y).impulse(x) is called at t_i
	// then f(t_i) = x and f(t) = y when t != t_i
	impulse(value: T) {
		if (this._equals(this._currentValue, value)) {
			return;
		}
		this._dispatchToReceivers(value);
		this._dispatchToReceivers(this._currentValue);
	}

	private _equals(x: T, y: T) {
		return x === y;
	}

	setEquals(equals: (x: T, y: T) => boolean) {
		this._equals = equals;
	}

	private _dispatchToReceivers(value: T) {
		var currentReceivers = this._receivers.slice();
		for (var receiver of currentReceivers) {
			this._ayncDispatchToReceiver(receiver, value);
		}
	}

	protected _dispatchToReceiver(receiver: any, value: T) {
		if (typeof receiver === 'function') {
			receiver(value);
		}
		else {
			receiver.receive(value);
		}
	}

	private _ayncDispatchToReceivers(value: T) {
		var currentReceivers = this._receivers.slice();
		for (var receiver of currentReceivers) {
			this._ayncDispatchToReceiver(receiver, value);
		}
	}

	protected _ayncDispatchToReceiver(receiver: any, value?: T) {
		scheduler.scheduleTimeout(
			() => this._dispatchToReceiver(receiver, value),
			0
		);
	}

	// transformators
	map<NewT>(mapping: (v: T) => NewT): inf.IEmitter<NewT> {
		return namedTransformator(
			'map' + this._enclosedName(),
			[this],
			transformators.map(mapping, 1),
			mapping(this._currentValue)
		);
	}

	filter(initialValue: T, predicate: (v: T) => boolean): inf.IEmitter<T> {
		return namedTransformator(
			'filter' + this._enclosedName(),
			[this],
			transformators.filter(predicate),
			initialValue
		);
	}

	filterMap<NewT>(initialValue: T, mapping: (v: T) => NewT | void): inf.IEmitter<NewT> {
		return namedTransformator(
			'filter' + this._enclosedName(),
			[this],
			transformators.filterMap(mapping),
			initialValue
		);
	}

	transformTime(initialValue: T, timeShift: (t: number) => number, t0 = 0): inf.IEmitter<T> {
		var t = namedTransformator(
			'transform time' + this._enclosedName(),
			[this],
			transformators.transformTime(timeShift, t0),
			initialValue
		);
		this._dispatchToReceiver(
			t._dirtyGetWireTo(this), this.dirtyCurrentValue()
		);
		return t;
	}

	accumulate<NewT>(initialValue: NewT, accumulator: (acc: NewT, value: T) => NewT): inf.IEmitter<NewT> {
		var acc = accumulator(initialValue, this.dirtyCurrentValue())
		return namedTransformator(
			'accumulate' + this._enclosedName(),
			[this],
			transformators.accumulate(acc, accumulator),
			acc
		);
	}

	merge(...emitters: inf.IEmitter<T>[]): inf.IEmitter<T> {
		return namedTransformator(
			'merge' + this._enclosedName() + ' with ' + emitters.map(e => e.name).join(', '),
			[<inf.IEmitter<T>>this].concat(emitters),
			transformators.merge(),
			this.dirtyCurrentValue()
		);
	}

	when<NewT>(switcher: {
		happens: (value: T) => boolean,
		then: (value: T) => NewT
	}): inf.IEmitter<eevent<NewT>> {
		var currentValue = this.dirtyCurrentValue();
		var t = namedTransformator(
			'when' + this._enclosedName(),
			[this],
			transformators.when(switcher.happens, switcher.then),
			eevent.notHappend
		);
		return t;
	}

	sample(initialValue: T, samplingEvent: inf.IEmitter<eevent<any>>): inf.IEmitter<T> {
		var t = namedTransformator(
			'sample' + this._enclosedName() + ' on ' + this._enclosedName(samplingEvent),
			[this, samplingEvent],
			transformators.sample(),
			initialValue
		);
		return t;
	}

	change<S1>(
	    switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) }
	): inf.IEmitter<T>;
	change<S1, S2>(
	    switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
	    switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) }
	): inf.IEmitter<T>;
	change<S1, S2, S3>(
	    switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
	    switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
	    switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) }
	): inf.IEmitter<T>;
	change<S1, S2, S3, S4>(
	    switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
	    switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
	    switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
	    switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) }
	): inf.IEmitter<T>;
	change<S1, S2, S3, S4, S5>(
	    switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
	    switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
	    switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
	    switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
	    switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) }
	): inf.IEmitter<T>;
	change<S1, S2, S3, S4, S5, S6>(
	    switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
	    switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
	    switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
	    switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
	    switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
	    switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) }
	): inf.IEmitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7>(
	    switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
	    switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
	    switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
	    switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
	    switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
	    switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
	    switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) }
	): inf.IEmitter<T>;
	change(...switchers: {
		when: inf.IEmitter<eevent<any>>,
		to: inf.IEmitter<T> | ((t: T, k: any) => inf.IEmitter<T>)
	}[]): inf.IEmitter<T> {
		return namedTransformator(
			'change' + this._enclosedName(),
			[<inf.IEmitter<any>>this].concat(switchers.map(s => s.when)),
			transformators.change(switchers),
			this._currentValue
		);
	}

	private _enclosedName(emitter: {name: string} = null) {
		return '<' + (emitter ? emitter.name : this.name) + '>';
	}
}

export function emitter<T>(initialValue: T): Emitter<T> {
	return new Emitter(initialValue);
}

class ManualEmitter<Out>
	extends Emitter<Out>
{
	emit(v: Out) {
		scheduler.scheduleTimeout(() => super.emit(v), 0);
	}
	impulse(v: Out) {
		scheduler.scheduleTimeout(() => super.impulse(v), 0);
	}
	stabilize() {
		super.stabilize();
		this.emit = this.emit;
		this.impulse = this.impulse;
	}
}

export function manual<T>(initialValue: T): ManualEmitter<T> {
	var e = new ManualEmitter(initialValue);
	e.name = en('manual')
	return e;
}

export function constant<T>(value: T): inf.IEmitter<T> {
	var e = new Emitter(value);
	e.name = en('constant *' + value + '*');
	return e;
}


export interface EventEmitter<T>
	extends inf.IEmitter<eevent<T>> {
	impulse(value: T): void;
}

export function manualEvent<T>(name?: string): EventEmitter<T> {
	// manual event emitter should
	// pack impulsed values into event
	// and not allow to emit values
	// it's done by monkey patching ManualEmitter
	var e = manual(eevent.notHappend);
	e.name = en('manual event');
	var oldImpulse = e.impulse;
	(<any>e).impulse = (v: T) => oldImpulse.apply(e, [eevent.of(v)]);
	(<any>e).emit = (v: T) => {
		throw Error("can't emit from event emitter, only impulse");
	};
	e.name = name ? en(name) : e.name;
	// monkey patching requires ugly casting...
	return <any>e;
}

type Identifier = number;


interface ITransformGeneratorFunction<In> {
	(
		emit: inf.IEmitterFunction<any>,
		impulse: inf.IEmitterFunction<any>
	): ITransformFunction<In>
}

interface ITransformFunction<In> {
	(values: Array<In>, index: Identifier): void;
}

export class Transformator<In>
	extends Emitter<any>
	implements inf.IReceiver<In>
{
	protected _wires: Array<Wire<In>>;
	private _values: Array<In>;

	constructor(
		emitters: Array<inf.IEmitter<In>>,
		transform: ITransformGeneratorFunction<In> = undefined,
		initialValue: any = undefined
	) {
		super(initialValue);
		this.name = '<| transformator |>'
		this._values = Array(emitters.length);;
		if (transform) {
			this.setTransform(transform);
		}
		this._wires = [];
		this.plugEmitters(emitters);
	}

	setTransform(transform: ITransformGeneratorFunction<In>) {
		this._transform = transform(
			(x: any) => this.emit(x),
			(x: any) => this.impulse(x)
		);
	}

	private _transform(values: Array<In>, index: Identifier) {
		// Default implementation that just passes values
		// Should be overwritten in functions that create Transformators
		this.emit(values[index]);
	}

	private plugEmitters(emitters: Array<inf.IEmitter<In>>) {
		emitters.forEach(e => this.wire(e));
		for (var i = 0; i < emitters.length; i++) {
			this._values[i] = emitters[i].dirtyCurrentValue();
		}
	}

	plugEmitter(emitter: inf.IEmitter<In>) {
		this.wire(emitter);
		this._values[this._wires.length - 1] = emitter.dirtyCurrentValue();
		return this._wires.length - 1;
	}

	wire(emitter: inf.IEmitter<any>) {
		var index = this._wires.length;
		this._wires[index] = new Wire(
			emitter,
			this,
			((index: number) => (x: In) => this.receiveOn(x, index))(index),
			((index: number) => (x: In) => this.setOn(x, index))(index)
		);
		return this._wires[index];
	}

	_dirtyGetWireTo(emitter: inf.IEmitter<any>) {
		return this._wires.filter(w => w.input === emitter)[0];
	}

	protected receiveOn(value: In, index: number) {
		this._values[index] = value;
		this._transform(this._values, index);
	}

	protected setOn(value: In, index: number) {
		this._values[index] = value;
	}
}


export function namedTransformator<In>(
	name: string,
	emitters: Array<inf.IEmitter<In>>,
	transform: ITransformGeneratorFunction<In> = undefined,
	initialValue?: any
) {
	var t = new Transformator(emitters, transform, initialValue);
	t.name = '<| ' + name + ' |>';
	return t;
}

