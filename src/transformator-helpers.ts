import inf = require('./interfaces');
import utils = require('./utils');
import Wire = require('./wire');
import scheduler = require('./scheduler');

type Index = number;

export function map<In, Out>(f: (v: In) => Out, noOfEmitters: number) {
	return function mapTransform(emit: inf.IEmitterFunction<Out>) {
		var eaten = 0;
		return function mapTransform(v: In[], i: Index) {
			if (eaten < noOfEmitters) {
				eaten += 1;
				return;
			}
			emit(f.apply(null, v));
		}
	}
}

export function filter<InOut>(
	predicate: (...args: InOut[]) => boolean,
	noOfEmitters = 1
) {
	return function transform(emit: inf.IEmitterFunction<InOut>) {
		var eaten = 0;
		return function filterTransform(v: InOut[], i: Index) {
			if (eaten < noOfEmitters) {
				eaten += 1;
				return;
			}
			if (predicate.apply(null, v)) {
				emit(v[i]);
			}
		}
	}
};

export function filterMap<In, Out>(
	mapping: (...args: In[]) => Out | void,
	noOfEmitters = 1
) {
	return function transform(emit: inf.IEmitterFunction<Out>) {
		var eaten = 0;
		return function filterMapTransform(v: In[], i: Index) {
			if (eaten < noOfEmitters) {
				eaten += 1;
				return;
			}
			var result = mapping.apply(null, v);
			if (result !== undefined) {
				emit(<Out>result);
			}
		}
	}
};

export function merge<InOut>() {
	return function mergeTransform(emit: inf.IEmitterFunction<InOut>) {
		var prev: InOut;
		return function mergeTransform(v: InOut[], i: Index) {
			if (prev !== v[i]) {
				emit(v[i]);
			}
			prev = v[i]
		}
	}
}

export function accumulate<In, Out>(
	initialValue: Out,
	accumulator: (accumulated: Out, value: In) => Out
) {
	var accumulated = initialValue;
	return function transform(emit: inf.IEmitterFunction<Out>) {
		return function accumulateTransform(v: In[], i: Index) {
			accumulated = accumulator(accumulated, v[i]);
			emit(accumulated)
		}
	}
};

export function transformTime<Out>(
	timeTransformation: (t: number) => number,
	t0: number
) {
	// var firstEmitted = false;
	return function transform(emit: inf.IEmitterFunction<Out>) {
		return function timeTransform(v: Out[], i: number){
			var delay = timeTransformation(scheduler.now() - t0) + t0 - scheduler.now();
			var toEmit = v[i];
			scheduler.scheduleTimeout(
				() => {
					emit(toEmit);
				}, delay
			);
		}
	}
}

export function sample<InOut>() {
	return function transform(emit: inf.IEmitterFunction<InOut>) {
		return function sampleTransform(v: any[], i: Index) {
			if (i > 0 && v[i].happend) {
				emit(v[0]);
			}
		};
	};
};

export function change<Out>(
	switchers: {
		when: inf.IEmitter<any>,
		to: inf.IEmitter<Out> | ((x: Out, y: any) => inf.IEmitter<Out>)
	}[]
) {
	return function transform(emit: inf.IEmitterFunction<Out>) {
		return function changeTransform(v: any[], i: Index) {
			if (i == 0){
				emit(<Out>v[0]);
			}
			else if (v[i].happend){
				var to = switchers[i - 1].to;
				var e = utils.callIfFunction(to, <Out>v[0], v[i].value);
				this._wires[0].unplug();
				this._wires[0] = new Wire(
					e,
					this,
					(x: Out) => this.receiveOn(x, 0)
				);
			}
		}
	}
}
