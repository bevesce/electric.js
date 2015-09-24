var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var all = require('./utils/all');
var ElectricEvent = (function () {
    function ElectricEvent() {
        this.__$isevent$ = true;
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
var happened = (function (_super) {
    __extends(happened, _super);
    function happened(value) {
        _super.call(this);
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
})(ElectricEvent);
var notHappened = (function (_super) {
    __extends(notHappened, _super);
    function notHappened() {
        _super.call(this);
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
})(ElectricEvent);
ElectricEvent.notHappened = new notHappened();
module.exports = ElectricEvent;
