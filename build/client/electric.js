define(["require", "exports", './scheduler', './device', './emitter', './transformator', './receiver', './clock', './fp'], function (require, exports, scheduler, device, emitter, transformator, receiver, clock, fp) {
    exports.scheduler = scheduler;
    exports.device = device;
    exports.emitter = emitter;
    exports.transformator = transformator;
    exports.receiver = receiver;
    exports.clock = clock;
    exports.fp = fp;
    function lift(f) {
        return function () {
            var emitters = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                emitters[_i - 0] = arguments[_i];
            }
            return exports.transformator.map.apply(exports.transformator, [f].concat(emitters));
        };
    }
    exports.lift = lift;
});
