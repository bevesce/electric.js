var emitter = require('./emitter');
var namedTransformator = emitter.namedTransformator;
var transformators = require('./transformator-helpers');
var eevent = require('../src/electric-event');
function map(mapping, emitter1, emitter2, emitter3, emitter4, emitter5, emitter6, emitter7) {
    var emitters = Array.prototype.slice.apply(arguments, [1]);
    return namedTransformator('map<' + emitters.map(function (e) { return e.name; }).join(', ') + '>', emitters, transformators.map(mapping, emitters.length), mapping.apply(null, emitters.map(function (e) { return e.dirtyCurrentValue(); })));
}
exports.map = map;
;
function filter(initialValue, predicate, emitter1, emitter2, emitter3, emitter4, emitter5, emitter6, emitter7) {
    var emitters = Array.prototype.slice.apply(arguments, [2]);
    return namedTransformator('filter<' + emitters.map(function (e) { return e.name; }).join(', ') + '>', emitters, transformators.filter(predicate, emitters.length), initialValue);
}
exports.filter = filter;
;
function filterMap(initialValue, filterMapping, emitter1, emitter2, emitter3, emitter4, emitter5, emitter6, emitter7) {
    var emitters = Array.prototype.slice.apply(arguments, [2]);
    return namedTransformator('filterMap<' + emitters.map(function (e) { return e.name; }).join(', ') + '>', emitters, transformators.filterMap(filterMapping, emitters.length), initialValue);
}
exports.filterMap = filterMap;
;
function accumulate(initialValue, accumulator, emitter1, emitter2, emitter3, emitter4, emitter5, emitter6, emitter7) {
    var emitters = Array.prototype.slice.apply(arguments, [2]);
    var acc = accumulator.apply([], [initialValue].concat(emitters.map(function (e) { return e.dirtyCurrentValue(); })));
    return namedTransformator('accumulate<' + emitters.map(function (e) { return e.name; }).join(', ') + '>', emitters, transformators.accumulate(acc, accumulator), acc);
}
exports.accumulate = accumulate;
function merge() {
    var emitters = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        emitters[_i - 0] = arguments[_i];
    }
    return namedTransformator('merge<' + emitters.map(function (e) { return e.name; }).join(', ') + '>', emitters, transformators.merge(), emitters[0].dirtyCurrentValue());
}
exports.merge = merge;
function cumulateOverTime(emitter, overInMs) {
    return namedTransformator('cumulate<' + emitter + '> over ' + overInMs + 'ms', [emitter], transformators.cumulateOverTime(overInMs), eevent.notHappend);
}
exports.cumulateOverTime = cumulateOverTime;
// what are semantics of flatten!?
function flatten(emitter) {
    var transformator = namedTransformator('flatten<' + emitter.name + '>', [emitter, emitter.dirtyCurrentValue()], transform, emitter.dirtyCurrentValue().dirtyCurrentValue());
    // var transformator = new Transformator([]);
    function transform(emit) {
        return function flattenTransform(v, i) {
            if (i == 0) {
                transformator.plugEmitter(v[i]);
                emit(v[i].dirtyCurrentValue());
            }
            else {
                emit(v[i]);
            }
        };
    }
    ;
    return transformator;
}
exports.flatten = flatten;
;
function hold(initialValue, emitter) {
    function transform(emit) {
        return function holdTransform(v, i) {
            if (v[i].happend) {
                emit(v[i].value);
            }
        };
    }
    return namedTransformator('hold<' + emitter.name + '>', [emitter], transform, initialValue);
}
exports.hold = hold;
;