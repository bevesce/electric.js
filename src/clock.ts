import inf = require('./interfaces');
import scheduler = require('./scheduler');
import emitter = require('./emitter');


export function interval(
	options: { inMs?: number, fps?: number }
) {
	var timer = emitter.manualEvent();
	scheduler.scheduleInterval(() => {
		timer.impulse(Date.now())
	}, calculateInterval(options.inMs, options.fps))
	timer.name = `interval(${calculateEmitterName(options)})`;
	return timer;
}

export function intervalValue<T>(
	value: T, options: { inMs?: number, fps?: number }
) {
	var timer = emitter.manualEvent();
	scheduler.scheduleInterval(() => {
		timer.impulse(value)
	}, calculateInterval(options.inMs, options.fps))
	timer.name = `intervalValue(${value}, ${calculateEmitterName(options)})`;
	return timer;
}

export function time(
	options: { intervalInMs?: number, fps?: number }
): inf.IEmitter<number> {
	var interval = calculateInterval(options.intervalInMs, options.fps);
	var timeEmitter = emitter.manual(scheduler.now());
	var id = scheduler.scheduleInterval(
		() => timeEmitter.emit((scheduler.now())),
		interval
	);
	timeEmitter.setReleaseResources(() => scheduler.unscheduleInterval(id));
	timeEmitter.name = `time(${calculateEmitterName(options)})`;
	return timeEmitter;
}

function calculateInterval(intervalInMs?: number, fps?: number) {
	if (intervalInMs === undefined) {
		return 1 / fps * 1000
	}
	else {
		return intervalInMs;
	}
}

function calculateEmitterName(options: { inMs?: number, intervalInMs?: number, fps?: number }) {
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
