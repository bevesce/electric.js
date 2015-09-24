import callIfFunction = require('./utils/call-if-function');
import Wire = require('./wire');
import scheduler = require('./scheduler');
import eevent = require('./electric-event');
import EmitFunction = require('./interfaces/t-to-void');
import Emitter = require('./interfaces/emitter');

type Index = number;

export function map<In, Out>(f: (...vs: any[]) => Out, noOfEmitters: number) {
	return function mapTransform(emit: EmitFunction<Out>) {
		return function mapTransform(v: In[], i: Index) {
			emit(f.apply(null, v));
		}
	}
}

export function filter<InOut>(
	predicate: (...args: InOut[]) => boolean,
	noOfEmitters = 1
) {
	return function transform(emit: EmitFunction<InOut>) {
		var eaten = 0;
		return function filterTransform(v: InOut[], i: Index) {
			if (predicate.apply(null, v)) {
				emit(v[i]);
			}
		}
	}
};

export function filterMap<Out>(
	mapping: (...args: any[]) => Out | void,
	noOfEmitters = 1
) {
	return function transform(emit: EmitFunction<Out>) {
		var eaten = 0;
		return function filterMapTransform(v: any[], i: Index) {
			var result = mapping.apply(null, v);
			if (result !== undefined) {
				emit(<Out>result);
			}
		}
	}
};

export function merge<InOut>() {
	return function mergeTransform(emit: EmitFunction<InOut>) {
		var prev: InOut;
		return function mergeTransform(v: InOut[], i: Index) {
			if (prev !== v[i]) {
				emit(v[i]);
			}
			prev = v[i]
		}
	}
}

export function accumulate<Out>(
	initialValue: Out,
	accumulator: (accumulated: Out, ...vs: any[]) => Out
) {
	var accumulated = initialValue;
	return function transform(emit: EmitFunction<Out>) {
		return function accumulateTransform(v: any[], i: Index) {
			accumulated = accumulator(accumulated, ...v);
			emit(accumulated)
		}
	}
};

export function transformTime<Out>(
	timeTransformation: (t: number) => number,
	t0: number
) {
	// var firstEmitted = false;
	return function transform(emit: EmitFunction<Out>, impulse: EmitFunction<Out>, dispatch: () => void) {
		return function timeTransform(v: Out[], i: number){
			var delay = timeTransformation(scheduler.now() - t0) + t0 - scheduler.now();
			var toEmit = v[i];
			scheduler.scheduleTimeout(
				() => {
					emit(toEmit);
					dispatch();
				}, delay
			);
		}
	}
}

export function sample<InOut>() {
	return function transform(emit: EmitFunction<InOut>) {
		return function sampleTransform(v: any[], i: Index) {
			if (i > 0 && v[i].happened) {
				emit(v[0]);
			}
		};
	};
};

export function change<Out>(
	switchers: {
		when: Emitter<any>,
		to: Emitter<Out> | ((x: Out, y: any) => Emitter<Out>)
	}[]
) {
	return function transform(emit: EmitFunction<Out>) {
		return function changeTransform(v: any[], i: Index) {
			if (i == 0){
				emit(<Out>v[0]);
			}
			else if (v[i].happened){
				this._wires[0].unplug();
				var to = switchers[i - 1].to;
				var e = callIfFunction(to, <Out>v[0], v[i].value);
				this._wires[0] = new Wire(
					e,
					this,
					(x: Out) => this.receiveOn(x, 0)
				);
				this.receiveOn(e.dirtyCurrentValue(), 0);
			}
		}
	}
}

export function when<In, Out>(happens: (value: In) => boolean, then: (value: In) => Out) {
	return function transform(emit: EmitFunction<eevent<Out>>, impulse: EmitFunction<eevent<Out>>) {
		var prevhappened = false;
		return function whenTransform(v: any[], i: Index) {
			var happened = happens(v[i]);
			if (happened && !prevhappened) {
				impulse(eevent.of(then(v[i])));
				prevhappened = true;
			}
			else if (!happened) {
				prevhappened = false;
			}
		}
	}
}

export function whenThen<In, Out>(happens: (value: In) => Out | void) {
	return function transform(emit: EmitFunction<eevent<Out>>, impulse: EmitFunction<eevent<Out>>) {
		var prevhappened: Out;
		return function whenTransform(v: any[], i: Index) {
			var happened = happens(v[i]);
			if (happened && !prevhappened) {
				impulse(eevent.of(<Out>happened));
				prevhappened = <Out>happened
			}
			else if (!happened) {
				prevhappened = null;
			}
		}
	}
}

export function cumulateOverTime<InOut>(
	delayInMiliseconds: number
) {
	return function transform(emit: EmitFunction<eevent<InOut[]>>, impulse: EmitFunction<eevent<InOut[]>>) {
		var accumulated: InOut[] = [];
		var accumulating = false;
		return function throttleTransform(v: eevent<InOut>[], i: Index) {
			if (!v[i].happened){
				return;
			}
			accumulated.push(v[i].value);
			if (!accumulating) {
				accumulating = true;
				scheduler.scheduleTimeout(
					() => {
						impulse(eevent.of(accumulated));
						accumulating = false;
						accumulated = [];
					},
					delayInMiliseconds
				);
			}
		};
	};
};

export function changes<InOut>(
	initialValue: InOut
) {
	return function transform(
	    emit: EmitFunction<eevent<{ previous: InOut, next: InOut }>>,
	    impulse: EmitFunction<eevent<{ previous: InOut, next: InOut }>>
	) {
	    var previous = initialValue;
	    return function changesTransform(v: InOut[], i: number) {
	        impulse(eevent.of({
	            previous: previous,
	            next: v[i]
	        }));
	        previous = v[i];
	    }
	}
}
