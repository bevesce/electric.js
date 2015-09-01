var electric = require('../../../src/electric');
function clock(options) {
    var interval = calculateInterval(options);
    var emitter = electric.emitter.manual(electric.scheduler.now());
    var id = electric.scheduler.scheduleInterval(function () { return emitter.emit((electric.scheduler.now())); }, interval);
    emitter.setReleaseResources(function () { return electric.scheduler.unscheduleInterval(id); });
    emitter.name = calculateEmitterName(options);
    return emitter;
}
function calculateInterval(options) {
    if (options.intervalInMs === undefined) {
        return 1 / options.fps * 1000;
    }
    else {
        return options.intervalInMs;
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
module.exports = clock;
