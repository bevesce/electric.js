var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports"], function (require, exports) {
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
});
