var stopTime: number = Date.now();

interface ICallback {
	(): void;
}

interface TimeMap {
	[time: number]: ICallback[];
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
	callbacks = {};
}

export function advance(timeShiftInMiliseconds: number = 1): number {
	if (!stopped){
		return;
	}
	var newTime = stopTime + timeShiftInMiliseconds;
	while (stopTime < newTime) {
		executeCallbacksForTime(stopTime)
		stopTime++;
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

interface IScheduleDisposable {

}

export function scheduleTimeout(
	callback: () => void, delayInMs: number = 0
): IScheduleDisposable {
	if (!stopped) {
		return <any>setTimeout(callback, delayInMs);
	}
	var whenToExecute = stopTime + delayInMs;
	if (delayInMs <= 0) {
		callback();
	}
	else if (callbacks[whenToExecute]) {
		callbacks[whenToExecute].push(callback);
	}
	else {
		callbacks[whenToExecute] = [callback];
	}
	return <any>callback;
}


export function scheduleInterval(
	callback: () => void, intervalInMs: number = 0
): IScheduleDisposable {
	if (!stopped) {
		return <any>setInterval(callback, intervalInMs);
	}
	var cancelable: IScheduleDisposable[] = [];
	function intervalCallback() {
		callback();
		cancelable.push(
			scheduleTimeout(intervalCallback, intervalInMs)
		);
	}
	var id = scheduleTimeout(intervalCallback, intervalInMs);
	cancelable.push(id);
	return <any>cancelable;
}

export function now(): number {
	if (!stopped){
		return Date.now();
	}
	return stopTime;
}

export function unscheduleInterval(id: IScheduleDisposable) {
	if (!stopped) {
		return clearInterval(<number>id);
	}

	(<IScheduleDisposable[]>id).forEach(removeFromCallbacks);
}

function removeFromCallbacks(callback: ICallback) {
	for (var k in callbacks) {
		removeFromCallbacksAtTime(callbacks[k], callback);
	}
}

function removeFromCallbacksAtTime(
	callbacksAtTime: ICallback[], callback: ICallback
) {
	var i = callbacksAtTime.indexOf(callback);
	while (i !== -1) {
		callbacksAtTime.splice(i, 1);
		i = callbacksAtTime.indexOf(callback);
	}
}
