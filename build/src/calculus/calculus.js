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
        var dt = v.time - acc.time;
        var diff = v.value.sub(acc.value).divT(dt);
        return {
            time: v.time,
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
    trans.name = 'timeValue';
    return trans;
}
