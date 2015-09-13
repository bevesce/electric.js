var scheduler = require('./scheduler');
var emitter = require('./emitter');
function interval(options) {
    var timer = emitter.manualEvent();
    var id = scheduler.scheduleInterval(function () {
        timer.impulse(scheduler.now());
    }, calculateInterval(options.inMs, options.fps));
    timer.name = "interval(" + calculateEmitterName(options) + ")";
    timer.setReleaseResources(function () { return scheduler.unscheduleInterval(id); });
    return timer;
}
exports.interval = interval;
function intervalValue(value, options) {
    var timer = emitter.manualEvent();
    var id = scheduler.scheduleInterval(function () {
        timer.impulse(value);
    }, calculateInterval(options.inMs, options.fps));
    timer.name = "intervalValue(" + value + ", " + calculateEmitterName(options) + ")";
    timer.setReleaseResources(function () { return scheduler.unscheduleInterval(id); });
    return timer;
}
exports.intervalValue = intervalValue;
function time(options) {
    var interval = calculateInterval(options.intervalInMs, options.fps);
    var timeEmitter = emitter.manual(scheduler.now());
    var id = scheduler.scheduleInterval(function () { return timeEmitter.emit((scheduler.now())); }, interval);
    timeEmitter.setReleaseResources(function () { return scheduler.unscheduleInterval(id); });
    timeEmitter.name = "time(" + calculateEmitterName(options) + ")";
    return timeEmitter;
}
exports.time = time;
function calculateInterval(intervalInMs, fps) {
    if (intervalInMs === undefined) {
        return 1 / fps * 1000;
    }
    else {
        return intervalInMs;
    }
}
function calculateEmitterName(options) {
    if (options.fps !== undefined) {
        return 'fps: ' + options.fps;
    }
    else if (options.inMs !== undefined) {
        return 'interval: ' + options.inMs + 'ms';
    }
    else {
        return 'interval: ' + options.intervalInMs + 'ms';
    }
}
