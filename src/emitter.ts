import inf = require('./interfaces');
import scheduler = require('./scheduler');
import transformators = require('./transformator-helpers');
import eevent = require('./electric-event');
import Wire = require('./wire');
import fn = require('./utils/fn');

export import placeholder = require('./placeholder');



export class Emitter<T>
	implements inf.IEmitter<T>
{
	name: string;
	private _receivers: Array<inf.IReceiverFunction<T> | inf.IReceiver<T> | inf.IWire<T>>;
	private _currentValue: T;

	constructor(initialValue: T = undefined) {
		this._receivers = [];
		this._currentValue = initialValue;
		this.name = (this.name);
	}

	toString() {
		return `| ${this.name} | ${this.dirtyCurrentValue().toString()} |>`;
	}

	// when reveiver is plugged current value is not emitted to him
	// instantaneously, but instead it's done asynchronously
	plugReceiver(receiver: inf.IReceiverFunction<T> | inf.IReceiver<T> | inf.IWire<T>): number {
		if (typeof receiver !== 'function' && (<inf.IReceiver<T>>receiver).wire) {
			receiver = (<inf.IReceiver<T>>receiver).wire(this);
		}
		this._receivers.push(receiver);
		this._asyncDispatchToReceiver(receiver, this._currentValue);
		return this._receivers.length - 1;
	}

	_dirtyPlugReceiver(receiver: inf.IReceiverFunction<T> | inf.IReceiver<T> | inf.IWire<T>): number {
		if (typeof receiver !== 'function' && (<inf.IReceiver<T>>receiver).wire) {
			receiver = (<inf.IReceiver<T>>receiver).wire(this);
		}
		this._receivers.push(receiver);
		// this._asyncDispatchToReceiver(receiver, this._currentValue);
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
			// this._asyncDispatchToReceiver(receiver, value);
			this._dispatchToReceiver(receiver, value);
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

	private _asyncDispatchToReceivers(value: T) {
		var currentReceivers = this._receivers.slice();
		for (var receiver of currentReceivers) {
			this._asyncDispatchToReceiver(receiver, value);
		}
	}

	protected _asyncDispatchToReceiver(receiver: any, value?: T) {
		scheduler.scheduleTimeout(
			() => this._dispatchToReceiver(receiver, value),
			0
		);
	}

	// transformators
	map<NewT>(mapping: (v: T) => NewT): inf.IEmitter<NewT> {
		return namedTransformator(
			`map(${fn(mapping)})`,
			[this],
			transformators.map(mapping, 1),
			mapping(this._currentValue)
		);
	}

	filter(initialValue: T, predicate: (v: T) => boolean): inf.IEmitter<T> {
		return namedTransformator(
			`filter(${fn(predicate)})`,
			[this],
			transformators.filter(predicate),
			initialValue
		);
	}

	filterMap<NewT>(initialValue: T, mapping: (v: T) => NewT | void): inf.IEmitter<NewT> {
		return namedTransformator(
			`filterMap(${fn(mapping)})`,
			[this],
			transformators.filterMap(mapping),
			initialValue
		);
	}

	transformTime(initialValue: T, timeShift: (t: number) => number, t0 = 0): inf.IEmitter<T> {
		var t = namedTransformator(
			`transformTime(${fn(timeShift)})`,
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
			`accumulate(${fn(accumulator)})`,
			[this],
			transformators.accumulate(acc, accumulator),
			acc
		);
	}

	merge(...emitters: inf.IEmitter<T>[]): inf.IEmitter<T> {
		return namedTransformator(
			'merge',
			[<inf.IEmitter<T>>this].concat(emitters),
			transformators.merge(),
			this.dirtyCurrentValue()
		);
	}

	when<NewT>(switcher: {
		happens: (value: T) => boolean,
		then: (value: T) => NewT
	}): inf.IEmitter<eevent<NewT>> {
		var t = namedTransformator(
			'whenHappensThen',
			[this],
			transformators.when(switcher.happens, switcher.then),
			eevent.notHappend
		);
		return t;
	}

	whenThen<NewT>(happens: (value: T) => NewT | void): inf.IEmitter<eevent<NewT>> {
		var t = namedTransformator(
			'whenThen',
			[this],
			transformators.whenThen(happens),
			eevent.notHappend
		);
		return t;
	}

	sample(initialValue: T, samplingEvent: inf.IEmitter<eevent<any>>): inf.IEmitter<T> {
		var t = namedTransformator(
			'sample',
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
	change<S1, S2, S3, S4, S5, S6, S7, S8>(
		switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
		switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
		switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
		switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
		switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
		switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
		switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
		switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) }
	): inf.IEmitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9>(
	    switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
	    switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
	    switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
	    switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
	    switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
	    switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
	    switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
	    switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
	    switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) }
	): inf.IEmitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10>(
	    switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
	    switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
	    switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
	    switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
	    switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
	    switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
	    switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
	    switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
	    switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
	    switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) }
	): inf.IEmitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11>(
	    switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
	    switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
	    switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
	    switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
	    switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
	    switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
	    switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
	    switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
	    switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
	    switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
	    switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) }
	): inf.IEmitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12>(
	    switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
	    switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
	    switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
	    switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
	    switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
	    switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
	    switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
	    switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
	    switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
	    switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
	    switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
	    switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) }
	): inf.IEmitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13>(
	    switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
	    switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
	    switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
	    switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
	    switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
	    switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
	    switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
	    switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
	    switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
	    switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
	    switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
	    switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
	    switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) }
	): inf.IEmitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14>(
	    switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
	    switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
	    switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
	    switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
	    switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
	    switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
	    switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
	    switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
	    switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
	    switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
	    switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
	    switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
	    switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) },
	    switcher14: { when: inf.IEmitter<eevent<S14>>, to: inf.IEmitter<T> | ((t: T, k: S14) => inf.IEmitter<T>) }
	): inf.IEmitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15>(
	    switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
	    switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
	    switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
	    switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
	    switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
	    switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
	    switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
	    switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
	    switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
	    switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
	    switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
	    switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
	    switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) },
	    switcher14: { when: inf.IEmitter<eevent<S14>>, to: inf.IEmitter<T> | ((t: T, k: S14) => inf.IEmitter<T>) },
	    switcher15: { when: inf.IEmitter<eevent<S15>>, to: inf.IEmitter<T> | ((t: T, k: S15) => inf.IEmitter<T>) }
	): inf.IEmitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16>(
	    switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
	    switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
	    switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
	    switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
	    switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
	    switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
	    switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
	    switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
	    switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
	    switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
	    switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
	    switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
	    switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) },
	    switcher14: { when: inf.IEmitter<eevent<S14>>, to: inf.IEmitter<T> | ((t: T, k: S14) => inf.IEmitter<T>) },
	    switcher15: { when: inf.IEmitter<eevent<S15>>, to: inf.IEmitter<T> | ((t: T, k: S15) => inf.IEmitter<T>) },
	    switcher16: { when: inf.IEmitter<eevent<S16>>, to: inf.IEmitter<T> | ((t: T, k: S16) => inf.IEmitter<T>) }
	): inf.IEmitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17>(
	    switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
	    switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
	    switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
	    switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
	    switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
	    switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
	    switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
	    switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
	    switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
	    switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
	    switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
	    switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
	    switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) },
	    switcher14: { when: inf.IEmitter<eevent<S14>>, to: inf.IEmitter<T> | ((t: T, k: S14) => inf.IEmitter<T>) },
	    switcher15: { when: inf.IEmitter<eevent<S15>>, to: inf.IEmitter<T> | ((t: T, k: S15) => inf.IEmitter<T>) },
	    switcher16: { when: inf.IEmitter<eevent<S16>>, to: inf.IEmitter<T> | ((t: T, k: S16) => inf.IEmitter<T>) },
	    switcher17: { when: inf.IEmitter<eevent<S17>>, to: inf.IEmitter<T> | ((t: T, k: S17) => inf.IEmitter<T>) }
	): inf.IEmitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18>(
	    switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
	    switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
	    switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
	    switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
	    switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
	    switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
	    switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
	    switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
	    switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
	    switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
	    switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
	    switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
	    switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) },
	    switcher14: { when: inf.IEmitter<eevent<S14>>, to: inf.IEmitter<T> | ((t: T, k: S14) => inf.IEmitter<T>) },
	    switcher15: { when: inf.IEmitter<eevent<S15>>, to: inf.IEmitter<T> | ((t: T, k: S15) => inf.IEmitter<T>) },
	    switcher16: { when: inf.IEmitter<eevent<S16>>, to: inf.IEmitter<T> | ((t: T, k: S16) => inf.IEmitter<T>) },
	    switcher17: { when: inf.IEmitter<eevent<S17>>, to: inf.IEmitter<T> | ((t: T, k: S17) => inf.IEmitter<T>) },
	    switcher18: { when: inf.IEmitter<eevent<S18>>, to: inf.IEmitter<T> | ((t: T, k: S18) => inf.IEmitter<T>) }
	): inf.IEmitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18, S19>(
	    switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
	    switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
	    switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
	    switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
	    switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
	    switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
	    switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
	    switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
	    switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
	    switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
	    switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
	    switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
	    switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) },
	    switcher14: { when: inf.IEmitter<eevent<S14>>, to: inf.IEmitter<T> | ((t: T, k: S14) => inf.IEmitter<T>) },
	    switcher15: { when: inf.IEmitter<eevent<S15>>, to: inf.IEmitter<T> | ((t: T, k: S15) => inf.IEmitter<T>) },
	    switcher16: { when: inf.IEmitter<eevent<S16>>, to: inf.IEmitter<T> | ((t: T, k: S16) => inf.IEmitter<T>) },
	    switcher17: { when: inf.IEmitter<eevent<S17>>, to: inf.IEmitter<T> | ((t: T, k: S17) => inf.IEmitter<T>) },
	    switcher18: { when: inf.IEmitter<eevent<S18>>, to: inf.IEmitter<T> | ((t: T, k: S18) => inf.IEmitter<T>) },
	    switcher19: { when: inf.IEmitter<eevent<S19>>, to: inf.IEmitter<T> | ((t: T, k: S19) => inf.IEmitter<T>) }
	): inf.IEmitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18, S19, S20>(
	    switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
	    switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
	    switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
	    switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
	    switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
	    switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
	    switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
	    switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
	    switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
	    switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
	    switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
	    switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
	    switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) },
	    switcher14: { when: inf.IEmitter<eevent<S14>>, to: inf.IEmitter<T> | ((t: T, k: S14) => inf.IEmitter<T>) },
	    switcher15: { when: inf.IEmitter<eevent<S15>>, to: inf.IEmitter<T> | ((t: T, k: S15) => inf.IEmitter<T>) },
	    switcher16: { when: inf.IEmitter<eevent<S16>>, to: inf.IEmitter<T> | ((t: T, k: S16) => inf.IEmitter<T>) },
	    switcher17: { when: inf.IEmitter<eevent<S17>>, to: inf.IEmitter<T> | ((t: T, k: S17) => inf.IEmitter<T>) },
	    switcher18: { when: inf.IEmitter<eevent<S18>>, to: inf.IEmitter<T> | ((t: T, k: S18) => inf.IEmitter<T>) },
	    switcher19: { when: inf.IEmitter<eevent<S19>>, to: inf.IEmitter<T> | ((t: T, k: S19) => inf.IEmitter<T>) },
	    switcher20: { when: inf.IEmitter<eevent<S20>>, to: inf.IEmitter<T> | ((t: T, k: S20) => inf.IEmitter<T>) }
	): inf.IEmitter<T>;
	change(...switchers: {
		when: inf.IEmitter<eevent<any>>,
		to: inf.IEmitter<T> | ((t: T, k: any) => inf.IEmitter<T>)
	}[]): inf.IEmitter<T> {
		return namedTransformator(
			'changeToWhen',
			[<inf.IEmitter<any>>this].concat(switchers.map(s => s.when)),
			transformators.change(switchers),
			this._currentValue
		);
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

export function manual<T>(initialValue: T, name?: string): ManualEmitter<T> {
	var e = new ManualEmitter(initialValue);
	e.name = name || 'manual';
	return e;
}

export function constant<T>(value: T): inf.IEmitter<T> {
	var e = new Emitter(value);
	e.name = `constant(${value})`;
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
	var oldImpulse = e.impulse;
	(<any>e).impulse = (v: T) => oldImpulse.apply(e, [eevent.of(v)]);
	(<any>e).emit = (v: T) => {
		throw Error("can't emit from event emitter, only impulse");
	};
	e.name = name || 'manualEvent';
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
		this.name = 'transformator'
		this._values = Array(emitters.length);
		if (transform) {
			this.setTransform(transform);
		}
		this._wires = [];
		this.plugEmitters(emitters);
	}

	toString() {
		return `<| ${this.name} | ${this.dirtyCurrentValue().toString()} |>`;
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

	unplugEmitter(emitter: inf.IEmitter<In>) {
		this._wires.filter(w => w.input === emitter).forEach(w => w.unplug());
	}

	dropEmitters(start: number) {
		var wiresToDrop = this._wires.slice(1);
		wiresToDrop.forEach(w => w.unplug());
		this._wires.splice(start, this._wires.length);
		this._values.splice(start, this._values.length);
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
	t.name = name;
	return t;
}
