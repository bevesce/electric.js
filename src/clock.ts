import scheduler = require('./scheduler');
import emitter = require('./emitter');


export function interval(
	options: { inMs?: number, fps?: number }
) {
	var timer = emitter.manualEvent();
	var id = scheduler.scheduleInterval(() => {
		timer.impulse(scheduler.now())
	}, calculateInterval(options.inMs, options.fps))
	timer.name = `interval(${calculateEmitterName(options)})`;
	timer.setReleaseResources(() => scheduler.unscheduleInterval(id));
	return timer;
}

export function intervalValue<T>(
	value: T, options: { inMs?: number, fps?: number }
) {
	var timer = emitter.manualEvent(<T>null);
	var id = scheduler.scheduleInterval(() => {
		timer.impulse(value)
	}, calculateInterval(options.inMs, options.fps))
	timer.name = `intervalValue(${value}, ${calculateEmitterName(options)})`;
	timer.setReleaseResources(() => scheduler.unscheduleInterval(id));
	return timer;
}

export function intervalOfRandom(
	min: number, max: number,
	options: { inMs?: number, fps?: number }
) {
	var timer = emitter.manualEvent(<number>null);
	var id = scheduler.scheduleInterval(() => {
		timer.impulse(random(min, max))
	}, calculateInterval(options.inMs, options.fps))
	timer.name = `intervalOfRandom(${min}-${max}, ${calculateEmitterName(options)})`;
	timer.setReleaseResources(() => scheduler.unscheduleInterval(id));
	return timer;
}

export function time(
	options: { intervalInMs?: number, fps?: number }
): emitter.Emitter<number> {
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


function random(min: number, max: number) {
    return Math.random() * (max - min) + min;
}
