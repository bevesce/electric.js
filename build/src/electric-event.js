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
            if (all(vs.map(function (v) { return v.happend; }))) {
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
var Happend = (function (_super) {
    __extends(Happend, _super);
    function Happend(value) {
        _super.call(this);
        this.happend = true;
        this.value = value;
    }
    Happend.prototype.toString = function () {
        return "Happend: " + this.value.toString();
    };
    Happend.prototype.map = function (f) {
        return ElectricEvent.of(f(this.value));
    };
    Happend.prototype.flattenMap = function (f) {
        return f(this.value);
    };
    return Happend;
})(ElectricEvent);
var NotHappend = (function (_super) {
    __extends(NotHappend, _super);
    function NotHappend() {
        _super.call(this);
        this.happend = false;
        this.value = undefined;
    }
    NotHappend.prototype.toString = function () {
        return 'NotHappend';
    };
    NotHappend.prototype.map = function (f) {
        return ElectricEvent.notHappend;
    };
    NotHappend.prototype.flattenMap = function (f) {
        return ElectricEvent.notHappend;
    };
    return NotHappend;
})(ElectricEvent);
ElectricEvent.notHappend = new NotHappend();
module.exports = ElectricEvent;
