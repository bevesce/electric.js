import EmitFunction = require('./interfaces/t-to-void');
import emitter = require('./emitter');
import transformators = require('./transformator-helpers');
import eevent = require('../src/electric-event');
import fn = require('./utils/fn');
import mapObj = require('./utils/map-obj');
import objKeys = require('./utils/objKeys');

var namedTransformator = emitter.namedTransformator;


export function map<In1, Out>(
    mapping: (v1: In1) => Out,
    emitter1: emitter.Emitter<In1>
): emitter.Emitter<Out>;
export function map<In1, In2, Out>(
    mapping: (v1: In1, v2: In2) => Out,
    emitter1: emitter.Emitter<In1>, emitter2: emitter.Emitter<In2>
): emitter.Emitter<Out>;
export function map<In1, In2, In3, Out>(
    mapping: (v1: In1, v2: In2, v3: In3) => Out,
    emitter1: emitter.Emitter<In1>, emitter2: emitter.Emitter<In2>, emitter3: emitter.Emitter<In3>
): emitter.Emitter<Out>;
export function map<In1, In2, In3, In4, Out>(
    mapping: (v1: In1, v2: In2, v3: In3, v4: In4) => Out,
    emitter1: emitter.Emitter<In1>, emitter2: emitter.Emitter<In2>, emitter3: emitter.Emitter<In3>, emitter4: emitter.Emitter<In4>
): emitter.Emitter<Out>;
export function map<In1, In2, In3, In4, In5, Out>(
    mapping: (v1: In1, v2: In2, v3: In3, v4: In4, v5: In5) => Out,
    emitter1: emitter.Emitter<In1>, emitter2: emitter.Emitter<In2>, emitter3: emitter.Emitter<In3>, emitter4: emitter.Emitter<In4>, emitter5: emitter.Emitter<In5>
): emitter.Emitter<Out>;
export function map<In1, In2, In3, In4, In5, In6, Out>(
    mapping: (v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6) => Out,
    emitter1: emitter.Emitter<In1>, emitter2: emitter.Emitter<In2>, emitter3: emitter.Emitter<In3>, emitter4: emitter.Emitter<In4>, emitter5: emitter.Emitter<In5>, emitter6: emitter.Emitter<In6>
): emitter.Emitter<Out>;
export function map<In1, In2, In3, In4, In5, In6, In7, Out>(
    mapping: (v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6, v7: In7) => Out,
    emitter1: emitter.Emitter<In1>, emitter2: emitter.Emitter<In2>, emitter3: emitter.Emitter<In3>, emitter4: emitter.Emitter<In4>, emitter5: emitter.Emitter<In5>, emitter6: emitter.Emitter<In6>, emitter7: emitter.Emitter<In7>
): emitter.Emitter<Out>;
export function map<In1, In2, In3, In4, In5, In6, In7, Out>(
    mapping:
        ((v1: In1) => Out) |
        ((v1: In1, v2: In2) => Out) |
        ((v1: In1, v2: In2, v3: In3) => Out) |
        ((v1: In1, v2: In2, v3: In3, v4: In4) => Out) |
        ((v1: In1, v2: In2, v3: In3, v4: In4, v5: In5) => Out) |
        ((v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6) => Out) |
        ((v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6, v7: In7) => Out),
    emitter1: emitter.Emitter<In1>, emitter2?: emitter.Emitter<In2>, emitter3?: emitter.Emitter<In3>, emitter4?: emitter.Emitter<In4>, emitter5?: emitter.Emitter<In5>, emitter6?: emitter.Emitter<In6>, emitter7?: emitter.Emitter<In7>
): emitter.Emitter<Out> {
    var emitters = <emitter.Emitter<any>[]>Array.prototype.slice.apply(arguments, [1]);
    return namedTransformator(
		`map(${fn(mapping)})`,
		emitters,
		transformators.map(mapping, emitters.length),
		mapping.apply(null, emitters.map(e => e.dirtyCurrentValue()))
	);
};

export function mapMany<Out>(
    mapping: (...vs: any[]) => Out,
    ...emitters: emitter.Emitter<any>[]
): emitter.Emitter<Out> {
    return namedTransformator(
        `mapMany(${fn(mapping)})`,
        emitters,
        transformators.map(mapping, emitters.length),
        mapping.apply(null, emitters.map(e => e.dirtyCurrentValue()))
    );
}

export function filter<InOut>(
    initialValue: InOut,
    predicate: (v1: InOut) => boolean,
    emitter1: emitter.Emitter<InOut>
): emitter.Emitter<InOut>;
export function filter<InOut> (
    initialValue: InOut,
    predicate: (v1: InOut, v2: InOut) => boolean,
    emitter1: emitter.Emitter<InOut>, emitter2: emitter.Emitter<InOut>
): emitter.Emitter<InOut>;
export function filter<InOut> (
    initialValue: InOut,
    predicate: (v1: InOut, v2: InOut, v3: InOut) => boolean,
    emitter1: emitter.Emitter<InOut>, emitter2: emitter.Emitter<InOut>, emitter3: emitter.Emitter<InOut>
): emitter.Emitter<InOut>;
export function filter<InOut> (
    initialValue: InOut,
    predicate: (v1: InOut, v2: InOut, v3: InOut, v4: InOut) => boolean,
    emitter1: emitter.Emitter<InOut>, emitter2: emitter.Emitter<InOut>, emitter3: emitter.Emitter<InOut>, emitter4: emitter.Emitter<InOut>
): emitter.Emitter<InOut>;
export function filter<InOut> (
    initialValue: InOut,
    predicate: (v1: InOut, v2: InOut, v3: InOut, v4: InOut, v5: InOut) => boolean,
    emitter1: emitter.Emitter<InOut>, emitter2: emitter.Emitter<InOut>, emitter3: emitter.Emitter<InOut>, emitter4: emitter.Emitter<InOut>, emitter5: emitter.Emitter<InOut>
): emitter.Emitter<InOut>;
export function filter<InOut> (
    initialValue: InOut,
    predicate: (v1: InOut, v2: InOut, v3: InOut, v4: InOut, v5: InOut, v6: InOut) => boolean,
    emitter1: emitter.Emitter<InOut>, emitter2: emitter.Emitter<InOut>, emitter3: emitter.Emitter<InOut>, emitter4: emitter.Emitter<InOut>, emitter5: emitter.Emitter<InOut>, emitter6: emitter.Emitter<InOut>
): emitter.Emitter<InOut>;
export function filter<InOut> (
    initialValue: InOut,
    predicate: (v1: InOut, v2: InOut, v3: InOut, v4: InOut, v5: InOut, v6: InOut, v7: InOut) => boolean,
    emitter1: emitter.Emitter<InOut>, emitter2: emitter.Emitter<InOut>, emitter3: emitter.Emitter<InOut>, emitter4: emitter.Emitter<InOut>, emitter5: emitter.Emitter<InOut>, emitter6: emitter.Emitter<InOut>, emitter7: emitter.Emitter<InOut>
): emitter.Emitter<InOut>;
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
    emitter1: emitter.Emitter<InOut>, emitter2?: emitter.Emitter<InOut>, emitter3?: emitter.Emitter<InOut>, emitter4?: emitter.Emitter<InOut>, emitter5?: emitter.Emitter<InOut>, emitter6?: emitter.Emitter<InOut>, emitter7?: emitter.Emitter<InOut>
): emitter.Emitter<InOut> {
    var emitters = <emitter.Emitter<any>[]>Array.prototype.slice.apply(arguments, [2]);
    return namedTransformator(
        `filter(${fn(predicate)})`,
		emitters,
		transformators.filter(predicate, emitters.length),
		initialValue
	);
};

export function filterMap<In1, Out>(
    initialValue: Out,
    filterMapping: (v1: In1) => Out | void,
    emitter1: emitter.Emitter<In1>
): emitter.Emitter<Out>;
export function filterMap<In1, In2, Out>(
    initialValue: Out,
    filterMapping: (v1: In1, v2: In2) => Out | void,
    emitter1: emitter.Emitter<In1>, emitter2: emitter.Emitter<In2>
): emitter.Emitter<Out>;
export function filterMap<In1, In2, In3, Out>(
    initialValue: Out,
    filterMapping: (v1: In1, v2: In2, v3: In3) => Out | void,
    emitter1: emitter.Emitter<In1>, emitter2: emitter.Emitter<In2>, emitter3: emitter.Emitter<In3>
): emitter.Emitter<Out>;
export function filterMap<In1, In2, In3, In4, Out>(
    initialValue: Out,
    filterMapping: (v1: In1, v2: In2, v3: In3, v4: In4) => Out | void,
    emitter1: emitter.Emitter<In1>, emitter2: emitter.Emitter<In2>, emitter3: emitter.Emitter<In3>, emitter4: emitter.Emitter<In4>
): emitter.Emitter<Out>;
export function filterMap<In1, In2, In3, In4, In5, Out>(
    initialValue: Out,
    filterMapping: (v1: In1, v2: In2, v3: In3, v4: In4, v5: In5) => Out | void,
    emitter1: emitter.Emitter<In1>, emitter2: emitter.Emitter<In2>, emitter3: emitter.Emitter<In3>, emitter4: emitter.Emitter<In4>, emitter5: emitter.Emitter<In5>
): emitter.Emitter<Out>;
export function filterMap<In1, In2, In3, In4, In5, In6, Out>(
    initialValue: Out,
    filterMapping: (v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6) => Out | void,
    emitter1: emitter.Emitter<In1>, emitter2: emitter.Emitter<In2>, emitter3: emitter.Emitter<In3>, emitter4: emitter.Emitter<In4>, emitter5: emitter.Emitter<In5>, emitter6: emitter.Emitter<In6>
): emitter.Emitter<Out>;
export function filterMap<In1, In2, In3, In4, In5, In6, In7, Out>(
    initialValue: Out,
    filterMapping: (v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6, v7: In7) => Out | void,
    emitter1: emitter.Emitter<In1>, emitter2: emitter.Emitter<In2>, emitter3: emitter.Emitter<In3>, emitter4: emitter.Emitter<In4>, emitter5: emitter.Emitter<In5>, emitter6: emitter.Emitter<In6>, emitter7: emitter.Emitter<In7>
): emitter.Emitter<Out>;
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
    emitter1: emitter.Emitter<In1>, emitter2?: emitter.Emitter<In2>, emitter3?: emitter.Emitter<In3>, emitter4?: emitter.Emitter<In4>, emitter5?: emitter.Emitter<In5>, emitter6?: emitter.Emitter<In6>, emitter7?: emitter.Emitter<In7>
): emitter.Emitter<Out> {
    var emitters = <emitter.Emitter<any>[]>Array.prototype.slice.apply(arguments, [2]);
    return namedTransformator(
		`filterMap(${fn(filterMapping)})`,
		emitters,
		transformators.filterMap(filterMapping, emitters.length),
		initialValue
	);
};


export function accumulate<In1, Out>(
    initialValue: Out,
    accumulator: (acc: Out, v1: In1) => Out,
    emitter1: emitter.Emitter<In1>
    ): emitter.Emitter<Out>;
export function accumulate<In1, In2, Out>(
    initialValue: Out,
    accumulator: (acc: Out, v1: In1, v2: In2) => Out,
    emitter1: emitter.Emitter<In1>, emitter2: emitter.Emitter<In2>
    ): emitter.Emitter<Out>;
export function accumulate<In1, In2, In3, Out>(
    initialValue: Out,
    accumulator: (acc: Out, v1: In1, v2: In2, v3: In3) => Out,
    emitter1: emitter.Emitter<In1>, emitter2: emitter.Emitter<In2>, emitter3: emitter.Emitter<In3>
    ): emitter.Emitter<Out>;
export function accumulate<In1, In2, In3, In4, Out>(
    initialValue: Out,
    accumulator: (acc: Out, v1: In1, v2: In2, v3: In3, v4: In4) => Out,
    emitter1: emitter.Emitter<In1>, emitter2: emitter.Emitter<In2>, emitter3: emitter.Emitter<In3>, emitter4: emitter.Emitter<In4>
    ): emitter.Emitter<Out>;
export function accumulate<In1, In2, In3, In4, In5, Out>(
    initialValue: Out,
    accumulator: (acc: Out, v1: In1, v2: In2, v3: In3, v4: In4, v5: In5) => Out,
    emitter1: emitter.Emitter<In1>, emitter2: emitter.Emitter<In2>, emitter3: emitter.Emitter<In3>, emitter4: emitter.Emitter<In4>, emitter5: emitter.Emitter<In5>
    ): emitter.Emitter<Out>;
export function accumulate<In1, In2, In3, In4, In5, In6, Out>(
    initialValue: Out,
    accumulator: (acc: Out, v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6) => Out,
    emitter1: emitter.Emitter<In1>, emitter2: emitter.Emitter<In2>, emitter3: emitter.Emitter<In3>, emitter4: emitter.Emitter<In4>, emitter5: emitter.Emitter<In5>, emitter6: emitter.Emitter<In6>
    ): emitter.Emitter<Out>;
export function accumulate<In1, In2, In3, In4, In5, In6, In7, Out>(
    initialValue: Out,
    accumulator: (acc: Out, v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6, v7: In7) => Out,
    emitter1: emitter.Emitter<In1>, emitter2: emitter.Emitter<In2>, emitter3: emitter.Emitter<In3>, emitter4: emitter.Emitter<In4>, emitter5: emitter.Emitter<In5>, emitter6: emitter.Emitter<In6>, emitter7: emitter.Emitter<In7>
): emitter.Emitter<Out>;
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
    emitter1: emitter.Emitter<In1>, emitter2?: emitter.Emitter<In2>, emitter3?: emitter.Emitter<In3>, emitter4?: emitter.Emitter<In4>, emitter5?: emitter.Emitter<In5>, emitter6?: emitter.Emitter<In6>, emitter7?: emitter.Emitter<In7>
): emitter.Emitter<Out> {
    var emitters = <emitter.Emitter<any>[]>Array.prototype.slice.apply(arguments, [2]);
    var acc = accumulator.apply([], [initialValue].concat(emitters.map(e => e.dirtyCurrentValue())));
    return namedTransformator(
        `accumulate(${fn(accumulator)})`,
        emitters,
        transformators.accumulate(acc, accumulator),
        acc
    );
}

export function merge<T>(
    ...emitters: emitter.Emitter <eevent<T>> []):
emitter.Emitter<eevent<T>> {
    return namedTransformator(
        'merge',
        emitters,
        transformators.merge(),
        emitters[0].dirtyCurrentValue()
    );
}


// export function cumulateOverTime<T>(
//     emitter: emitter.Emitter<eevent<T>>,
//     overInMs: number
// ): emitter.Emitter <eevent<T[]>> {
//     return namedTransformator(
//         `cumulateOverTime(${overInMs}ms)`,
//         [emitter],
//         transformators.cumulateOverTime(overInMs),
//         eevent.notHappend
//     );
// }


export function hold<InOut>(
	initialValue: InOut,
	emitter: emitter.Emitter<eevent<InOut>>
): emitter.Emitter<InOut> {
	function transform(emit: EmitFunction<InOut>) {
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
    emitter: emitter.Emitter<InOut>
): emitter.Emitter<eevent<{ previous: InOut, next: InOut }>> {
    return namedTransformator(
        'changes',
        [emitter],
        transformators.changes(emitter.dirtyCurrentValue()),
        eevent.notHappend
    )
}


export function skipFirst<InOut>(
    emitter: emitter.Emitter<eevent<InOut>>
): emitter.Emitter<eevent<InOut>> {
    function transform(emit: EmitFunction<eevent<InOut>>, impulse: EmitFunction<eevent<InOut>>) {
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
        'skip(1)',
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
    emitter: emitter.Emitter<emitter.Emitter<InOut>>
): emitter.Emitter<InOut> {
    var transformator = namedTransformator(
        'flatten',
        [emitter, emitter.dirtyCurrentValue()],
        transform,
        emitter.dirtyCurrentValue().dirtyCurrentValue()
    );
    function transform(emit: EmitFunction<InOut>) {
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
    emitter: emitter.Emitter<emitter.Emitter<InOut>[]>
): emitter.Emitter<InOut[]> {
    var currentValues = emitter.dirtyCurrentValue().map(e => e.dirtyCurrentValue());
    var transformator = namedTransformator(
        'flattenMany',
        [<emitter.Emitter<any>>emitter].concat(emitter.dirtyCurrentValue()),
        transform,
        currentValues
    );
    function transform(emit: EmitFunction<InOut[]>) {
        return function flattenManyTransform(v: any[], i: number) {
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


export function flattenNamed<InOut>(
    emitter: emitter.Emitter<{ [name: string]: emitter.Emitter<InOut> }>
): emitter.Emitter<{ [name: string]: InOut }> {
    var currentValue = emitter.dirtyCurrentValue()
    var currentValues = mapObj(
        currentValue,
        e => e.dirtyCurrentValue()
    );
    var currentKeys = objKeys(currentValue);
    var transformator = namedTransformator(
        'flattenNamed',
        [<emitter.Emitter<any>>emitter].concat(
            currentKeys.map(k => currentValue[k])
        ),
        transform,
        currentValues
    );
    function transform(emit: EmitFunction<{ [name: string]: InOut}>) {
        var keys = currentKeys;
        return function flattenNamedTransform(v: any[], i: number) {
            if (i == 0) {
                transformator.dropEmitters(1);
                keys = objKeys(v[0]);
                keys.forEach(k => {
                    transformator.plugEmitter(v[0][k])
                })
                emit(mapObj(
                    v[0],
                    (e: any) => e.dirtyCurrentValue()
                ));
            }
            else {
                var r: { [name: string]: InOut } = {};
                keys.forEach((k: string, i: number) => {
                    r[k] =  v[i + 1];
                });
                emit(r);
            }
        }
    };
    return transformator;
}


export function unglitch<InOut>(
    emitter: emitter.Emitter<InOut>
): emitter.Emitter<InOut> {
    var transformator = namedTransformator(
        'unglitch',
        [emitter],
        transform,
        emitter.dirtyCurrentValue()
    );
    function transform(emit: EmitFunction<InOut>) {
        var value: InOut;
        return function unglitchTransform(v: any[], i: number) {
            value = v[i];
            setTimeout(() => {
                emit(value)
            }, 0);
        }
    };
    return transformator;
};
