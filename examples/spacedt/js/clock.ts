import electric = require('../../../src/electric');

export = clock;

function clock(
	options: { intervalInMs?: number, fps?: number }
) {
	var interval = calculateInterval(options);
	var emitter = electric.emitter.manual(electric.scheduler.now());
	var id = electric.scheduler.scheduleInterval(
		() => emitter.emit((electric.scheduler.now())),
		interval
	);
	emitter.setReleaseResources(() => electric.scheduler.unscheduleInterval(id));
	emitter.name = calculateEmitterName(options);
	return emitter;
}

function calculateInterval(options: { intervalInMs?: number, fps?: number }) {
	if (options.intervalInMs === undefined) {
		return 1 / options.fps * 1000
	}
	else {
		return options.intervalInMs;
	}
}

function calculateEmitterName(options: { intervalInMs?: number, fps?: number }) {
	if (options.intervalInMs === undefined) {
		return '| fps: ' + options.fps + ' |>';
	}
	else {
		return '| interval: ' + options.intervalInMs + 'ms |>';
	}
}
