import inf = require('./interfaces');
import emitter = require('./emitter');


// functions that can be simply queued
var functionsToVoid = [
	'plugReceiver',
	'unplugReceiver',
	'stabilize',
	'setReleaseResources',
	'setEquals'
];
// functions that should return another placeholder
var functionsToEmitter = [
	'plugReceiver',
	'unplugReceiver',
	'stabilize',
	'setReleaseResources',
	'setEquals',
	'map',
	'filter',
	'filterMap',
	'transformTime',
	'accumulate',
	'sample',
	'change'
];
// function to throw if called before is()
var functionsToSomething = [
	'dirtyCurrentValue'
]

interface IPlaceholder<Out>
	extends inf.IEmitter<Out>
{
	is(emitter: inf.IEmitter<Out>): void;
}

class Placeholder<Out> {
	private _emitter: inf.IEmitter<Out>;
	private _actions: Array<((emitter: inf.IEmitter<Out>) => any)> = [];
	name: string;

	constructor() {
		// super(undefined);
		this.name = 'placeholder';
	}

	is(emitter: inf.IEmitter<Out>) {
		this._emitter = emitter;
		for (var action of this._actions) {
			action(this._emitter);
		}
		this._actions = undefined;
		if ((<any>this._emitter)._dispatchToReceivers) {
			(<any>this._emitter)._dispatchToReceivers(this._emitter.dirtyCurrentValue());
		}
		this.name = emitter.name;
	}
}

function doOrQueue(name: string) {
	return function placeholding() {
		var args = arguments;
		if (this._emitter) {
			this._emitter[name].apply(this._emitter, arguments);
		}
		else {
			this._actions.push((emitter: any) => {
				emitter[name].apply(emitter, args);
			});
		}
	}
}

functionsToVoid.forEach((name: string) => {
	(<any>Placeholder.prototype)[name] = doOrQueue(name)
})

function doOrQueueAndReturnPlaceholder(name: string) {
	return function placeholding() {
		var args = arguments;
		if (this._emitter) {
			return this._emitter[name].apply(this._emitter, args);
		}
		else {
			var p = placeholder();
			this._actions.push((emitter: any) => {
				p.is(emitter[name].apply(emitter, args));
			});
			return p;
		}
	}
}

functionsToEmitter.forEach((name: string) => {
	(<any>Placeholder.prototype)[name] = doOrQueueAndReturnPlaceholder(name)
})

function doOrThrow(name: string) {
	return function placeholding() {
		var args = arguments;
		if (this._emitter) {
			return this._emitter[name].apply(this._emitter, args);
		}
		throw Error('called <' + name + '> on empty placeholder');
	}
}

functionsToSomething.forEach((name: string) => {
	(<any>Placeholder.prototype)[name] = doOrThrow(name)
})

function placeholder<T>() {
	return <IPlaceholder<T>>(<any>(new Placeholder()));
}

export = placeholder;
