var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var fp = require('./fp');
var Emitter = (function () {
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
        this.dispatchToReceiver(this._currentValue, receiver);
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
    Emitter.prototype._emit = function (value) {
        if (this._currentValue === value) {
            return;
        }
        this.dispatchToReceivers(value);
        this._currentValue = value;
    };
    Emitter.prototype._impulse = function (value) {
        if (this._currentValue === value) {
            return;
        }
        this.dispatchToReceivers(value);
        this.dispatchToReceivers(this._currentValue);
    };
    Emitter.prototype.dispatchToReceivers = function (value) {
        var currentReceivers = this._receivers.slice();
        for (var _i = 0; _i < currentReceivers.length; _i++) {
            var receiver = currentReceivers[_i];
            this.dispatchToReceiver(value, receiver);
        }
    };
    Emitter.prototype.dispatchToReceiver = function (value, receiver) {
        if (typeof receiver === 'function') {
            receiver(value);
        }
        else {
            receiver.receive(value);
        }
    };
    return Emitter;
})();
exports.Emitter = Emitter;
var ManualEmitter = (function (_super) {
    __extends(ManualEmitter, _super);
    function ManualEmitter() {
        _super.apply(this, arguments);
        this.emit = this._emit;
        this.impulse = this._impulse;
    }
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
function fromEvent(target, type, useCapture) {
    if (useCapture === void 0) { useCapture = false; }
    var e = new ManualEmitter(undefined);
    e.name = 'event(' + type + ' - ' + target + ')';
    target.addEventListener(type, function (event) {
        e.impulse(event);
    }, useCapture);
    return e;
}
exports.fromEvent = fromEvent;
function fromPromise(promise) {
    var e = new ManualEmitter(undefined);
    e.name = 'promise(' + promise + ')';
    promise.then(function (value) { return e.impulse(fp.either.right(value)); }, function (err) { return e.impulse(fp.either.left(err)); });
    return e;
}
exports.fromPromise = fromPromise;
