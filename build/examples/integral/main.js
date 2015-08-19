(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var electric = require('../../src/electric');
console.log('DDSD');
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
function bar(x, y, ys) {
    ys = ys || 0;
    ctx.fillStyle = 'white';
    ctx.fillRect(x, ys, 1, y);
}
function a(time) {
    return 1;
}
aT = electric.clock.clock({ intervalInMs: 10 }).map(function (time) {
    return { time: time, value: a(time) };
});
vT = electric.clock.integral(aT);
sT = electric.clock.integral(vT);
var x0 = 0;
aT.plugReceiver(function (a) {
    bar(x0, a.value, 0);
    x0++;
});
var x1 = 0;
vT.plugReceiver(function (v) {
    bar(x1, v.value, 10);
    x1++;
});
var x2 = 0;
sT.plugReceiver(function (s) {
    bar(x2, s.value, 100);
    x2++;
});

},{"../../src/electric":4}],2:[function(require,module,exports){
exports.scheduler = require('./scheduler');
exports.emitter = require('./emitter');
exports.transformator = require('./transformator');
function clock(args) {
    var e = exports.emitter.manual(exports.scheduler.now());
    var interval = args.intervalInMs || 1 / args.fps * 1000;
    exports.scheduler.scheduleInterval(function () { return e.emit(exports.scheduler.now()); }, interval);
    return e;
}
exports.clock = clock;
function fclock(f, args) {
    return clock(args).map(function (t) { return ({ time: t, value: f(t) }); });
}
exports.fclock = fclock;
function eclock(emitter, args) {
    var time = clock(args);
    function timeSampling(emit) {
        var latestValue;
        return function (v, i) {
            if (i == 0) {
                latestValue = v[0];
            }
            else {
                emit({ time: v[1], value: latestValue });
            }
        };
    }
    return new exports.transformator.Transformator([emitter, time], timeSampling);
}
exports.eclock = eclock;
function integral(f) {
    var initialAcc = { time: exports.scheduler.now(), value: 0, sum: 0 };
    var result = f.accumulate(initialAcc, function (acc, v) {
        var dt = (v.time - acc.time) / 1000;
        return {
            time: v.time,
            value: v.value,
            sum: acc.sum + (acc.value + v.value) / 2 * dt,
            dt: dt
        };
    }).map(function (v) { return ({ time: v.time, value: v.sum }); });
    function equalsWithTime(x, y) {
        return x.time === y.time && x.value === y.value;
    }
    result.setEquals(equalsWithTime);
    return result;
}
exports.integral = integral;

},{"./emitter":5,"./scheduler":8,"./transformator":9}],3:[function(require,module,exports){
var emitter = require('./emitter');
var receiver = require('./receiver');
function create(name, createDevice) {
    function plug(inputsOutputs) {
        for (var name in inputsOutputs.ins) {
            if (!inputsOutputs.ins.hasOwnProperty(name)) {
                return;
            }
            ins[name].plugEmitter(inputsOutputs.ins[name]);
        }
        for (var name in inputsOutputs.outs) {
            if (!inputsOutputs.outs.hasOwnProperty(name)) {
                return;
            }
            outs[name].plugReceiver(inputsOutputs.outs[name]);
        }
    }
    if (createDevice === undefined) {
        createDevice = name;
        name = undefined;
    }
    var ins;
    var outs;
    createDevice(function (x) { ins = x; }, function (x) { outs = x; });
    return {
        name: name,
        ins: ins,
        outs: outs,
        plug: plug,
        toString: function () { return 'device<' + name + '>'; }
    };
}
exports.create = create;
exports.list = function createListDevice() {
    return create('list', function (ins, outs) {
        var constant = emitter.constant;
        function insert(items, value) {
            var newItems = items.slice();
            newItems.push(value);
            return constant(newItems);
        }
        ;
        function remove(items, index) {
            var newItems = items.slice();
            newItems.splice(index, 1);
            return constant(newItems);
        }
        ;
        function edit(items, index, value) {
            var newItems = items.slice();
            newItems[index] = value;
            return constant(newItems);
        }
        var newItem = receiver.hanging();
        var deleteItem = receiver.hanging();
        var editItem = receiver.hanging();
        var items = constant([]).change({ to: function (items, value) { return insert(items, value); }, when: newItem }, { to: function (items, index) { return remove(items, index); }, when: deleteItem }, { to: function (items, newObj) { return edit(items, newObj.index, newObj.value); }, when: editItem });
        ins({
            inserts: newItem,
            deletes: deleteItem,
            edits: editItem
        });
        outs({
            items: items
        });
    });
};

},{"./emitter":5,"./receiver":7}],4:[function(require,module,exports){
exports.scheduler = require('./scheduler');
exports.device = require('./device');
exports.emitter = require('./emitter');
exports.transformator = require('./transformator');
exports.receiver = require('./receiver');
exports.clock = require('./clock');
exports.fp = require('./fp');
function lift(f) {
    return function () {
        var emitters = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            emitters[_i - 0] = arguments[_i];
        }
        return exports.transformator.map.apply(exports.transformator, [f].concat(emitters));
    };
}
exports.lift = lift;

},{"./clock":2,"./device":3,"./emitter":5,"./fp":6,"./receiver":7,"./scheduler":8,"./transformator":9}],5:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Transformable = (function () {
    function Transformable() {
    }
    return Transformable;
})();
exports.Transformable = Transformable;
var Emitter = (function (_super) {
    __extends(Emitter, _super);
    function Emitter(initialValue) {
        if (initialValue === void 0) { initialValue = undefined; }
        this._receivers = [];
        this._currentValue = initialValue;
    }
    Emitter.prototype.plugReceiver = function (receiver) {
        if (typeof receiver !== 'function' && receiver.wire) {
            receiver = receiver.wire(this);
        }
        this._receivers.push(receiver);
        this._dispatchToReceiver(this._currentValue, receiver);
        return this._receivers.length - 1;
    };
    Emitter.prototype.unplugReceiver = function (receiverOrId) {
        var index = this._getIndexOfReceiver(receiverOrId);
        this._receivers.splice(index, 1);
    };
    Emitter.prototype._getIndexOfReceiver = function (receiverOrId) {
        if (typeof receiverOrId === 'number') {
            return receiverOrId;
        }
        else {
            return this._receivers.indexOf(receiverOrId);
        }
    };
    Emitter.prototype.dirtyCurrentValue = function () {
        return this._currentValue;
    };
    Emitter.prototype.stabilize = function () {
        this._emit = this._throwStabilized;
        this._impulse = this._throwStabilized;
        this._releaseResources();
    };
    Emitter.prototype.setReleaseResources = function (releaseResources) {
        this._releaseResources = releaseResources;
    };
    Emitter.prototype._releaseResources = function () {
    };
    Emitter.prototype._throwStabilized = function (value) {
        throw Error("can't emit <" + value + "> from " + this.name + ", it's stabilized");
    };
    Emitter.prototype._emit = function (value) {
        if (this._equals(this._currentValue, value)) {
            return;
        }
        this._dispatchToReceivers(value);
        this._currentValue = value;
    };
    Emitter.prototype._equals = function (x, y) {
        return x === y;
    };
    Emitter.prototype.setEquals = function (equals) {
        this._equals = equals;
    };
    Emitter.prototype._impulse = function (value) {
        if (this._currentValue === value) {
            return;
        }
        this._dispatchToReceivers(value);
        this._dispatchToReceivers(this._currentValue);
    };
    Emitter.prototype._dispatchToReceivers = function (value) {
        var currentReceivers = this._receivers.slice();
        for (var _i = 0; _i < currentReceivers.length; _i++) {
            var receiver = currentReceivers[_i];
            this._dispatchToReceiver(value, receiver);
        }
    };
    Emitter.prototype._dispatchToReceiver = function (value, receiver) {
        if (typeof receiver === 'function') {
            receiver(value);
        }
        else {
            receiver.receive(value);
        }
    };
    return Emitter;
})(Transformable);
exports.Emitter = Emitter;
var ManualEmitter = (function (_super) {
    __extends(ManualEmitter, _super);
    function ManualEmitter() {
        _super.apply(this, arguments);
        this.emit = this._emit;
        this.impulse = this._impulse;
    }
    ManualEmitter.prototype.stabilize = function () {
        _super.prototype.stabilize.call(this);
        this.emit = this._emit;
        this.impulse = this._impulse;
    };
    return ManualEmitter;
})(Emitter);
function manual(initialValue) {
    var e = new ManualEmitter(initialValue);
    e.name = 'manual emitter';
    return e;
}
exports.manual = manual;
function constant(value) {
    var e = new Emitter(value);
    e.name = 'constant(' + value + ')';
    return e;
}
exports.constant = constant;
var Placeholder = (function (_super) {
    __extends(Placeholder, _super);
    function Placeholder() {
        _super.apply(this, arguments);
        this._actions = [];
    }
    Placeholder.prototype.is = function (emitter) {
        this._emitter = emitter;
        for (var _i = 0, _a = this._actions; _i < _a.length; _i++) {
            var action = _a[_i];
            action(this._emitter);
        }
    };
    Placeholder.prototype._doOrQueue = function (action) {
        if (this._emitter) {
            return action(this._emitter);
        }
        else {
            this._actions.push(action);
        }
    };
    Placeholder.prototype.plugReceiver = function (receiver) {
        return this._doOrQueue(function (emitter) { return emitter.plugReceiver(receiver); });
    };
    ;
    Placeholder.prototype.unplugReceiver = function (index) {
        this._doOrQueue(function (emitter) { return emitter.unplugReceiver(index); });
    };
    Placeholder.prototype.dirtyCurrentValue = function () {
        if (this._emitter) {
            return this._emitter.dirtyCurrentValue();
        }
        return undefined;
    };
    Placeholder.prototype.stabilize = function () {
        this._doOrQueue(function (emitter) { return emitter.stabilize(index); });
    };
    Placeholder.prototype.setReleaseResources = function (releaseResources) {
        this._doOrQueue(function (emitter) { return emitter.setReleaseResources(releaseResources); });
    };
    return Placeholder;
})(Emitter);
function placeholder() {
    return new Placeholder();
}
exports.placeholder = placeholder;

},{}],6:[function(require,module,exports){
;
function curry(f, arity) {
    arity = arity || 2;
    function partial(prevArgs) {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            var nextArgs = prevArgs.slice();
            nextArgs.splice.apply(nextArgs, [nextArgs.length, 0].concat(args));
            if (nextArgs.length >= arity) {
                return f.apply(void 0, nextArgs);
            }
            return partial(nextArgs);
        };
    }
    return partial([]);
}
exports.curry = curry;
;
function property(name) {
    return function (obj) {
        return obj[name];
    };
}
exports.property = property;
;
function compose(f, g) {
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        return f(g.apply(void 0, args));
    };
}
exports.compose = compose;
var maybe;
(function (maybe) {
    var Just = (function () {
        function Just(value) {
            this.value = value;
        }
        Just.prototype.map = function (f) {
            var result = f(this.flatten());
            return just(result);
        };
        Just.prototype.flatten = function () {
            return this.value;
        };
        Just.prototype.chain = function (f) {
            return this.map(f).flatten();
        };
        return Just;
    })();
    function just(value) {
        return new Just(value);
    }
    maybe.just = just;
    var Nothing = (function () {
        function Nothing() {
        }
        Nothing.prototype.map = function (f) {
            return maybe.nothing;
        };
        Nothing.prototype.bind = function (f) {
            return maybe.nothing;
        };
        Nothing.prototype.flatten = function () {
            return maybe.nothing;
        };
        Nothing.prototype.chain = function (f) {
            return maybe.nothing;
        };
        return Nothing;
    })();
    maybe.nothing = new Nothing();
})(maybe = exports.maybe || (exports.maybe = {}));
var either;
(function (either) {
    var Right = (function () {
        function Right(value) {
            this.value = value;
        }
        Right.prototype.map = function (f) {
            var result = f(this.flatten());
            return right(result);
        };
        Right.prototype.flatten = function () {
            return this.value;
        };
        Right.prototype.chain = function (f) {
            return this.map(f).flatten();
        };
        Right.prototype.isRight = function () {
            return true;
        };
        Right.prototype.isLeft = function () {
            return false;
        };
        return Right;
    })();
    function right(value) {
        return new Right(value);
    }
    either.right = right;
    var Left = (function () {
        function Left(value) {
            this.value = value;
        }
        Left.prototype.map = function (f) {
            return left(this.value);
        };
        Left.prototype.flatten = function () {
            return left(this.value);
        };
        Left.prototype.chain = function (f) {
            return left(this.value);
        };
        Left.prototype.isRight = function () {
            return false;
        };
        Left.prototype.isLeft = function () {
            return true;
        };
        return Left;
    })();
    function left(value) {
        return (new Left(value));
        // when remove <any> casting:
        // Neither type 'Left<L, {}>' nor type 'Either<L, R>' is assignable to the other.
        // Types of property 'flatten' are incompatible.
        // Type '() => {} | Either<L, {}>' is not assignable to type '() => R | Monad<R>'.
        // Type '{} | Either<L, {}>' is not assignable to type 'R | Monad<R>'.
        // Type '{}' is not assignable to type 'R | Monad<R>'.
        // Type '{}' is not assignable to type 'Monad<R>'.
        // Property 'flatten' is missing in type '{}'.
    }
    either.left = left;
})(either = exports.either || (exports.either = {}));

},{}],7:[function(require,module,exports){
var transformator = require('./transformator');
function hanging() {
    return new transformator.Transformator([]);
}
exports.hanging = hanging;
function htmlReceiverById(id) {
    var element = document.getElementById(id);
    return function (html) {
        element.innerHTML = html;
    };
}
exports.htmlReceiverById = htmlReceiverById;
function logReceiver(message) {
    if (!message) {
        message = '';
    }
    return function (x) {
        console.log(message, x);
    };
}
exports.logReceiver = logReceiver;
function log(emitter) {
    emitter.plugReceiver(logReceiver(emitter.name));
}
exports.log = log;

},{"./transformator":9}],8:[function(require,module,exports){
var stopTime = Date.now();
var callbacks = {};
var stopped = false;
function stop() {
    stopTime = Date.now();
    stopped = true;
    return stopTime;
}
exports.stop = stop;
function advance(timeShiftInMiliseconds) {
    if (timeShiftInMiliseconds === void 0) { timeShiftInMiliseconds = 1; }
    if (!stopped) {
        return;
    }
    var newTime = stopTime + timeShiftInMiliseconds;
    for (; stopTime < newTime; stopTime++) {
        executeCallbacksForTime(stopTime);
    }
    return stopTime;
}
exports.advance = advance;
function executeCallbacksForTime(currentTime) {
    var toExecute = callbacks[stopTime];
    if (toExecute) {
        toExecute.forEach(function (f) { return f(); });
    }
}
function currentTime() {
    return stopTime;
}
exports.currentTime = currentTime;
function scheduleTimeout(callback, delayInMs) {
    if (delayInMs === void 0) { delayInMs = 0; }
    if (!stopped) {
        setTimeout(callback, delayInMs);
        return;
    }
    var whenToExecute = stopTime + delayInMs;
    if (delayInMs <= 0) {
        callback();
    }
    else if (callbacks[whenToExecute]) {
        callbacks[whenToExecute].push(callback);
    }
    else {
        callbacks[whenToExecute] = [callback];
    }
}
exports.scheduleTimeout = scheduleTimeout;
function scheduleInterval(callback, intervalInMs) {
    if (intervalInMs === void 0) { intervalInMs = 0; }
    if (!stopped) {
        setInterval(callback, intervalInMs);
        return;
    }
    scheduleTimeout(function () {
        callback();
        scheduleInterval(callback, intervalInMs);
    }, intervalInMs);
}
exports.scheduleInterval = scheduleInterval;
function now() {
    if (!stopped) {
        return Date.now();
    }
    return stopTime;
}
exports.now = now;

},{}],9:[function(require,module,exports){
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
    if (transform === void 0) { transform = undefined; }
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
// (<any>emitter.Emitter.prototype).dropRepeats = function() {
// 	return dropRepeats(this);
// };
function callIfFunction(obj, arg1, arg2) {
    if (typeof obj === 'function') {
        return obj(arg1, arg2);
    }
    else {
        return obj;
    }
}
function change(switchers, emitter) {
    function transform(emit) {
        return function changeTransform(v, i) {
            var _this = this;
            if (i == 0) {
                emit(v[0]);
            }
            else if (v[i] !== undefined) {
                var to = switchers[i - 1].to;
                var e = callIfFunction(to, v[0], v[i]);
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
function transformTime(initialValue, timeTransformation, t0) {
    var emitters = [];
    for (var _i = 3; _i < arguments.length; _i++) {
        emitters[_i - 3] = arguments[_i];
    }
    var firstEmitted = false;
    function transform(emit) {
        return function timeTransform(v, i) {
            if (firstEmitted) {
                var delay = timeTransformation(scheduler.now() - t0) + t0 - scheduler.now();
                var toEmit = v[i];
                scheduler.scheduleTimeout(function () { return emit(toEmit); }, delay);
            }
            else {
                emit(v[i]);
                firstEmitted = true;
            }
        };
    }
    return namedTransformator('transform time', emitters, transform, initialValue);
}
exports.transformTime = transformTime;
emitter.Emitter.prototype.transformTime = function transformTimeWith(initialValue, timeTransformation, t0) {
    var t0 = t0 || 0;
    return transformTime(initialValue, timeTransformation, t0, this);
};
function hold(initialValue) {
    var emitters = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        emitters[_i - 1] = arguments[_i];
    }
    function transform(emit) {
        return function holdTransform(v, i) {
            if (v[i] !== undefined) {
                emit(v[i]);
            }
        };
    }
    return namedTransformator('filter', emitters, transform, initialValue);
}
exports.hold = hold;
;
emitter.Emitter.prototype.hold = function holdValueOf(initialValue) {
    return hold(initialValue, this);
};

},{"./emitter":5,"./scheduler":8}]},{},[1]);
