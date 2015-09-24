import electric = require('../electric');
import clock = require('../clock');
import scheduler = require('../scheduler');
import transformator = require('../transformator');


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

export interface IntegrableAntiderivative
	extends Integrable, Antiderivative {

}

export function integral<In extends Integrable, Out extends Antiderivative>(
	initialValue: Out,
	emitter: electric.emitter.Emitter<In>,
	options: TimeOptions
): electric.emitter.Emitter<Out> {
	var timmed = timeValue(emitter, options);
	var acc = timmed.accumulate(
		{
			time: scheduler.now(),
			value: emitter.dirtyCurrentValue(),
			sum: initialValue
		},
		(acc, v) => {
			var now = scheduler.now();
			var dt = now - acc.time;
			var nv = <Out>v.value.add(acc.value).mulT(dt / 2);
			var sum = <Out>acc.sum.addDelta(nv);
			return {
				time: now,
				value: v.value,
				sum: sum
			}
		}
	)
	acc.name = 'internal integral accumulator'
	var result = acc.map(v => v.sum);
	result.name = 'integral';
	result.setEquals((x, y) => x.equals(y));
	result.stabilize = () => timmed.stabilize();
	return result;
}


export interface Differentiable {
	sub(other: Differentiable): Differentiable;
	divT(dt: number): Derivative;
}

export interface Derivative {
	equals(other: Derivative): boolean;
}

export function differential<In extends Differentiable, Out extends Derivative>(
	initialValue: Out,
	emitter: electric.emitter.Emitter<In>,
	options: TimeOptions
): electric.emitter.Emitter<Out>{
	var timmed = timeValue(emitter, options);
	var result = timmed.accumulate(
		{
			time: scheduler.now(),
			value: emitter.dirtyCurrentValue(),
			diff: initialValue
		},
		(acc, v) => {
			var now = scheduler.now();
			var dt = now - acc.time;
			var diff = acc.diff;
			if (dt !== 0) {
				diff = <Out>v.value.sub(acc.value).divT(dt);
			}
			return {
				time: now,
				value: v.value,
				diff: diff
			}
		}
	).map(v => v.diff);
	result.setEquals((x, y) => x.equals(y));
	result.name = 'differential';
	return result;
}


function timeValue<T>(
	emitter: electric.emitter.Emitter<T>,
	options: TimeOptions
): electric.emitter.Emitter<{ value: T, time: number }> {
	var time = clock.time(options);
	var trans =  transformator.map(
		(t, v) => ({ time: t, value: v }),
		time, emitter
	);
	trans.stabilize = () => time.stabilize();
	trans.name = 'calculus timer'
	return trans;
}
