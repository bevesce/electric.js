(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var electric = require('../../src/electric');
var IntegrableAntiderivativeOfNumber = require('../../src/calculus/integrable-antiderivative-of-number');
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
function bar(x, y, ys) {
    ys = ys || 0;
    ctx.fillStyle = 'white';
    ctx.fillRect(x, ys, 1, y);
}
function acceleration(x) {
    return IntegrableAntiderivativeOfNumber.of(x, velocity);
}
function velocity(x) {
    return IntegrableAntiderivativeOfNumber.of(x, shift);
}
function shift(x) {
    return IntegrableAntiderivativeOfNumber.of(x);
}
var intervalInMs = 10;
var interval = { intervalInMs: intervalInMs };
var aT = electric.e.constant(acceleration(5));
var vT = electric.calculus.integral(velocity(0), aT, interval);
var sT = electric.calculus.integral(shift(0), vT, interval);
var x0 = 0;
electric.clock.intervalValue(5, { inMs: intervalInMs }).plugReceiver(function (a) {
    if (!a.happened) {
        return;
    }
    bar(x0, a.value, 0);
    x0++;
});
var x1 = 0;
vT.plugReceiver(function (v) {
    bar(x1, v.x, 10);
    x1++;
});
var x2 = 0;
sT.plugReceiver(function (s) {
    bar(x2, s.x, 100);
    x2++;
});

},{"../../src/calculus/integrable-antiderivative-of-number":3,"../../src/electric":6}],2:[function(require,module,exports){
var clock = require('../clock');
var scheduler = require('../scheduler');
var transformator = require('../transformator');
function integral(initialValue, emitter, options) {
    var timmed = timeValue(emitter, options);
    var result = timmed.accumulate({
        time: scheduler.now(),
        value: emitter.dirtyCurrentValue(),
        sum: initialValue
    }, function (acc, v) {
        var now = scheduler.now();
        var dt = now - acc.time;
        var nv = v.value.add(acc.value).mulT(dt / 2);
        var sum = acc.sum.addDelta(nv);
        return {
            time: now,
            value: v.value,
            sum: sum
        };
    }).map(function (v) { return v.sum; });
    result.name = '<| integral |>';
    result.setEquals(function (x, y) { return x.equals(y); });
    result.stabilize = function () { return timmed.stabilize(); };
    return result;
}
exports.integral = integral;
function differential(initialValue, emitter, options) {
    var timmed = timeValue(emitter, options);
    var result = timmed.accumulate({
        time: scheduler.now(),
        value: emitter.dirtyCurrentValue(),
        diff: initialValue
    }, function (acc, v) {
        var dt = v.time - acc.time;
        var diff = v.value.sub(acc.value).divT(dt);
        return {
            time: v.time,
            value: v.value,
            diff: diff
        };
    }).map(function (v) { return v.diff; });
    result.setEquals(function (x, y) { return x.equals(y); });
    result.name = '<| differential |>';
    return result;
}
exports.differential = differential;
function timeValue(emitter, options) {
    var time = clock.time(options);
    var trans = transformator.map(function (t, v) { return ({ time: t, value: v }); }, time, emitter);
    trans.stabilize = function () { return time.stabilize(); };
    return trans;
}

},{"../clock":4,"../scheduler":10,"../transformator":12}],3:[function(require,module,exports){
var IntegrableAntiderivativeOfNumber = (function () {
    function IntegrableAntiderivativeOfNumber(x, antiderivative, bounds) {
        this.bounds = bounds || {};
        this.x = within(x, this.bounds.minX, this.bounds.maxX);
        this.antiderivative = antiderivative;
    }
    IntegrableAntiderivativeOfNumber.of = function (x, antiderivative, bounds) {
        return new IntegrableAntiderivativeOfNumber(x, antiderivative, bounds);
    };
    IntegrableAntiderivativeOfNumber.zero = function (antiderivative, bounds) {
        return IntegrableAntiderivativeOfNumber.of(0, antiderivative, bounds);
    };
    IntegrableAntiderivativeOfNumber.prototype.add = function (other) {
        var x = within(this.x + other.x, this.bounds.minX, this.bounds.maxX);
        return IntegrableAntiderivativeOfNumber.of(x, this.antiderivative, this.bounds);
    };
    IntegrableAntiderivativeOfNumber.prototype.addDelta = function (delta) {
        return this.add(delta);
    };
    IntegrableAntiderivativeOfNumber.prototype.equals = function (other) {
        return this.x === other.x;
    };
    IntegrableAntiderivativeOfNumber.prototype.mulT = function (dt) {
        var dx = this.x * dt / 1000;
        return this.antiderivative(dx);
    };
    IntegrableAntiderivativeOfNumber.prototype.withX = function (x) {
        return IntegrableAntiderivativeOfNumber.of(x, this.antiderivative, this.bounds);
    };
    IntegrableAntiderivativeOfNumber.prototype.withY = function (y) {
        return IntegrableAntiderivativeOfNumber.of(this.x, this.antiderivative, this.bounds);
    };
    return IntegrableAntiderivativeOfNumber;
})();
function within(v, min, max) {
    if (max !== undefined && v > max) {
        return max;
    }
    if (min !== undefined && v < min) {
        return min;
    }
    return v;
}
module.exports = IntegrableAntiderivativeOfNumber;

},{}],4:[function(require,module,exports){
var scheduler = require('./scheduler');
var emitter = require('./emitter');
function interval(options) {
    var timer = emitter.manualEvent();
    scheduler.scheduleInterval(function () {
        timer.impulse(Date.now());
    }, calculateInterval(options.inMs, options.fps));
    timer.name = '| interval ' + calculateEmitterName(options);
    return timer;
}
exports.interval = interval;
function intervalValue(value, options) {
    var timer = emitter.manualEvent();
    scheduler.scheduleInterval(function () {
        timer.impulse(value);
    }, calculateInterval(options.inMs, options.fps));
    timer.name = '| interval of ' + value + calculateEmitterName(options);
    return timer;
}
exports.intervalValue = intervalValue;
function time(options) {
    var interval = calculateInterval(options.intervalInMs, options.fps);
    var timeEmitter = emitter.manual(scheduler.now());
    var id = scheduler.scheduleInterval(function () { return timeEmitter.emit((scheduler.now())); }, interval);
    timeEmitter.setReleaseResources(function () { return scheduler.unscheduleInterval(id); });
    timeEmitter.name = '| time ' + calculateEmitterName(options);
    return timeEmitter;
}
exports.time = time;
function calculateInterval(intervalInMs, fps) {
    if (intervalInMs === undefined) {
        return 1 / fps * 1000;
    }
    else {
        return intervalInMs;
    }
}
function calculateEmitterName(options) {
    if (options.fps !== undefined) {
        return ' fps: ' + options.fps + ' |>';
    }
    else if (options.inMs !== undefined) {
        return ' interval: ' + options.inMs + 'ms |>';
    }
    else {
        return ' interval: ' + options.intervalInMs + 'ms |>';
    }
}

},{"./emitter":7,"./scheduler":10}],5:[function(require,module,exports){
var utils = require('./utils');
var ElectricEvent = (function () {
    function ElectricEvent() {
    }
    ElectricEvent.restore = function (e) {
        if (e.happened) {
            return ElectricEvent.of(e.value);
        }
        return ElectricEvent.notHappened;
    };
    ElectricEvent.of = function (value) {
        return new happened(value);
    };
    ElectricEvent.lift = function (f) {
        return function () {
            var vs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                vs[_i - 0] = arguments[_i];
            }
            if (utils.all(vs.map(function (v) { return v.happened; }))) {
                return ElectricEvent.of(f.apply(null, vs.map(function (v) { return v.value; })));
            }
            else {
                return ElectricEvent.notHappened;
            }
        };
    };
    ElectricEvent.flatLift = function (f) {
        return function (v1) {
            if (v1.happened) {
                return f(v1.value);
            }
            else {
                return ElectricEvent.notHappened;
            }
        };
    };
    ElectricEvent.liftOnFirst = function (f) {
        return function (v1, v2) {
            if (v1.happened) {
                return ElectricEvent.of(f(v1.value, v2));
            }
            else {
                return ElectricEvent.notHappened;
            }
        };
    };
    ElectricEvent.prototype.map = function (f) {
        throw Error('ElectricEvent is abstract class, use happened and notHappened');
    };
    ;
    ElectricEvent.prototype.flattenMap = function (f) {
        throw Error('ElectricEvent is abstract class, use happened and notHappened');
    };
    return ElectricEvent;
})();
var happened = (function () {
    function happened(value) {
        this.happened = true;
        this.value = value;
    }
    happened.prototype.map = function (f) {
        return ElectricEvent.of(f(this.value));
    };
    happened.prototype.flattenMap = function (f) {
        return f(this.value);
    };
    return happened;
})();
var notHappened = (function () {
    function notHappened() {
        this.happened = false;
        this.value = undefined;
    }
    notHappened.prototype.map = function (f) {
        return ElectricEvent.notHappened;
    };
    notHappened.prototype.flattenMap = function (f) {
        return ElectricEvent.notHappened;
    };
    return notHappened;
})();
ElectricEvent.notHappened = new notHappened();
module.exports = ElectricEvent;

},{"./utils":14}],6:[function(require,module,exports){
exports.scheduler = require('./scheduler');
exports.emitter = require('./emitter');
exports.transformator = require('./transformator');
exports.receiver = require('./receiver');
exports.clock = require('./clock');
exports.transmitter = require('./transmitter');
exports.calculus = require('./calculus/calculus');
exports.e = exports.emitter;
exports.t = exports.transformator;
exports.r = exports.receiver;
exports.c = exports.calculus;

},{"./calculus/calculus":2,"./clock":4,"./emitter":7,"./receiver":9,"./scheduler":10,"./transformator":12,"./transmitter":13}],7:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var scheduler = require('./scheduler');
var transformators = require('./transformator-helpers');
var eevent = require('./electric-event');
var Wire = require('./wire');
exports.placeholder = require('./placeholder');
function en(name) {
    return '| ' + name + ' |>';
}
var Emitter = (function () {
    function Emitter(initialValue) {
        if (initialValue === void 0) { initialValue = undefined; }
        this._receivers = [];
        this._currentValue = initialValue;
        this.name = en(this.name);
    }
    // when reveiver is plugged current value is not emitted to him
    // instantaneously, but instead it's done asynchronously
    Emitter.prototype.plugReceiver = function (receiver) {
        if (typeof receiver !== 'function' && receiver.wire) {
            receiver = receiver.wire(this);
        }
        this._receivers.push(receiver);
        this._ayncDispatchToReceiver(receiver, this._currentValue);
        return this._receivers.length - 1;
    };
    Emitter.prototype._dirtyPlugReceiver = function (receiver) {
        if (typeof receiver !== 'function' && receiver.wire) {
            receiver = receiver.wire(this);
        }
        this._receivers.push(receiver);
        // this._ayncDispatchToReceiver(receiver, this._currentValue);
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
        this.emit = this._throwStabilized;
        this.impulse = this._throwStabilized;
        this._releaseResources();
    };
    Emitter.prototype.setReleaseResources = function (releaseResources) {
        this._releaseResources = releaseResources;
    };
    Emitter.prototype._releaseResources = function () {
        // should be overwritten in more specific emitters
    };
    Emitter.prototype._throwStabilized = function (value) {
        throw Error("can't emit <" + value + "> from " + this.name + ", it's stabilized");
    };
    // let's say that f = constant(y).emit(x) is called at t_e
    // then f(t) = x for t >= t_e, and f(t) = y for t < t_e
    Emitter.prototype.emit = function (value) {
        if (this._equals(this._currentValue, value)) {
            return;
        }
        this._dispatchToReceivers(value);
        this._currentValue = value;
    };
    // let's say that f constant(y).impulse(x) is called at t_i
    // then f(t_i) = x and f(t) = y when t != t_i
    Emitter.prototype.impulse = function (value) {
        if (this._equals(this._currentValue, value)) {
            return;
        }
        this._dispatchToReceivers(value);
        this._dispatchToReceivers(this._currentValue);
    };
    Emitter.prototype._equals = function (x, y) {
        return x === y;
    };
    Emitter.prototype.setEquals = function (equals) {
        this._equals = equals;
    };
    Emitter.prototype._dispatchToReceivers = function (value) {
        var currentReceivers = this._receivers.slice();
        for (var _i = 0; _i < currentReceivers.length; _i++) {
            var receiver = currentReceivers[_i];
            this._dispatchToReceiver(receiver, value);
        }
    };
    Emitter.prototype._dispatchToReceiver = function (receiver, value) {
        if (typeof receiver === 'function') {
            receiver(value);
        }
        else {
            receiver.receive(value);
        }
    };
    Emitter.prototype._ayncDispatchToReceivers = function (value) {
        var currentReceivers = this._receivers.slice();
        for (var _i = 0; _i < currentReceivers.length; _i++) {
            var receiver = currentReceivers[_i];
            this._ayncDispatchToReceiver(receiver, value);
        }
    };
    Emitter.prototype._ayncDispatchToReceiver = function (receiver, value) {
        var _this = this;
        scheduler.scheduleTimeout(function () { return _this._dispatchToReceiver(receiver, value); }, 0);
    };
    // transformators
    Emitter.prototype.map = function (mapping) {
        return namedTransformator('map' + this._enclosedName(), [this], transformators.map(mapping, 1), mapping(this._currentValue));
    };
    Emitter.prototype.filter = function (initialValue, predicate) {
        return namedTransformator('filter' + this._enclosedName(), [this], transformators.filter(predicate), initialValue);
    };
    Emitter.prototype.filterMap = function (initialValue, mapping) {
        return namedTransformator('filter' + this._enclosedName(), [this], transformators.filterMap(mapping), initialValue);
    };
    Emitter.prototype.transformTime = function (initialValue, timeShift, t0) {
        if (t0 === void 0) { t0 = 0; }
        var t = namedTransformator('transform time' + this._enclosedName(), [this], transformators.transformTime(timeShift, t0), initialValue);
        this._dispatchToReceiver(t._dirtyGetWireTo(this), this.dirtyCurrentValue());
        return t;
    };
    Emitter.prototype.accumulate = function (initialValue, accumulator) {
        var acc = accumulator(initialValue, this.dirtyCurrentValue());
        return namedTransformator('accumulate' + this._enclosedName(), [this], transformators.accumulate(acc, accumulator), acc);
    };
    Emitter.prototype.merge = function () {
        var emitters = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            emitters[_i - 0] = arguments[_i];
        }
        return namedTransformator('merge' + this._enclosedName() + ' with ' + emitters.map(function (e) { return e.name; }).join(', '), [this].concat(emitters), transformators.merge(), this.dirtyCurrentValue());
    };
    Emitter.prototype.when = function (switcher) {
        var t = namedTransformator('when happens then', [this], transformators.when(switcher.happens, switcher.then), eevent.notHappened);
        return t;
    };
    Emitter.prototype.whenThen = function (happens) {
        var t = namedTransformator('when then', [this], transformators.whenThen(happens), eevent.notHappened);
        return t;
    };
    Emitter.prototype.sample = function (initialValue, samplingEvent) {
        var t = namedTransformator('sample' + this._enclosedName() + ' on ' + this._enclosedName(samplingEvent), [this, samplingEvent], transformators.sample(), initialValue);
        return t;
    };
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
    //     switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
    //     switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
    //     switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
    //     switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
    //     switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
    //     switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
    //     switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
    //     switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
    //     switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) },
    //     switcher14: { when: inf.IEmitter<eevent<S14>>, to: inf.IEmitter<T> | ((t: T, k: S14) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
    //     switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
    //     switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
    //     switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) },
    //     switcher14: { when: inf.IEmitter<eevent<S14>>, to: inf.IEmitter<T> | ((t: T, k: S14) => inf.IEmitter<T>) },
    //     switcher15: { when: inf.IEmitter<eevent<S15>>, to: inf.IEmitter<T> | ((t: T, k: S15) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
    //     switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
    //     switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
    //     switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) },
    //     switcher14: { when: inf.IEmitter<eevent<S14>>, to: inf.IEmitter<T> | ((t: T, k: S14) => inf.IEmitter<T>) },
    //     switcher15: { when: inf.IEmitter<eevent<S15>>, to: inf.IEmitter<T> | ((t: T, k: S15) => inf.IEmitter<T>) },
    //     switcher16: { when: inf.IEmitter<eevent<S16>>, to: inf.IEmitter<T> | ((t: T, k: S16) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
    //     switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
    //     switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
    //     switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) },
    //     switcher14: { when: inf.IEmitter<eevent<S14>>, to: inf.IEmitter<T> | ((t: T, k: S14) => inf.IEmitter<T>) },
    //     switcher15: { when: inf.IEmitter<eevent<S15>>, to: inf.IEmitter<T> | ((t: T, k: S15) => inf.IEmitter<T>) },
    //     switcher16: { when: inf.IEmitter<eevent<S16>>, to: inf.IEmitter<T> | ((t: T, k: S16) => inf.IEmitter<T>) },
    //     switcher17: { when: inf.IEmitter<eevent<S17>>, to: inf.IEmitter<T> | ((t: T, k: S17) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
    //     switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
    //     switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
    //     switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) },
    //     switcher14: { when: inf.IEmitter<eevent<S14>>, to: inf.IEmitter<T> | ((t: T, k: S14) => inf.IEmitter<T>) },
    //     switcher15: { when: inf.IEmitter<eevent<S15>>, to: inf.IEmitter<T> | ((t: T, k: S15) => inf.IEmitter<T>) },
    //     switcher16: { when: inf.IEmitter<eevent<S16>>, to: inf.IEmitter<T> | ((t: T, k: S16) => inf.IEmitter<T>) },
    //     switcher17: { when: inf.IEmitter<eevent<S17>>, to: inf.IEmitter<T> | ((t: T, k: S17) => inf.IEmitter<T>) },
    //     switcher18: { when: inf.IEmitter<eevent<S18>>, to: inf.IEmitter<T> | ((t: T, k: S18) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18, S19>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
    //     switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
    //     switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
    //     switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) },
    //     switcher14: { when: inf.IEmitter<eevent<S14>>, to: inf.IEmitter<T> | ((t: T, k: S14) => inf.IEmitter<T>) },
    //     switcher15: { when: inf.IEmitter<eevent<S15>>, to: inf.IEmitter<T> | ((t: T, k: S15) => inf.IEmitter<T>) },
    //     switcher16: { when: inf.IEmitter<eevent<S16>>, to: inf.IEmitter<T> | ((t: T, k: S16) => inf.IEmitter<T>) },
    //     switcher17: { when: inf.IEmitter<eevent<S17>>, to: inf.IEmitter<T> | ((t: T, k: S17) => inf.IEmitter<T>) },
    //     switcher18: { when: inf.IEmitter<eevent<S18>>, to: inf.IEmitter<T> | ((t: T, k: S18) => inf.IEmitter<T>) },
    //     switcher19: { when: inf.IEmitter<eevent<S19>>, to: inf.IEmitter<T> | ((t: T, k: S19) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18, S19, S20>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
    //     switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
    //     switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
    //     switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) },
    //     switcher14: { when: inf.IEmitter<eevent<S14>>, to: inf.IEmitter<T> | ((t: T, k: S14) => inf.IEmitter<T>) },
    //     switcher15: { when: inf.IEmitter<eevent<S15>>, to: inf.IEmitter<T> | ((t: T, k: S15) => inf.IEmitter<T>) },
    //     switcher16: { when: inf.IEmitter<eevent<S16>>, to: inf.IEmitter<T> | ((t: T, k: S16) => inf.IEmitter<T>) },
    //     switcher17: { when: inf.IEmitter<eevent<S17>>, to: inf.IEmitter<T> | ((t: T, k: S17) => inf.IEmitter<T>) },
    //     switcher18: { when: inf.IEmitter<eevent<S18>>, to: inf.IEmitter<T> | ((t: T, k: S18) => inf.IEmitter<T>) },
    //     switcher19: { when: inf.IEmitter<eevent<S19>>, to: inf.IEmitter<T> | ((t: T, k: S19) => inf.IEmitter<T>) },
    //     switcher20: { when: inf.IEmitter<eevent<S20>>, to: inf.IEmitter<T> | ((t: T, k: S20) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    Emitter.prototype.change = function () {
        var switchers = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            switchers[_i - 0] = arguments[_i];
        }
        return namedTransformator('change to when', [this].concat(switchers.map(function (s) { return s.when; })), transformators.change(switchers), this._currentValue);
    };
    Emitter.prototype._enclosedName = function (emitter) {
        if (emitter === void 0) { emitter = null; }
        return '<' + (emitter ? emitter.name : this.name) + '>';
    };
    return Emitter;
})();
exports.Emitter = Emitter;
function emitter(initialValue) {
    return new Emitter(initialValue);
}
exports.emitter = emitter;
var ManualEmitter = (function (_super) {
    __extends(ManualEmitter, _super);
    function ManualEmitter() {
        _super.apply(this, arguments);
    }
    ManualEmitter.prototype.emit = function (v) {
        var _this = this;
        scheduler.scheduleTimeout(function () { return _super.prototype.emit.call(_this, v); }, 0);
    };
    ManualEmitter.prototype.impulse = function (v) {
        var _this = this;
        scheduler.scheduleTimeout(function () { return _super.prototype.impulse.call(_this, v); }, 0);
    };
    ManualEmitter.prototype.stabilize = function () {
        _super.prototype.stabilize.call(this);
        this.emit = this.emit;
        this.impulse = this.impulse;
    };
    return ManualEmitter;
})(Emitter);
function manual(initialValue) {
    var e = new ManualEmitter(initialValue);
    e.name = en('manual');
    return e;
}
exports.manual = manual;
function constant(value) {
    var e = new Emitter(value);
    e.name = en('constant *' + value + '*');
    return e;
}
exports.constant = constant;
function manualEvent(name) {
    // manual event emitter should
    // pack impulsed values into event
    // and not allow to emit values
    // it's done by monkey patching ManualEmitter
    var e = manual(eevent.notHappened);
    e.name = en('manual event');
    var oldImpulse = e.impulse;
    e.impulse = function (v) { return oldImpulse.apply(e, [eevent.of(v)]); };
    e.emit = function (v) {
        throw Error("can't emit from event emitter, only impulse");
    };
    e.name = name ? en(name) : e.name;
    // monkey patching requires ugly casting...
    return e;
}
exports.manualEvent = manualEvent;
var Transformator = (function (_super) {
    __extends(Transformator, _super);
    function Transformator(emitters, transform, initialValue) {
        if (transform === void 0) { transform = undefined; }
        if (initialValue === void 0) { initialValue = undefined; }
        _super.call(this, initialValue);
        this.name = '<| transformator |>';
        this._values = Array(emitters.length);
        if (transform) {
            this.setTransform(transform);
        }
        this._wires = [];
        this.plugEmitters(emitters);
    }
    Transformator.prototype.setTransform = function (transform) {
        var _this = this;
        this._transform = transform(function (x) { return _this.emit(x); }, function (x) { return _this.impulse(x); });
    };
    Transformator.prototype._transform = function (values, index) {
        // Default implementation that just passes values
        // Should be overwritten in functions that create Transformators
        this.emit(values[index]);
    };
    Transformator.prototype.plugEmitters = function (emitters) {
        var _this = this;
        emitters.forEach(function (e) { return _this.wire(e); });
        for (var i = 0; i < emitters.length; i++) {
            this._values[i] = emitters[i].dirtyCurrentValue();
        }
    };
    Transformator.prototype.plugEmitter = function (emitter) {
        this.wire(emitter);
        this._values[this._wires.length - 1] = emitter.dirtyCurrentValue();
        return this._wires.length - 1;
    };
    Transformator.prototype.unplugEmitter = function (emitter) {
        this._wires.filter(function (w) { return w.input === emitter; }).forEach(function (w) { return w.unplug(); });
    };
    Transformator.prototype.dropEmitters = function (start) {
        var wiresToDrop = this._wires.slice(1);
        wiresToDrop.forEach(function (w) { return w.unplug(); });
        this._wires.splice(start, this._wires.length);
        this._values.splice(start, this._values.length);
    };
    Transformator.prototype.wire = function (emitter) {
        var _this = this;
        var index = this._wires.length;
        this._wires[index] = new Wire(emitter, this, (function (index) { return function (x) { return _this.receiveOn(x, index); }; })(index), (function (index) { return function (x) { return _this.setOn(x, index); }; })(index));
        return this._wires[index];
    };
    Transformator.prototype._dirtyGetWireTo = function (emitter) {
        return this._wires.filter(function (w) { return w.input === emitter; })[0];
    };
    Transformator.prototype.receiveOn = function (value, index) {
        this._values[index] = value;
        this._transform(this._values, index);
    };
    Transformator.prototype.setOn = function (value, index) {
        this._values[index] = value;
    };
    return Transformator;
})(Emitter);
exports.Transformator = Transformator;
function namedTransformator(name, emitters, transform, initialValue) {
    if (transform === void 0) { transform = undefined; }
    var t = new Transformator(emitters, transform, initialValue);
    t.name = '<| ' + name + ' |>';
    return t;
}
exports.namedTransformator = namedTransformator;

},{"./electric-event":5,"./placeholder":8,"./scheduler":10,"./transformator-helpers":11,"./wire":15}],8:[function(require,module,exports){
// functions that can be simply queued
var functionsToVoid = [
    'plugReceiver',
    'unplugReceiver',
    'stabilize',
    'setReleaseResources',
    'setEquals'
];
// functions that should return another placeholder
var functionsToEmitter = [
    'plugReceiver',
    'unplugReceiver',
    'stabilize',
    'setReleaseResources',
    'setEquals',
    'map',
    'filter',
    'filterMap',
    'transformTime',
    'accumulate',
    'sample',
    'change',
    'merge'
];
// function to throw if called before is()
var functionsToSomething = [];
var Placeholder = (function () {
    function Placeholder(initialValue) {
        this._actions = [];
        this._initialValue = initialValue;
        this.name = '| placeholder |>';
    }
    Placeholder.prototype.is = function (emitter) {
        if (this._emitter) {
            throw Error("placeholder is " + this._emitter.name + " so cannot be " + emitter.name);
        }
        this._emitter = emitter;
        for (var _i = 0, _a = this._actions; _i < _a.length; _i++) {
            var action = _a[_i];
            action(this._emitter);
        }
        this._actions = undefined;
        this.name = '| ph ' + emitter.name;
    };
    Placeholder.prototype.dirtyCurrentValue = function () {
        if (this._emitter) {
            return this._emitter.dirtyCurrentValue();
        }
        else if (this._initialValue !== undefined) {
            return this._initialValue;
        }
        throw Error('called dirtyCurrentValue() on placeholder without initial value');
    };
    return Placeholder;
})();
function doOrQueue(name) {
    return function placeholding() {
        var args = arguments;
        if (this._emitter) {
            this._emitter[name].apply(this._emitter, arguments);
        }
        else {
            this._actions.push(function (emitter) {
                emitter[name].apply(emitter, args);
            });
        }
    };
}
functionsToVoid.forEach(function (name) {
    Placeholder.prototype[name] = doOrQueue(name);
});
function doOrQueueAndReturnPlaceholder(name) {
    return function placeholding() {
        var args = arguments;
        if (this._emitter) {
            return this._emitter[name].apply(this._emitter, args);
        }
        else {
            var p = placeholder();
            this._actions.push(function (emitter) {
                p.is(emitter[name].apply(emitter, args));
            });
            return p;
        }
    };
}
functionsToEmitter.forEach(function (name) {
    Placeholder.prototype[name] = doOrQueueAndReturnPlaceholder(name);
});
function doOrThrow(name) {
    return function placeholding() {
        var args = arguments;
        if (this._emitter) {
            return this._emitter[name].apply(this._emitter, args);
        }
        throw Error('called <' + name + '> on empty placeholder');
    };
}
functionsToSomething.forEach(function (name) {
    Placeholder.prototype[name] = doOrThrow(name);
});
function placeholder(initialValue) {
    return (new Placeholder(initialValue));
}
module.exports = placeholder;

},{}],9:[function(require,module,exports){
function logReceiver(message) {
    if (!message) {
        message = '<<<';
    }
    return function (x) {
        console.log(message, x);
    };
}
exports.logReceiver = logReceiver;
function log(emitter) {
    emitter.plugReceiver(function (x) {
        console.log(emitter.name, '--', x);
    });
}
exports.log = log;
function logEvents(emitter) {
    emitter.plugReceiver(function (x) {
        if (!x.happened) {
            return;
        }
        console.log(emitter.name, '--', x.value);
    });
}
exports.logEvents = logEvents;
function collect(emitter) {
    var r = [];
    emitter.plugReceiver(function (x) {
        r.push(x);
    });
    return r;
}
exports.collect = collect;

},{}],10:[function(require,module,exports){
var stopTime = Date.now();
var callbacks = {};
var stopped = false;
function stop() {
    stopTime = Date.now();
    stopped = true;
    return stopTime;
}
exports.stop = stop;
function resume() {
    stopped = false;
    callbacks = {};
}
exports.resume = resume;
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
        return setTimeout(callback, delayInMs);
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
    return callback;
}
exports.scheduleTimeout = scheduleTimeout;
function scheduleInterval(callback, intervalInMs) {
    if (intervalInMs === void 0) { intervalInMs = 0; }
    if (!stopped) {
        return setInterval(callback, intervalInMs);
    }
    var cancelable = [];
    function intervalCallback() {
        callback();
        cancelable.push(scheduleTimeout(intervalCallback, intervalInMs));
    }
    var id = scheduleTimeout(intervalCallback, intervalInMs);
    cancelable.push(id);
    return cancelable;
}
exports.scheduleInterval = scheduleInterval;
function now() {
    if (!stopped) {
        return Date.now();
    }
    return stopTime;
}
exports.now = now;
function unscheduleInterval(id) {
    if (!stopped) {
        return clearInterval(id);
    }
    id.forEach(removeFromCallbacks);
}
exports.unscheduleInterval = unscheduleInterval;
function removeFromCallbacks(callback) {
    for (var k in callbacks) {
        removeFromCallbacksAtTime(callbacks[k], callback);
    }
}
function removeFromCallbacksAtTime(callbacksAtTime, callback) {
    var i = callbacksAtTime.indexOf(callback);
    while (i !== -1) {
        callbacksAtTime.splice(i, 1);
        i = callbacksAtTime.indexOf(callback);
    }
}

},{}],11:[function(require,module,exports){
var utils = require('./utils');
var Wire = require('./wire');
var scheduler = require('./scheduler');
var eevent = require('./electric-event');
function map(f, noOfEmitters) {
    return function mapTransform(emit) {
        return function mapTransform(v, i) {
            emit(f.apply(null, v));
        };
    };
}
exports.map = map;
function filter(predicate, noOfEmitters) {
    if (noOfEmitters === void 0) { noOfEmitters = 1; }
    return function transform(emit) {
        var eaten = 0;
        return function filterTransform(v, i) {
            if (predicate.apply(null, v)) {
                emit(v[i]);
            }
        };
    };
}
exports.filter = filter;
;
function filterMap(mapping, noOfEmitters) {
    if (noOfEmitters === void 0) { noOfEmitters = 1; }
    return function transform(emit) {
        var eaten = 0;
        return function filterMapTransform(v, i) {
            var result = mapping.apply(null, v);
            if (result !== undefined) {
                emit(result);
            }
        };
    };
}
exports.filterMap = filterMap;
;
function merge() {
    return function mergeTransform(emit) {
        var prev;
        return function mergeTransform(v, i) {
            if (prev !== v[i]) {
                emit(v[i]);
            }
            prev = v[i];
        };
    };
}
exports.merge = merge;
function accumulate(initialValue, accumulator) {
    var accumulated = initialValue;
    return function transform(emit) {
        return function accumulateTransform(v, i) {
            accumulated = accumulator.apply(void 0, [accumulated].concat(v));
            emit(accumulated);
        };
    };
}
exports.accumulate = accumulate;
;
function transformTime(timeTransformation, t0) {
    // var firstEmitted = false;
    return function transform(emit) {
        return function timeTransform(v, i) {
            var delay = timeTransformation(scheduler.now() - t0) + t0 - scheduler.now();
            var toEmit = v[i];
            scheduler.scheduleTimeout(function () {
                emit(toEmit);
            }, delay);
        };
    };
}
exports.transformTime = transformTime;
function sample() {
    return function transform(emit) {
        return function sampleTransform(v, i) {
            if (i > 0 && v[i].happened) {
                emit(v[0]);
            }
        };
    };
}
exports.sample = sample;
;
function change(switchers) {
    return function transform(emit) {
        return function changeTransform(v, i) {
            var _this = this;
            if (i == 0) {
                emit(v[0]);
            }
            else if (v[i].happened) {
                this._wires[0].unplug();
                var to = switchers[i - 1].to;
                var e = utils.callIfFunction(to, v[0], v[i].value);
                this._wires[0] = new Wire(e, this, function (x) { return _this.receiveOn(x, 0); });
            }
        };
    };
}
exports.change = change;
function when(happened, then) {
    return function transform(emit, impulse) {
        return function whenTransform(v, i) {
            if (happened(v[i])) {
                impulse(eevent.of(then(v[i])));
            }
        };
    };
}
exports.when = when;
function whenThen(happens) {
    return function transform(emit, impulse) {
        var prevhappened;
        return function whenTransform(v, i) {
            var happened = happens(v[i]);
            if (happened && !prevhappened) {
                impulse(eevent.of(happened));
                prevhappened = happened;
            }
            else if (!happened) {
                prevhappened = null;
            }
        };
    };
}
exports.whenThen = whenThen;
function cumulateOverTime(delayInMiliseconds) {
    return function transform(emit, impulse) {
        var accumulated = [];
        var accumulating = false;
        return function throttleTransform(v, i) {
            if (!v[i].happened) {
                return;
            }
            accumulated.push(v[i].value);
            if (!accumulating) {
                accumulating = true;
                scheduler.scheduleTimeout(function () {
                    impulse(eevent.of(accumulated));
                    accumulating = false;
                    accumulated = [];
                }, delayInMiliseconds);
            }
        };
    };
}
exports.cumulateOverTime = cumulateOverTime;
;

},{"./electric-event":5,"./scheduler":10,"./utils":14,"./wire":15}],12:[function(require,module,exports){
var emitter = require('./emitter');
var namedTransformator = emitter.namedTransformator;
var transformators = require('./transformator-helpers');
var eevent = require('../src/electric-event');
function map(mapping, emitter1, emitter2, emitter3, emitter4, emitter5, emitter6, emitter7) {
    var emitters = Array.prototype.slice.apply(arguments, [1]);
    return namedTransformator('map', emitters, transformators.map(mapping, emitters.length), mapping.apply(null, emitters.map(function (e) { return e.dirtyCurrentValue(); })));
}
exports.map = map;
;
function mapMany(mapping) {
    var emitters = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        emitters[_i - 1] = arguments[_i];
    }
    return namedTransformator('map many', emitters, transformators.map(mapping, emitters.length), mapping.apply(null, emitters.map(function (e) { return e.dirtyCurrentValue(); })));
}
exports.mapMany = mapMany;
function filter(initialValue, predicate, emitter1, emitter2, emitter3, emitter4, emitter5, emitter6, emitter7) {
    var emitters = Array.prototype.slice.apply(arguments, [2]);
    return namedTransformator('filter', emitters, transformators.filter(predicate, emitters.length), initialValue);
}
exports.filter = filter;
;
function filterMap(initialValue, filterMapping, emitter1, emitter2, emitter3, emitter4, emitter5, emitter6, emitter7) {
    var emitters = Array.prototype.slice.apply(arguments, [2]);
    return namedTransformator('filter map', emitters, transformators.filterMap(filterMapping, emitters.length), initialValue);
}
exports.filterMap = filterMap;
;
function accumulate(initialValue, accumulator, emitter1, emitter2, emitter3, emitter4, emitter5, emitter6, emitter7) {
    var emitters = Array.prototype.slice.apply(arguments, [2]);
    var acc = accumulator.apply([], [initialValue].concat(emitters.map(function (e) { return e.dirtyCurrentValue(); })));
    return namedTransformator('accumulate', emitters, transformators.accumulate(acc, accumulator), acc);
}
exports.accumulate = accumulate;
function merge() {
    var emitters = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        emitters[_i - 0] = arguments[_i];
    }
    return namedTransformator('merge', emitters, transformators.merge(), emitters[0].dirtyCurrentValue());
}
exports.merge = merge;
function cumulateOverTime(emitter, overInMs) {
    return namedTransformator('cumulate', [emitter], transformators.cumulateOverTime(overInMs), eevent.notHappened);
}
exports.cumulateOverTime = cumulateOverTime;
function hold(initialValue, emitter) {
    function transform(emit) {
        return function holdTransform(v, i) {
            if (v[i].happened) {
                emit(v[i].value);
            }
        };
    }
    return namedTransformator('hold', [emitter], transform, initialValue);
}
exports.hold = hold;
;
function changes(emitter) {
    var previous = emitter.dirtyCurrentValue();
    function transform(emit, impulse) {
        return function changesTransform(v, i) {
            impulse(eevent.of({
                previous: previous,
                next: v[i]
            }));
            previous = v[i];
        };
    }
    return namedTransformator('changes', [emitter], transform, eevent.notHappened);
}
exports.changes = changes;
function skipFirst(emitter) {
    function transform(emit, impulse) {
        var skipped = false;
        return function skipFirstTransform(v, i) {
            if (v[i].happened) {
                if (skipped) {
                    impulse(v[i]);
                }
                else {
                    skipped = true;
                }
            }
        };
    }
    return namedTransformator('skip 1', [emitter], transform, eevent.notHappened);
}
exports.skipFirst = skipFirst;
;
// semantics:
// f_a :: t -> (t -> a)
// flatten(f_a) = f(t)
// flatten(f_a)(t) = f(t)(t)
function flatten(emitter) {
    var transformator = namedTransformator('flatten', [emitter, emitter.dirtyCurrentValue()], transform, emitter.dirtyCurrentValue().dirtyCurrentValue());
    function transform(emit) {
        return function flattenTransform(v, i) {
            if (i == 0) {
                transformator.dropEmitters(1);
                transformator.plugEmitter(v[0]);
                emit(v[0].dirtyCurrentValue());
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
// semantics:
// f_a :: t -> [t -> a]
// flatten(f_a) = f(t)
// flatten(f_a)(t) = f(t).map(g => g(t))
function flattenMany(emitter) {
    var currentValues = emitter.dirtyCurrentValue().map(function (e) { return e.dirtyCurrentValue(); });
    var transformator = namedTransformator('flatten many', [emitter].concat(emitter.dirtyCurrentValue()), transform, currentValues);
    function transform(emit) {
        return function flattenTransform(v, i) {
            if (i == 0) {
                transformator.dropEmitters(1);
                v[0].forEach(function (e) { return transformator.plugEmitter(e); });
                emit(v[0].map(function (e) { return e.dirtyCurrentValue(); }));
            }
            else {
                emit(v.slice(1));
            }
        };
    }
    ;
    return transformator;
}
exports.flattenMany = flattenMany;

},{"../src/electric-event":5,"./emitter":7,"./transformator-helpers":11}],13:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var emitter = require('./emitter');
var Wire = require('./wire');
var Transmitter = (function (_super) {
    __extends(Transmitter, _super);
    function Transmitter() {
        _super.apply(this, arguments);
    }
    Transmitter.prototype.wire = function (emitter) {
        var _this = this;
        var index = this._wires.length;
        this._wires[index] = new Wire(emitter, this, (function (index) { return function (x) { return _this.receiveOn(x, index); }; })(index));
        return this._wires[index];
    };
    Transmitter.prototype.dropEmitters = function () {
        this._wires.forEach(function (w) { return w.input.stabilize(); });
        this._wires = [];
    };
    return Transmitter;
})(emitter.Transformator);
function transmitter(initialValue) {
    var t = new Transmitter([], undefined, initialValue);
    t.name = '?| transmitter |>';
    return t;
}
module.exports = transmitter;

},{"./emitter":7,"./wire":15}],14:[function(require,module,exports){
function callIfFunction(obj) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    if (typeof obj === 'function') {
        return obj.apply(null, args);
    }
    else {
        return obj;
    }
}
exports.callIfFunction = callIfFunction;
function any(list) {
    for (var i = 0; i < list.length; i++) {
        if (list[i]) {
            return true;
        }
    }
    return false;
}
exports.any = any;
function all(list) {
    for (var i = 0; i < list.length; i++) {
        if (!list[i]) {
            return false;
        }
    }
    return true;
}
exports.all = all;

},{}],15:[function(require,module,exports){
var Wire = (function () {
    function Wire(input, output, receive, set) {
        this.input = input;
        this.output = output;
        this.name = '-w-';
        if (set) {
            this._set = set;
            this._futureReceive = receive;
        }
        else {
            this.receive = receive;
        }
        this.receiverId = this.input.plugReceiver(this);
    }
    Wire.prototype.receive = function (x) {
        this._set(x);
        this._set = undefined;
        this.receive = this._futureReceive;
        this._futureReceive = undefined;
    };
    Wire.prototype.unplug = function () {
        if (this.input) {
            this.input.unplugReceiver(this.receiverId);
        }
        this.input = undefined;
        this.output = undefined;
    };
    return Wire;
})();
module.exports = Wire;

},{}]},{},[1]);
