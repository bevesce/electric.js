import inf = require('../../../src/interfaces');
import clock = require('./clock');
import electric = require('../../../src/electric');


interface TimeOptions {
	intervalInMs?: number;
	fps?: number;
}


export interface Integrable {
	add(other: Integrable): Integrable;
	mulT(dt: number): Antiderivative;
}

export interface Antiderivative {
	addDelta(delta: Antiderivative): Antiderivative;
	equals(other: Antiderivative): boolean;
}

export function integral<In extends Integrable, Out extends Antiderivative>(
	initialValue: Out,
	emitter: inf.IEmitter<In>,
	options: TimeOptions
): inf.IEmitter<Out> {
	var timmed = timeValue(emitter, options);
	var result = timmed.accumulate(
		{
			time: electric.scheduler.now(),
			value: emitter.dirtyCurrentValue(),
			sum: initialValue
		},
		(acc, v) => {
			var now = electric.scheduler.now()
			var dt = now - acc.time;
			var nv = <Out>v.value.add(acc.value).mulT(dt / 2);
			var sum = <Out>acc.sum.addDelta(nv);
			return {
				time: now,
				value: v.value,
				sum: sum
			}
		}
	).map(v => v.sum);
	result.name = '<| integral |>';
	result.setEquals((x, y) => x.equals(y));
	return result;
}


interface Differentiable {
	sub(other: Differentiable): Differentiable;
	divT(dt: number): Derivative;
}

interface Derivative {
	equals(other: Derivative): boolean;
}

export function differential<In extends Differentiable, Out extends Derivative>(
	initialValue: Out,
	emitter: inf.IEmitter<In>,
	options: TimeOptions
) {
	var timmed = timeValue(emitter, options);
	var result = timmed.accumulate(
		{
			time: electric.scheduler.now(),
			value: emitter.dirtyCurrentValue(),
			diff: initialValue
		},
		(acc, v) => {
			var dt = v.time - acc.time;
			var diff = <Out>v.value.sub(acc.value).divT(dt);
			return {
				time: v.time,
				value: v.value,
				diff: diff
			}
		}
	).map(v => v.diff);
	result.setEquals((x, y) => x.equals(y));
	result.name = '<| differential |>';
	return result;
}


function timeValue<T>(
	emitter: inf.IEmitter<T>,
	options: TimeOptions
): inf.IEmitter<{ value: T, time: number }> {
	var time = clock(options);
	return electric.transformator.map(
		(t, v) => ({ time: t, value: v }),
		time, emitter
	);
}
