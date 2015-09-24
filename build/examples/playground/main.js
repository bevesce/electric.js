(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var electric = require('../../src/electric');
var rui = require('../../src/receivers/ui');
var eui = require('../../src/emitters/ui');
function pointToText(point) {
    return point.x + ', ' + point.y;
}
var rendered = rui.htmlReceiverById('mouse-location');
var mouseXY = eui.mouseXY(document);
document.body.addEventListener('click', function () {
    console.log('a');
});
mouseXY
    .map(pointToText)
    .plugReceiver(rendered);
var g = electric.graph.of(mouseXY);
console.log(g.stringify());

},{"../../src/electric":5,"../../src/emitters/ui":7,"../../src/receivers/ui":11}],2:[function(require,module,exports){
var clock = require('../clock');
var scheduler = require('../scheduler');
var transformator = require('../transformator');
function integral(initialValue, emitter, options) {
    var timmed = timeValue(emitter, options);
    var acc = timmed.accumulate({
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
    });
    acc.name = 'internal integral accumulator';
    var result = acc.map(function (v) { return v.sum; });
    result.name = 'integral';
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
        var now = scheduler.now();
        var dt = now - acc.time;
        var diff = acc.diff;
        if (dt !== 0) {
            diff = v.value.sub(acc.value).divT(dt);
        }
        return {
            time: now,
            value: v.value,
            diff: diff
        };
    }).map(function (v) { return v.diff; });
    result.setEquals(function (x, y) { return x.equals(y); });
    result.name = 'differential';
    return result;
}
exports.differential = differential;
function timeValue(emitter, options) {
    var time = clock.time(options);
    var trans = transformator.map(function (t, v) { return ({ time: t, value: v }); }, time, emitter);
    trans.stabilize = function () { return time.stabilize(); };
    trans.name = 'calculus timer';
    return trans;
}

},{"../clock":3,"../scheduler":12,"../transformator":14}],3:[function(require,module,exports){
var scheduler = require('./scheduler');
var emitter = require('./emitter');
function interval(options) {
    var timer = emitter.manualEvent();
    var id = scheduler.scheduleInterval(function () {
        timer.impulse(scheduler.now());
    }, calculateInterval(options.inMs, options.fps));
    timer.name = "interval(" + calculateEmitterName(options) + ")";
    timer.setReleaseResources(function () { return scheduler.unscheduleInterval(id); });
    return timer;
}
exports.interval = interval;
function intervalValue(value, options) {
    var timer = emitter.manualEvent();
    var id = scheduler.scheduleInterval(function () {
        timer.impulse(value);
    }, calculateInterval(options.inMs, options.fps));
    timer.name = "intervalValue(" + value + ", " + calculateEmitterName(options) + ")";
    timer.setReleaseResources(function () { return scheduler.unscheduleInterval(id); });
    return timer;
}
exports.intervalValue = intervalValue;
function time(options) {
    var interval = calculateInterval(options.intervalInMs, options.fps);
    var timeEmitter = emitter.manual(scheduler.now());
    var id = scheduler.scheduleInterval(function () { return timeEmitter.emit((scheduler.now())); }, interval);
    timeEmitter.setReleaseResources(function () { return scheduler.unscheduleInterval(id); });
    timeEmitter.name = "time(" + calculateEmitterName(options) + ")";
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
        return 'fps: ' + options.fps;
    }
    else if (options.inMs !== undefined) {
        return 'interval: ' + options.inMs + 'ms';
    }
    else {
        return 'interval: ' + options.intervalInMs + 'ms';
    }
}

},{"./emitter":6,"./scheduler":12}],4:[function(require,module,exports){
var all = require('./utils/all');
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
            if (all(vs.map(function (v) { return v.happened; }))) {
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
    happened.prototype.toString = function () {
        return "happened: " + this.value.toString();
    };
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
    notHappened.prototype.toString = function () {
        return 'notHappened';
    };
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

},{"./utils/all":16}],5:[function(require,module,exports){
exports.scheduler = require('./scheduler');
exports.emitter = require('./emitter');
exports.transformator = require('./transformator');
exports.receiver = require('./receiver');
exports.clock = require('./clock');
exports.transmitter = require('./transmitter');
exports.calculus = require('./calculus/calculus');
exports.event = require('./electric-event');
exports.graph = require('./graph');
exports.e = exports.emitter;
exports.t = exports.transformator;
exports.r = exports.receiver;
exports.c = exports.calculus;

},{"./calculus/calculus":2,"./clock":3,"./electric-event":4,"./emitter":6,"./graph":8,"./receiver":10,"./scheduler":12,"./transformator":14,"./transmitter":15}],6:[function(require,module,exports){
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
var fn = require('./utils/fn');
exports.placeholder = require('./placeholder');
var Emitter = (function () {
    function Emitter(initialValue) {
        if (initialValue === void 0) { initialValue = undefined; }
        this._receivers = [];
        this._currentValue = initialValue;
        this.name = (this.name);
    }
    Emitter.prototype.toString = function (includeCurrentValue) {
        if (includeCurrentValue === void 0) { includeCurrentValue = false; }
        if (includeCurrentValue) {
            return "| " + this.name + " = " + this.dirtyCurrentValue().toString() + " >";
        }
        return "| " + this.name + " >";
    };
    // when reveiver is plugged current value is not emitted to him
    // instantaneously, but instead it's done asynchronously
    Emitter.prototype.plugReceiver = function (receiver) {
        if (typeof receiver !== 'function' && receiver.wire) {
            receiver = receiver.wire(this);
        }
        this._receivers.push(receiver);
        this._asyncDispatchToReceiver(receiver, this._currentValue);
        return this._receivers.length - 1;
    };
    Emitter.prototype._dirtyPlugReceiver = function (receiver) {
        if (typeof receiver !== 'function' && receiver.wire) {
            receiver = receiver.wire(this);
        }
        this._receivers.push(receiver);
        // this._asyncDispatchToReceiver(receiver, this._currentValue);
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
            // this._asyncDispatchToReceiver(receiver, value);
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
    Emitter.prototype._asyncDispatchToReceivers = function (value) {
        var currentReceivers = this._receivers.slice();
        for (var _i = 0; _i < currentReceivers.length; _i++) {
            var receiver = currentReceivers[_i];
            this._asyncDispatchToReceiver(receiver, value);
        }
    };
    Emitter.prototype._asyncDispatchToReceiver = function (receiver, value) {
        var _this = this;
        scheduler.scheduleTimeout(function () { return _this._dispatchToReceiver(receiver, value); }, 0);
    };
    // transformators
    Emitter.prototype.map = function (mapping) {
        return namedTransformator("map(" + fn(mapping) + ")", [this], transformators.map(mapping, 1), mapping(this._currentValue));
    };
    Emitter.prototype.filter = function (initialValue, predicate) {
        return namedTransformator("filter(" + fn(predicate) + ")", [this], transformators.filter(predicate), initialValue);
    };
    Emitter.prototype.filterMap = function (initialValue, mapping) {
        return namedTransformator("filterMap(" + fn(mapping) + ")", [this], transformators.filterMap(mapping), initialValue);
    };
    Emitter.prototype.transformTime = function (initialValue, timeShift, t0) {
        if (t0 === void 0) { t0 = 0; }
        var t = namedTransformator("transformTime(" + fn(timeShift) + ")", [this], transformators.transformTime(timeShift, t0), initialValue);
        this._dispatchToReceiver(t._dirtyGetWireTo(this), this.dirtyCurrentValue());
        return t;
    };
    Emitter.prototype.accumulate = function (initialValue, accumulator) {
        var acc = accumulator(initialValue, this.dirtyCurrentValue());
        return namedTransformator("accumulate(" + fn(accumulator) + ")", [this], transformators.accumulate(acc, accumulator), acc);
    };
    Emitter.prototype.changes = function () {
        return namedTransformator('changes', [this], transformators.changes(this.dirtyCurrentValue()), eevent.notHappened);
    };
    Emitter.prototype.when = function (switcher) {
        var t = namedTransformator('whenHappensThen', [this], transformators.when(switcher.happens, switcher.then), eevent.notHappened);
        return t;
    };
    Emitter.prototype.whenThen = function (happens) {
        var t = namedTransformator('whenThen', [this], transformators.whenThen(happens), eevent.notHappened);
        return t;
    };
    Emitter.prototype.sample = function (initialValue, samplingEvent) {
        var t = namedTransformator('sample', [this, samplingEvent], transformators.sample(), initialValue);
        return t;
    };
    Emitter.prototype.change = function () {
        var switchers = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            switchers[_i - 0] = arguments[_i];
        }
        return namedTransformator('changeToWhen', [this].concat(switchers.map(function (s) { return s.when; })), transformators.change(switchers), this._currentValue);
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
function manual(initialValue, name) {
    var e = new ManualEmitter(initialValue);
    e.name = name || 'manual';
    return e;
}
exports.manual = manual;
function constant(value) {
    var e = new Emitter(value);
    e.name = "constant(" + value + ")";
    return e;
}
exports.constant = constant;
function manualEvent(name) {
    // manual event emitter should
    // pack impulsed values into event
    // and not allow to emit values
    // it's done by monkey patching ManualEmitter
    var e = manual(eevent.notHappened);
    var oldImpulse = e.impulse;
    e.impulse = function (v) { return oldImpulse.apply(e, [eevent.of(v)]); };
    e.emit = function (v) {
        throw Error("can't emit from event emitter, only impulse");
    };
    e.name = name || 'manualEvent';
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
        this.name = 'transformator';
        this._values = Array(emitters.length);
        if (transform) {
            this.setTransform(transform);
        }
        this._wires = [];
        this.plugEmitters(emitters);
    }
    Transformator.prototype.toString = function (includeCurrentValue) {
        if (includeCurrentValue === void 0) { includeCurrentValue = false; }
        if (includeCurrentValue) {
            return "< " + this.name + " = " + this.dirtyCurrentValue().toString() + " >";
        }
        return "< " + this.name + " >";
    };
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
    t.name = name;
    return t;
}
exports.namedTransformator = namedTransformator;

},{"./electric-event":4,"./placeholder":9,"./scheduler":12,"./transformator-helpers":13,"./utils/fn":18,"./wire":24}],7:[function(require,module,exports){
var electric = require('../electric');
var shallowCopy = require('../utils/shallow-copy');
var keyCodes = require('../utils/key-codes');
function clicks(targetOrId, mapping) {
    return fromEvent({
        target: targetOrId,
        mapping: mapping,
        type: 'click',
        preventDefault: true
    });
}
exports.clicks = clicks;
function key(name, type) {
    var keyCode = keyCodes[name];
    return fromEvent({
        target: document.body,
        mapping: function (e) { return name; },
        filter: function (e) { return e.keyCode === keyCode; },
        type: 'key' + type,
        preventDefault: true
    });
}
exports.key = key;
function text(targetOrId, type) {
    if (type === void 0) { type = 'keyup'; }
    var input = getTargetById(targetOrId);
    return fromValue({
        target: input,
        mapping: function (_) { return input.value; },
        initialValue: '',
        type: 'keyup',
        name: "text of " + targetOrId
    });
}
exports.text = text;
function enteredText(targetOrId) {
    var input = getTargetById(targetOrId);
    return fromEvent({
        target: input,
        filter: function (e) { return e.keyCode === 13; },
        mapping: function (_) { return input.value; },
        type: 'keyup',
        name: "text entered into " + targetOrId
    });
}
exports.enteredText = enteredText;
function checkbox(targetOrId) {
    var checkbox = getTargetById(targetOrId);
    return fromValue({
        target: checkbox,
        type: 'click',
        initialValue: checkbox.checked,
        mapping: function (_) { return checkbox.checked; },
        name: "checbox " + targetOrId
    });
}
exports.checkbox = checkbox;
;
function checkboxClicks(targetOrId) {
    var checkbox = getTargetById(targetOrId);
    return fromEvent({
        target: checkbox,
        type: 'click',
        mapping: function (_) { return checkbox.checked; },
        name: "checbox " + targetOrId
    });
}
exports.checkboxClicks = checkboxClicks;
;
function checkboxes(targetsOrName) {
    var targets = getTargetsByName(targetsOrName);
    var prevValue = {};
    targets.forEach(function (t) { return prevValue[t.id] = t.checked; });
    return fromValues({
        targetsOrName: targets,
        listener: function (emitter, target) {
            return function () {
                prevValue[target.id] = target.checked;
                emitter.emit(shallowCopy(prevValue));
            };
        },
        name: "checkboxes " + targetsOrName,
        type: 'click',
        initialValue: prevValue
    });
}
exports.checkboxes = checkboxes;
function radioGroup(targetsOrName) {
    var targets = getTargetsByName(targetsOrName);
    return fromValues({
        targetsOrName: targets,
        listener: function (emitter, target) {
            return function () { return emitter.emit(target.id); };
        },
        name: "radio group " + targetsOrName,
        type: 'click',
        initialValue: targets.filter(function (t) { return t.checked; })[0].id
    });
}
exports.radioGroup = radioGroup;
function select(targetOrId) {
    var select = getTargetById(targetOrId);
    return fromValue({
        target: select,
        name: "select " + targetOrId,
        mapping: function () { return select.value; },
        type: 'change',
        initialValue: select.value
    });
}
exports.select = select;
;
function mouseXY(targetOrId) {
    return fromValue({
        type: 'mousemove',
        target: targetOrId,
        initialValue: { x: undefined, y: undefined },
        name: 'mouse position',
        mapping: function (e) { return ({ x: e.offsetX, y: e.offsetY }); }
    });
}
exports.mouseXY = mouseXY;
function mouseDown(targetOrId) {
    return fromEvent({
        type: 'mousedown',
        target: targetOrId,
        mapping: function (e) { return ({ x: e.offsetX, y: e.offsetY }); }
    });
}
exports.mouseDown = mouseDown;
function mouseUp(targetOrId) {
    return fromEvent({
        type: 'mouseup',
        target: targetOrId,
        mapping: function (e) { return ({ x: e.offsetX, y: e.offsetY }); }
    });
}
exports.mouseUp = mouseUp;
var hashEmitter = null;
function hash() {
    if (!hashEmitter) {
        hashEmitter = fromValue({
            type: 'hashchange',
            name: 'window.location.hash',
            target: window,
            mapping: function () { return window.location.hash; },
            initialValue: window.location.hash
        });
    }
    return hashEmitter;
}
exports.hash = hash;
function fromEvent(options) {
    var useCapture = options.useCapture === true ? true : false;
    var emitter = electric.emitter.manualEvent();
    var target = getTargetById(options.target);
    emitter.name = options.name || options.type + " on " + options.target;
    var impulse = emitOrImpluse(emitter, options);
    target.addEventListener(options.type, impulse, useCapture);
    emitter.setReleaseResources(function () {
        return target.removeEventListener(options.type, impulse, useCapture);
    });
    return emitter;
}
exports.fromEvent = fromEvent;
function fromValue(options) {
    var useCapture = options.useCapture === true ? true : false;
    var emitter = electric.emitter.manual(options.initialValue);
    var target = getTargetById(options.target);
    emitter.name = options.name || options.type + " on " + options.target;
    var emit = emitOrImpluse(emitter, options, false);
    target.addEventListener(options.type, emit, useCapture);
    emitter.setReleaseResources(function () {
        return target.removeEventListener(options.type, emit, useCapture);
    });
    return emitter;
}
exports.fromValue = fromValue;
function fromValues(options) {
    var targets = getTargetsByName(options.targetsOrName);
    var emitter = electric.emitter.manual(options.initialValue);
    var listeners = [];
    targets.forEach(function (t) {
        listeners.push(options.listener(emitter, t));
        t.addEventListener(options.type, listeners[listeners.length - 1]);
    });
    emitter.name = options.name || options.type + " " + options.targetsOrName;
    emitter.setReleaseResources(function () {
        targets.forEach(function (t, i) {
            t.removeEventListener(options.type, listeners[i]);
        });
    });
    return emitter;
}
exports.fromValues = fromValues;
// some event can fire with high frequency
// so here we ensure that all the checks of
// provided options are calculated only at creation
// ugly code
function emitOrImpluse(emitter, options, impulse) {
    if (impulse === void 0) { impulse = true; }
    var filter = options.filter;
    var mapping = options.mapping;
    var preventDefault = options.preventDefault;
    if (filter && mapping && impulse && preventDefault) {
        return function (event) {
            if (filter(event)) {
                emitter.impulse(mapping(event));
            }
        };
    }
    else if (filter && mapping && impulse) {
        return function (event) {
            if (filter(event)) {
                emitter.impulse(mapping(event));
            }
        };
    }
    else if (filter && impulse && preventDefault) {
        return function (event) {
            event.preventDefault();
            if (filter(event)) {
                emitter.impulse(event);
            }
        };
    }
    else if (filter && impulse) {
        return function (event) {
            if (filter(event)) {
                emitter.impulse(event);
            }
        };
    }
    else if (mapping && impulse && preventDefault) {
        return function (event) {
            event.preventDefault();
            emitter.impulse(mapping(event));
        };
    }
    else if (mapping && impulse) {
        return function (event) {
            emitter.impulse(mapping(event));
        };
    }
    else if (filter && mapping && preventDefault) {
        return function (event) {
            event.preventDefault();
            if (filter(event)) {
                emitter.emit(mapping(event));
            }
        };
    }
    else if (filter && mapping) {
        return function (event) {
            if (filter(event)) {
                emitter.emit(mapping(event));
            }
        };
    }
    else if (filter && preventDefault) {
        return function (event) {
            event.preventDefault();
            if (filter(event)) {
                emitter.emit(event);
            }
        };
    }
    else if (filter) {
        return function (event) {
            if (filter(event)) {
                emitter.emit(event);
            }
        };
    }
    else if (mapping && preventDefault) {
        return function (event) {
            event.preventDefault();
            emitter.emit(mapping(event));
        };
    }
    else if (mapping) {
        return function (event) {
            emitter.emit(mapping(event));
        };
    }
    else if (preventDefault) {
        return function (event) {
            event.preventDefault();
            emitter.impulse(event);
        };
    }
    else {
        return function (event) {
            emitter.impulse(event);
        };
    }
}
function getTargetById(t) {
    if (typeof t === 'string') {
        return document.getElementById(t);
    }
    return t;
}
function getTargetsByName(t) {
    if (typeof t === 'string') {
        return Array.prototype.slice.apply(document.getElementsByName(t));
    }
    return t;
}

},{"../electric":5,"../utils/key-codes":19,"../utils/shallow-copy":23}],8:[function(require,module,exports){
var pushIfNotIn = require('./utils//push-if-not-in');
var Graph = (function () {
    function Graph(source, depth, showCurrentValue) {
        this._sources = [];
        this.vertices = [];
        this.showCurrentValue = showCurrentValue;
        this.sourceIndex = this._findVertices(source, 0, depth);
        this._findEdges();
        this.clean();
    }
    Graph.of = function (source, depth, showCurrentValue) {
        if (showCurrentValue === void 0) { showCurrentValue = false; }
        return new Graph(source, depth, showCurrentValue);
    };
    Graph.prototype.removeVertex = function (id) {
        this.vertices = this.vertices
            .filter(function (v) { return v.id !== id; })
            .map(function (v) { return ({
            id: v.id,
            name: v.name,
            receivers: v.receivers.filter(function (r) { return r !== id; }),
            emitters: v.emitters.filter(function (e) { return e !== id; }),
            type: v.type
        }); });
        this.edges = this.edges.filter(function (e) { return e.source !== id && e.target !== id; });
    };
    Graph.prototype._findVertices = function (source, depth, maxDepth) {
        if (source.__$visualize_visited_id$ !== undefined) {
            return source.__$visualize_visited_id$;
        }
        this._sources.push(source);
        this.vertices.push({
            id: this.vertices.length,
            name: this._name(source),
            receivers: [],
            emitters: [],
            type: this._sourceType(source)
        });
        source.__$visualize_visited_id$ = this.vertices.length - 1;
        this._goBackwards(source, depth + 1, maxDepth);
        this._goForwards(source, depth + 1, maxDepth);
        return source.__$visualize_visited_id$;
    };
    Graph.prototype._sourceType = function (source) {
        if (typeof source === 'function') {
            return 'receiver';
        }
        if (!source._wires) {
            return 'emitter';
        }
        return 'transformator';
    };
    Graph.prototype._goBackwards = function (source, depth, maxDepth) {
        var _this = this;
        if (this._shouldntGo(depth, maxDepth, source._wires)) {
            return;
        }
        source._wires.forEach(function (w) {
            var e = w.input;
            e = _this._maybeUnpackPlaceholder(e);
            var wId = _this._findVertices(e, depth, maxDepth);
            var sourceId = source.__$visualize_visited_id$;
            pushIfNotIn(_this.vertices[sourceId].emitters, wId);
            pushIfNotIn(_this.vertices[wId].receivers, sourceId);
        });
    };
    Graph.prototype._goForwards = function (source, depth, maxDepth) {
        var _this = this;
        if (this._shouldntGo(depth, maxDepth, source._receivers)) {
            return;
        }
        source._receivers.forEach(function (r) {
            r = _this._maybeUnpackWire(r);
            r = _this._maybeUnpackPlaceholder(r);
            var rId = _this._findVertices(r, depth, maxDepth);
            var sourceId = source.__$visualize_visited_id$;
            pushIfNotIn(_this.vertices[sourceId].receivers, rId);
            pushIfNotIn(_this.vertices[rId].emitters, sourceId);
        });
    };
    Graph.prototype._shouldntGo = function (depth, maxDepth, potentialEdges) {
        if (maxDepth && depth >= maxDepth) {
            return true;
        }
        if (potentialEdges === undefined) {
            return true;
        }
        return false;
    };
    Graph.prototype._maybeUnpackPlaceholder = function (e) {
        if (e._emitter !== undefined) {
            return e._emitter;
        }
        return e;
    };
    Graph.prototype._maybeUnpackWire = function (w) {
        if (w.input !== undefined && w.output !== undefined) {
            return w.output;
        }
        return w;
    };
    Graph.prototype._name = function (source) {
        if (typeof source === 'function') {
            return "< " + (source.name || 'anonymous') + " |";
        }
        return source.toString(this.showCurrentValue);
    };
    Graph.prototype._findEdges = function () {
        var _this = this;
        this.edges = [];
        for (var i = 0; i < this.vertices.length; i++) {
            var node = this.vertices[i];
            var type = 'transformator';
            node.emitters.forEach(function (e) {
                _this.edges.push({
                    source: e,
                    target: i
                });
            });
        }
    };
    Graph.prototype.clean = function () {
        this._sources.forEach(function (s) { return s.__$visualize_visited_id$ = undefined; });
    };
    Graph.prototype.stringify = function () {
        return JSON.stringify({
            vertices: this.vertices,
            edges: this.edges
        });
    };
    return Graph;
})();
module.exports = Graph;

},{"./utils//push-if-not-in":22}],9:[function(require,module,exports){
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
        this.initialValue = initialValue;
        this.name = '| placeholder >';
    }
    Placeholder.prototype.toString = function (showCurrentValue) {
        if (showCurrentValue === void 0) { showCurrentValue = false; }
        if (this._emitter) {
            return 'placeholder: ' + this._emitter.toString(showCurrentValue);
        }
        else if (showCurrentValue) {
            return "? placeholder = " + this.dirtyCurrentValue() + " >";
        }
        return '? placeholder >';
    };
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
    };
    Placeholder.prototype.dirtyCurrentValue = function () {
        if (this._emitter) {
            return this._emitter.dirtyCurrentValue();
        }
        else if (this.initialValue !== undefined) {
            return this.initialValue;
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

},{}],10:[function(require,module,exports){
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
        console.log(emitter.name, '>>>', x);
    });
}
exports.log = log;
function logEvents(emitter) {
    emitter.plugReceiver(function (x) {
        if (!x.happened) {
            return;
        }
        console.log(emitter.name, '>>>', x.value);
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

},{}],11:[function(require,module,exports){
function htmlReceiverById(id) {
    var element = document.getElementById(id);
    return function htmlReceiver(html) {
        element.innerHTML = html;
    };
}
exports.htmlReceiverById = htmlReceiverById;

},{}],12:[function(require,module,exports){
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
    while (stopTime < newTime) {
        executeCallbacksForTime(stopTime);
        stopTime++;
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

},{}],13:[function(require,module,exports){
var callIfFunction = require('./utils/call-if-function');
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
                var e = callIfFunction(to, v[0], v[i].value);
                this._wires[0] = new Wire(e, this, function (x) { return _this.receiveOn(x, 0); });
            }
        };
    };
}
exports.change = change;
function when(happens, then) {
    return function transform(emit, impulse) {
        var prevhappened = false;
        return function whenTransform(v, i) {
            var happened = happens(v[i]);
            if (happened && !prevhappened) {
                impulse(eevent.of(then(v[i])));
                prevhappened = true;
            }
            else if (!happened) {
                prevhappened = false;
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
function changes(initialValue) {
    return function transform(emit, impulse) {
        var previous = initialValue;
        return function changesTransform(v, i) {
            impulse(eevent.of({
                previous: previous,
                next: v[i]
            }));
            previous = v[i];
        };
    };
}
exports.changes = changes;

},{"./electric-event":4,"./scheduler":12,"./utils/call-if-function":17,"./wire":24}],14:[function(require,module,exports){
var emitter = require('./emitter');
var namedTransformator = emitter.namedTransformator;
var transformators = require('./transformator-helpers');
var eevent = require('../src/electric-event');
var fn = require('./utils/fn');
var mapObj = require('./utils/map-obj');
var objKeys = require('./utils/objKeys');
function map(mapping, emitter1, emitter2, emitter3, emitter4, emitter5, emitter6, emitter7) {
    var emitters = Array.prototype.slice.apply(arguments, [1]);
    return namedTransformator("map(" + fn(mapping) + ")", emitters, transformators.map(mapping, emitters.length), mapping.apply(null, emitters.map(function (e) { return e.dirtyCurrentValue(); })));
}
exports.map = map;
;
function mapMany(mapping) {
    var emitters = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        emitters[_i - 1] = arguments[_i];
    }
    return namedTransformator("mapMany(" + fn(mapping) + ")", emitters, transformators.map(mapping, emitters.length), mapping.apply(null, emitters.map(function (e) { return e.dirtyCurrentValue(); })));
}
exports.mapMany = mapMany;
function filter(initialValue, predicate, emitter1, emitter2, emitter3, emitter4, emitter5, emitter6, emitter7) {
    var emitters = Array.prototype.slice.apply(arguments, [2]);
    return namedTransformator("filter(" + fn(predicate) + ")", emitters, transformators.filter(predicate, emitters.length), initialValue);
}
exports.filter = filter;
;
function filterMap(initialValue, filterMapping, emitter1, emitter2, emitter3, emitter4, emitter5, emitter6, emitter7) {
    var emitters = Array.prototype.slice.apply(arguments, [2]);
    return namedTransformator("filterMap(" + fn(filterMapping) + ")", emitters, transformators.filterMap(filterMapping, emitters.length), initialValue);
}
exports.filterMap = filterMap;
;
function accumulate(initialValue, accumulator, emitter1, emitter2, emitter3, emitter4, emitter5, emitter6, emitter7) {
    var emitters = Array.prototype.slice.apply(arguments, [2]);
    var acc = accumulator.apply([], [initialValue].concat(emitters.map(function (e) { return e.dirtyCurrentValue(); })));
    return namedTransformator("accumulate(" + fn(accumulator) + ")", emitters, transformators.accumulate(acc, accumulator), acc);
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
    return namedTransformator("cumulateOverTime(" + overInMs + "ms)", [emitter], transformators.cumulateOverTime(overInMs), eevent.notHappened);
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
    return namedTransformator('changes', [emitter], transformators.changes(emitter.dirtyCurrentValue()), eevent.notHappened);
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
    return namedTransformator('skip(1)', [emitter], transform, eevent.notHappened);
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
    var transformator = namedTransformator('flattenMany', [emitter].concat(emitter.dirtyCurrentValue()), transform, currentValues);
    function transform(emit) {
        return function flattenManyTransform(v, i) {
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
function flattenNamed(emitter) {
    var currentValue = emitter.dirtyCurrentValue();
    var currentValues = mapObj(currentValue, function (e) { return e.dirtyCurrentValue(); });
    var currentKeys = objKeys(currentValue);
    var transformator = namedTransformator('flattenNamed', [emitter].concat(currentKeys.map(function (k) { return currentValue[k]; })), transform, currentValues);
    function transform(emit) {
        var keys = currentKeys;
        return function flattenNamedTransform(v, i) {
            if (i == 0) {
                transformator.dropEmitters(1);
                keys = objKeys(v[0]);
                keys.forEach(function (k) {
                    transformator.plugEmitter(v[0][k]);
                });
                emit(mapObj(v[0], function (e) { return e.dirtyCurrentValue(); }));
            }
            else {
                var r = {};
                keys.forEach(function (k, i) {
                    r[k] = v[i + 1];
                });
                emit(r);
            }
        };
    }
    ;
    return transformator;
}
exports.flattenNamed = flattenNamed;

},{"../src/electric-event":4,"./emitter":6,"./transformator-helpers":13,"./utils/fn":18,"./utils/map-obj":20,"./utils/objKeys":21}],15:[function(require,module,exports){
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
    t.name = '? | transmitter';
    return t;
}
module.exports = transmitter;

},{"./emitter":6,"./wire":24}],16:[function(require,module,exports){
function all(list) {
    for (var i = 0; i < list.length; i++) {
        if (!list[i]) {
            return false;
        }
    }
    return true;
}
module.exports = all;

},{}],17:[function(require,module,exports){
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
module.exports = callIfFunction;

},{}],18:[function(require,module,exports){
function fn(f) {
    return f.name || '=>';
}
module.exports = fn;

},{}],19:[function(require,module,exports){
var keyCodes = {
    backspace: 8,
    tab: 9,
    enter: 13,
    shift: 16,
    ctrl: 17,
    alt: 18,
    pause: 19,
    capslock: 20,
    escape: 27,
    pageup: 33,
    pagedown: 34,
    end: 35,
    home: 36,
    left: 37,
    up: 38,
    right: 39,
    down: 40,
    insert: 45,
    delete: 46,
    0: 48,
    1: 49,
    2: 50,
    3: 51,
    4: 52,
    5: 53,
    6: 54,
    7: 55,
    8: 56,
    9: 57,
    a: 65,
    b: 66,
    c: 67,
    d: 68,
    e: 69,
    f: 70,
    g: 71,
    h: 72,
    i: 73,
    j: 74,
    k: 75,
    l: 76,
    m: 77,
    n: 78,
    o: 79,
    p: 80,
    q: 81,
    r: 82,
    s: 83,
    t: 84,
    u: 85,
    v: 86,
    w: 87,
    x: 88,
    y: 89,
    z: 90,
    numpad0: 96,
    numpad1: 97,
    numpad2: 98,
    numpad3: 99,
    numpad4: 100,
    numpad5: 101,
    numpad6: 102,
    numpad7: 103,
    numpad8: 104,
    numpad9: 105,
    multiply: 106,
    add: 107,
    subtract: 109,
    decimalpoint: 110,
    divide: 111,
    f1: 112,
    f2: 113,
    f3: 114,
    f4: 115,
    f5: 116,
    f6: 117,
    f7: 118,
    f8: 119,
    f9: 120,
    f10: 121,
    f11: 122,
    f12: 123,
    numlock: 144,
    scrolllock: 145,
    semicolon: 186,
    equal: 187,
    comma: 188,
    dash: 189,
    period: 190,
    forwardslash: 191,
    graveaccent: 192,
    openbracket: 219,
    backslash: 220,
    closebraket: 221,
    singlequote: 222
};
module.exports = keyCodes;

},{}],20:[function(require,module,exports){
function mapObj(obj, mapping) {
    var result = {};
    for (var key in obj) {
        if (!obj.hasOwnProperty(key)) {
            continue;
        }
        result[key] = mapping(obj[key]);
    }
    return result;
}
module.exports = mapObj;

},{}],21:[function(require,module,exports){
function objKeys(obj) {
    var result = [];
    for (var k in obj) {
        if (obj.hasOwnProperty(k)) {
            result.push(k);
        }
    }
    return result;
}
module.exports = objKeys;

},{}],22:[function(require,module,exports){
function pushIfNotIn(list, item) {
    if (list.indexOf(item) === -1) {
        list.push(item);
    }
}
module.exports = pushIfNotIn;

},{}],23:[function(require,module,exports){
function shallowCopy(obj) {
    var copy = {};
    for (var k in obj) {
        copy[k] = obj[k];
    }
    return copy;
}
module.exports = shallowCopy;

},{}],24:[function(require,module,exports){
var Wire = (function () {
    function Wire(input, output, receive, set) {
        this.input = input;
        this.output = output;
        this.name = 'w';
        if (set) {
            this._set = set;
            this._futureReceive = receive;
        }
        else {
            this.receive = receive;
        }
        this.receiverId = this.input.plugReceiver(this);
    }
    Wire.prototype.toString = function () {
        return this.input.toString() + " -" + this.name + "- " + this.output.toString();
    };
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
