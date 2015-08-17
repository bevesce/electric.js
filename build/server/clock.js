exports.scheduler = require('./scheduler');
exports.emitter = require('./emitter');
exports.transformator = require('./transformator');
function clock(args) {
    var e = exports.emitter.manual(exports.scheduler.now());
    exports.scheduler.scheduleInterval(function () { return e.emit(exports.scheduler.now()); }, args.intervalInMs);
    return e;
}
exports.clock = clock;
function fclock(f, args) {
    return clock(args).map(function (t) { return ({ time: t, value: f(t) }); });
}
exports.fclock = fclock;
function eclock(emitter, args) {
    var time = clock(args);
    function timeSampling(emit) {
        var latestValue;
        return function (v, i) {
            if (i == 0) {
                latestValue = v[0];
            }
            else {
                emit({ time: v[1], value: latestValue });
            }
        };
    }
    return new exports.transformator.Transformator([emitter, time], timeSampling);
}
exports.eclock = eclock;
function integral(f) {
    var initialAcc = { time: exports.scheduler.now(), value: 0, sum: 0 };
    return f.accumulate(initialAcc, function (acc, v) {
        var dt = (v.time - acc.time) / 1000;
        return {
            time: v.time,
            value: v.value,
            sum: acc.sum + (acc.value + v.value) / 2 * dt,
            dt: dt
        };
    }).map(function (v) { return ({ time: v.time, value: v.sum }); });
}
exports.integral = integral;