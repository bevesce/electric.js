import inf = require('./interfaces');
import emitter = require('./emitter');
var namedTransformator = emitter.namedTransformator;
import transformators = require('./transformator-helpers');
// import scheduler = require('./scheduler');

// type Identifier = number;

export function map<In1, Out>(
    mapping: (v1: In1) => Out,
    emitter1: inf.IEmitter<In1>
): inf.IEmitter<Out>;
export function map<In1, In2, Out>(
    mapping: (v1: In1, v2: In2) => Out,
    emitter1: inf.IEmitter<In1>, emitter2: inf.IEmitter<In2>
): inf.IEmitter<Out>;
export function map<In1, In2, In3, Out>(
    mapping: (v1: In1, v2: In2, v3: In3) => Out,
    emitter1: inf.IEmitter<In1>, emitter2: inf.IEmitter<In2>, emitter3: inf.IEmitter<In3>
): inf.IEmitter<Out>;
export function map<In1, In2, In3, In4, Out>(
    mapping: (v1: In1, v2: In2, v3: In3, v4: In4) => Out,
    emitter1: inf.IEmitter<In1>, emitter2: inf.IEmitter<In2>, emitter3: inf.IEmitter<In3>, emitter4: inf.IEmitter<In4>
): inf.IEmitter<Out>;
export function map<In1, In2, In3, In4, In5, Out>(
    mapping: (v1: In1, v2: In2, v3: In3, v4: In4, v5: In5) => Out,
    emitter1: inf.IEmitter<In1>, emitter2: inf.IEmitter<In2>, emitter3: inf.IEmitter<In3>, emitter4: inf.IEmitter<In4>, emitter5: inf.IEmitter<In5>
): inf.IEmitter<Out>;
export function map<In1, In2, In3, In4, In5, In6, Out>(
    mapping: (v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6) => Out,
    emitter1: inf.IEmitter<In1>, emitter2: inf.IEmitter<In2>, emitter3: inf.IEmitter<In3>, emitter4: inf.IEmitter<In4>, emitter5: inf.IEmitter<In5>, emitter6: inf.IEmitter<In6>
): inf.IEmitter<Out>;
export function map<In1, In2, In3, In4, In5, In6, In7, Out>(
    mapping: (v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6, v7: In7) => Out,
    emitter1: inf.IEmitter<In1>, emitter2: inf.IEmitter<In2>, emitter3: inf.IEmitter<In3>, emitter4: inf.IEmitter<In4>, emitter5: inf.IEmitter<In5>, emitter6: inf.IEmitter<In6>, emitter7: inf.IEmitter<In7>
): inf.IEmitter<Out>;
export function map<Out>(
	mapping: (v1: any) => Out,
	...emitters: inf.IEmitter<any>[]
): inf.IEmitter<Out> {
	return namedTransformator(
		'map<' + emitters.map(e => e.name).join(', ') + '>',
		emitters,
		transformators.map(mapping, emitters.length),
		mapping.apply(null, emitters.map(e => e.dirtyCurrentValue()))
	);
};

export function filter<In1, Out>(
    initialValue: Out,
    predicate: (v1: In1) => boolean,
    emitter1: inf.IEmitter<In1>
): inf.IEmitter<Out>;
export function filter<In1, In2, Out>(
    initialValue: Out,
    predicate: (v1: In1, v2: In2) => boolean,
    emitter1: inf.IEmitter<In1>, emitter2: inf.IEmitter<In2>
): inf.IEmitter<Out>;
export function filter<In1, In2, In3, Out>(
    initialValue: Out,
    predicate: (v1: In1, v2: In2, v3: In3) => boolean,
    emitter1: inf.IEmitter<In1>, emitter2: inf.IEmitter<In2>, emitter3: inf.IEmitter<In3>
): inf.IEmitter<Out>;
export function filter<In1, In2, In3, In4, Out>(
    initialValue: Out,
    predicate: (v1: In1, v2: In2, v3: In3, v4: In4) => boolean,
    emitter1: inf.IEmitter<In1>, emitter2: inf.IEmitter<In2>, emitter3: inf.IEmitter<In3>, emitter4: inf.IEmitter<In4>
): inf.IEmitter<Out>;
export function filter<In1, In2, In3, In4, In5, Out>(
    initialValue: Out,
    predicate: (v1: In1, v2: In2, v3: In3, v4: In4, v5: In5) => boolean,
    emitter1: inf.IEmitter<In1>, emitter2: inf.IEmitter<In2>, emitter3: inf.IEmitter<In3>, emitter4: inf.IEmitter<In4>, emitter5: inf.IEmitter<In5>
): inf.IEmitter<Out>;
export function filter<In1, In2, In3, In4, In5, In6, Out>(
    initialValue: Out,
    predicate: (v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6) => boolean,
    emitter1: inf.IEmitter<In1>, emitter2: inf.IEmitter<In2>, emitter3: inf.IEmitter<In3>, emitter4: inf.IEmitter<In4>, emitter5: inf.IEmitter<In5>, emitter6: inf.IEmitter<In6>
): inf.IEmitter<Out>;
export function filter<In1, In2, In3, In4, In5, In6, In7, Out>(
    initialValue: Out,
    predicate: (v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6, v7: In7) => boolean,
    emitter1: inf.IEmitter<In1>, emitter2: inf.IEmitter<In2>, emitter3: inf.IEmitter<In3>, emitter4: inf.IEmitter<In4>, emitter5: inf.IEmitter<In5>, emitter6: inf.IEmitter<In6>, emitter7: inf.IEmitter<In7>
): inf.IEmitter<Out>;
export function filter<Out>(
	initialValue: Out,
	predicate: (...args: any[]) => boolean,
	...emitters: inf.IEmitter < any > []
): inf.IEmitter<Out> {
	return namedTransformator(
		'filter<' + emitters.map(e => e.name).join(', ') + '>',
		emitters,
		transformators.filter(predicate, emitters.length),
		initialValue
	);
};

export function filterMap<In1, Out>(
    initialValue: Out,
    mapping: (v1: In1) => Out | void,
    emitter1: inf.IEmitter<In1>
	): inf.IEmitter<Out>;
export function filterMap<In1, In2, Out>(
    initialValue: Out,
    mapping: (v1: In1, v2: In2) => Out | void,
    emitter1: inf.IEmitter<In1>, emitter2: inf.IEmitter<In2>
	): inf.IEmitter<Out>;
export function filterMap<In1, In2, In3, Out>(
    initialValue: Out,
    mapping: (v1: In1, v2: In2, v3: In3) => Out | void,
    emitter1: inf.IEmitter<In1>, emitter2: inf.IEmitter<In2>, emitter3: inf.IEmitter<In3>
	): inf.IEmitter<Out>;
export function filterMap<In1, In2, In3, In4, Out>(
    initialValue: Out,
    mapping: (v1: In1, v2: In2, v3: In3, v4: In4) => Out | void,
    emitter1: inf.IEmitter<In1>, emitter2: inf.IEmitter<In2>, emitter3: inf.IEmitter<In3>, emitter4: inf.IEmitter<In4>
	): inf.IEmitter<Out>;
export function filterMap<In1, In2, In3, In4, In5, Out>(
    initialValue: Out,
    mapping: (v1: In1, v2: In2, v3: In3, v4: In4, v5: In5) => Out | void,
    emitter1: inf.IEmitter<In1>, emitter2: inf.IEmitter<In2>, emitter3: inf.IEmitter<In3>, emitter4: inf.IEmitter<In4>, emitter5: inf.IEmitter<In5>
	): inf.IEmitter<Out>;
export function filterMap<In1, In2, In3, In4, In5, In6, Out>(
    initialValue: Out,
    mapping: (v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6) => Out | void,
    emitter1: inf.IEmitter<In1>, emitter2: inf.IEmitter<In2>, emitter3: inf.IEmitter<In3>, emitter4: inf.IEmitter<In4>, emitter5: inf.IEmitter<In5>, emitter6: inf.IEmitter<In6>
	): inf.IEmitter<Out>;
export function filterMap<In1, In2, In3, In4, In5, In6, In7, Out>(
    initialValue: Out,
    mapping: (v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6, v7: In7) => Out | void,
    emitter1: inf.IEmitter<In1>, emitter2: inf.IEmitter<In2>, emitter3: inf.IEmitter<In3>, emitter4: inf.IEmitter<In4>, emitter5: inf.IEmitter<In5>, emitter6: inf.IEmitter<In6>, emitter7: inf.IEmitter<In7>
	): inf.IEmitter<Out>;
export function filterMap<Out>(
	initialValue: Out,
	mapping: (...args: any[]) => Out | void,
	...emitters: inf.IEmitter<any>[]
	): inf.IEmitter<Out> {
	return namedTransformator(
		'filterMap<' + emitters.map(e => e.name).join(', ') + '>',
		emitters,
		transformators.filterMap(mapping, emitters.length),
		initialValue
	);
};

// export function merge<InOut>(
// 	...emitters: inf.IEmitter<InOut>[]
// ) {
// 	return namedTransformator('merge', emitters, undefined);
// };

// (<any>emitter.Emitter.prototype).merge = function mergeWith<Out>(...emitters: inf.IEmitter<Out>[]) {
// 	return merge(this, ...emitters);
// }


// export function accumulate<In, Out>(
// 	initValue: Out, accumulator: (accumulated: Out, value: In) => Out,
// 	...emitters: inf.IEmitter<In>[]
// ) {
// 	var accumulated = initValue;
// 	function transform(emit: inf.IEmitterFunction<Out>) {
// 		return function accumulateTransform(v: In[], i: Identifier) {
// 			accumulated = accumulator(accumulated, v[i]);
// 			emit(accumulated)
// 		}
// 	}
// 	return namedTransformator('accumulate', emitters, transform);
// };

// (<any>emitter.Emitter.prototype).accumulate = function accumulateWith<NewOut, Out>(
// 	initValue: NewOut, accumulator: (accumulated: NewOut, value: Out) => NewOut
// ) {
// 	return accumulate(initValue, accumulator, this);
// }


// export function flatten<InOut>(
// 	...emitters: inf.IEmitter<inf.IEmitter<InOut>>[]
// ) {
// 	var transformator = new Transformator([]);
// 	function transform(emit: inf.IEmitterFunction<inf.IEmitter<InOut>>) {
// 		return function flattenTransform(v: inf.IEmitter<InOut>[], i: Identifier) {
// 			transformator.plugEmitter(v[i]);
// 		}
// 	};
// 	new Transformator(emitters, transform);
// 	transformator.name = 'flatten';
// 	return transformator;
// };

// (<any>emitter.Emitter.prototype).flatten = function() {
// 	return flatten(<any>this);
// }


// export function sample<InOut>(
// 	sampled: inf.IEmitter<InOut>,
// 	...samplers: inf.IEmitter<any>[]
// ) {
// 	function transform(emit: inf.IEmitterFunction<InOut>) {
// 		return function sampleTransform(v: any[], i: Identifier) {
// 			if (i > 0) {
// 				emit(v[0]);
// 			}
// 		};
// 	};
// 	var emitters = samplers.slice();
// 	emitters.splice(0, 0, sampled);
// 	return namedTransformator('sample', emitters, transform);
// };

// (<any>emitter.Emitter.prototype).sampleBy = function(...emitters: inf.IEmitter<any>[]) {
// 	return sample(this, ...emitters);
// }


// export function throttle<InOut>(
// 	deylayInMiliseconds: number,
// 	...emitters: inf.IEmitter<InOut>[]
// ) {
// 	function transform(emit: inf.IEmitterFunction<InOut[]>) {
// 		var accumulated: InOut[] = [];
// 		var accumulating = false;
// 		return function throttleTransform(v: InOut[], i: Identifier) {
// 			accumulated.push(v[i]);
// 			if (!accumulating) {
// 				accumulating = true;
// 				scheduler.scheduleTimeout(
// 					() => {
// 						emit(accumulated);
// 						accumulating = false;
// 						accumulated = [];
// 					},
// 					deylayInMiliseconds
// 				);
// 			}
// 		};
// 	};
// 	return namedTransformator('throttle', emitters, transform, []);
// };

// (<any>emitter.Emitter.prototype).throttle = function(deylayInMiliseconds: number) {
// 	return throttle(deylayInMiliseconds, this)
// };


// // export function dropRepeats<InOut>(
// // 	...emitters: inf.IEmitter<InOut>[]
// // ) {
// // 	var lastValue: InOut;
// // 	function transform(emit: inf.IEmitterFunction<InOut>) {
// // 		return function dropRepeatsTransform(v: InOut[], i: Identifier) {
// // 			if (v[i] !== lastValue) {
// // 				emit(v[i]);
// // 				lastValue = v[i];
// // 			}
// // 		};
// // 	};
// // 	return namedTransformator('drop repeats', emitters, transform);
// // };

// // (<any>emitter.Emitter.prototype).dropRepeats = function() {
// // 	return dropRepeats(this);
// // };


// function callIfFunction<Out, Arg1, Arg2>(
// 	obj: Out | ((arg1: Arg1, arg2: Arg2) => Out), arg1: Arg1, arg2: Arg2
// ): Out {
// 	if (typeof obj === 'function') {
// 		return (<((arg1: Arg1, arg2: Arg2) => Out)>obj)(arg1, arg2);
// 	}
// 	else {
// 		return <Out>obj;
// 	}
// }


// export function change<Out, OtherOut>(
// 	switchers: { when: inf.IEmitter<OtherOut>, to: (x: Out, y: OtherOut) => inf.IEmitter<Out> }[],
// 	emitter: inf.IEmitter<Out>
// ) {
// 	function transform(emit: inf.IEmitterFunction<Out>) {
// 		return function changeTransform(v: (Out | OtherOut)[], i: Identifier) {
// 			if (i == 0){
// 				emit(<Out>v[0]);
// 			}
// 			else if (v[i] !== undefined){
// 				var to = switchers[i - 1].to;
// 				var e = callIfFunction(to, <Out>v[0], <OtherOut>v[i]);
// 				this._wires[0].unplug();
// 				this._wires[0] = new Wire(
// 					e,
// 					this,
// 					(x: Out) => this.receiveOn(x, 0)
// 				);
// 			}
// 		}
// 	}
// 	var allEmitters: inf.IEmitter<OtherOut | Out>[] = switchers.map(s => s.when);
// 	allEmitters.splice(0, 0, emitter);
// 	return namedTransformator('change', allEmitters, transform);
// }

// (<any>emitter.Emitter.prototype).change = function changeToWhen<OtherOut, Out>(
// 	...switchers: { when: inf.IEmitter<OtherOut>, to: (x: Out, y: OtherOut) => inf.IEmitter<Out> }[]
// ) {
// 	return change(switchers, this);
// }


// export function changes<Out>(
// 	...emitters: inf.IEmitter<Out>[]
// ) {
// 	var previousValue: Out;
// 	function transform(emit: inf.IEmitterFunction<{ previous: Out, current: Out }>) {
// 		return function changesTransform(v: Out[], i: number){
// 			if (previousValue !== v[i]){
// 				emit({
// 					previous: previousValue,
// 					current: v[i]
// 				});
// 				previousValue = v[i];
// 			}
// 		}
// 	}
// 	return namedTransformator('change', emitters, transform);
// };

// (<any>emitter.Emitter.prototype).changes = function onlyChanges<Out>() {
// 	return changes(this);
// }


// export function transformTime<Out>(
// 	initialValue: Out,
// 	timeTransformation: (t: number) => number,
// 	t0: number,
// 	...emitters: Array<inf.IEmitter<Out>>
// ) {
// 	var firstEmitted = false;
// 	function transform(emit: inf.IEmitterFunction<Out>) {
// 		return function timeTransform(v: Out[], i: number){
// 			if (firstEmitted){
// 				var delay = timeTransformation(scheduler.now() - t0) + t0 - scheduler.now();
// 				var toEmit = v[i];
// 				scheduler.scheduleTimeout(
// 					() => emit(toEmit), delay
// 				);
// 			}
// 			else {
// 				emit(v[i]);
// 				firstEmitted = true;
// 			}
// 		}
// 	}
// 	return namedTransformator('transform time', emitters, transform, initialValue);
// }

// (<any>emitter.Emitter.prototype).transformTime = function transformTimeWith<Out>(
// 	initialValue: Out,
// 	timeTransformation: (t: number) => number,
// 	t0?: number
// ) {
// 	var t0 = t0 || 0;
// 	return transformTime(initialValue, timeTransformation, t0, this);
// }

// export function hold<InOut>(
// 	initialValue: InOut,
// 	...emitters: inf.IEmitter<InOut>[]
// ) {
// 	function transform(emit: inf.IEmitterFunction<InOut>) {
// 		return function holdTransform(v: InOut[], i: Identifier) {
// 			if (v[i] !== undefined) {
// 				emit(v[i]);
// 			}
// 		}
// 	}
// 	return namedTransformator('filter', emitters, transform, initialValue);
// };

// (<any>emitter.Emitter.prototype).hold = function holdValueOf<Out>(
// 	initialValue: Out
// ) {
// 	return hold(initialValue, this)
// };
