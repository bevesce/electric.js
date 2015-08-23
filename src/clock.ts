import inf = require('./interfaces');

export import scheduler = require('./scheduler');
export import emitter = require('./emitter');
export import transformator = require('./transformator');


type Identifier = number;

export interface ITimeValue<T> {
	time: number;
	value: T;
}

export class TimeValue<T>
	implements ITimeValue<T>
{
	time: number;
	value: T;

	constructor(time: number, value: T) {
		this.time = time;
		this.value = value;
	}

	map<NewT>(f: (value: T) => NewT) {
		return TimeValue.of(this.time, f(this.value))
	}

	static of<K>(time: number, value: K = undefined) {
		return new TimeValue(time, value);
	}

	static lift<In1, Out>(f: (value: In1) => Out):
	(value: TimeValue<In1>) => TimeValue<Out> {
		return function(tv: TimeValue<In1>) {
			return tv.map(f);
		}
	};
}

function _time<T>(
	args: { intervalInMs?: number, fps?: number },
	transform: (t: number) => T
) {
	var e = emitter.manual(transform(scheduler.now()));
	var interval = args.intervalInMs || 1 / args.fps * 1000;
	scheduler.scheduleInterval(
		() => e.emit(transform(scheduler.now())),
		interval
	);
	return e;
}

export function time(
	args: { intervalInMs?: number, fps?: number }
): inf.IEmitter<TimeValue<void>> {
	return _time(args, t => TimeValue.of(t, undefined));
}

export function timeFunction<T>(
	f: (time: number) => T,
	args: { intervalInMs?: number, fps?: number }
) {
	return _time(args, t => (TimeValue.of(t, f(t))));
}

type IIntegrable = TimeValue<number>;
interface IIntegrating {
	time: number;
	value: number;
	integral: number;
}

function equalsWithTime(x: IIntegrable, y: IIntegrable) {
	return x.time === y.time && x.value === y.value;
}

export function integral(f: inf.IEmitter<IIntegrable>) {
	var initialAcc = { time: scheduler.now(), value: 0, integral: 0 };
	var result = f.accumulate(
		initialAcc,
		(acc: IIntegrating, v: TimeValue<number>): IIntegrating => {
			var dt = (v.time - acc.time) / 1000;
			return {
				time: v.time,
				value: v.value,
				integral: acc.integral + (acc.value + v.value) / 2 * dt
			}
		}
	).map((v: IIntegrating): IIntegrable => TimeValue.of(v.time, v.integral));
	result.setEquals(equalsWithTime);
	return result;
}

interface IDerivating {
	time: number;
	value: number;
	derivative: number;
}

export function derivative(f: emitter.Emitter<IIntegrable>) {
	var initialAcc = <IDerivating>{ time: scheduler.now(), value: undefined, derivative: 0 };
	var result = f.accumulate(
		initialAcc,
		(acc, v): IDerivating => {
			var dt = (v.time - acc.time) / 1000;
			var diff = acc.value !== undefined ? (v.value - acc.value) : v.value
			return {
				time: v.time,
				value: v.value,
				derivative: diff / dt
			}
		}
	).map((v: IDerivating) => ({time: v.time, value: v.derivative}));
	result.setEquals(equalsWithTime);
	return result;

}
