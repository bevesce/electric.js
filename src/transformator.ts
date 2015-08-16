import inf = require('./interfaces');
import emitter = require('./emitter');
import scheduler = require('./scheduler');

type Identifier = number;


interface ITransformGeneratorFunction<In> {
	(emit: inf.IEmitterFunction<any>): ITransformFunction<In>
}

interface ITransformFunction<In> {
	(values: Array<In>, index: Identifier): void;
}

export class Transformator<In>
	extends emitter.Emitter<any>
	implements inf.IReceiver<In>
{
	private _wires: Array<Wire<In>>;
	private _values: Array<In>;

	constructor(
		emitters: Array<inf.IEmitter<In>>,
		transform: ITransformGeneratorFunction<In> = undefined,
		initialValue: any = undefined
	) {
		super(initialValue);
		this._values = Array(emitters.length);;
		if (transform) {
			this.setTransform(transform);
		}
		this._wires = [];
		this.plugEmitters(emitters);
	}

	wire(emitter: inf.IEmitter<any>) {
		var index = this._wires.length;
		this._wires[index] = new Wire(
			emitter,
			this,
			((index: number) => (x: In) => this.receiveOn(x, index))(index)
			);
		return this._wires[index];
	}

	setTransform(transform: ITransformGeneratorFunction<In>) {
		this._transform = transform((x: any) => this._emit(x));
	}

	private _transform(values: Array<In>, index: Identifier) {
		// Default implementation that just passes values
		// Should be overwritten in functions that create Transformators
		this._emit(values[index]);
	}

	private plugEmitters(emitters: Array<inf.IEmitter<In>>) {
		for (var emitter of emitters) {
			this.wire(emitter);
		}
	}

	plugEmitter(emitter: inf.IEmitter<In>) {
		this.wire(emitter);
		return this._wires.length - 1;
	}

	protected receiveOn(x: In, index: number) {
		this._values[index] = x;
		this._transform(this._values, index);
	}
}


class Wire<InOut>
	implements inf.IWire<InOut>
{
	input: inf.IEmitter<InOut>;
	output: inf.IReceiver<InOut>;
	receive: (x: InOut) => void;
	private receiverId: Identifier;

	constructor(input: inf.IEmitter<InOut>, output: inf.IReceiver<InOut>, receive: (x: InOut) => void) {
		this.input = input;
		this.output = output;
		this.receive = receive;
		this.receiverId = this.input.plugReceiver(this);
	}

	unplug() {
		this.input.unplugReceiver(this.receiverId);
		this.input = undefined;
		this.output = undefined;
	}
}


export function generic<In>(
	emitters: Array<inf.IEmitter<In>>,
	transform: ITransformGeneratorFunction<In> = undefined
) {
	return new Transformator(emitters, transform);
};


function namedTransformator(name, emitters, transform, initialValue?) {
	var t = new Transformator(emitters, transform, initialValue);
	t.name = name;
	return t;
}


export function map<In, Out>(
	mapping: (...args: In[]) => Out,
	...emitters: Array<inf.IEmitter<In>>
) {
	function transform(emit: inf.IEmitterFunction<Out>) {
		return function mapTransform(v: In[], i: Identifier) {
			emit(mapping.apply(null, v));
		}
	}
	return namedTransformator('map', emitters, transform);
};

emitter.Emitter.prototype.map = function mapWith<Out, NewOut>(mapping: (arg: Out) => NewOut) {
	return map(mapping, this);
}


export function filter<InOut>(
	initialValue: InOut,
	predicate: (...args: InOut[]) => boolean,
	...emitters: inf.IEmitter<InOut>[]
) {
	function transform(emit: inf.IEmitterFunction<InOut>) {
		return function filterTransform(v: InOut[], i: Identifier) {
			if (predicate(v[i])) {
				emit(v[i]);
			}
		}
	}
	return namedTransformator('filter', emitters, transform, initialValue);

};

emitter.Emitter.prototype.filter = function filterBy<Out>(
	initialValue, predicate: (arg: Out) => boolean
) {
	return filter(initialValue, predicate, this);
}


export function merge<InOut>(
	...emitters: inf.IEmitter<InOut>[]
) {
	return namedTransformator('merge', emitters, undefined);
};

emitter.Emitter.prototype.merge = function mergeWith<Out>(...emitters: inf.IEmitter<Out>[]) {
	return merge(this, ...emitters);
}


export function accumulate<In, Out>(
	initValue: Out, accumulator: (accumulated: Out, value: In) => Out,
	...emitters: inf.IEmitter<In>[]
) {
	var accumulated = initValue;
	function transform(emit: inf.IEmitterFunction<Out>) {
		return function accumulateTransform(v: In[], i: Identifier) {
			accumulated = accumulator(accumulated, v[i]);
			emit(accumulated)
		}
	}
	return namedTransformator('accumulate', emitters, transform);
};

emitter.Emitter.prototype.accumulate = function accumulateWith<NewOut, Out>(
	initValue: NewOut, accumulator: (accumulated: NewOut, value: Out) => NewOut
) {
	return accumulate(initValue, accumulator, this);
}


export function flatten<InOut>(
	...emitters: inf.IEmitter<inf.IEmitter<InOut>>[]
) {
	var transformator = new Transformator([]);
	function transform(emit: inf.IEmitterFunction<inf.IEmitter<InOut>>) {
		return function flattenTransform(v: inf.IEmitter<InOut>[], i: Identifier) {
			transformator.plugEmitter(v[i]);
		}
	};
	new Transformator(emitters, transform);
	transformator.name = 'flatten';
	return transformator;
};

emitter.Emitter.prototype.flatten = function() {
	return flatten(<any>this);
}


export function sample<InOut>(
	sampled: inf.IEmitter<InOut>,
	...samplers: inf.IEmitter<any>[]
) {
	function transform(emit: inf.IEmitterFunction<InOut>) {
		return function sampleTransform(v: any[], i: Identifier) {
			if (i > 0) {
				emit(v[0]);
			}
		};
	};
	var emitters = samplers.slice();
	emitters.splice(0, 0, sampled);
	return namedTransformator('sample', emitters, transform);
};

emitter.Emitter.prototype.sampleBy = function(...emitters: inf.IEmitter<any>[]) {
	return sample(this, ...emitters);
}


export function throttle<InOut>(
	deylayInMiliseconds: number,
	...emitters: inf.IEmitter<InOut>[]
) {
	function transform(emit: inf.IEmitterFunction<InOut[]>) {
		var accumulated: InOut[] = [];
		var accumulating = false;
		return function throttleTransform(v: InOut[], i: Identifier) {
			accumulated.push(v[i]);
			if (!accumulating) {
				accumulating = true;
				scheduler.scheduleTimeout(
					() => {
						emit(accumulated);
						accumulating = false;
						accumulated = [];
					},
					deylayInMiliseconds
				);
			}
		};
	};
	return namedTransformator('throttle', emitters, transform, []);
};

emitter.Emitter.prototype.throttle = function(deylayInMiliseconds: number) {
	return throttle(deylayInMiliseconds, this)
};


// export function dropRepeats<InOut>(
// 	...emitters: inf.IEmitter<InOut>[]
// ) {
// 	var lastValue: InOut;
// 	function transform(emit: inf.IEmitterFunction<InOut>) {
// 		return function dropRepeatsTransform(v: InOut[], i: Identifier) {
// 			if (v[i] !== lastValue) {
// 				emit(v[i]);
// 				lastValue = v[i];
// 			}
// 		};
// 	};
// 	return namedTransformator('drop repeats', emitters, transform);
// };

emitter.Emitter.prototype.dropRepeats = function() {
	return dropRepeats(this);
};


export function change<Out, OtherOut>(
	switchers: { when: inf.IEmitter<OtherOut>, to: (x: Out, y: OtherOut) => inf.IEmitter<Out> }[],
	emitter: inf.IEmitter<Out>
) {
	function transform(emit: inf.IEmitterFunction<Out>) {
		return function changeTransform(v: (Out | OtherOut)[], i: Identifier) {
			if (i == 0){
				emit(<Out>v[0]);
			}
			else if (v[i] !== undefined){
				var e = switchers[i - 1].to(<Out>v[0], <OtherOut>v[i]);
				this._wires[0].unplug();
				this._wires[0] = new Wire(
					e,
					this,
					(x: Out) => this.receiveOn(x, 0)
				);
			}
		}
	}
	var allEmitters: inf.IEmitter<OtherOut | Out>[] = switchers.map(s => s.when);
	allEmitters.splice(0, 0, emitter);
	return namedTransformator('change', allEmitters, transform);
}

emitter.Emitter.prototype.change = function changeToWhen<OtherOut, Out>(
	...switchers: { when: inf.IEmitter<OtherOut>, to: (x: Out, y: OtherOut) => inf.IEmitter<Out> }[]
) {
	return change(switchers, this);
}


export function changes<Out>(
	...emitters: inf.IEmitter<Out>[]
) {
	var previousValue: Out;
	function transform(emit: inf.IEmitterFunction<{ previous: Out, current: Out }>) {
		return function changesTransform(v: Out[], i: number){
			if (previousValue !== v[i]){
				emit({
					previous: previousValue,
					current: v[i]
				});
				previousValue = v[i];
			}
		}
	}
	return namedTransformator('change', emitters, transform);
};

emitter.Emitter.prototype.changes = function onlyChanges<Out>() {
	return changes(this);
}


export function transformTime<Out>(
	timeTransformation: (t: number) => number,
	t0: number,
	...emitters: Array<inf.IEmitter<Out>>
) {
	var firstEmitted = false;
	function transform(emit: inf.IEmitterFunction<Out>) {
		return function timeTransform(v: Out[], i: number){
			if (firstEmitted){
				var delay = timeTransformation(scheduler.now() - t0) + t0 - scheduler.now();
				scheduler.scheduleTimeout(
					() => emit(v[i]), delay
				);
			}
			else {
				emit(v[i]);
				firstEmitted = true;
			}
		}
	}
	return namedTransformator('transform time', emitters, transform);
}

emitter.Emitter.prototype.transformTime = function transformTimeWith<Out>(
	timeTransformation: (t: number) => number,
	t0?: number
) {
	var t0 = t0 || 0;
	return transformTime(timeTransformation, t0, this);
}
