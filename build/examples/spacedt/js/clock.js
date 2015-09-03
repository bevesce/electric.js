var electric = require('../../../src/electric');
function interval(options) {
    var timer = electric.emitter.manualEvent();
    electric.scheduler.scheduleInterval(function () {
        timer.impulse(Date.now());
    }, calculateInterval(options.inMs, options.fps));
    timer.name = '| interval |>';
    return timer;
}
exports.interval = interval;
function intervalValue(value, options) {
    var timer = electric.emitter.manualEvent();
    electric.scheduler.scheduleInterval(function () {
        timer.impulse(value);
    }, calculateInterval(options.inMs, options.fps));
    timer.name = '| interval |>';
    return timer;
}
exports.intervalValue = intervalValue;
function time(options) {
    var interval = calculateInterval(options.intervalInMs, options.fps);
    var emitter = electric.emitter.manual(electric.scheduler.now());
    var id = electric.scheduler.scheduleInterval(function () { return emitter.emit((electric.scheduler.now())); }, interval);
    emitter.setReleaseResources(function () { return electric.scheduler.unscheduleInterval(id); });
    emitter.name = calculateEmitterName(options);
    return emitter;
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
    if (options.intervalInMs === undefined) {
        return '| fps: ' + options.fps + ' |>';
    }
    else {
        return '| interval: ' + options.intervalInMs + 'ms |>';
    }
}
