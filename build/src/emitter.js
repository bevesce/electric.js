var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var scheduler = require('./scheduler');
var transformators = require('./transformator-helpers');
var ElectricEvent = require('./electric-event');
var Wire = require('./wire');
var fn = require('./utils/fn');
exports.placeholder = require('./placeholder');
var ConcreteEmitter = (function () {
    function ConcreteEmitter(initialValue) {
        if (initialValue === void 0) { initialValue = undefined; }
        this._receivers = [];
        this._currentValue = initialValue;
        this.name = (this.name);
    }
    ConcreteEmitter.prototype.toString = function (includeCurrentValue) {
        if (includeCurrentValue === void 0) { includeCurrentValue = false; }
        if (includeCurrentValue) {
            return "| " + this.name + " = " + this.dirtyCurrentValue().toString() + " >";
        }
        return "| " + this.name + " >";
    };
    // when reveiver is plugged current value is not emitted to him
    // instantaneously, but instead it's done asynchronously
    ConcreteEmitter.prototype.plugReceiver = function (receiver) {
        if (typeof receiver !== 'function' && receiver.wire) {
            receiver = receiver.wire(this);
        }
        this._receivers.push(receiver);
        this._asyncDispatchToReceiver(receiver, this._currentValue);
        return this._receivers.length - 1;
    };
    ConcreteEmitter.prototype._dirtyPlugReceiver = function (receiver) {
        if (typeof receiver !== 'function' && receiver.wire) {
            receiver = receiver.wire(this);
        }
        this._receivers.push(receiver);
        // this._asyncDispatchToReceiver(receiver, this._currentValue);
        return this._receivers.length - 1;
    };
    ConcreteEmitter.prototype.unplugReceiver = function (receiverOrId) {
        var index = this._getIndexOfReceiver(receiverOrId);
        this._receivers.splice(index, 1);
    };
    ConcreteEmitter.prototype._getIndexOfReceiver = function (receiverOrId) {
        if (typeof receiverOrId === 'number') {
            return receiverOrId;
        }
        else {
            return this._receivers.indexOf(receiverOrId);
        }
    };
    ConcreteEmitter.prototype.dirtyCurrentValue = function () {
        return this._currentValue;
    };
    ConcreteEmitter.prototype.stabilize = function () {
        this.emit = this._throwStabilized;
        this.impulse = this._throwStabilized;
        this._releaseResources();
    };
    ConcreteEmitter.prototype.setReleaseResources = function (releaseResources) {
        this._releaseResources = releaseResources;
    };
    ConcreteEmitter.prototype._releaseResources = function () {
        // should be overwritten in more specific emitters
    };
    ConcreteEmitter.prototype._throwStabilized = function (value) {
        throw Error("can't emit <" + value + "> from " + this.name + ", it's stabilized");
    };
    // let's say that f = constant(y).emit(x) is called at t_e
    // then f(t) = x for t >= t_e, and f(t) = y for t < t_e
    ConcreteEmitter.prototype.emit = function (value) {
        if (this._equals(this._currentValue, value)) {
            return;
        }
        this._dispatchToReceivers(value);
        this._currentValue = value;
    };
    // let's say that f constant(y).impulse(x) is called at t_i
    // then f(t_i) = x and f(t) = y when t != t_i
    ConcreteEmitter.prototype.impulse = function (value) {
        if (this._equals(this._currentValue, value)) {
            return;
        }
        this._dispatchToReceivers(value);
        this._dispatchToReceivers(this._currentValue);
    };
    ConcreteEmitter.prototype._equals = function (x, y) {
        return x === y;
    };
    ConcreteEmitter.prototype.setEquals = function (equals) {
        this._equals = equals;
    };
    ConcreteEmitter.prototype._dispatchToReceivers = function (value) {
        var currentReceivers = this._receivers.slice();
        for (var _i = 0; _i < currentReceivers.length; _i++) {
            var receiver = currentReceivers[_i];
            // this._asyncDispatchToReceiver(receiver, value);
            this._dispatchToReceiver(receiver, value);
        }
    };
    ConcreteEmitter.prototype._dispatchToReceiver = function (receiver, value) {
        if (typeof receiver === 'function') {
            receiver(value);
        }
        else {
            receiver.receive(value);
        }
    };
    ConcreteEmitter.prototype._asyncDispatchToReceivers = function (value) {
        var currentReceivers = this._receivers.slice();
        for (var _i = 0; _i < currentReceivers.length; _i++) {
            var receiver = currentReceivers[_i];
            this._asyncDispatchToReceiver(receiver, value);
        }
    };
    ConcreteEmitter.prototype._asyncDispatchToReceiver = function (receiver, value) {
        var _this = this;
        scheduler.scheduleTimeout(function () { return _this._dispatchToReceiver(receiver, value); }, 0);
    };
    // transformators
    ConcreteEmitter.prototype.map = function (mapping) {
        return namedTransformator("map(" + fn(mapping) + ")", [this], transformators.map(mapping, 1), mapping(this._currentValue));
    };
    ConcreteEmitter.prototype.filter = function (initialValue, predicate) {
        return namedTransformator("filter(" + fn(predicate) + ")", [this], transformators.filter(predicate), initialValue);
    };
    ConcreteEmitter.prototype.filterMap = function (initialValue, mapping) {
        return namedTransformator("filterMap(" + fn(mapping) + ")", [this], transformators.filterMap(mapping), initialValue);
    };
    ConcreteEmitter.prototype.transformTime = function (initialValue, timeShift, t0) {
        if (t0 === void 0) { t0 = 0; }
        var t = namedTransformator("transformTime(" + fn(timeShift) + ")", [this], transformators.transformTime(timeShift, t0), initialValue);
        this._dispatchToReceiver(t._dirtyGetWireTo(this), this.dirtyCurrentValue());
        return t;
    };
    ConcreteEmitter.prototype.accumulate = function (initialValue, accumulator) {
        var acc = accumulator(initialValue, this.dirtyCurrentValue());
        return namedTransformator("accumulate(" + fn(accumulator) + ")", [this], transformators.accumulate(acc, accumulator), acc);
    };
    ConcreteEmitter.prototype.changes = function () {
        return namedTransformator('changes', [this], transformators.changes(this.dirtyCurrentValue()), ElectricEvent.notHappend);
    };
    ConcreteEmitter.prototype.when = function (switcher) {
        var t = namedTransformator('whenHappensThen', [this], transformators.when(switcher.happens, switcher.then), ElectricEvent.notHappend);
        return t;
    };
    ConcreteEmitter.prototype.whenThen = function (happens) {
        var t = namedTransformator('whenThen', [this], transformators.whenThen(happens), ElectricEvent.notHappend);
        return t;
    };
    ConcreteEmitter.prototype.sample = function (initialValue, samplingEvent) {
        var t = namedTransformator('sample', [this, samplingEvent], transformators.sample(), initialValue);
        return t;
    };
    ConcreteEmitter.prototype.change = function () {
        var switchers = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            switchers[_i - 0] = arguments[_i];
        }
        return namedTransformator('changeToWhen', [this].concat(switchers.map(function (s) { return s.when; })), transformators.change(switchers), this._currentValue);
    };
    return ConcreteEmitter;
})();
exports.ConcreteEmitter = ConcreteEmitter;
function emitter(initialValue) {
    return new ConcreteEmitter(initialValue);
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
})(ConcreteEmitter);
exports.ManualEmitter = ManualEmitter;
function manual(initialValue, name) {
    var e = new ManualEmitter(initialValue);
    e.name = name || 'manual';
    return e;
}
exports.manual = manual;
function constant(value) {
    var e = new ConcreteEmitter(value);
    e.name = "constant(" + value + ")";
    return e;
}
exports.constant = constant;
function manualEvent(initialValue, name) {
    // initialValue doesn nothing it just to ease up
    // typing
    // instead of var e = <Emitter<ElectricEvent<T>>>manualEvent()
    // you can do var e = manualEvent(<T>null)
    // manual event emitter should
    // pack impulsed values into event
    // and not allow to emit values
    // it's done by monkey patching ManualEmitter
    var e = manual(ElectricEvent.notHappend);
    var oldImpulse = e.impulse;
    e.impulse = function (v) { return oldImpulse.apply(e, [ElectricEvent.of(v)]); };
    e.emit = function (v) {
        throw Error("can't emit from event emitter, only impulse");
    };
    e.name = name || 'manual event';
    // monkey patching requires ugly casting...
    return e;
}
exports.manualEvent = manualEvent;
var Transformator = (function (_super) {
    __extends(Transformator, _super);
    function Transformator(emitters, initialValue, transform) {
        if (transform === void 0) { transform = undefined; }
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
})(ConcreteEmitter);
exports.Transformator = Transformator;
function namedTransformator(name, emitters, transform, initialValue) {
    if (transform === void 0) { transform = undefined; }
    var t = new Transformator(emitters, initialValue, transform);
    t.name = name;
    return t;
}
exports.namedTransformator = namedTransformator;
