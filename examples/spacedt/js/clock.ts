import electric = require('../../../src/electric');

export function interval(
	options: { inMs?: number, fps?: number }
) {
	var timer = electric.emitter.manualEvent();
	electric.scheduler.scheduleInterval(() => {
		timer.impulse(Date.now())
	}, calculateInterval(options.inMs, options.fps))
	timer.name = '| interval |>';
	return timer;
}

export function intervalValue<T>(
	value: T, options: { inMs?: number, fps?: number }
) {
	var timer = electric.emitter.manualEvent();
	electric.scheduler.scheduleInterval(() => {
		timer.impulse(value)
	}, calculateInterval(options.inMs, options.fps))
	timer.name = '| interval |>';
	return timer;
}


export function time(
	options: { intervalInMs?: number, fps?: number }
) {
	var interval = calculateInterval(options.intervalInMs, options.fps);
	var emitter = electric.emitter.manual(electric.scheduler.now());
	var id = electric.scheduler.scheduleInterval(
		() => emitter.emit((electric.scheduler.now())),
		interval
	);
	emitter.setReleaseResources(() => electric.scheduler.unscheduleInterval(id));
	emitter.name = calculateEmitterName(options);
	return emitter;
}

function calculateInterval(intervalInMs?: number, fps?: number) {
	if (intervalInMs === undefined) {
		return 1 / fps * 1000
	}
	else {
		return intervalInMs;
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
