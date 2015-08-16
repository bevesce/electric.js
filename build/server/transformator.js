var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var emitter = require('./emitter');
var scheduler = require('./scheduler');
var Transformator = (function (_super) {
    __extends(Transformator, _super);
    function Transformator(emitters, transform, initialValue) {
        if (transform === void 0) { transform = undefined; }
        if (initialValue === void 0) { initialValue = undefined; }
        _super.call(this, initialValue);
        this._values = Array(emitters.length);
        ;
        if (transform) {
            this.setTransform(transform);
        }
        this._wires = [];
        this.plugEmitters(emitters);
    }
    Transformator.prototype.wire = function (emitter) {
        var _this = this;
        var index = this._wires.length;
        this._wires[index] = new Wire(emitter, this, (function (index) { return function (x) { return _this.receiveOn(x, index); }; })(index));
        return this._wires[index];
    };
    Transformator.prototype.setTransform = function (transform) {
        var _this = this;
        this._transform = transform(function (x) { return _this._emit(x); });
    };
    Transformator.prototype._transform = function (values, index) {
        // Default implementation that just passes values
        // Should be overwritten in functions that create Transformators
        this._emit(values[index]);
    };
    Transformator.prototype.plugEmitters = function (emitters) {
        for (var _i = 0; _i < emitters.length; _i++) {
            var emitter = emitters[_i];
            this.wire(emitter);
        }
    };
    Transformator.prototype.plugEmitter = function (emitter) {
        this.wire(emitter);
        return this._wires.length - 1;
    };
    Transformator.prototype.receiveOn = function (x, index) {
        this._values[index] = x;
        this._transform(this._values, index);
    };
    return Transformator;
})(emitter.Emitter);
exports.Transformator = Transformator;
var Wire = (function () {
    function Wire(input, output, receive) {
        this.input = input;
        this.output = output;
        this.receive = receive;
        this.receiverId = this.input.plugReceiver(this);
    }
    Wire.prototype.unplug = function () {
        this.input.unplugReceiver(this.receiverId);
        this.input = undefined;
        this.output = undefined;
    };
    return Wire;
})();
function generic(emitters, transform) {
    if (transform === void 0) { transform = undefined; }
    return new Transformator(emitters, transform);
}
exports.generic = generic;
;
function namedTransformator(name, emitters, transform, initialValue) {
    var t = new Transformator(emitters, transform, initialValue);
    t.name = name;
    return t;
}
function map(mapping) {
    var emitters = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        emitters[_i - 1] = arguments[_i];
    }
    function transform(emit) {
        return function mapTransform(v, i) {
            emit(mapping.apply(null, v));
        };
    }
    return namedTransformator('map', emitters, transform);
}
exports.map = map;
;
emitter.Emitter.prototype.map = function mapWith(mapping) {
    return map(mapping, this);
};
function filter(initialValue, predicate) {
    var emitters = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        emitters[_i - 2] = arguments[_i];
    }
    function transform(emit) {
        return function filterTransform(v, i) {
            if (predicate(v[i])) {
                emit(v[i]);
            }
        };
    }
    return namedTransformator('filter', emitters, transform, initialValue);
}
exports.filter = filter;
;
emitter.Emitter.prototype.filter = function filterBy(initialValue, predicate) {
    return filter(initialValue, predicate, this);
};
function merge() {
    var emitters = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        emitters[_i - 0] = arguments[_i];
    }
    return namedTransformator('merge', emitters, undefined);
}
exports.merge = merge;
;
emitter.Emitter.prototype.merge = function mergeWith() {
    var emitters = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        emitters[_i - 0] = arguments[_i];
    }
    return merge.apply(void 0, [this].concat(emitters));
};
function accumulate(initValue, accumulator) {
    var emitters = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        emitters[_i - 2] = arguments[_i];
    }
    var accumulated = initValue;
    function transform(emit) {
        return function accumulateTransform(v, i) {
            accumulated = accumulator(accumulated, v[i]);
            emit(accumulated);
        };
    }
    return namedTransformator('accumulate', emitters, transform);
}
exports.accumulate = accumulate;
;
emitter.Emitter.prototype.accumulate = function accumulateWith(initValue, accumulator) {
    return accumulate(initValue, accumulator, this);
};
function flatten() {
    var emitters = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        emitters[_i - 0] = arguments[_i];
    }
    var transformator = new Transformator([]);
    function transform(emit) {
        return function flattenTransform(v, i) {
            transformator.plugEmitter(v[i]);
        };
    }
    ;
    new Transformator(emitters, transform);
    transformator.name = 'flatten';
    return transformator;
}
exports.flatten = flatten;
;
emitter.Emitter.prototype.flatten = function () {
    return flatten(this);
};
function sample(sampled) {
    var samplers = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        samplers[_i - 1] = arguments[_i];
    }
    function transform(emit) {
        return function sampleTransform(v, i) {
            if (i > 0) {
                emit(v[0]);
            }
        };
    }
    ;
    var emitters = samplers.slice();
    emitters.splice(0, 0, sampled);
    return namedTransformator('sample', emitters, transform);
}
exports.sample = sample;
;
emitter.Emitter.prototype.sampleBy = function () {
    var emitters = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        emitters[_i - 0] = arguments[_i];
    }
    return sample.apply(void 0, [this].concat(emitters));
};
function throttle(deylayInMiliseconds) {
    var emitters = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        emitters[_i - 1] = arguments[_i];
    }
    function transform(emit) {
        var accumulated = [];
        var accumulating = false;
        return function throttleTransform(v, i) {
            accumulated.push(v[i]);
            if (!accumulating) {
                accumulating = true;
                scheduler.scheduleTimeout(function () {
                    emit(accumulated);
                    accumulating = false;
                    accumulated = [];
                }, deylayInMiliseconds);
            }
        };
    }
    ;
    return namedTransformator('throttle', emitters, transform, []);
}
exports.throttle = throttle;
;
emitter.Emitter.prototype.throttle = function (deylayInMiliseconds) {
    return throttle(deylayInMiliseconds, this);
};
// export function dropRepeats<InOut>(
// 	...emitters: inf.IEmitter<InOut>[]
// ) {
// 	var lastValue: InOut;
// 	function transform(emit: inf.IEmitterFunction<InOut>) {
// 		return function dropRepeatsTransform(v: InOut[], i: Identifier) {
// 			if (v[i] !== lastValue) {
// 				emit(v[i]);
// 				lastValue = v[i];
// 			}
// 		};
// 	};
// 	return namedTransformator('drop repeats', emitters, transform);
// };
emitter.Emitter.prototype.dropRepeats = function () {
    return dropRepeats(this);
};
function change(switchers, emitter) {
    function transform(emit) {
        return function changeTransform(v, i) {
            var _this = this;
            if (i == 0) {
                emit(v[0]);
            }
            else if (v[i] !== undefined) {
                var e = switchers[i - 1].to(v[0], v[i]);
                this._wires[0].unplug();
                this._wires[0] = new Wire(e, this, function (x) { return _this.receiveOn(x, 0); });
            }
        };
    }
    var allEmitters = switchers.map(function (s) { return s.when; });
    allEmitters.splice(0, 0, emitter);
    return namedTransformator('change', allEmitters, transform);
}
exports.change = change;
emitter.Emitter.prototype.change = function changeToWhen() {
    var switchers = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        switchers[_i - 0] = arguments[_i];
    }
    return change(switchers, this);
};
function changes() {
    var emitters = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        emitters[_i - 0] = arguments[_i];
    }
    var previousValue;
    function transform(emit) {
        return function changesTransform(v, i) {
            if (previousValue !== v[i]) {
                emit({
                    previous: previousValue,
                    current: v[i]
                });
                previousValue = v[i];
            }
        };
    }
    return namedTransformator('change', emitters, transform);
}
exports.changes = changes;
;
emitter.Emitter.prototype.changes = function onlyChanges() {
    return changes(this);
};
function transformTime(timeTransformation, t0) {
    var emitters = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        emitters[_i - 2] = arguments[_i];
    }
    var firstEmitted = false;
    function transform(emit) {
        return function timeTransform(v, i) {
            if (firstEmitted) {
                var delay = timeTransformation(scheduler.now() - t0) + t0 - scheduler.now();
                scheduler.scheduleTimeout(function () { return emit(v[i]); }, delay);
            }
            else {
                emit(v[i]);
                firstEmitted = true;
            }
        };
    }
    return namedTransformator('transform time', emitters, transform);
}
exports.transformTime = transformTime;
emitter.Emitter.prototype.transformTime = function transformTimeWith(timeTransformation, t0) {
    var t0 = t0 || 0;
    return transformTime(timeTransformation, t0, this);
};
