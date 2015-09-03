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
		'map',
		emitters,
		transformators.map(mapping, emitters.length),
		mapping.apply(null, emitters.map(e => e.dirtyCurrentValue()))
	);
};

export function mapMany<Out>(
    mapping: (...vs: any[]) => Out,
    ...emitters: inf.IEmitter<any>[]
): inf.IEmitter<Out> {
    return namedTransformator(
        'map many',
        emitters,
        transformators.map(mapping, emitters.length),
        mapping.apply(null, emitters.map(e => e.dirtyCurrentValue()))
    );
}

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
		'filter',
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
		'filter map',
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
        'accumulate',
        emitters,
        transformators.accumulate(acc, accumulator),
        acc
    );
}

export function merge<T>(...emitters: inf.IEmitter < T > []): inf.IEmitter < T > {
    return namedTransformator(
        'merge',
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
        'cumulate',
        [emitter],
        transformators.cumulateOverTime(overInMs),
        eevent.notHappend
    );
}


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
        'hold',
        [emitter],
        transform,
        initialValue
    );
};


export function changes<InOut>(
    emitter: inf.IEmitter<InOut>
): inf.IEmitter<eevent<{ previous: InOut, next: InOut }>> {
    var previous = emitter.dirtyCurrentValue();
    function transform(
        emit: inf.IEmitterFunction<eevent<{ previous: InOut, next: InOut }>>,
        impulse: inf.IEmitterFunction<eevent<{ previous: InOut, next: InOut }>>
    ) {
        return function changesTransform(v: InOut[], i: number) {
            impulse(eevent.of({
                previous: previous,
                next: v[i]
            }));
            previous = v[i];
        }
    }
    return namedTransformator(
        'changes',
        [emitter],
        transform,
        eevent.notHappend
    )
}


export function skipFirst<InOut>(
    emitter: inf.IEmitter<eevent<InOut>>
): inf.IEmitter<eevent<InOut>> {
    function transform(emit: inf.IEmitterFunction<eevent<InOut>>, impulse: inf.IEmitterFunction<eevent<InOut>>) {
        var skipped = false;
        return function skipFirstTransform(v: eevent<InOut>[], i: number) {
            if (v[i].happend) {
                if (skipped) {
                    impulse(v[i]);
                }
                else {
                    skipped = true;
                }
            }
        }
    }
    return namedTransformator(
        'skip 1',
        [emitter],
        transform,
        eevent.notHappend
    );
};

// semantics:
// f_a :: t -> (t -> a)
// flatten(f_a) = f(t)
// flatten(f_a)(t) = f(t)(t)
export function flatten<InOut>(
    emitter: inf.IEmitter<inf.IEmitter<InOut>>
): inf.IEmitter<InOut> {
    var transformator = namedTransformator(
        'flatten',
        [emitter, emitter.dirtyCurrentValue()],
        transform,
        emitter.dirtyCurrentValue().dirtyCurrentValue()
    );
    function transform(emit: inf.IEmitterFunction<InOut>) {
        return function flattenTransform(v: any[], i: number) {
            if (i == 0) {
                transformator.dropEmitters(1);
                transformator.plugEmitter(v[0]);
                emit(v[0].dirtyCurrentValue());
            }
            else {
                emit(v[i])
            }
        }
    };
    return transformator;
};

// semantics:
// f_a :: t -> [t -> a]
// flatten(f_a) = f(t)
// flatten(f_a)(t) = f(t).map(g => g(t))
export function flattenMany<InOut>(
    emitter: inf.IEmitter<inf.IEmitter<InOut>[]>
): inf.IEmitter<InOut[]> {
    var currentValues = emitter.dirtyCurrentValue().map(e => e.dirtyCurrentValue());
    var transformator = namedTransformator(
        'flatten many',
        [<inf.IEmitter<any>>emitter].concat(emitter.dirtyCurrentValue()),
        transform,
        currentValues
    );
    function transform(emit: inf.IEmitterFunction<InOut[]>) {
        return function flattenTransform(v: any[], i: number) {
            if (i == 0) {
                transformator.dropEmitters(1);
                v[0].forEach((e: any) => transformator.plugEmitter(e));
                emit(v[0].map((e: any) => e.dirtyCurrentValue()));
            }
            else {
                emit(v.slice(1));
            }
        }
    };

    return transformator;
}
