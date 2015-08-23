exports.scheduler = require('./scheduler');
exports.emitter = require('./emitter');
exports.transformator = require('./transformator');
var TimeValue = (function () {
    function TimeValue(time, value) {
        this.time = time;
        this.value = value;
    }
    TimeValue.prototype.map = function (f) {
        return TimeValue.of(this.time, f(this.value));
    };
    TimeValue.of = function (time, value) {
        if (value === void 0) { value = undefined; }
        return new TimeValue(time, value);
    };
    TimeValue.lift = function (f) {
        return function (tv) {
            return tv.map(f);
        };
    };
    ;
    return TimeValue;
})();
exports.TimeValue = TimeValue;
function _time(args, transform) {
    var e = exports.emitter.manual(transform(exports.scheduler.now()));
    var interval = args.intervalInMs || 1 / args.fps * 1000;
    exports.scheduler.scheduleInterval(function () { return e.emit(transform(exports.scheduler.now())); }, interval);
    return e;
}
function time(args) {
    return _time(args, function (t) { return TimeValue.of(t, undefined); });
}
exports.time = time;
function timeFunction(f, args) {
    return _time(args, function (t) { return (TimeValue.of(t, f(t))); });
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
        var diff = acc.value !== undefined ? (v.value - acc.value) : v.value;
        return {
            time: v.time,
            value: v.value,
            derivative: diff / dt
        };
    }).map(function (v) { return ({ time: v.time, value: v.derivative }); });
    result.setEquals(equalsWithTime);
    return result;
}
exports.derivative = derivative;
