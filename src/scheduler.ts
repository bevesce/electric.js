var stopTime: number = Date.now();

interface TimeMap {
	[time: number]: Array<() => void>;
}
var callbacks: TimeMap = {};
var stopped = false;

export function stop(): number{
	stopTime = Date.now();
	stopped = true;
	return stopTime;
}

export function resume() {
	stopped = false;
}

export function advance(timeShiftInMiliseconds: number = 1): number {
	if (!stopped){
		return;
	}
	var newTime = stopTime + timeShiftInMiliseconds;
	for (; stopTime < newTime; stopTime++){
		executeCallbacksForTime(stopTime)
	}
	return stopTime;
}

function executeCallbacksForTime(currentTime: number) {
	var toExecute = callbacks[stopTime];
	if (toExecute) {
		toExecute.forEach(f => f());
	}
}

export function currentTime(){
	return stopTime;
}

export function scheduleTimeout(
	callback: () => void, delayInMs: number = 0
) {
	if (!stopped) {
		setTimeout(callback, delayInMs);
		return
	}
	var whenToExecute = stopTime + delayInMs;
	if (delayInMs <= 0){
		callback();
	}
	else if (callbacks[whenToExecute]) {
		callbacks[whenToExecute].push(callback);
	}
	else {
		callbacks[whenToExecute] = [callback];
	}
}


export function scheduleInterval(
	callback: () => void, intervalInMs: number = 0
) {
	if (!stopped) {
		setInterval(callback, intervalInMs);
		return;
	}
	scheduleTimeout(() => {
		callback();
		scheduleInterval(callback, intervalInMs);
	}, intervalInMs);
}

export function now(): number {
	if (!stopped){
		return Date.now();
	}
	return stopTime;
}