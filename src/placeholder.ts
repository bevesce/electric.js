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
	'change',
	'merge'
];
// function to throw if called before is()
var functionsToSomething: string[] = [
	// 'dirtyCurrentValue'
]

class Placeholder<Out> {
	private _emitter: inf.IEmitter<Out>;
	private _actions: Array<((emitter: inf.IEmitter<Out>) => any)> = [];
	private _initialValue: Out;
	name: string;

	constructor(initialValue: Out) {
		this._initialValue = initialValue;
		this.name = '| placeholder |>';
	}

	is(emitter: inf.IEmitter<Out>) {
		if (this._emitter) {
			throw Error("placeholder is " + this._emitter.name + " so cannot be " + emitter.name);
		}
		this._emitter = emitter;
		for (var action of this._actions) {
			action(this._emitter);
		}
		this._actions = undefined;
		this.name = '| ph ' + emitter.name;
	}

	dirtyCurrentValue() {
		if (this._emitter) {
			return this._emitter.dirtyCurrentValue();
		}
		else if (this._initialValue !== undefined) {
			return this._initialValue
		}
		throw Error('called dirtyCurrentValue() on placeholder without initial value');
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

function placeholder<T>(initialValue?: T) {
	return <inf.IPlaceholder<T>>(<any>(new Placeholder(initialValue)));
}

export = placeholder;
