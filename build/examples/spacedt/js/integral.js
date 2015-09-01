var clock = require('./clock');
var electric = require('../../../src/electric');
function integral(initialValue, emitter, options) {
    var time = clock(options);
    var timmed = electric.transformator.map(function (t, v) { return ({ time: t, value: v }); }, time, emitter);
    var result = timmed.accumulate({
        time: electric.scheduler.now(),
        value: emitter.dirtyCurrentValue(),
        sum: initialValue
    }, function (acc, v) {
        var dt = v.time - acc.time;
        var nv = v.value.add(acc.value).timesT(dt / 2);
        var nsum = acc.sum.add(nv);
        return {
            time: v.time,
            value: v.value,
            sum: nsum
        };
    }).map(function (v) { return v.sum; });
    result.name = '<| integral |>';
    result.setEquals(function (x, y) { return x.equals(y); });
    return result;
}
exports.integral = integral;
