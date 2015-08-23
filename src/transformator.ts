import inf = require('./interfaces');
import emitter = require('./emitter');
var namedTransformator = emitter.namedTransformator;
import transformators = require('./transformator-helpers');
import eevent = require('../src/electric-event');


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
export function map<In1, In2, In3, In4, In5, In6, In7, Out>(
    mapping:
        ((v1: In1) => Out) |
        ((v1: In1, v2: In2) => Out) |
        ((v1: In1, v2: In2, v3: In3) => Out) |
        ((v1: In1, v2: In2, v3: In3, v4: In4) => Out) |
        ((v1: In1, v2: In2, v3: In3, v4: In4, v5: In5) => Out) |
        ((v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6) => Out) |
        ((v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6, v7: In7) => Out),
    emitter1: inf.IEmitter<In1>, emitter2?: inf.IEmitter<In2>, emitter3?: inf.IEmitter<In3>, emitter4?: inf.IEmitter<In4>, emitter5?: inf.IEmitter<In5>, emitter6?: inf.IEmitter<In6>, emitter7?: inf.IEmitter<In7>
): inf.IEmitter<Out> {
    var emitters = <inf.IEmitter<any>[]>Array.prototype.slice.apply(arguments, [1]);
    return namedTransformator(
		'map<' + emitters.map(e => e.name).join(', ') + '>',
		emitters,
		transformators.map(mapping, emitters.length),
		mapping.apply(null, emitters.map(e => e.dirtyCurrentValue()))
	);
};

export function filter<InOut>(
    initialValue: InOut,
    predicate: (v1: InOut) => boolean,
    emitter1: inf.IEmitter<InOut>
): inf.IEmitter<InOut>;
export function filter<InOut> (
    initialValue: InOut,
    predicate: (v1: InOut, v2: InOut) => boolean,
    emitter1: inf.IEmitter<InOut>, emitter2: inf.IEmitter<InOut>
): inf.IEmitter<InOut>;
export function filter<InOut> (
    initialValue: InOut,
    predicate: (v1: InOut, v2: InOut, v3: InOut) => boolean,
    emitter1: inf.IEmitter<InOut>, emitter2: inf.IEmitter<InOut>, emitter3: inf.IEmitter<InOut>
): inf.IEmitter<InOut>;
export function filter<InOut> (
    initialValue: InOut,
    predicate: (v1: InOut, v2: InOut, v3: InOut, v4: InOut) => boolean,
    emitter1: inf.IEmitter<InOut>, emitter2: inf.IEmitter<InOut>, emitter3: inf.IEmitter<InOut>, emitter4: inf.IEmitter<InOut>
): inf.IEmitter<InOut>;
export function filter<InOut> (
    initialValue: InOut,
    predicate: (v1: InOut, v2: InOut, v3: InOut, v4: InOut, v5: InOut) => boolean,
    emitter1: inf.IEmitter<InOut>, emitter2: inf.IEmitter<InOut>, emitter3: inf.IEmitter<InOut>, emitter4: inf.IEmitter<InOut>, emitter5: inf.IEmitter<InOut>
): inf.IEmitter<InOut>;
export function filter<InOut> (
    initialValue: InOut,
    predicate: (v1: InOut, v2: InOut, v3: InOut, v4: InOut, v5: InOut, v6: InOut) => boolean,
    emitter1: inf.IEmitter<InOut>, emitter2: inf.IEmitter<InOut>, emitter3: inf.IEmitter<InOut>, emitter4: inf.IEmitter<InOut>, emitter5: inf.IEmitter<InOut>, emitter6: inf.IEmitter<InOut>
): inf.IEmitter<InOut>;
export function filter<InOut> (
    initialValue: InOut,
    predicate: (v1: InOut, v2: InOut, v3: InOut, v4: InOut, v5: InOut, v6: InOut, v7: InOut) => boolean,
    emitter1: inf.IEmitter<InOut>, emitter2: inf.IEmitter<InOut>, emitter3: inf.IEmitter<InOut>, emitter4: inf.IEmitter<InOut>, emitter5: inf.IEmitter<InOut>, emitter6: inf.IEmitter<InOut>, emitter7: inf.IEmitter<InOut>
): inf.IEmitter<InOut>;
export function filter<InOut> (
	initialValue: InOut,
	predicate:
        ((v1: InOut) => boolean) |
        ((v1: InOut, v2: InOut) => boolean) |
        ((v1: InOut, v2: InOut, v3: InOut) => boolean) |
        ((v1: InOut, v2: InOut, v3: InOut, v4: InOut) => boolean) |
        ((v1: InOut, v2: InOut, v3: InOut, v4: InOut, v5: InOut) => boolean) |
        ((v1: InOut, v2: InOut, v3: InOut, v4: InOut, v5: InOut, v6: InOut) => boolean) |
        ((v1: InOut, v2: InOut, v3: InOut, v4: InOut, v5: InOut, v6: InOut, v7: InOut) => boolean),
    emitter1: inf.IEmitter<InOut>, emitter2?: inf.IEmitter<InOut>, emitter3?: inf.IEmitter<InOut>, emitter4?: inf.IEmitter<InOut>, emitter5?: inf.IEmitter<InOut>, emitter6?: inf.IEmitter<InOut>, emitter7?: inf.IEmitter<InOut>
): inf.IEmitter<InOut> {
    var emitters = <inf.IEmitter<any>[]>Array.prototype.slice.apply(arguments, [2]);
    return namedTransformator(
		'filter<' + emitters.map(e => e.name).join(', ') + '>',
		emitters,
		transformators.filter(predicate, emitters.length),
		initialValue
	);
};

export function filterMap<In1, Out>(
    initialValue: Out,
    filterMapping: (v1: In1) => Out | void,
    emitter1: inf.IEmitter<In1>
): inf.IEmitter<Out>;
export function filterMap<In1, In2, Out>(
    initialValue: Out,
    filterMapping: (v1: In1, v2: In2) => Out | void,
    emitter1: inf.IEmitter<In1>, emitter2: inf.IEmitter<In2>
): inf.IEmitter<Out>;
export function filterMap<In1, In2, In3, Out>(
    initialValue: Out,
    filterMapping: (v1: In1, v2: In2, v3: In3) => Out | void,
    emitter1: inf.IEmitter<In1>, emitter2: inf.IEmitter<In2>, emitter3: inf.IEmitter<In3>
): inf.IEmitter<Out>;
export function filterMap<In1, In2, In3, In4, Out>(
    initialValue: Out,
    filterMapping: (v1: In1, v2: In2, v3: In3, v4: In4) => Out | void,
    emitter1: inf.IEmitter<In1>, emitter2: inf.IEmitter<In2>, emitter3: inf.IEmitter<In3>, emitter4: inf.IEmitter<In4>
): inf.IEmitter<Out>;
export function filterMap<In1, In2, In3, In4, In5, Out>(
    initialValue: Out,
    filterMapping: (v1: In1, v2: In2, v3: In3, v4: In4, v5: In5) => Out | void,
    emitter1: inf.IEmitter<In1>, emitter2: inf.IEmitter<In2>, emitter3: inf.IEmitter<In3>, emitter4: inf.IEmitter<In4>, emitter5: inf.IEmitter<In5>
): inf.IEmitter<Out>;
export function filterMap<In1, In2, In3, In4, In5, In6, Out>(
    initialValue: Out,
    filterMapping: (v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6) => Out | void,
    emitter1: inf.IEmitter<In1>, emitter2: inf.IEmitter<In2>, emitter3: inf.IEmitter<In3>, emitter4: inf.IEmitter<In4>, emitter5: inf.IEmitter<In5>, emitter6: inf.IEmitter<In6>
): inf.IEmitter<Out>;
export function filterMap<In1, In2, In3, In4, In5, In6, In7, Out>(
    initialValue: Out,
    filterMapping: (v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6, v7: In7) => Out | void,
    emitter1: inf.IEmitter<In1>, emitter2: inf.IEmitter<In2>, emitter3: inf.IEmitter<In3>, emitter4: inf.IEmitter<In4>, emitter5: inf.IEmitter<In5>, emitter6: inf.IEmitter<In6>, emitter7: inf.IEmitter<In7>
): inf.IEmitter<Out>;
export function filterMap<In1, In2, In3, In4, In5, In6, In7, Out>(
	initialValue: Out,
	filterMapping:
        ((v1: In1) => Out | void) |
        ((v1: In1, v2: In2) => Out | void) |
        ((v1: In1, v2: In2, v3: In3) => Out | void) |
        ((v1: In1, v2: In2, v3: In3, v4: In4) => Out | void) |
        ((v1: In1, v2: In2, v3: In3, v4: In4, v5: In5) => Out | void) |
        ((v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6) => Out | void) |
        ((v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6, v7: In7) => Out | void),
    emitter1: inf.IEmitter<In1>, emitter2?: inf.IEmitter<In2>, emitter3?: inf.IEmitter<In3>, emitter4?: inf.IEmitter<In4>, emitter5?: inf.IEmitter<In5>, emitter6?: inf.IEmitter<In6>, emitter7?: inf.IEmitter<In7>
): inf.IEmitter<Out> {
    var emitters = <inf.IEmitter<any>[]>Array.prototype.slice.apply(arguments, [2]);
    return namedTransformator(
		'filterMap<' + emitters.map(e => e.name).join(', ') + '>',
		emitters,
		transformators.filterMap(filterMapping, emitters.length),
		initialValue
	);
};


export function accumulate<In1, Out>(
    initialValue: Out,
    accumulator: (acc: Out, v1: In1) => Out,
    emitter1: inf.IEmitter<In1>
    ): inf.IEmitter<Out>;
export function accumulate<In1, In2, Out>(
    initialValue: Out,
    accumulator: (acc: Out, v1: In1, v2: In2) => Out,
    emitter1: inf.IEmitter<In1>, emitter2: inf.IEmitter<In2>
    ): inf.IEmitter<Out>;
export function accumulate<In1, In2, In3, Out>(
    initialValue: Out,
    accumulator: (acc: Out, v1: In1, v2: In2, v3: In3) => Out,
    emitter1: inf.IEmitter<In1>, emitter2: inf.IEmitter<In2>, emitter3: inf.IEmitter<In3>
    ): inf.IEmitter<Out>;
export function accumulate<In1, In2, In3, In4, Out>(
    initialValue: Out,
    accumulator: (acc: Out, v1: In1, v2: In2, v3: In3, v4: In4) => Out,
    emitter1: inf.IEmitter<In1>, emitter2: inf.IEmitter<In2>, emitter3: inf.IEmitter<In3>, emitter4: inf.IEmitter<In4>
    ): inf.IEmitter<Out>;
export function accumulate<In1, In2, In3, In4, In5, Out>(
    initialValue: Out,
    accumulator: (acc: Out, v1: In1, v2: In2, v3: In3, v4: In4, v5: In5) => Out,
    emitter1: inf.IEmitter<In1>, emitter2: inf.IEmitter<In2>, emitter3: inf.IEmitter<In3>, emitter4: inf.IEmitter<In4>, emitter5: inf.IEmitter<In5>
    ): inf.IEmitter<Out>;
export function accumulate<In1, In2, In3, In4, In5, In6, Out>(
    initialValue: Out,
    accumulator: (acc: Out, v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6) => Out,
    emitter1: inf.IEmitter<In1>, emitter2: inf.IEmitter<In2>, emitter3: inf.IEmitter<In3>, emitter4: inf.IEmitter<In4>, emitter5: inf.IEmitter<In5>, emitter6: inf.IEmitter<In6>
    ): inf.IEmitter<Out>;
export function accumulate<In1, In2, In3, In4, In5, In6, In7, Out>(
    initialValue: Out,
    accumulator: (acc: Out, v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6, v7: In7) => Out,
    emitter1: inf.IEmitter<In1>, emitter2: inf.IEmitter<In2>, emitter3: inf.IEmitter<In3>, emitter4: inf.IEmitter<In4>, emitter5: inf.IEmitter<In5>, emitter6: inf.IEmitter<In6>, emitter7: inf.IEmitter<In7>
): inf.IEmitter<Out>;
export function accumulate<In1, In2, In3, In4, In5, In6, In7, Out>(
    initialValue: Out,
    accumulator:
        ((acc: Out, v1: In1) => Out) |
        ((acc: Out, v1: In1, v2: In2) => Out) |
        ((acc: Out, v1: In1, v2: In2, v3: In3) => Out) |
        ((acc: Out, v1: In1, v2: In2, v3: In3, v4: In4) => Out) |
        ((acc: Out, v1: In1, v2: In2, v3: In3, v4: In4, v5: In5) => Out) |
        ((acc: Out, v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6) => Out) |
        ((acc: Out, v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6, v7: In7) => Out),
    emitter1: inf.IEmitter<In1>, emitter2?: inf.IEmitter<In2>, emitter3?: inf.IEmitter<In3>, emitter4?: inf.IEmitter<In4>, emitter5?: inf.IEmitter<In5>, emitter6?: inf.IEmitter<In6>, emitter7?: inf.IEmitter<In7>
): inf.IEmitter<Out> {
    var emitters = <inf.IEmitter<any>[]>Array.prototype.slice.apply(arguments, [2]);
    var acc = accumulator.apply([], [initialValue].concat(emitters.map(e => e.dirtyCurrentValue())));
    return namedTransformator(
        'accumulate<' + emitters.map(e => e.name).join(', ') + '>',
        emitters,
        transformators.accumulate(acc, accumulator),
        acc
    );
}

export function merge<T>(...emitters: inf.IEmitter < T > []): inf.IEmitter < T > {
    return namedTransformator(
        'merge<' + emitters.map(e => e.name).join(', ') + '>',
        emitters,
        transformators.merge(),
        emitters[0].dirtyCurrentValue()
    );
}


export function cumulateOverTime<T>(
    emitter: inf.IEmitter<eevent<T>>,
    overInMs: number
): inf.IEmitter <eevent<T[]>> {
    return namedTransformator(
        'cumulate<' + emitter + '> over ' + overInMs + 'ms',
        [emitter],
        transformators.cumulateOverTime(overInMs),
        eevent.notHappend
    );
}

// what are semantics of flatten!?
export function flatten<InOut>(
    emitter: inf.IEmitter<inf.IEmitter<InOut>>
): inf.IEmitter<InOut> {
    var transformator = namedTransformator(
        'flatten<' + emitter.name + '>',
        [emitter, emitter.dirtyCurrentValue()],
        transform,
        emitter.dirtyCurrentValue().dirtyCurrentValue()
    );
    // var transformator = new Transformator([]);
    function transform(emit: inf.IEmitterFunction<InOut>) {
        return function flattenTransform(v: any[], i: number) {
            if (i == 0){
                transformator.plugEmitter(v[i]);
                emit(v[i].dirtyCurrentValue())
            }
            else {
                emit(v[i])
            }
        }
    };
    return transformator;
};




export function hold<InOut>(
	initialValue: InOut,
	emitter: inf.IEmitter<eevent<InOut>>
): inf.IEmitter<InOut> {
	function transform(emit: inf.IEmitterFunction<InOut>) {
		return function holdTransform(v: eevent<InOut>[], i: number) {
			if (v[i].happend) {
				emit(v[i].value);
			}
		}
	}
    return namedTransformator(
        'hold<' + emitter.name + '>',
        [emitter],
        transform,
        initialValue
    );
};
