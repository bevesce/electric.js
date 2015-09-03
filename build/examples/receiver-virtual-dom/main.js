(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/// <reference path="../../d/viertual-dom.d.ts" />
var electric = require('../../src/electric');
var vdom = require('virtual-dom');
var virtualDomReceiver = require('../../src/receivers/virtual-dom-receiver');
var h = vdom.h;
var diff = vdom.diff;
var patch = vdom.patch;
var createElement = vdom.create;
function renderTime(count) {
    return h('h1', { className: 'test' }, [count]);
}
function renderList(list) {
    return h('ul', {}, list.map(function (item) {
        return h('li', { key: item }, [item]);
    }));
}
function renderApp(time, list) {
    return h('div', {}, [time, list]);
}
function append(list, item) {
    var list = list.slice();
    list.push(item);
    return list;
}
var time = electric.clock.time({ intervalInMs: 1000 })
    .map(renderTime);
var list = electric.clock.time({ intervalInMs: 1000 })
    .accumulate([], append)
    .map(renderList);
electric.transformator
    .map(renderApp, time, list)
    .plugReceiver(virtualDomReceiver(document.body));

},{"../../src/electric":5,"../../src/receivers/virtual-dom-receiver":10,"virtual-dom":20}],2:[function(require,module,exports){
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

},{"../clock":3,"../scheduler":11,"../transformator":13}],3:[function(require,module,exports){
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

},{"./emitter":6,"./scheduler":11}],4:[function(require,module,exports){
var utils = require('./utils');
var ElectricEvent = (function () {
    function ElectricEvent() {
    }
    ElectricEvent.restore = function (e) {
        if (e.happend) {
            return ElectricEvent.of(e.value);
        }
        return ElectricEvent.notHappend;
    };
    ElectricEvent.of = function (value) {
        return new Happend(value);
    };
    ElectricEvent.lift = function (f) {
        return function () {
            var vs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                vs[_i - 0] = arguments[_i];
            }
            if (utils.all(vs.map(function (v) { return v.happend; }))) {
                return ElectricEvent.of(f.apply(null, vs.map(function (v) { return v.value; })));
            }
            else {
                return ElectricEvent.notHappend;
            }
        };
    };
    ElectricEvent.flatLift = function (f) {
        return function (v1) {
            if (v1.happend) {
                return f(v1.value);
            }
            else {
                return ElectricEvent.notHappend;
            }
        };
    };
    ElectricEvent.liftOnFirst = function (f) {
        return function (v1, v2) {
            if (v1.happend) {
                return ElectricEvent.of(f(v1.value, v2));
            }
            else {
                return ElectricEvent.notHappend;
            }
        };
    };
    ElectricEvent.prototype.map = function (f) {
        throw Error('ElectricEvent is abstract class, use Happend and NotHappend');
    };
    ;
    ElectricEvent.prototype.flattenMap = function (f) {
        throw Error('ElectricEvent is abstract class, use Happend and NotHappend');
    };
    return ElectricEvent;
})();
var Happend = (function () {
    function Happend(value) {
        this.happend = true;
        this.value = value;
    }
    Happend.prototype.map = function (f) {
        return ElectricEvent.of(f(this.value));
    };
    Happend.prototype.flattenMap = function (f) {
        return f(this.value);
    };
    return Happend;
})();
var NotHappend = (function () {
    function NotHappend() {
        this.happend = false;
        this.value = undefined;
    }
    NotHappend.prototype.map = function (f) {
        return ElectricEvent.notHappend;
    };
    NotHappend.prototype.flattenMap = function (f) {
        return ElectricEvent.notHappend;
    };
    return NotHappend;
})();
ElectricEvent.notHappend = new NotHappend();
module.exports = ElectricEvent;

},{"./utils":15}],5:[function(require,module,exports){
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

},{"./calculus/calculus":2,"./clock":3,"./emitter":6,"./receiver":8,"./scheduler":11,"./transformator":13,"./transmitter":14}],6:[function(require,module,exports){
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
        var t = namedTransformator('when happens then', [this], transformators.when(switcher.happens, switcher.then), eevent.notHappend);
        return t;
    };
    Emitter.prototype.whenThen = function (happens) {
        var t = namedTransformator('when then', [this], transformators.whenThen(happens), eevent.notHappend);
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
    var e = manual(eevent.notHappend);
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

},{"./electric-event":4,"./placeholder":7,"./scheduler":11,"./transformator-helpers":12,"./wire":16}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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
        if (!x.happend) {
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

},{}],9:[function(require,module,exports){
function getNode(nodeOrId) {
    if (typeof nodeOrId === 'string') {
        return document.getElementById(nodeOrId);
    }
    else {
        return nodeOrId;
    }
}
exports.getNode = getNode;
function getNodes(nodesOfName) {
    if (typeof nodesOfName === 'string') {
        return Array.prototype.slice.call(document.getElementsByName(nodesOfName));
    }
    else {
        return nodesOfName;
    }
}
exports.getNodes = getNodes;

},{}],10:[function(require,module,exports){
/// <reference path="../../d/viertual-dom.d.ts" />
var vdom = require('virtual-dom');
var utils = require('./utils');
function virtualDomReceiver(nodeOrId) {
    var node = utils.getNode(nodeOrId);
    var previousTree = vdom.h();
    var rootNode = vdom.create(previousTree);
    node.appendChild(rootNode);
    return function (newTree) {
        var patches = vdom.diff(previousTree, newTree);
        rootNode = vdom.patch(rootNode, patches);
        previousTree = newTree;
    };
}
module.exports = virtualDomReceiver;

},{"./utils":9,"virtual-dom":20}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
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
            if (i > 0 && v[i].happend) {
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
            else if (v[i].happend) {
                this._wires[0].unplug();
                var to = switchers[i - 1].to;
                var e = utils.callIfFunction(to, v[0], v[i].value);
                this._wires[0] = new Wire(e, this, function (x) { return _this.receiveOn(x, 0); });
            }
        };
    };
}
exports.change = change;
function when(happend, then) {
    return function transform(emit, impulse) {
        return function whenTransform(v, i) {
            if (happend(v[i])) {
                impulse(eevent.of(then(v[i])));
            }
        };
    };
}
exports.when = when;
function whenThen(happens) {
    return function transform(emit, impulse) {
        var prevHappend;
        return function whenTransform(v, i) {
            var happend = happens(v[i]);
            if (happend && !prevHappend) {
                impulse(eevent.of(happend));
                prevHappend = happend;
            }
            else if (!happend) {
                prevHappend = null;
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
            if (!v[i].happend) {
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

},{"./electric-event":4,"./scheduler":11,"./utils":15,"./wire":16}],13:[function(require,module,exports){
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
    return namedTransformator('cumulate', [emitter], transformators.cumulateOverTime(overInMs), eevent.notHappend);
}
exports.cumulateOverTime = cumulateOverTime;
function hold(initialValue, emitter) {
    function transform(emit) {
        return function holdTransform(v, i) {
            if (v[i].happend) {
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
    return namedTransformator('changes', [emitter], transform, eevent.notHappend);
}
exports.changes = changes;
function skipFirst(emitter) {
    function transform(emit, impulse) {
        var skipped = false;
        return function skipFirstTransform(v, i) {
            if (v[i].happend) {
                if (skipped) {
                    impulse(v[i]);
                }
                else {
                    skipped = true;
                }
            }
        };
    }
    return namedTransformator('skip 1', [emitter], transform, eevent.notHappend);
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

},{"../src/electric-event":4,"./emitter":6,"./transformator-helpers":12}],14:[function(require,module,exports){
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

},{"./emitter":6,"./wire":16}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
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

},{}],17:[function(require,module,exports){
var createElement = require("./vdom/create-element.js")

module.exports = createElement

},{"./vdom/create-element.js":30}],18:[function(require,module,exports){
var diff = require("./vtree/diff.js")

module.exports = diff

},{"./vtree/diff.js":50}],19:[function(require,module,exports){
var h = require("./virtual-hyperscript/index.js")

module.exports = h

},{"./virtual-hyperscript/index.js":37}],20:[function(require,module,exports){
var diff = require("./diff.js")
var patch = require("./patch.js")
var h = require("./h.js")
var create = require("./create-element.js")
var VNode = require('./vnode/vnode.js')
var VText = require('./vnode/vtext.js')

module.exports = {
    diff: diff,
    patch: patch,
    h: h,
    create: create,
    VNode: VNode,
    VText: VText
}

},{"./create-element.js":17,"./diff.js":18,"./h.js":19,"./patch.js":28,"./vnode/vnode.js":46,"./vnode/vtext.js":48}],21:[function(require,module,exports){
/*!
 * Cross-Browser Split 1.1.1
 * Copyright 2007-2012 Steven Levithan <stevenlevithan.com>
 * Available under the MIT License
 * ECMAScript compliant, uniform cross-browser split method
 */

/**
 * Splits a string into an array of strings using a regex or string separator. Matches of the
 * separator are not included in the result array. However, if `separator` is a regex that contains
 * capturing groups, backreferences are spliced into the result each time `separator` is matched.
 * Fixes browser bugs compared to the native `String.prototype.split` and can be used reliably
 * cross-browser.
 * @param {String} str String to split.
 * @param {RegExp|String} separator Regex or string to use for separating the string.
 * @param {Number} [limit] Maximum number of items to include in the result array.
 * @returns {Array} Array of substrings.
 * @example
 *
 * // Basic use
 * split('a b c d', ' ');
 * // -> ['a', 'b', 'c', 'd']
 *
 * // With limit
 * split('a b c d', ' ', 2);
 * // -> ['a', 'b']
 *
 * // Backreferences in result array
 * split('..word1 word2..', /([a-z]+)(\d+)/i);
 * // -> ['..', 'word', '1', ' ', 'word', '2', '..']
 */
module.exports = (function split(undef) {

  var nativeSplit = String.prototype.split,
    compliantExecNpcg = /()??/.exec("")[1] === undef,
    // NPCG: nonparticipating capturing group
    self;

  self = function(str, separator, limit) {
    // If `separator` is not a regex, use `nativeSplit`
    if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
      return nativeSplit.call(str, separator, limit);
    }
    var output = [],
      flags = (separator.ignoreCase ? "i" : "") + (separator.multiline ? "m" : "") + (separator.extended ? "x" : "") + // Proposed for ES6
      (separator.sticky ? "y" : ""),
      // Firefox 3+
      lastLastIndex = 0,
      // Make `global` and avoid `lastIndex` issues by working with a copy
      separator = new RegExp(separator.source, flags + "g"),
      separator2, match, lastIndex, lastLength;
    str += ""; // Type-convert
    if (!compliantExecNpcg) {
      // Doesn't need flags gy, but they don't hurt
      separator2 = new RegExp("^" + separator.source + "$(?!\\s)", flags);
    }
    /* Values for `limit`, per the spec:
     * If undefined: 4294967295 // Math.pow(2, 32) - 1
     * If 0, Infinity, or NaN: 0
     * If positive number: limit = Math.floor(limit); if (limit > 4294967295) limit -= 4294967296;
     * If negative number: 4294967296 - Math.floor(Math.abs(limit))
     * If other: Type-convert, then use the above rules
     */
    limit = limit === undef ? -1 >>> 0 : // Math.pow(2, 32) - 1
    limit >>> 0; // ToUint32(limit)
    while (match = separator.exec(str)) {
      // `separator.lastIndex` is not reliable cross-browser
      lastIndex = match.index + match[0].length;
      if (lastIndex > lastLastIndex) {
        output.push(str.slice(lastLastIndex, match.index));
        // Fix browsers whose `exec` methods don't consistently return `undefined` for
        // nonparticipating capturing groups
        if (!compliantExecNpcg && match.length > 1) {
          match[0].replace(separator2, function() {
            for (var i = 1; i < arguments.length - 2; i++) {
              if (arguments[i] === undef) {
                match[i] = undef;
              }
            }
          });
        }
        if (match.length > 1 && match.index < str.length) {
          Array.prototype.push.apply(output, match.slice(1));
        }
        lastLength = match[0].length;
        lastLastIndex = lastIndex;
        if (output.length >= limit) {
          break;
        }
      }
      if (separator.lastIndex === match.index) {
        separator.lastIndex++; // Avoid an infinite loop
      }
    }
    if (lastLastIndex === str.length) {
      if (lastLength || !separator.test("")) {
        output.push("");
      }
    } else {
      output.push(str.slice(lastLastIndex));
    }
    return output.length > limit ? output.slice(0, limit) : output;
  };

  return self;
})();

},{}],22:[function(require,module,exports){
'use strict';

var OneVersionConstraint = require('individual/one-version');

var MY_VERSION = '7';
OneVersionConstraint('ev-store', MY_VERSION);

var hashKey = '__EV_STORE_KEY@' + MY_VERSION;

module.exports = EvStore;

function EvStore(elem) {
    var hash = elem[hashKey];

    if (!hash) {
        hash = elem[hashKey] = {};
    }

    return hash;
}

},{"individual/one-version":24}],23:[function(require,module,exports){
(function (global){
'use strict';

/*global window, global*/

var root = typeof window !== 'undefined' ?
    window : typeof global !== 'undefined' ?
    global : {};

module.exports = Individual;

function Individual(key, value) {
    if (key in root) {
        return root[key];
    }

    root[key] = value;

    return value;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],24:[function(require,module,exports){
'use strict';

var Individual = require('./index.js');

module.exports = OneVersion;

function OneVersion(moduleName, version, defaultValue) {
    var key = '__INDIVIDUAL_ONE_VERSION_' + moduleName;
    var enforceKey = key + '_ENFORCE_SINGLETON';

    var versionValue = Individual(enforceKey, version);

    if (versionValue !== version) {
        throw new Error('Can only have one copy of ' +
            moduleName + '.\n' +
            'You already have version ' + versionValue +
            ' installed.\n' +
            'This means you cannot install version ' + version);
    }

    return Individual(key, defaultValue);
}

},{"./index.js":23}],25:[function(require,module,exports){
(function (global){
var topLevel = typeof global !== 'undefined' ? global :
    typeof window !== 'undefined' ? window : {}
var minDoc = require('min-document');

if (typeof document !== 'undefined') {
    module.exports = document;
} else {
    var doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

    if (!doccy) {
        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
    }

    module.exports = doccy;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"min-document":51}],26:[function(require,module,exports){
"use strict";

module.exports = function isObject(x) {
	return typeof x === "object" && x !== null;
};

},{}],27:[function(require,module,exports){
var nativeIsArray = Array.isArray
var toString = Object.prototype.toString

module.exports = nativeIsArray || isArray

function isArray(obj) {
    return toString.call(obj) === "[object Array]"
}

},{}],28:[function(require,module,exports){
var patch = require("./vdom/patch.js")

module.exports = patch

},{"./vdom/patch.js":33}],29:[function(require,module,exports){
var isObject = require("is-object")
var isHook = require("../vnode/is-vhook.js")

module.exports = applyProperties

function applyProperties(node, props, previous) {
    for (var propName in props) {
        var propValue = props[propName]

        if (propValue === undefined) {
            removeProperty(node, propName, propValue, previous);
        } else if (isHook(propValue)) {
            removeProperty(node, propName, propValue, previous)
            if (propValue.hook) {
                propValue.hook(node,
                    propName,
                    previous ? previous[propName] : undefined)
            }
        } else {
            if (isObject(propValue)) {
                patchObject(node, props, previous, propName, propValue);
            } else {
                node[propName] = propValue
            }
        }
    }
}

function removeProperty(node, propName, propValue, previous) {
    if (previous) {
        var previousValue = previous[propName]

        if (!isHook(previousValue)) {
            if (propName === "attributes") {
                for (var attrName in previousValue) {
                    node.removeAttribute(attrName)
                }
            } else if (propName === "style") {
                for (var i in previousValue) {
                    node.style[i] = ""
                }
            } else if (typeof previousValue === "string") {
                node[propName] = ""
            } else {
                node[propName] = null
            }
        } else if (previousValue.unhook) {
            previousValue.unhook(node, propName, propValue)
        }
    }
}

function patchObject(node, props, previous, propName, propValue) {
    var previousValue = previous ? previous[propName] : undefined

    // Set attributes
    if (propName === "attributes") {
        for (var attrName in propValue) {
            var attrValue = propValue[attrName]

            if (attrValue === undefined) {
                node.removeAttribute(attrName)
            } else {
                node.setAttribute(attrName, attrValue)
            }
        }

        return
    }

    if(previousValue && isObject(previousValue) &&
        getPrototype(previousValue) !== getPrototype(propValue)) {
        node[propName] = propValue
        return
    }

    if (!isObject(node[propName])) {
        node[propName] = {}
    }

    var replacer = propName === "style" ? "" : undefined

    for (var k in propValue) {
        var value = propValue[k]
        node[propName][k] = (value === undefined) ? replacer : value
    }
}

function getPrototype(value) {
    if (Object.getPrototypeOf) {
        return Object.getPrototypeOf(value)
    } else if (value.__proto__) {
        return value.__proto__
    } else if (value.constructor) {
        return value.constructor.prototype
    }
}

},{"../vnode/is-vhook.js":41,"is-object":26}],30:[function(require,module,exports){
var document = require("global/document")

var applyProperties = require("./apply-properties")

var isVNode = require("../vnode/is-vnode.js")
var isVText = require("../vnode/is-vtext.js")
var isWidget = require("../vnode/is-widget.js")
var handleThunk = require("../vnode/handle-thunk.js")

module.exports = createElement

function createElement(vnode, opts) {
    var doc = opts ? opts.document || document : document
    var warn = opts ? opts.warn : null

    vnode = handleThunk(vnode).a

    if (isWidget(vnode)) {
        return vnode.init()
    } else if (isVText(vnode)) {
        return doc.createTextNode(vnode.text)
    } else if (!isVNode(vnode)) {
        if (warn) {
            warn("Item is not a valid virtual dom node", vnode)
        }
        return null
    }

    var node = (vnode.namespace === null) ?
        doc.createElement(vnode.tagName) :
        doc.createElementNS(vnode.namespace, vnode.tagName)

    var props = vnode.properties
    applyProperties(node, props)

    var children = vnode.children

    for (var i = 0; i < children.length; i++) {
        var childNode = createElement(children[i], opts)
        if (childNode) {
            node.appendChild(childNode)
        }
    }

    return node
}

},{"../vnode/handle-thunk.js":39,"../vnode/is-vnode.js":42,"../vnode/is-vtext.js":43,"../vnode/is-widget.js":44,"./apply-properties":29,"global/document":25}],31:[function(require,module,exports){
// Maps a virtual DOM tree onto a real DOM tree in an efficient manner.
// We don't want to read all of the DOM nodes in the tree so we use
// the in-order tree indexing to eliminate recursion down certain branches.
// We only recurse into a DOM node if we know that it contains a child of
// interest.

var noChild = {}

module.exports = domIndex

function domIndex(rootNode, tree, indices, nodes) {
    if (!indices || indices.length === 0) {
        return {}
    } else {
        indices.sort(ascending)
        return recurse(rootNode, tree, indices, nodes, 0)
    }
}

function recurse(rootNode, tree, indices, nodes, rootIndex) {
    nodes = nodes || {}


    if (rootNode) {
        if (indexInRange(indices, rootIndex, rootIndex)) {
            nodes[rootIndex] = rootNode
        }

        var vChildren = tree.children

        if (vChildren) {

            var childNodes = rootNode.childNodes

            for (var i = 0; i < tree.children.length; i++) {
                rootIndex += 1

                var vChild = vChildren[i] || noChild
                var nextIndex = rootIndex + (vChild.count || 0)

                // skip recursion down the tree if there are no nodes down here
                if (indexInRange(indices, rootIndex, nextIndex)) {
                    recurse(childNodes[i], vChild, indices, nodes, rootIndex)
                }

                rootIndex = nextIndex
            }
        }
    }

    return nodes
}

// Binary search for an index in the interval [left, right]
function indexInRange(indices, left, right) {
    if (indices.length === 0) {
        return false
    }

    var minIndex = 0
    var maxIndex = indices.length - 1
    var currentIndex
    var currentItem

    while (minIndex <= maxIndex) {
        currentIndex = ((maxIndex + minIndex) / 2) >> 0
        currentItem = indices[currentIndex]

        if (minIndex === maxIndex) {
            return currentItem >= left && currentItem <= right
        } else if (currentItem < left) {
            minIndex = currentIndex + 1
        } else  if (currentItem > right) {
            maxIndex = currentIndex - 1
        } else {
            return true
        }
    }

    return false;
}

function ascending(a, b) {
    return a > b ? 1 : -1
}

},{}],32:[function(require,module,exports){
var applyProperties = require("./apply-properties")

var isWidget = require("../vnode/is-widget.js")
var VPatch = require("../vnode/vpatch.js")

var updateWidget = require("./update-widget")

module.exports = applyPatch

function applyPatch(vpatch, domNode, renderOptions) {
    var type = vpatch.type
    var vNode = vpatch.vNode
    var patch = vpatch.patch

    switch (type) {
        case VPatch.REMOVE:
            return removeNode(domNode, vNode)
        case VPatch.INSERT:
            return insertNode(domNode, patch, renderOptions)
        case VPatch.VTEXT:
            return stringPatch(domNode, vNode, patch, renderOptions)
        case VPatch.WIDGET:
            return widgetPatch(domNode, vNode, patch, renderOptions)
        case VPatch.VNODE:
            return vNodePatch(domNode, vNode, patch, renderOptions)
        case VPatch.ORDER:
            reorderChildren(domNode, patch)
            return domNode
        case VPatch.PROPS:
            applyProperties(domNode, patch, vNode.properties)
            return domNode
        case VPatch.THUNK:
            return replaceRoot(domNode,
                renderOptions.patch(domNode, patch, renderOptions))
        default:
            return domNode
    }
}

function removeNode(domNode, vNode) {
    var parentNode = domNode.parentNode

    if (parentNode) {
        parentNode.removeChild(domNode)
    }

    destroyWidget(domNode, vNode);

    return null
}

function insertNode(parentNode, vNode, renderOptions) {
    var newNode = renderOptions.render(vNode, renderOptions)

    if (parentNode) {
        parentNode.appendChild(newNode)
    }

    return parentNode
}

function stringPatch(domNode, leftVNode, vText, renderOptions) {
    var newNode

    if (domNode.nodeType === 3) {
        domNode.replaceData(0, domNode.length, vText.text)
        newNode = domNode
    } else {
        var parentNode = domNode.parentNode
        newNode = renderOptions.render(vText, renderOptions)

        if (parentNode && newNode !== domNode) {
            parentNode.replaceChild(newNode, domNode)
        }
    }

    return newNode
}

function widgetPatch(domNode, leftVNode, widget, renderOptions) {
    var updating = updateWidget(leftVNode, widget)
    var newNode

    if (updating) {
        newNode = widget.update(leftVNode, domNode) || domNode
    } else {
        newNode = renderOptions.render(widget, renderOptions)
    }

    var parentNode = domNode.parentNode

    if (parentNode && newNode !== domNode) {
        parentNode.replaceChild(newNode, domNode)
    }

    if (!updating) {
        destroyWidget(domNode, leftVNode)
    }

    return newNode
}

function vNodePatch(domNode, leftVNode, vNode, renderOptions) {
    var parentNode = domNode.parentNode
    var newNode = renderOptions.render(vNode, renderOptions)

    if (parentNode && newNode !== domNode) {
        parentNode.replaceChild(newNode, domNode)
    }

    return newNode
}

function destroyWidget(domNode, w) {
    if (typeof w.destroy === "function" && isWidget(w)) {
        w.destroy(domNode)
    }
}

function reorderChildren(domNode, moves) {
    var childNodes = domNode.childNodes
    var keyMap = {}
    var node
    var remove
    var insert

    for (var i = 0; i < moves.removes.length; i++) {
        remove = moves.removes[i]
        node = childNodes[remove.from]
        if (remove.key) {
            keyMap[remove.key] = node
        }
        domNode.removeChild(node)
    }

    var length = childNodes.length
    for (var j = 0; j < moves.inserts.length; j++) {
        insert = moves.inserts[j]
        node = keyMap[insert.key]
        // this is the weirdest bug i've ever seen in webkit
        domNode.insertBefore(node, insert.to >= length++ ? null : childNodes[insert.to])
    }
}

function replaceRoot(oldRoot, newRoot) {
    if (oldRoot && newRoot && oldRoot !== newRoot && oldRoot.parentNode) {
        oldRoot.parentNode.replaceChild(newRoot, oldRoot)
    }

    return newRoot;
}

},{"../vnode/is-widget.js":44,"../vnode/vpatch.js":47,"./apply-properties":29,"./update-widget":34}],33:[function(require,module,exports){
var document = require("global/document")
var isArray = require("x-is-array")

var render = require("./create-element")
var domIndex = require("./dom-index")
var patchOp = require("./patch-op")
module.exports = patch

function patch(rootNode, patches, renderOptions) {
    renderOptions = renderOptions || {}
    renderOptions.patch = renderOptions.patch && renderOptions.patch !== patch
        ? renderOptions.patch
        : patchRecursive
    renderOptions.render = renderOptions.render || render

    return renderOptions.patch(rootNode, patches, renderOptions)
}

function patchRecursive(rootNode, patches, renderOptions) {
    var indices = patchIndices(patches)

    if (indices.length === 0) {
        return rootNode
    }

    var index = domIndex(rootNode, patches.a, indices)
    var ownerDocument = rootNode.ownerDocument

    if (!renderOptions.document && ownerDocument !== document) {
        renderOptions.document = ownerDocument
    }

    for (var i = 0; i < indices.length; i++) {
        var nodeIndex = indices[i]
        rootNode = applyPatch(rootNode,
            index[nodeIndex],
            patches[nodeIndex],
            renderOptions)
    }

    return rootNode
}

function applyPatch(rootNode, domNode, patchList, renderOptions) {
    if (!domNode) {
        return rootNode
    }

    var newNode

    if (isArray(patchList)) {
        for (var i = 0; i < patchList.length; i++) {
            newNode = patchOp(patchList[i], domNode, renderOptions)

            if (domNode === rootNode) {
                rootNode = newNode
            }
        }
    } else {
        newNode = patchOp(patchList, domNode, renderOptions)

        if (domNode === rootNode) {
            rootNode = newNode
        }
    }

    return rootNode
}

function patchIndices(patches) {
    var indices = []

    for (var key in patches) {
        if (key !== "a") {
            indices.push(Number(key))
        }
    }

    return indices
}

},{"./create-element":30,"./dom-index":31,"./patch-op":32,"global/document":25,"x-is-array":27}],34:[function(require,module,exports){
var isWidget = require("../vnode/is-widget.js")

module.exports = updateWidget

function updateWidget(a, b) {
    if (isWidget(a) && isWidget(b)) {
        if ("name" in a && "name" in b) {
            return a.id === b.id
        } else {
            return a.init === b.init
        }
    }

    return false
}

},{"../vnode/is-widget.js":44}],35:[function(require,module,exports){
'use strict';

var EvStore = require('ev-store');

module.exports = EvHook;

function EvHook(value) {
    if (!(this instanceof EvHook)) {
        return new EvHook(value);
    }

    this.value = value;
}

EvHook.prototype.hook = function (node, propertyName) {
    var es = EvStore(node);
    var propName = propertyName.substr(3);

    es[propName] = this.value;
};

EvHook.prototype.unhook = function(node, propertyName) {
    var es = EvStore(node);
    var propName = propertyName.substr(3);

    es[propName] = undefined;
};

},{"ev-store":22}],36:[function(require,module,exports){
'use strict';

module.exports = SoftSetHook;

function SoftSetHook(value) {
    if (!(this instanceof SoftSetHook)) {
        return new SoftSetHook(value);
    }

    this.value = value;
}

SoftSetHook.prototype.hook = function (node, propertyName) {
    if (node[propertyName] !== this.value) {
        node[propertyName] = this.value;
    }
};

},{}],37:[function(require,module,exports){
'use strict';

var isArray = require('x-is-array');

var VNode = require('../vnode/vnode.js');
var VText = require('../vnode/vtext.js');
var isVNode = require('../vnode/is-vnode');
var isVText = require('../vnode/is-vtext');
var isWidget = require('../vnode/is-widget');
var isHook = require('../vnode/is-vhook');
var isVThunk = require('../vnode/is-thunk');

var parseTag = require('./parse-tag.js');
var softSetHook = require('./hooks/soft-set-hook.js');
var evHook = require('./hooks/ev-hook.js');

module.exports = h;

function h(tagName, properties, children) {
    var childNodes = [];
    var tag, props, key, namespace;

    if (!children && isChildren(properties)) {
        children = properties;
        props = {};
    }

    props = props || properties || {};
    tag = parseTag(tagName, props);

    // support keys
    if (props.hasOwnProperty('key')) {
        key = props.key;
        props.key = undefined;
    }

    // support namespace
    if (props.hasOwnProperty('namespace')) {
        namespace = props.namespace;
        props.namespace = undefined;
    }

    // fix cursor bug
    if (tag === 'INPUT' &&
        !namespace &&
        props.hasOwnProperty('value') &&
        props.value !== undefined &&
        !isHook(props.value)
    ) {
        props.value = softSetHook(props.value);
    }

    transformProperties(props);

    if (children !== undefined && children !== null) {
        addChild(children, childNodes, tag, props);
    }


    return new VNode(tag, props, childNodes, key, namespace);
}

function addChild(c, childNodes, tag, props) {
    if (typeof c === 'string') {
        childNodes.push(new VText(c));
    } else if (typeof c === 'number') {
        childNodes.push(new VText(String(c)));
    } else if (isChild(c)) {
        childNodes.push(c);
    } else if (isArray(c)) {
        for (var i = 0; i < c.length; i++) {
            addChild(c[i], childNodes, tag, props);
        }
    } else if (c === null || c === undefined) {
        return;
    } else {
        throw UnexpectedVirtualElement({
            foreignObject: c,
            parentVnode: {
                tagName: tag,
                properties: props
            }
        });
    }
}

function transformProperties(props) {
    for (var propName in props) {
        if (props.hasOwnProperty(propName)) {
            var value = props[propName];

            if (isHook(value)) {
                continue;
            }

            if (propName.substr(0, 3) === 'ev-') {
                // add ev-foo support
                props[propName] = evHook(value);
            }
        }
    }
}

function isChild(x) {
    return isVNode(x) || isVText(x) || isWidget(x) || isVThunk(x);
}

function isChildren(x) {
    return typeof x === 'string' || isArray(x) || isChild(x);
}

function UnexpectedVirtualElement(data) {
    var err = new Error();

    err.type = 'virtual-hyperscript.unexpected.virtual-element';
    err.message = 'Unexpected virtual child passed to h().\n' +
        'Expected a VNode / Vthunk / VWidget / string but:\n' +
        'got:\n' +
        errorString(data.foreignObject) +
        '.\n' +
        'The parent vnode is:\n' +
        errorString(data.parentVnode)
        '\n' +
        'Suggested fix: change your `h(..., [ ... ])` callsite.';
    err.foreignObject = data.foreignObject;
    err.parentVnode = data.parentVnode;

    return err;
}

function errorString(obj) {
    try {
        return JSON.stringify(obj, null, '    ');
    } catch (e) {
        return String(obj);
    }
}

},{"../vnode/is-thunk":40,"../vnode/is-vhook":41,"../vnode/is-vnode":42,"../vnode/is-vtext":43,"../vnode/is-widget":44,"../vnode/vnode.js":46,"../vnode/vtext.js":48,"./hooks/ev-hook.js":35,"./hooks/soft-set-hook.js":36,"./parse-tag.js":38,"x-is-array":27}],38:[function(require,module,exports){
'use strict';

var split = require('browser-split');

var classIdSplit = /([\.#]?[a-zA-Z0-9\u007F-\uFFFF_:-]+)/;
var notClassId = /^\.|#/;

module.exports = parseTag;

function parseTag(tag, props) {
    if (!tag) {
        return 'DIV';
    }

    var noId = !(props.hasOwnProperty('id'));

    var tagParts = split(tag, classIdSplit);
    var tagName = null;

    if (notClassId.test(tagParts[1])) {
        tagName = 'DIV';
    }

    var classes, part, type, i;

    for (i = 0; i < tagParts.length; i++) {
        part = tagParts[i];

        if (!part) {
            continue;
        }

        type = part.charAt(0);

        if (!tagName) {
            tagName = part;
        } else if (type === '.') {
            classes = classes || [];
            classes.push(part.substring(1, part.length));
        } else if (type === '#' && noId) {
            props.id = part.substring(1, part.length);
        }
    }

    if (classes) {
        if (props.className) {
            classes.push(props.className);
        }

        props.className = classes.join(' ');
    }

    return props.namespace ? tagName : tagName.toUpperCase();
}

},{"browser-split":21}],39:[function(require,module,exports){
var isVNode = require("./is-vnode")
var isVText = require("./is-vtext")
var isWidget = require("./is-widget")
var isThunk = require("./is-thunk")

module.exports = handleThunk

function handleThunk(a, b) {
    var renderedA = a
    var renderedB = b

    if (isThunk(b)) {
        renderedB = renderThunk(b, a)
    }

    if (isThunk(a)) {
        renderedA = renderThunk(a, null)
    }

    return {
        a: renderedA,
        b: renderedB
    }
}

function renderThunk(thunk, previous) {
    var renderedThunk = thunk.vnode

    if (!renderedThunk) {
        renderedThunk = thunk.vnode = thunk.render(previous)
    }

    if (!(isVNode(renderedThunk) ||
            isVText(renderedThunk) ||
            isWidget(renderedThunk))) {
        throw new Error("thunk did not return a valid node");
    }

    return renderedThunk
}

},{"./is-thunk":40,"./is-vnode":42,"./is-vtext":43,"./is-widget":44}],40:[function(require,module,exports){
module.exports = isThunk

function isThunk(t) {
    return t && t.type === "Thunk"
}

},{}],41:[function(require,module,exports){
module.exports = isHook

function isHook(hook) {
    return hook &&
      (typeof hook.hook === "function" && !hook.hasOwnProperty("hook") ||
       typeof hook.unhook === "function" && !hook.hasOwnProperty("unhook"))
}

},{}],42:[function(require,module,exports){
var version = require("./version")

module.exports = isVirtualNode

function isVirtualNode(x) {
    return x && x.type === "VirtualNode" && x.version === version
}

},{"./version":45}],43:[function(require,module,exports){
var version = require("./version")

module.exports = isVirtualText

function isVirtualText(x) {
    return x && x.type === "VirtualText" && x.version === version
}

},{"./version":45}],44:[function(require,module,exports){
module.exports = isWidget

function isWidget(w) {
    return w && w.type === "Widget"
}

},{}],45:[function(require,module,exports){
module.exports = "2"

},{}],46:[function(require,module,exports){
var version = require("./version")
var isVNode = require("./is-vnode")
var isWidget = require("./is-widget")
var isThunk = require("./is-thunk")
var isVHook = require("./is-vhook")

module.exports = VirtualNode

var noProperties = {}
var noChildren = []

function VirtualNode(tagName, properties, children, key, namespace) {
    this.tagName = tagName
    this.properties = properties || noProperties
    this.children = children || noChildren
    this.key = key != null ? String(key) : undefined
    this.namespace = (typeof namespace === "string") ? namespace : null

    var count = (children && children.length) || 0
    var descendants = 0
    var hasWidgets = false
    var hasThunks = false
    var descendantHooks = false
    var hooks

    for (var propName in properties) {
        if (properties.hasOwnProperty(propName)) {
            var property = properties[propName]
            if (isVHook(property) && property.unhook) {
                if (!hooks) {
                    hooks = {}
                }

                hooks[propName] = property
            }
        }
    }

    for (var i = 0; i < count; i++) {
        var child = children[i]
        if (isVNode(child)) {
            descendants += child.count || 0

            if (!hasWidgets && child.hasWidgets) {
                hasWidgets = true
            }

            if (!hasThunks && child.hasThunks) {
                hasThunks = true
            }

            if (!descendantHooks && (child.hooks || child.descendantHooks)) {
                descendantHooks = true
            }
        } else if (!hasWidgets && isWidget(child)) {
            if (typeof child.destroy === "function") {
                hasWidgets = true
            }
        } else if (!hasThunks && isThunk(child)) {
            hasThunks = true;
        }
    }

    this.count = count + descendants
    this.hasWidgets = hasWidgets
    this.hasThunks = hasThunks
    this.hooks = hooks
    this.descendantHooks = descendantHooks
}

VirtualNode.prototype.version = version
VirtualNode.prototype.type = "VirtualNode"

},{"./is-thunk":40,"./is-vhook":41,"./is-vnode":42,"./is-widget":44,"./version":45}],47:[function(require,module,exports){
var version = require("./version")

VirtualPatch.NONE = 0
VirtualPatch.VTEXT = 1
VirtualPatch.VNODE = 2
VirtualPatch.WIDGET = 3
VirtualPatch.PROPS = 4
VirtualPatch.ORDER = 5
VirtualPatch.INSERT = 6
VirtualPatch.REMOVE = 7
VirtualPatch.THUNK = 8

module.exports = VirtualPatch

function VirtualPatch(type, vNode, patch) {
    this.type = Number(type)
    this.vNode = vNode
    this.patch = patch
}

VirtualPatch.prototype.version = version
VirtualPatch.prototype.type = "VirtualPatch"

},{"./version":45}],48:[function(require,module,exports){
var version = require("./version")

module.exports = VirtualText

function VirtualText(text) {
    this.text = String(text)
}

VirtualText.prototype.version = version
VirtualText.prototype.type = "VirtualText"

},{"./version":45}],49:[function(require,module,exports){
var isObject = require("is-object")
var isHook = require("../vnode/is-vhook")

module.exports = diffProps

function diffProps(a, b) {
    var diff

    for (var aKey in a) {
        if (!(aKey in b)) {
            diff = diff || {}
            diff[aKey] = undefined
        }

        var aValue = a[aKey]
        var bValue = b[aKey]

        if (aValue === bValue) {
            continue
        } else if (isObject(aValue) && isObject(bValue)) {
            if (getPrototype(bValue) !== getPrototype(aValue)) {
                diff = diff || {}
                diff[aKey] = bValue
            } else if (isHook(bValue)) {
                 diff = diff || {}
                 diff[aKey] = bValue
            } else {
                var objectDiff = diffProps(aValue, bValue)
                if (objectDiff) {
                    diff = diff || {}
                    diff[aKey] = objectDiff
                }
            }
        } else {
            diff = diff || {}
            diff[aKey] = bValue
        }
    }

    for (var bKey in b) {
        if (!(bKey in a)) {
            diff = diff || {}
            diff[bKey] = b[bKey]
        }
    }

    return diff
}

function getPrototype(value) {
  if (Object.getPrototypeOf) {
    return Object.getPrototypeOf(value)
  } else if (value.__proto__) {
    return value.__proto__
  } else if (value.constructor) {
    return value.constructor.prototype
  }
}

},{"../vnode/is-vhook":41,"is-object":26}],50:[function(require,module,exports){
var isArray = require("x-is-array")

var VPatch = require("../vnode/vpatch")
var isVNode = require("../vnode/is-vnode")
var isVText = require("../vnode/is-vtext")
var isWidget = require("../vnode/is-widget")
var isThunk = require("../vnode/is-thunk")
var handleThunk = require("../vnode/handle-thunk")

var diffProps = require("./diff-props")

module.exports = diff

function diff(a, b) {
    var patch = { a: a }
    walk(a, b, patch, 0)
    return patch
}

function walk(a, b, patch, index) {
    if (a === b) {
        return
    }

    var apply = patch[index]
    var applyClear = false

    if (isThunk(a) || isThunk(b)) {
        thunks(a, b, patch, index)
    } else if (b == null) {

        // If a is a widget we will add a remove patch for it
        // Otherwise any child widgets/hooks must be destroyed.
        // This prevents adding two remove patches for a widget.
        if (!isWidget(a)) {
            clearState(a, patch, index)
            apply = patch[index]
        }

        apply = appendPatch(apply, new VPatch(VPatch.REMOVE, a, b))
    } else if (isVNode(b)) {
        if (isVNode(a)) {
            if (a.tagName === b.tagName &&
                a.namespace === b.namespace &&
                a.key === b.key) {
                var propsPatch = diffProps(a.properties, b.properties)
                if (propsPatch) {
                    apply = appendPatch(apply,
                        new VPatch(VPatch.PROPS, a, propsPatch))
                }
                apply = diffChildren(a, b, patch, apply, index)
            } else {
                apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
                applyClear = true
            }
        } else {
            apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
            applyClear = true
        }
    } else if (isVText(b)) {
        if (!isVText(a)) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
            applyClear = true
        } else if (a.text !== b.text) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
        }
    } else if (isWidget(b)) {
        if (!isWidget(a)) {
            applyClear = true
        }

        apply = appendPatch(apply, new VPatch(VPatch.WIDGET, a, b))
    }

    if (apply) {
        patch[index] = apply
    }

    if (applyClear) {
        clearState(a, patch, index)
    }
}

function diffChildren(a, b, patch, apply, index) {
    var aChildren = a.children
    var orderedSet = reorder(aChildren, b.children)
    var bChildren = orderedSet.children

    var aLen = aChildren.length
    var bLen = bChildren.length
    var len = aLen > bLen ? aLen : bLen

    for (var i = 0; i < len; i++) {
        var leftNode = aChildren[i]
        var rightNode = bChildren[i]
        index += 1

        if (!leftNode) {
            if (rightNode) {
                // Excess nodes in b need to be added
                apply = appendPatch(apply,
                    new VPatch(VPatch.INSERT, null, rightNode))
            }
        } else {
            walk(leftNode, rightNode, patch, index)
        }

        if (isVNode(leftNode) && leftNode.count) {
            index += leftNode.count
        }
    }

    if (orderedSet.moves) {
        // Reorder nodes last
        apply = appendPatch(apply, new VPatch(
            VPatch.ORDER,
            a,
            orderedSet.moves
        ))
    }

    return apply
}

function clearState(vNode, patch, index) {
    // TODO: Make this a single walk, not two
    unhook(vNode, patch, index)
    destroyWidgets(vNode, patch, index)
}

// Patch records for all destroyed widgets must be added because we need
// a DOM node reference for the destroy function
function destroyWidgets(vNode, patch, index) {
    if (isWidget(vNode)) {
        if (typeof vNode.destroy === "function") {
            patch[index] = appendPatch(
                patch[index],
                new VPatch(VPatch.REMOVE, vNode, null)
            )
        }
    } else if (isVNode(vNode) && (vNode.hasWidgets || vNode.hasThunks)) {
        var children = vNode.children
        var len = children.length
        for (var i = 0; i < len; i++) {
            var child = children[i]
            index += 1

            destroyWidgets(child, patch, index)

            if (isVNode(child) && child.count) {
                index += child.count
            }
        }
    } else if (isThunk(vNode)) {
        thunks(vNode, null, patch, index)
    }
}

// Create a sub-patch for thunks
function thunks(a, b, patch, index) {
    var nodes = handleThunk(a, b)
    var thunkPatch = diff(nodes.a, nodes.b)
    if (hasPatches(thunkPatch)) {
        patch[index] = new VPatch(VPatch.THUNK, null, thunkPatch)
    }
}

function hasPatches(patch) {
    for (var index in patch) {
        if (index !== "a") {
            return true
        }
    }

    return false
}

// Execute hooks when two nodes are identical
function unhook(vNode, patch, index) {
    if (isVNode(vNode)) {
        if (vNode.hooks) {
            patch[index] = appendPatch(
                patch[index],
                new VPatch(
                    VPatch.PROPS,
                    vNode,
                    undefinedKeys(vNode.hooks)
                )
            )
        }

        if (vNode.descendantHooks || vNode.hasThunks) {
            var children = vNode.children
            var len = children.length
            for (var i = 0; i < len; i++) {
                var child = children[i]
                index += 1

                unhook(child, patch, index)

                if (isVNode(child) && child.count) {
                    index += child.count
                }
            }
        }
    } else if (isThunk(vNode)) {
        thunks(vNode, null, patch, index)
    }
}

function undefinedKeys(obj) {
    var result = {}

    for (var key in obj) {
        result[key] = undefined
    }

    return result
}

// List diff, naive left to right reordering
function reorder(aChildren, bChildren) {
    // O(M) time, O(M) memory
    var bChildIndex = keyIndex(bChildren)
    var bKeys = bChildIndex.keys
    var bFree = bChildIndex.free

    if (bFree.length === bChildren.length) {
        return {
            children: bChildren,
            moves: null
        }
    }

    // O(N) time, O(N) memory
    var aChildIndex = keyIndex(aChildren)
    var aKeys = aChildIndex.keys
    var aFree = aChildIndex.free

    if (aFree.length === aChildren.length) {
        return {
            children: bChildren,
            moves: null
        }
    }

    // O(MAX(N, M)) memory
    var newChildren = []

    var freeIndex = 0
    var freeCount = bFree.length
    var deletedItems = 0

    // Iterate through a and match a node in b
    // O(N) time,
    for (var i = 0 ; i < aChildren.length; i++) {
        var aItem = aChildren[i]
        var itemIndex

        if (aItem.key) {
            if (bKeys.hasOwnProperty(aItem.key)) {
                // Match up the old keys
                itemIndex = bKeys[aItem.key]
                newChildren.push(bChildren[itemIndex])

            } else {
                // Remove old keyed items
                itemIndex = i - deletedItems++
                newChildren.push(null)
            }
        } else {
            // Match the item in a with the next free item in b
            if (freeIndex < freeCount) {
                itemIndex = bFree[freeIndex++]
                newChildren.push(bChildren[itemIndex])
            } else {
                // There are no free items in b to match with
                // the free items in a, so the extra free nodes
                // are deleted.
                itemIndex = i - deletedItems++
                newChildren.push(null)
            }
        }
    }

    var lastFreeIndex = freeIndex >= bFree.length ?
        bChildren.length :
        bFree[freeIndex]

    // Iterate through b and append any new keys
    // O(M) time
    for (var j = 0; j < bChildren.length; j++) {
        var newItem = bChildren[j]

        if (newItem.key) {
            if (!aKeys.hasOwnProperty(newItem.key)) {
                // Add any new keyed items
                // We are adding new items to the end and then sorting them
                // in place. In future we should insert new items in place.
                newChildren.push(newItem)
            }
        } else if (j >= lastFreeIndex) {
            // Add any leftover non-keyed items
            newChildren.push(newItem)
        }
    }

    var simulate = newChildren.slice()
    var simulateIndex = 0
    var removes = []
    var inserts = []
    var simulateItem

    for (var k = 0; k < bChildren.length;) {
        var wantedItem = bChildren[k]
        simulateItem = simulate[simulateIndex]

        // remove items
        while (simulateItem === null && simulate.length) {
            removes.push(remove(simulate, simulateIndex, null))
            simulateItem = simulate[simulateIndex]
        }

        if (!simulateItem || simulateItem.key !== wantedItem.key) {
            // if we need a key in this position...
            if (wantedItem.key) {
                if (simulateItem && simulateItem.key) {
                    // if an insert doesn't put this key in place, it needs to move
                    if (bKeys[simulateItem.key] !== k + 1) {
                        removes.push(remove(simulate, simulateIndex, simulateItem.key))
                        simulateItem = simulate[simulateIndex]
                        // if the remove didn't put the wanted item in place, we need to insert it
                        if (!simulateItem || simulateItem.key !== wantedItem.key) {
                            inserts.push({key: wantedItem.key, to: k})
                        }
                        // items are matching, so skip ahead
                        else {
                            simulateIndex++
                        }
                    }
                    else {
                        inserts.push({key: wantedItem.key, to: k})
                    }
                }
                else {
                    inserts.push({key: wantedItem.key, to: k})
                }
                k++
            }
            // a key in simulate has no matching wanted key, remove it
            else if (simulateItem && simulateItem.key) {
                removes.push(remove(simulate, simulateIndex, simulateItem.key))
            }
        }
        else {
            simulateIndex++
            k++
        }
    }

    // remove all the remaining nodes from simulate
    while(simulateIndex < simulate.length) {
        simulateItem = simulate[simulateIndex]
        removes.push(remove(simulate, simulateIndex, simulateItem && simulateItem.key))
    }

    // If the only moves we have are deletes then we can just
    // let the delete patch remove these items.
    if (removes.length === deletedItems && !inserts.length) {
        return {
            children: newChildren,
            moves: null
        }
    }

    return {
        children: newChildren,
        moves: {
            removes: removes,
            inserts: inserts
        }
    }
}

function remove(arr, index, key) {
    arr.splice(index, 1)

    return {
        from: index,
        key: key
    }
}

function keyIndex(children) {
    var keys = {}
    var free = []
    var length = children.length

    for (var i = 0; i < length; i++) {
        var child = children[i]

        if (child.key) {
            keys[child.key] = i
        } else {
            free.push(i)
        }
    }

    return {
        keys: keys,     // A hash of key name to index
        free: free      // An array of unkeyed item indices
    }
}

function appendPatch(apply, patch) {
    if (apply) {
        if (isArray(apply)) {
            apply.push(patch)
        } else {
            apply = [apply, patch]
        }

        return apply
    } else {
        return patch
    }
}

},{"../vnode/handle-thunk":39,"../vnode/is-thunk":40,"../vnode/is-vnode":42,"../vnode/is-vtext":43,"../vnode/is-widget":44,"../vnode/vpatch":47,"./diff-props":49,"x-is-array":27}],51:[function(require,module,exports){

},{}]},{},[1]);
