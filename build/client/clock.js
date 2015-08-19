define(["require", "exports", './scheduler', './emitter', './transformator'], function (require, exports, scheduler, emitter, transformator) {
    exports.scheduler = scheduler;
    exports.emitter = emitter;
    exports.transformator = transformator;
    function clock(args) {
        var e = exports.emitter.manual(exports.scheduler.now());
        var interval = args.intervalInMs || 1 / args.fps * 1000;
        exports.scheduler.scheduleInterval(function () { return e.emit(exports.scheduler.now()); }, interval);
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
        var result = f.accumulate(initialAcc, function (acc, v) {
            var dt = (v.time - acc.time) / 1000;
            return {
                time: v.time,
                value: v.value,
                sum: acc.sum + (acc.value + v.value) / 2 * dt,
                dt: dt
            };
        }).map(function (v) { return ({ time: v.time, value: v.sum }); });
        function equalsWithTime(x, y) {
            return x.time === y.time && x.value === y.value;
        }
        result.setEquals(equalsWithTime);
        return result;
    }
    exports.integral = integral;
});
