(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var electric = require('../../src/electric');
var ui = require('../../src/emitters/ui');
var rui = require('../../src/receivers/ui');
var eevent = require('../../src/electric-event');
function formatBoolean(value) {
    return value ? '☑ true' : '☐ false';
}
var clicks = ui.fromEvent(document.getElementById('clicker'), 'click');
var deleyedClick = clicks.transformTime(eevent.notHappend, function (t) { return t + 1000; });
clicks.merge(deleyedClick)
    .accumulate('not clicked', function (acc, x) {
    if (x.happend) {
        return acc;
    }
    return acc === 'clicked' ? 'not clicked' : 'clicked';
})
    .plugReceiver(rui.htmlReceiverById('clicked'));
var button0 = ui.fromButton('button0');
var button1 = ui.fromButton('button1');
electric.emitter.constant('not clicked').change({ to: electric.emitter.constant('clicked 0'), when: button0 }, { to: electric.emitter.constant('clicked 1'), when: button1 })
    .plugReceiver(rui.htmlReceiverById('buttoned'));
ui.fromInputText('text')
    .plugReceiver(rui.htmlReceiverById('typed'));
ui.fromCheckbox('checkbox')
    .map(function (b) { return formatBoolean(b); })
    .plugReceiver(rui.htmlReceiverById('checked'));
ui.fromCheckboxes(['checkbox0', 'checkbox1', 'checkbox2', 'checkbox3'])
    .map(function (d) {
    var result = [];
    for (var k in d) {
        result.push(k + ': ' + formatBoolean(d[k]));
    }
    return result.join(', ');
})
    .plugReceiver(rui.htmlReceiverById('checkers'));
ui.fromInputText('textarea')
    .plugReceiver(rui.htmlReceiverById('written'));
ui.fromRadioGroup('radio')
    .filter('', function (x) { return x !== undefined; })
    .plugReceiver(rui.htmlReceiverById('radioed'));
ui.fromSelect('select')
    .plugReceiver(rui.htmlReceiverById('selected'));
electric.transformator.hold({ data: {}, type: '' }, ui.mouse('mouse'))
    .map(function (o) {
    return o.type + '<br />' + 'x: ' + o.data.offsetX + '<br /> y: ' + o.data.offsetY;
})
    .plugReceiver(rui.htmlReceiverById('moused'));
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
ctx.fillStyle = 'black';
function paint(point) {
    if (!point) {
        return;
    }
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI, true);
    ctx.fillStyle = 'black';
    ctx.fill();
}
var trackpadBox = document.getElementById('trackpad');
var canvas = document.getElementById('canvas');
canvas.width = trackpadBox.offsetWidth;
canvas.height = trackpadBox.offsetHeight;
var trackpad = ui.mouse('trackpad');
var xy = electric.transformator.hold({ type: '', data: {} }, trackpad)
    .map(function (o) {
    return { x: o.data.offsetX, y: o.data.offsetY };
});
var downs = trackpad.map(function (e) {
    if (e.happend && e.value.type === 'down') {
        return eevent.of(true);
    }
    return eevent.notHappend;
});
var ups = trackpad.map(function (e) {
    if (e.happend && e.value.type === 'up') {
        return eevent.of(true);
    }
    return eevent.notHappend;
});
electric.emitter.constant(undefined).change({ to: xy, when: downs }, { to: electric.emitter.constant(undefined), when: ups })
    .plugReceiver(paint);

},{"../../src/electric":4,"../../src/electric-event":3,"../../src/emitters/ui":6,"../../src/receivers/ui":9}],2:[function(require,module,exports){
exports.scheduler = require('./scheduler');
exports.emitter = require('./emitter');
exports.transformator = require('./transformator');
var TimeValue = (function () {
    function TimeValue(time, value) {
        this.time = time;
        this.value = value;
    }
    TimeValue.of = function (time, value) {
        if (value === void 0) { value = undefined; }
        return new TimeValue(time, value);
    };
    TimeValue.lift = function (f) {
        return function () {
            var vs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                vs[_i - 0] = arguments[_i];
            }
            return TimeValue.of(Math.max.apply(Math, vs.map(function (v) { return v.time; })), f.apply(null, vs.map(function (v) { return v.value; })));
        };
    };
    TimeValue.prototype.map = function (f) {
        return TimeValue.of(this.time, f(this.value));
    };
    return TimeValue;
})();
exports.TimeValue = TimeValue;
function _time(args, transform) {
    var e = exports.emitter.manual(transform(exports.scheduler.now()));
    var subname;
    var interval;
    if (args.intervalInMs === undefined) {
        subname = 'fps: ' + args.fps;
        interval = 1 / args.fps * 1000;
    }
    else {
        subname = 'interval: ' + args.intervalInMs + 'ms';
        interval = args.intervalInMs;
    }
    var id = exports.scheduler.scheduleInterval(function () { return e.emit(transform(exports.scheduler.now())); }, interval);
    e.name = 'clock<' + subname + '>';
    function releaseResoueces() {
        console.log('STAABB');
        exports.scheduler.unscheduleInterval(id);
    }
    e.setReleaseResources(releaseResoueces);
    return e;
}
function time(args) {
    return _time(args, function (t) { return TimeValue.of(t, undefined); });
}
exports.time = time;
function timeFunction(f, args, t0) {
    if (t0 === void 0) { t0 = 0; }
    return _time(args, function (t) { return (TimeValue.of(t, f(t - t0))); });
}
exports.timeFunction = timeFunction;
function equalsWithTime(x, y) {
    return x.time === y.time && x.value === y.value;
}
function integral(f) {
    var initialAcc = { time: exports.scheduler.now(), value: 0, integral: 0 };
    var result = f.accumulate(initialAcc, function (acc, v) {
        var dt = (v.time - acc.time) / 1000;
        return {
            time: v.time,
            value: v.value,
            integral: acc.integral + (acc.value + v.value) / 2 * dt
        };
    }).map(function (v) { return TimeValue.of(v.time, v.integral); });
    result.setEquals(equalsWithTime);
    return result;
}
exports.integral = integral;
function derivative(f) {
    var initialAcc = { time: exports.scheduler.now(), value: undefined, derivative: 0 };
    var result = f.accumulate(initialAcc, function (acc, v) {
        var dt = (v.time - acc.time) / 1000;
        var diff = 0;
        if (dt !== 0) {
            diff = (v.value - acc.value) / dt / 1000;
        }
        return {
            time: v.time,
            value: v.value,
            derivative: diff
        };
    }).map(function (v) { return TimeValue.of(v.time, v.derivative); });
    result.setEquals(equalsWithTime);
    return result;
}
exports.derivative = derivative;

},{"./emitter":5,"./scheduler":11,"./transformator":13}],3:[function(require,module,exports){
var utils = require('./utils');
var ElectricEvent = (function () {
    function ElectricEvent() {
    }
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
    ElectricEvent.prototype.map = function (f) {
        throw Error('ElectricEvent is abstract class, use Happend and NotHappend');
    };
    ;
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
    return NotHappend;
})();
ElectricEvent.notHappend = new NotHappend();
module.exports = ElectricEvent;

},{"./utils":14}],4:[function(require,module,exports){
exports.scheduler = require('./scheduler');
exports.emitter = require('./emitter');
exports.transformator = require('./transformator');
exports.receiver = require('./receiver');
exports.clock = require('./clock');
// export import device = require('./device');
// export import fp = require('./fp');

},{"./clock":2,"./emitter":5,"./receiver":8,"./scheduler":11,"./transformator":13}],5:[function(require,module,exports){
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
var Emitter = (function () {
    function Emitter(initialValue) {
        if (initialValue === void 0) { initialValue = undefined; }
        this._receivers = [];
        this._currentValue = initialValue;
        this.name = 'emitter';
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
    // semantics:
    // let's say that f = constant(y).emit(x) is called at t_e
    // then f(t) = x for t >= t_e, and f(t) = y for t < t_e
    Emitter.prototype.emit = function (value) {
        if (this._equals(this._currentValue, value)) {
            return;
        }
        this._dispatchToReceivers(value);
        this._currentValue = value;
    };
    // semantics:
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
        return namedTransformator('when' + this._enclosedName(), [this], transformators.when(switcher.happens, switcher.then), eevent.notHappend);
    };
    Emitter.prototype.sample = function (initialValue, samplingEvent) {
        var t = namedTransformator('sample' + this._enclosedName() + ' on ' + this._enclosedName(samplingEvent), [this, samplingEvent], transformators.sample(), initialValue);
        return t;
    };
    Emitter.prototype.change = function () {
        var switchers = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            switchers[_i - 0] = arguments[_i];
        }
        return namedTransformator('change' + this._enclosedName(), [this].concat(switchers.map(function (s) { return s.when; })), transformators.change(switchers), this._currentValue);
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
function manualEvent() {
    // manual event emitter should
    // pack impulsed values into event
    // and not allow to emit values
    // it's done by monkey patching ManualEmitter
    var e = manual(eevent.notHappend);
    e.name = 'manual event emitter';
    var oldImpulse = e.impulse;
    e.impulse = function (v) { return oldImpulse.apply(e, [eevent.of(v)]); };
    e.emit = function (v) {
        throw Error("can't emit from event emitter, only impulse");
    };
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
        this._values = Array(emitters.length);
        ;
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
        for (var _i = 0; _i < emitters.length; _i++) {
            var emitter = emitters[_i];
            this.wire(emitter);
        }
    };
    Transformator.prototype.plugEmitter = function (emitter) {
        this.wire(emitter);
        return this._wires.length - 1;
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
    Transformator.prototype.receiveOn = function (x, index) {
        this._values[index] = x;
        this._transform(this._values, index);
    };
    Transformator.prototype.setOn = function (x, index) {
        this._values[index] = x;
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

},{"./electric-event":3,"./placeholder":7,"./scheduler":11,"./transformator-helpers":12,"./wire":15}],6:[function(require,module,exports){
var electric = require('../electric');
var utils = require('../receivers/utils');
var transformator = require('../transformator');
var eevent = require('../electric-event');
function em(text) {
    return '*' + text + '*';
}
function fromEvent(target, type, name, useCapture) {
    if (name === void 0) { name = ''; }
    if (useCapture === void 0) { useCapture = false; }
    var e = electric.emitter.manualEvent();
    e.name = name || 'event: ' + type + ' on ' + em(target);
    var impulse = function (event) {
        e.impulse(event);
    };
    target.addEventListener(type, impulse, useCapture);
    e.setReleaseResources(function () { return target.removeEventListener(type, impulse, useCapture); });
    return e;
}
exports.fromEvent = fromEvent;
function fromButton(nodeOrId) {
    var button = utils.getNode(nodeOrId);
    return fromEvent(button, 'click', 'button clicks on ' + em(nodeOrId));
}
exports.fromButton = fromButton;
function fromInputText(nodeOrId, type) {
    if (type === void 0) { type = 'keyup'; }
    var input = utils.getNode(nodeOrId);
    return fromEvent(input, 'keyup', 'text of ' + em(nodeOrId)).map(function () { return input.value; });
}
exports.fromInputText = fromInputText;
function fromCheckbox(nodeOrId) {
    var checkbox = utils.getNode(nodeOrId);
    var e = fromEvent(checkbox, 'click', 'checked of ' + em(nodeOrId));
    electric.receiver.collect(e);
    return e.map(function () { return checkbox.checked; });
}
exports.fromCheckbox = fromCheckbox;
;
function joinObjects(objs) {
    var o = {};
    objs.forEach(function (e) {
        if (e === undefined) {
            return;
        }
        o[e.key] = e.value;
    });
    return o;
}
function fromCheckboxes(nodeOrIds) {
    var emitters = nodeOrIds.map(function (nodeOrId) {
        var checkbox = utils.getNode(nodeOrId);
        return fromEvent(checkbox, 'click').map(function () { return ({ key: checkbox.id, value: checkbox.checked }); });
    });
    var e = transformator.mapMany.apply(transformator, [function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        return joinObjects(args);
    }].concat(emitters));
    e.name = 'state of checkboxes ' + em(nodeOrIds);
    return e;
}
exports.fromCheckboxes = fromCheckboxes;
;
function fromRadioGroup(nodesOrName) {
    var nodes = utils.getNodes(nodesOrName);
    var emitters = nodes.map(function (radio) { return fromEvent(radio, 'click').map(function (v) { return v.happend ? eevent.of(radio.id) : eevent.notHappend; }); });
    var e = transformator.hold('', transformator.merge.apply(transformator, emitters));
    e.name = 'state of radio group ' + em(nodesOrName);
    return e;
}
exports.fromRadioGroup = fromRadioGroup;
function fromSelect(nodeOrId) {
    var select = utils.getNode(nodeOrId);
    return fromEvent(select, 'change', 'selected of ' + em(nodeOrId)).map(function () { return select.value; });
}
exports.fromSelect = fromSelect;
;
function mouse(nodeOrId) {
    var mouse = utils.getNode(nodeOrId);
    var emitters = ['down', 'up', 'over', 'out', 'move'].map(function (type) { return fromEvent(mouse, 'mouse' + type).map(function (e) { return (e.happend ? eevent.of({ type: type, data: e.value }) : eevent.notHappend); }); });
    var emitter = transformator.merge.apply(transformator, emitters);
    emitter.name = 'mouse on ' + em(nodeOrId);
    return emitter;
}
exports.mouse = mouse;
;

},{"../electric":4,"../electric-event":3,"../receivers/utils":10,"../transformator":13}],7:[function(require,module,exports){
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
    'change'
];
// function to throw if called before is()
var functionsToSomething = [];
var Placeholder = (function () {
    function Placeholder(initialValue) {
        this._actions = [];
        this._initialValue = initialValue;
        this.name = 'placeholder';
    }
    Placeholder.prototype.is = function (emitter) {
        this._emitter = emitter;
        for (var _i = 0, _a = this._actions; _i < _a.length; _i++) {
            var action = _a[_i];
            action(this._emitter);
        }
        this._actions = undefined;
        if (this._emitter._dispatchToReceivers) {
            this._emitter._dispatchToReceivers(this._emitter.dirtyCurrentValue());
        }
        this.name = emitter.name;
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
        console.log(emitter.name + ' >>> ', x);
    });
}
exports.log = log;
function collect(emitter) {
    var r = [];
    emitter.plugReceiver(function (x) {
        r.push(x);
    });
    return r;
}
exports.collect = collect;

},{}],9:[function(require,module,exports){
function htmlReceiverById(id) {
    var element = document.getElementById(id);
    return function (html) {
        element.innerHTML = html;
    };
}
exports.htmlReceiverById = htmlReceiverById;

},{}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
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
                var to = switchers[i - 1].to;
                var e = utils.callIfFunction(to, v[0], v[i].value);
                this._wires[0].unplug();
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

},{"./electric-event":3,"./scheduler":11,"./utils":14,"./wire":15}],13:[function(require,module,exports){
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
function mapMany(mapping) {
    var emitters = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        emitters[_i - 1] = arguments[_i];
    }
    return namedTransformator('map many<' + emitters.map(function (e) { return e.name; }).join(', ') + '>', emitters, transformators.map(mapping, emitters.length), mapping.apply(null, emitters.map(function (e) { return e.dirtyCurrentValue(); })));
}
exports.mapMany = mapMany;
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

},{"../src/electric-event":3,"./emitter":5,"./transformator-helpers":12}],14:[function(require,module,exports){
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
