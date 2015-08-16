import inf = require('./interfaces');

export import scheduler = require('./scheduler');
export import emitter = require('./emitter');
export import transformator = require('./transformator');


type Identifier = number;


export function clock(
	args: { intervalInMs?: number, fps?: number }
) {
	var e = emitter.manual(scheduler.now());
	scheduler.scheduleInterval(
		() => e.emit(scheduler.now()),
		args.intervalInMs
	);
	return e;
}

export function fclock<T>(
	f: (time: number) => T,
	args: { intervalInMs?: number, fps?: number }
) {
	return clock(args).map((t: number) => ({ time: t, value: f(t) }));
}

export function eclock<T>(
	emitter: inf.IEmitter<T>,
	args: { intervalInMs?: number, fps?: number }
) {
	var time = clock(args);
	function timeSampling(emit: inf.IEmitterFunction<{ time: number, value: T }>) {
		var latestValue: T;
		return function(v: (T | number)[], i: Identifier) {
			if (i == 0) {
				latestValue = <T>v[0];
			}
			else {
				emit({ time: <number>v[1], value: latestValue })
			}
		}
	}
	return new transformator.Transformator([emitter, time], timeSampling);
}

interface IIntegrable {
	time: number;
	value: number;
	sum?: number;
	dt?: number;
}

export function integral(f: emitter.Emitter<IIntegrable>) {
	var initialAcc = { time: scheduler.now(), value: 0, sum: 0 };
	return f.accumulate(initialAcc, (acc: IIntegrable, v: IIntegrable) => {
		var dt = (v.time - acc.time) / 1000;
		return {
			time: v.time,
			value: v.value,
			sum: acc.sum + (acc.value + v.value) / 2 * dt,
			dt: dt
		}
	}).map((v: IIntegrable) => ({ time: v.time, value: v.sum }));
}
