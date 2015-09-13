import scheduler = require('./scheduler');
import transformators = require('./transformator-helpers');
import ElectricEvent = require('./electric-event');
import Wire = require('./wire');
import fn = require('./utils/fn');
import EmitFunction = require('./interfaces/t-to-void');
import receiver = require('./interfaces/receiver');

export import Emitter = require('./interfaces/emitter');
export import placeholder = require('./placeholder');


export class ConcreteEmitter<T>
	implements Emitter<T>
{
	name: string;
	private _receivers: Array<receiver.ReceiverFunction<T> | receiver.Receiver<T> | Wire<T>>;
	private _currentValue: T;

	constructor(initialValue: T = undefined) {
		this._receivers = [];
		this._currentValue = initialValue;
		this.name = (this.name);
	}

	toString(includeCurrentValue = false) {
		if (includeCurrentValue) {
			return `| ${this.name} = ${this.dirtyCurrentValue().toString()} >`;
		}
		return `| ${this.name} >`;
	}

	// when reveiver is plugged current value is not emitted to him
	// instantaneously, but instead it's done asynchronously
	plugReceiver(receiver: receiver.ReceiverFunction<T> | receiver.Receiver<T> | Wire<T>): number {
		if (typeof receiver !== 'function' && (<receiver.Receiver<T>>receiver).wire) {
			receiver = (<receiver.Receiver<T>>receiver).wire(this);
		}
		this._receivers.push(receiver);
		this._asyncDispatchToReceiver(receiver, this._currentValue);
		return this._receivers.length - 1;
	}

	_dirtyPlugReceiver(receiver: receiver.ReceiverFunction<T> | receiver.Receiver<T> | Wire<T>): number {
		if (typeof receiver !== 'function' && (<receiver.Receiver<T>>receiver).wire) {
			receiver = (<receiver.Receiver<T>>receiver).wire(this);
		}
		this._receivers.push(receiver);
		// this._asyncDispatchToReceiver(receiver, this._currentValue);
		return this._receivers.length - 1;
	}

	unplugReceiver(
		receiverOrId: number | receiver.ReceiverFunction<T> | receiver.Receiver<T> | Wire<T>
	) {
		var index = this._getIndexOfReceiver(receiverOrId);
		this._receivers.splice(index, 1);
	}

	_getIndexOfReceiver(
		receiverOrId: number | receiver.ReceiverFunction<T> | receiver.Receiver<T> | Wire<T>
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
	map<NewT>(mapping: (v: T) => NewT): Emitter<NewT> {
		return namedTransformator(
			`map(${fn(mapping)})`,
			[this],
			transformators.map(mapping, 1),
			mapping(this._currentValue)
		);
	}

	filter(initialValue: T, predicate: (v: T) => boolean): Emitter<T> {
		return namedTransformator(
			`filter(${fn(predicate)})`,
			[this],
			transformators.filter(predicate),
			initialValue
		);
	}

	filterMap<NewT>(initialValue: NewT, mapping: (v: T) => NewT | void): Emitter<NewT> {
		return namedTransformator(
			`filterMap(${fn(mapping)})`,
			[this],
			transformators.filterMap(mapping),
			initialValue
		);
	}

	transformTime(initialValue: T, timeShift: (t: number) => number, t0 = 0): Emitter<T> {
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

	accumulate<NewT>(
		initialValue: NewT,
		accumulator: (acc: NewT, value: T) => NewT
	): Emitter<NewT> {
		var acc = accumulator(initialValue, this.dirtyCurrentValue())
		return namedTransformator(
			`accumulate(${fn(accumulator)})`,
			[this],
			transformators.accumulate(acc, accumulator),
			acc
		);
	}

	changes<InOut>(): Emitter<ElectricEvent<{ previous: InOut, next: InOut }>> {
	    return namedTransformator(
	        'changes',
	        [this],
	        transformators.changes(this.dirtyCurrentValue()),
	        ElectricEvent.notHappend
	    )
	}

	when<NewT>(switcher: {
		happens: (value: T) => boolean,
		then: (value: T) => NewT
	}): Emitter<ElectricEvent<NewT>> {
		var t = namedTransformator(
			'whenHappensThen',
			[this],
			transformators.when(switcher.happens, switcher.then),
			ElectricEvent.notHappend
		);
		return t;
	}

	whenThen<NewT>(happens: (value: T) => NewT | void): Emitter<ElectricEvent<NewT>> {
		var t = namedTransformator(
			'whenThen',
			[this],
			transformators.whenThen(happens),
			ElectricEvent.notHappend
		);
		return t;
	}

	sample(initialValue: T, samplingEvent: Emitter<ElectricEvent<any>>): Emitter<T> {
		var t = namedTransformator(
			'sample',
			[this, samplingEvent],
			transformators.sample(),
			initialValue
		);
		return t;
	}

	change<S1>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
	    switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5, S6>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
	    switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) },
	    switcher6: { when: Emitter<ElectricEvent<S6>>, to: Emitter<T> | ((t: T, k: S6) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
	    switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) },
	    switcher6: { when: Emitter<ElectricEvent<S6>>, to: Emitter<T> | ((t: T, k: S6) => Emitter<T>) },
	    switcher7: { when: Emitter<ElectricEvent<S7>>, to: Emitter<T> | ((t: T, k: S7) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8>(
		switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
		switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
		switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
		switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
		switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) },
		switcher6: { when: Emitter<ElectricEvent<S6>>, to: Emitter<T> | ((t: T, k: S6) => Emitter<T>) },
		switcher7: { when: Emitter<ElectricEvent<S7>>, to: Emitter<T> | ((t: T, k: S7) => Emitter<T>) },
		switcher8: { when: Emitter<ElectricEvent<S8>>, to: Emitter<T> | ((t: T, k: S8) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
	    switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) },
	    switcher6: { when: Emitter<ElectricEvent<S6>>, to: Emitter<T> | ((t: T, k: S6) => Emitter<T>) },
	    switcher7: { when: Emitter<ElectricEvent<S7>>, to: Emitter<T> | ((t: T, k: S7) => Emitter<T>) },
	    switcher8: { when: Emitter<ElectricEvent<S8>>, to: Emitter<T> | ((t: T, k: S8) => Emitter<T>) },
	    switcher9: { when: Emitter<ElectricEvent<S9>>, to: Emitter<T> | ((t: T, k: S9) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
	    switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) },
	    switcher6: { when: Emitter<ElectricEvent<S6>>, to: Emitter<T> | ((t: T, k: S6) => Emitter<T>) },
	    switcher7: { when: Emitter<ElectricEvent<S7>>, to: Emitter<T> | ((t: T, k: S7) => Emitter<T>) },
	    switcher8: { when: Emitter<ElectricEvent<S8>>, to: Emitter<T> | ((t: T, k: S8) => Emitter<T>) },
	    switcher9: { when: Emitter<ElectricEvent<S9>>, to: Emitter<T> | ((t: T, k: S9) => Emitter<T>) },
	    switcher10: { when: Emitter<ElectricEvent<S10>>, to: Emitter<T> | ((t: T, k: S10) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
	    switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) },
	    switcher6: { when: Emitter<ElectricEvent<S6>>, to: Emitter<T> | ((t: T, k: S6) => Emitter<T>) },
	    switcher7: { when: Emitter<ElectricEvent<S7>>, to: Emitter<T> | ((t: T, k: S7) => Emitter<T>) },
	    switcher8: { when: Emitter<ElectricEvent<S8>>, to: Emitter<T> | ((t: T, k: S8) => Emitter<T>) },
	    switcher9: { when: Emitter<ElectricEvent<S9>>, to: Emitter<T> | ((t: T, k: S9) => Emitter<T>) },
	    switcher10: { when: Emitter<ElectricEvent<S10>>, to: Emitter<T> | ((t: T, k: S10) => Emitter<T>) },
	    switcher11: { when: Emitter<ElectricEvent<S11>>, to: Emitter<T> | ((t: T, k: S11) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
	    switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) },
	    switcher6: { when: Emitter<ElectricEvent<S6>>, to: Emitter<T> | ((t: T, k: S6) => Emitter<T>) },
	    switcher7: { when: Emitter<ElectricEvent<S7>>, to: Emitter<T> | ((t: T, k: S7) => Emitter<T>) },
	    switcher8: { when: Emitter<ElectricEvent<S8>>, to: Emitter<T> | ((t: T, k: S8) => Emitter<T>) },
	    switcher9: { when: Emitter<ElectricEvent<S9>>, to: Emitter<T> | ((t: T, k: S9) => Emitter<T>) },
	    switcher10: { when: Emitter<ElectricEvent<S10>>, to: Emitter<T> | ((t: T, k: S10) => Emitter<T>) },
	    switcher11: { when: Emitter<ElectricEvent<S11>>, to: Emitter<T> | ((t: T, k: S11) => Emitter<T>) },
	    switcher12: { when: Emitter<ElectricEvent<S12>>, to: Emitter<T> | ((t: T, k: S12) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
	    switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) },
	    switcher6: { when: Emitter<ElectricEvent<S6>>, to: Emitter<T> | ((t: T, k: S6) => Emitter<T>) },
	    switcher7: { when: Emitter<ElectricEvent<S7>>, to: Emitter<T> | ((t: T, k: S7) => Emitter<T>) },
	    switcher8: { when: Emitter<ElectricEvent<S8>>, to: Emitter<T> | ((t: T, k: S8) => Emitter<T>) },
	    switcher9: { when: Emitter<ElectricEvent<S9>>, to: Emitter<T> | ((t: T, k: S9) => Emitter<T>) },
	    switcher10: { when: Emitter<ElectricEvent<S10>>, to: Emitter<T> | ((t: T, k: S10) => Emitter<T>) },
	    switcher11: { when: Emitter<ElectricEvent<S11>>, to: Emitter<T> | ((t: T, k: S11) => Emitter<T>) },
	    switcher12: { when: Emitter<ElectricEvent<S12>>, to: Emitter<T> | ((t: T, k: S12) => Emitter<T>) },
	    switcher13: { when: Emitter<ElectricEvent<S13>>, to: Emitter<T> | ((t: T, k: S13) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
	    switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) },
	    switcher6: { when: Emitter<ElectricEvent<S6>>, to: Emitter<T> | ((t: T, k: S6) => Emitter<T>) },
	    switcher7: { when: Emitter<ElectricEvent<S7>>, to: Emitter<T> | ((t: T, k: S7) => Emitter<T>) },
	    switcher8: { when: Emitter<ElectricEvent<S8>>, to: Emitter<T> | ((t: T, k: S8) => Emitter<T>) },
	    switcher9: { when: Emitter<ElectricEvent<S9>>, to: Emitter<T> | ((t: T, k: S9) => Emitter<T>) },
	    switcher10: { when: Emitter<ElectricEvent<S10>>, to: Emitter<T> | ((t: T, k: S10) => Emitter<T>) },
	    switcher11: { when: Emitter<ElectricEvent<S11>>, to: Emitter<T> | ((t: T, k: S11) => Emitter<T>) },
	    switcher12: { when: Emitter<ElectricEvent<S12>>, to: Emitter<T> | ((t: T, k: S12) => Emitter<T>) },
	    switcher13: { when: Emitter<ElectricEvent<S13>>, to: Emitter<T> | ((t: T, k: S13) => Emitter<T>) },
	    switcher14: { when: Emitter<ElectricEvent<S14>>, to: Emitter<T> | ((t: T, k: S14) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
	    switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) },
	    switcher6: { when: Emitter<ElectricEvent<S6>>, to: Emitter<T> | ((t: T, k: S6) => Emitter<T>) },
	    switcher7: { when: Emitter<ElectricEvent<S7>>, to: Emitter<T> | ((t: T, k: S7) => Emitter<T>) },
	    switcher8: { when: Emitter<ElectricEvent<S8>>, to: Emitter<T> | ((t: T, k: S8) => Emitter<T>) },
	    switcher9: { when: Emitter<ElectricEvent<S9>>, to: Emitter<T> | ((t: T, k: S9) => Emitter<T>) },
	    switcher10: { when: Emitter<ElectricEvent<S10>>, to: Emitter<T> | ((t: T, k: S10) => Emitter<T>) },
	    switcher11: { when: Emitter<ElectricEvent<S11>>, to: Emitter<T> | ((t: T, k: S11) => Emitter<T>) },
	    switcher12: { when: Emitter<ElectricEvent<S12>>, to: Emitter<T> | ((t: T, k: S12) => Emitter<T>) },
	    switcher13: { when: Emitter<ElectricEvent<S13>>, to: Emitter<T> | ((t: T, k: S13) => Emitter<T>) },
	    switcher14: { when: Emitter<ElectricEvent<S14>>, to: Emitter<T> | ((t: T, k: S14) => Emitter<T>) },
	    switcher15: { when: Emitter<ElectricEvent<S15>>, to: Emitter<T> | ((t: T, k: S15) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
	    switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) },
	    switcher6: { when: Emitter<ElectricEvent<S6>>, to: Emitter<T> | ((t: T, k: S6) => Emitter<T>) },
	    switcher7: { when: Emitter<ElectricEvent<S7>>, to: Emitter<T> | ((t: T, k: S7) => Emitter<T>) },
	    switcher8: { when: Emitter<ElectricEvent<S8>>, to: Emitter<T> | ((t: T, k: S8) => Emitter<T>) },
	    switcher9: { when: Emitter<ElectricEvent<S9>>, to: Emitter<T> | ((t: T, k: S9) => Emitter<T>) },
	    switcher10: { when: Emitter<ElectricEvent<S10>>, to: Emitter<T> | ((t: T, k: S10) => Emitter<T>) },
	    switcher11: { when: Emitter<ElectricEvent<S11>>, to: Emitter<T> | ((t: T, k: S11) => Emitter<T>) },
	    switcher12: { when: Emitter<ElectricEvent<S12>>, to: Emitter<T> | ((t: T, k: S12) => Emitter<T>) },
	    switcher13: { when: Emitter<ElectricEvent<S13>>, to: Emitter<T> | ((t: T, k: S13) => Emitter<T>) },
	    switcher14: { when: Emitter<ElectricEvent<S14>>, to: Emitter<T> | ((t: T, k: S14) => Emitter<T>) },
	    switcher15: { when: Emitter<ElectricEvent<S15>>, to: Emitter<T> | ((t: T, k: S15) => Emitter<T>) },
	    switcher16: { when: Emitter<ElectricEvent<S16>>, to: Emitter<T> | ((t: T, k: S16) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
	    switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) },
	    switcher6: { when: Emitter<ElectricEvent<S6>>, to: Emitter<T> | ((t: T, k: S6) => Emitter<T>) },
	    switcher7: { when: Emitter<ElectricEvent<S7>>, to: Emitter<T> | ((t: T, k: S7) => Emitter<T>) },
	    switcher8: { when: Emitter<ElectricEvent<S8>>, to: Emitter<T> | ((t: T, k: S8) => Emitter<T>) },
	    switcher9: { when: Emitter<ElectricEvent<S9>>, to: Emitter<T> | ((t: T, k: S9) => Emitter<T>) },
	    switcher10: { when: Emitter<ElectricEvent<S10>>, to: Emitter<T> | ((t: T, k: S10) => Emitter<T>) },
	    switcher11: { when: Emitter<ElectricEvent<S11>>, to: Emitter<T> | ((t: T, k: S11) => Emitter<T>) },
	    switcher12: { when: Emitter<ElectricEvent<S12>>, to: Emitter<T> | ((t: T, k: S12) => Emitter<T>) },
	    switcher13: { when: Emitter<ElectricEvent<S13>>, to: Emitter<T> | ((t: T, k: S13) => Emitter<T>) },
	    switcher14: { when: Emitter<ElectricEvent<S14>>, to: Emitter<T> | ((t: T, k: S14) => Emitter<T>) },
	    switcher15: { when: Emitter<ElectricEvent<S15>>, to: Emitter<T> | ((t: T, k: S15) => Emitter<T>) },
	    switcher16: { when: Emitter<ElectricEvent<S16>>, to: Emitter<T> | ((t: T, k: S16) => Emitter<T>) },
	    switcher17: { when: Emitter<ElectricEvent<S17>>, to: Emitter<T> | ((t: T, k: S17) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
	    switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) },
	    switcher6: { when: Emitter<ElectricEvent<S6>>, to: Emitter<T> | ((t: T, k: S6) => Emitter<T>) },
	    switcher7: { when: Emitter<ElectricEvent<S7>>, to: Emitter<T> | ((t: T, k: S7) => Emitter<T>) },
	    switcher8: { when: Emitter<ElectricEvent<S8>>, to: Emitter<T> | ((t: T, k: S8) => Emitter<T>) },
	    switcher9: { when: Emitter<ElectricEvent<S9>>, to: Emitter<T> | ((t: T, k: S9) => Emitter<T>) },
	    switcher10: { when: Emitter<ElectricEvent<S10>>, to: Emitter<T> | ((t: T, k: S10) => Emitter<T>) },
	    switcher11: { when: Emitter<ElectricEvent<S11>>, to: Emitter<T> | ((t: T, k: S11) => Emitter<T>) },
	    switcher12: { when: Emitter<ElectricEvent<S12>>, to: Emitter<T> | ((t: T, k: S12) => Emitter<T>) },
	    switcher13: { when: Emitter<ElectricEvent<S13>>, to: Emitter<T> | ((t: T, k: S13) => Emitter<T>) },
	    switcher14: { when: Emitter<ElectricEvent<S14>>, to: Emitter<T> | ((t: T, k: S14) => Emitter<T>) },
	    switcher15: { when: Emitter<ElectricEvent<S15>>, to: Emitter<T> | ((t: T, k: S15) => Emitter<T>) },
	    switcher16: { when: Emitter<ElectricEvent<S16>>, to: Emitter<T> | ((t: T, k: S16) => Emitter<T>) },
	    switcher17: { when: Emitter<ElectricEvent<S17>>, to: Emitter<T> | ((t: T, k: S17) => Emitter<T>) },
	    switcher18: { when: Emitter<ElectricEvent<S18>>, to: Emitter<T> | ((t: T, k: S18) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18, S19>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
	    switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) },
	    switcher6: { when: Emitter<ElectricEvent<S6>>, to: Emitter<T> | ((t: T, k: S6) => Emitter<T>) },
	    switcher7: { when: Emitter<ElectricEvent<S7>>, to: Emitter<T> | ((t: T, k: S7) => Emitter<T>) },
	    switcher8: { when: Emitter<ElectricEvent<S8>>, to: Emitter<T> | ((t: T, k: S8) => Emitter<T>) },
	    switcher9: { when: Emitter<ElectricEvent<S9>>, to: Emitter<T> | ((t: T, k: S9) => Emitter<T>) },
	    switcher10: { when: Emitter<ElectricEvent<S10>>, to: Emitter<T> | ((t: T, k: S10) => Emitter<T>) },
	    switcher11: { when: Emitter<ElectricEvent<S11>>, to: Emitter<T> | ((t: T, k: S11) => Emitter<T>) },
	    switcher12: { when: Emitter<ElectricEvent<S12>>, to: Emitter<T> | ((t: T, k: S12) => Emitter<T>) },
	    switcher13: { when: Emitter<ElectricEvent<S13>>, to: Emitter<T> | ((t: T, k: S13) => Emitter<T>) },
	    switcher14: { when: Emitter<ElectricEvent<S14>>, to: Emitter<T> | ((t: T, k: S14) => Emitter<T>) },
	    switcher15: { when: Emitter<ElectricEvent<S15>>, to: Emitter<T> | ((t: T, k: S15) => Emitter<T>) },
	    switcher16: { when: Emitter<ElectricEvent<S16>>, to: Emitter<T> | ((t: T, k: S16) => Emitter<T>) },
	    switcher17: { when: Emitter<ElectricEvent<S17>>, to: Emitter<T> | ((t: T, k: S17) => Emitter<T>) },
	    switcher18: { when: Emitter<ElectricEvent<S18>>, to: Emitter<T> | ((t: T, k: S18) => Emitter<T>) },
	    switcher19: { when: Emitter<ElectricEvent<S19>>, to: Emitter<T> | ((t: T, k: S19) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18, S19, S20>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
	    switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) },
	    switcher6: { when: Emitter<ElectricEvent<S6>>, to: Emitter<T> | ((t: T, k: S6) => Emitter<T>) },
	    switcher7: { when: Emitter<ElectricEvent<S7>>, to: Emitter<T> | ((t: T, k: S7) => Emitter<T>) },
	    switcher8: { when: Emitter<ElectricEvent<S8>>, to: Emitter<T> | ((t: T, k: S8) => Emitter<T>) },
	    switcher9: { when: Emitter<ElectricEvent<S9>>, to: Emitter<T> | ((t: T, k: S9) => Emitter<T>) },
	    switcher10: { when: Emitter<ElectricEvent<S10>>, to: Emitter<T> | ((t: T, k: S10) => Emitter<T>) },
	    switcher11: { when: Emitter<ElectricEvent<S11>>, to: Emitter<T> | ((t: T, k: S11) => Emitter<T>) },
	    switcher12: { when: Emitter<ElectricEvent<S12>>, to: Emitter<T> | ((t: T, k: S12) => Emitter<T>) },
	    switcher13: { when: Emitter<ElectricEvent<S13>>, to: Emitter<T> | ((t: T, k: S13) => Emitter<T>) },
	    switcher14: { when: Emitter<ElectricEvent<S14>>, to: Emitter<T> | ((t: T, k: S14) => Emitter<T>) },
	    switcher15: { when: Emitter<ElectricEvent<S15>>, to: Emitter<T> | ((t: T, k: S15) => Emitter<T>) },
	    switcher16: { when: Emitter<ElectricEvent<S16>>, to: Emitter<T> | ((t: T, k: S16) => Emitter<T>) },
	    switcher17: { when: Emitter<ElectricEvent<S17>>, to: Emitter<T> | ((t: T, k: S17) => Emitter<T>) },
	    switcher18: { when: Emitter<ElectricEvent<S18>>, to: Emitter<T> | ((t: T, k: S18) => Emitter<T>) },
	    switcher19: { when: Emitter<ElectricEvent<S19>>, to: Emitter<T> | ((t: T, k: S19) => Emitter<T>) },
	    switcher20: { when: Emitter<ElectricEvent<S20>>, to: Emitter<T> | ((t: T, k: S20) => Emitter<T>) }
	): Emitter<T>;
	change(...switchers: {
		when: Emitter<ElectricEvent<any>>,
		to: Emitter<T> | ((t: T, k: any) => Emitter<T>)
	}[]): Emitter<T> {
		return namedTransformator(
			'changeToWhen',
			[<Emitter<any>>this].concat(switchers.map(s => s.when)),
			transformators.change(switchers),
			this._currentValue
		);
	}
}

export function emitter<T>(initialValue: T): ConcreteEmitter<T> {
	return new ConcreteEmitter(initialValue);
}

export class ManualEmitter<Out>
	extends ConcreteEmitter<Out>
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

export function constant<T>(value: T): Emitter<T> {
	var e = new ConcreteEmitter(value);
	e.name = `constant(${value})`;
	return e;
}

export interface EventEmitter<T>
	extends Emitter<ElectricEvent<T>> {
}

export interface ManualEventEmitter<T>
	extends EventEmitter<T>
{
	impulse(value: T): void;
}


export function manualEvent<T>(initialValue?: T, name?: string): ManualEventEmitter<T> {
	// initialValue doesn nothing it just to ease up
	// typing
	// instead of var e = <Emitter<ElectricEvent<T>>>manualEvent()
	// you can do var e = manualEvent(<T>null)

	// manual event emitter should
	// pack impulsed values into event
	// and not allow to emit values
	// it's done by monkey patching ManualEmitter
	var e = manual(ElectricEvent.notHappend);
	var oldImpulse = e.impulse;
	(<any>e).impulse = (v: T) => oldImpulse.apply(e, [ElectricEvent.of(v)]);
	(<any>e).emit = (v: T) => {
		throw Error("can't emit from event emitter, only impulse");
	};
	e.name = name || 'manual event';
	// monkey patching requires ugly casting...
	return <any>e;
}

type Identifier = number;


interface ITransformGeneratorFunction<In> {
	(
		emit: EmitFunction<any>,
		impulse: EmitFunction<any>
	): ITransformFunction<In>
}

interface ITransformFunction<In> {
	(values: Array<In>, index: Identifier): void;
}

export class Transformator<In, Out>
	extends ConcreteEmitter<Out>
	implements receiver.Receiver<In>
{
	protected _wires: Array<Wire<In>>;
	private _values: Array<In>;

	constructor(
		emitters: Array<Emitter<In>>,
		initialValue: Out,
		transform: ITransformGeneratorFunction<In> = undefined
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

	toString(includeCurrentValue = false) {
		if (includeCurrentValue) {
			return `< ${this.name} = ${this.dirtyCurrentValue().toString()} >`;
		}
		return `< ${this.name} >`;
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
		this.emit(<Out><any>values[index]);
	}

	private plugEmitters(emitters: Array<Emitter<In>>) {
		emitters.forEach(e => this.wire(e));
		for (var i = 0; i < emitters.length; i++) {
			this._values[i] = emitters[i].dirtyCurrentValue();
		}
	}

	plugEmitter(emitter: Emitter<In>) {
		this.wire(emitter);
		this._values[this._wires.length - 1] = emitter.dirtyCurrentValue();
		return this._wires.length - 1;
	}

	unplugEmitter(emitter: Emitter<In>) {
		this._wires.filter(w => w.input === emitter).forEach(w => w.unplug());
	}

	dropEmitters(start: number) {
		var wiresToDrop = this._wires.slice(1);
		wiresToDrop.forEach(w => w.unplug());
		this._wires.splice(start, this._wires.length);
		this._values.splice(start, this._values.length);
	}

	wire(emitter: Emitter<any>) {
		var index = this._wires.length;
		this._wires[index] = new Wire(
			emitter,
			this,
			((index: number) => (x: In) => this.receiveOn(x, index))(index),
			((index: number) => (x: In) => this.setOn(x, index))(index)
		);
		return this._wires[index];
	}

	_dirtyGetWireTo(emitter: Emitter<any>) {
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


export function namedTransformator<In, Out>(
	name: string,
	emitters: Emitter<In>[],
	transform: ITransformGeneratorFunction<In> = undefined,
	initialValue?: Out
) {
	var t = new Transformator(emitters, initialValue, transform);
	t.name = name;
	return t;
}
