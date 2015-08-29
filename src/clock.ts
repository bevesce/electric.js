import inf = require('./interfaces');

export import scheduler = require('./scheduler');
export import emitter = require('./emitter');
export import transformator = require('./transformator');


type Identifier = number;

export interface ITimeValue<T> {
	time: number;
	value: T;
}

export type IIntegrable = TimeValue<number>;
export type IDerivable = TimeValue<number>;

export function interval(intervalInMs: number) {
	var timer = emitter.manualEvent();
	scheduler.scheduleInterval(() => {
		timer.impulse(Date.now())
	}, intervalInMs)
	timer.name = '| interval |>';
	return timer;
}


export class TimeValue<T>
	implements ITimeValue<T>
{
	static of<K>(time: number, value: K = undefined) {
		return new TimeValue(time, value);
	}

	static lift<In1, Out>(
		f: (v1: In1) => Out
	): (v1: TimeValue<In1>) => TimeValue<Out>;
	static lift<In1, In2, Out>(
		f: (v1: In1, v2: In2) => Out
	): (v1: TimeValue<In1>, v2: TimeValue<In2>) => TimeValue<Out>;
	static lift<In1, In2, In3, Out>(
		f: (v1: In1, v2: In2, v3: In3) => Out
	): (v1: TimeValue<In1>, v2: TimeValue<In2>, v3: TimeValue<In3>) => TimeValue<Out>;
	static lift<In1, In2, In3, In4, Out>(
		f: (v1: In1, v2: In2, v3: In3, v4: In4) => Out
	): (v1: TimeValue<In1>, v2: TimeValue<In2>, v3: TimeValue<In3>, v4: TimeValue<In4>) => TimeValue<Out>;
	static lift<In1, In2, In3, In4, In5, Out>(
		f: (v1: In1, v2: In2, v3: In3, v4: In4, v5: In5) => Out
	): (v1: TimeValue<In1>, v2: TimeValue<In2>, v3: TimeValue<In3>, v4: TimeValue<In4>, v5: TimeValue<In5>) => TimeValue<Out>;
	static lift<In1, In2, In3, In4, In5, In6, Out>(
		f: (v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6) => Out
	): (v1: TimeValue<In1>, v2: TimeValue<In2>, v3: TimeValue<In3>, v4: TimeValue<In4>, v5: TimeValue<In5>, v6: TimeValue<In6>) => TimeValue<Out>;
	static lift<In1, In2, In3, In4, In5, In6, In7, Out>(
		f: (v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6, v7: In7) => Out
	): (v1: TimeValue<In1>, v2: TimeValue<In2>, v3: TimeValue<In3>, v4: TimeValue<In4>, v5: TimeValue<In5>, v6: TimeValue<In6>, v7: TimeValue<In7>) => TimeValue<Out>;
	static lift<In1, In2, In3, In4, In5, In6, In7, Out>(
		f:
			((v1: In1) => Out) |
			((v1: In1, v2: In2) => Out) |
			((v1: In1, v2: In2, v3: In3) => Out) |
			((v1: In1, v2: In2, v3: In3, v4: In4) => Out) |
			((v1: In1, v2: In2, v3: In3, v4: In4, v5: In5) => Out) |
			((v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6) => Out) |
			((v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6, v7: In7) => Out)
	): (v1: TimeValue<In1>, v2?: TimeValue<In2>, v3?: TimeValue<In3>, v4?: TimeValue<In4>, v5?: TimeValue<In5>, v6?: TimeValue<In6>, v7?: TimeValue<In7>) => TimeValue<Out> {
		return function(...vs: TimeValue<any>[]) {
			return TimeValue.of(
				Math.max(...vs.map(v => v.time)),
				f.apply(null, vs.map(v => v.value))
			)
		}
	}

	time: number;
	value: T;

	constructor(time: number, value: T) {
		this.time = time;
		this.value = value;
	}

	map<NewT>(f: (value: T) => NewT) {
		return TimeValue.of(this.time, f(this.value))
	}

}

function _time<T>(
	args: { intervalInMs?: number, fps?: number },
	transform: (t: number) => T
) {
	var e = emitter.manual(transform(scheduler.now()));
	var subname: string;
	var interval: number;
	if (args.intervalInMs === undefined) {
		subname = 'fps: ' + args.fps;
		interval = 1 / args.fps * 1000
	}
	else {
		subname = 'interval: ' + args.intervalInMs + 'ms';
		interval = args.intervalInMs;
	}
	var id = scheduler.scheduleInterval(
		() => e.emit(transform(scheduler.now())),
		interval
	);
	e.name = 'clock<' + subname + '>';
	function releaseResoueces() {
		scheduler.unscheduleInterval(id);
	}

	e.setReleaseResources(releaseResoueces);
	return e;
}

export function time(
	args: { intervalInMs?: number, fps?: number }
): inf.IEmitter<TimeValue<void>> {
	return _time(args, t => TimeValue.of(t, undefined));
}

export function timeFunction<T>(
	f: (time: number) => T,
	args: { intervalInMs?: number, fps?: number },
	t0: number = 0
) {
	return _time(args, t => (TimeValue.of(t, f(t - t0))));
}

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

export function derivative(f: inf.IEmitter<IIntegrable>) {
	var initialAcc = <IDerivating>{ time: scheduler.now(), value: undefined, derivative: 0 };
	var result = f.accumulate(
		initialAcc,
		(acc, v): IDerivating => {
			var dt = (v.time - acc.time) / 1000;
			var diff = 0
			if (dt !== 0) {
				diff = (v.value - acc.value) / dt / 1000
			}
			return {
				time: v.time,
				value: v.value,
				derivative: diff
			}
		}
	).map((v: IDerivating) => TimeValue.of(v.time, v.derivative));
	result.setEquals(equalsWithTime);
	return result;

}
