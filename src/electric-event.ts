import all = require('./utils/all');


class ElectricEvent<T>{
	static notHappend: NotHappend<any>;
	private __$isevent$ = true;


	static restore<K>(e: {happend: boolean, value: K}) {
		if (e.happend) {
			return ElectricEvent.of(e.value);
		}
		return ElectricEvent.notHappend;
	}

	static of<K>(value: K): ElectricEvent<K> {
		return new Happend(value)
	}

	static lift<In1, Out>(
		f: (v1: In1) => Out
	): (v1: ElectricEvent<In1>) => ElectricEvent<Out>;
	static lift<In1, In2, Out>(
		f: (v1: In1, v2: In2) => Out
	): (v1: ElectricEvent<In1>, v2: ElectricEvent<In2>) => ElectricEvent<Out>;
	static lift<In1, In2, In3, Out>(
		f: (v1: In1, v2: In2, v3: In3) => Out
	): (v1: ElectricEvent<In1>, v2: ElectricEvent<In2>, v3: ElectricEvent<In3>) => ElectricEvent<Out>;
	static lift<In1, In2, In3, In4, Out>(
		f: (v1: In1, v2: In2, v3: In3, v4: In4) => Out
	): (v1: ElectricEvent<In1>, v2: ElectricEvent<In2>, v3: ElectricEvent<In3>, v4: ElectricEvent<In4>) => ElectricEvent<Out>;
	static lift<In1, In2, In3, In4, In5, Out>(
		f: (v1: In1, v2: In2, v3: In3, v4: In4, v5: In5) => Out
	): (v1: ElectricEvent<In1>, v2: ElectricEvent<In2>, v3: ElectricEvent<In3>, v4: ElectricEvent<In4>, v5: ElectricEvent<In5>) => ElectricEvent<Out>;
	static lift<In1, In2, In3, In4, In5, In6, Out>(
		f: (v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6) => Out
	): (v1: ElectricEvent<In1>, v2: ElectricEvent<In2>, v3: ElectricEvent<In3>, v4: ElectricEvent<In4>, v5: ElectricEvent<In5>, v6: ElectricEvent<In6>) => ElectricEvent<Out>;
	static lift<In1, In2, In3, In4, In5, In6, In7, Out>(
		f: (v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6, v7: In7) => Out
	): (v1: ElectricEvent<In1>, v2: ElectricEvent<In2>, v3: ElectricEvent<In3>, v4: ElectricEvent<In4>, v5: ElectricEvent<In5>, v6: ElectricEvent<In6>, v7: ElectricEvent<In7>) => ElectricEvent<Out>;
	static lift<In1, In2, In3, In4, In5, In6, In7, Out>(
		f:
			((v1: In1) => Out) |
			((v1: In1, v2: In2) => Out) |
			((v1: In1, v2: In2, v3: In3) => Out) |
			((v1: In1, v2: In2, v3: In3, v4: In4) => Out) |
			((v1: In1, v2: In2, v3: In3, v4: In4, v5: In5) => Out) |
			((v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6) => Out) |
			((v1: In1, v2: In2, v3: In3, v4: In4, v5: In5, v6: In6, v7: In7) => Out)
	): (v1: ElectricEvent<In1>, v2?: ElectricEvent<In2>, v3?: ElectricEvent<In3>, v4?: ElectricEvent<In4>, v5?: ElectricEvent<In5>, v6?: ElectricEvent<In6>, v7?: ElectricEvent<In7>) => ElectricEvent<Out> {
		return function(...vs: ElectricEvent<any>[]) {
			if (all(vs.map(v => v.happend))) {
				return ElectricEvent.of(f.apply(null, vs.map(v => v.value)));
			}
			else {
				return ElectricEvent.notHappend;
			}
		}
	}

	static flatLift<In1, Out>(
		f: (v1: In1) => ElectricEvent<Out>
	): (v1: ElectricEvent<In1>) => ElectricEvent<Out> {
		return function(v1: ElectricEvent<In1>): ElectricEvent<Out> {
			if (v1.happend) {
				return f(v1.value);
			}
			else {
				return ElectricEvent.notHappend;
			}
		}
	}

	static liftOnFirst<In1, In2, Out>(
		f: (v1: In1, v2: In2) => Out
	): (v1: ElectricEvent<In1>, v2: In2) => ElectricEvent<Out> {
		return function(v1: ElectricEvent<In1>, v2: In2): ElectricEvent<Out> {
			if (v1.happend) {
				return ElectricEvent.of(f(v1.value, v2))
			}
			else {
				return ElectricEvent.notHappend;
			}
		}
	}

	happend: boolean;
	value: T;

	map<Out>(f: (v: T) => Out): ElectricEvent<Out> {
		throw Error('ElectricEvent is abstract class, use Happend and NotHappend')
	};

	flattenMap<Out>(f: (v: T) => ElectricEvent<Out>): ElectricEvent<Out> {
		throw Error('ElectricEvent is abstract class, use Happend and NotHappend')
	}
}

class Happend<T> extends ElectricEvent<T> {
	value: T;
	happend = true;

	toString() {
		return `Happend: ${this.value.toString()}`;
	}


	constructor(value: T) {
		super();
		this.value = value;
	}

	map<Out>(f: (v: T) => Out): ElectricEvent<Out> {
		return ElectricEvent.of(f(this.value));
	}

	flattenMap<Out>(f: (v: T) => ElectricEvent<Out>): ElectricEvent<Out> {
		return f(this.value);
	}
}

class NotHappend<T> extends ElectricEvent<T> {
	happend = false;
	value: T = undefined;

	constructor() {
		super();
	}

	toString() {
		return 'NotHappend';
	}

	map<Out>(f: (v: T) => Out): ElectricEvent<Out> {
		return ElectricEvent.notHappend;
	}

	flattenMap<Out>(f: (v: T) => ElectricEvent<Out>): ElectricEvent<Out> {
		return ElectricEvent.notHappend;
	}
}

ElectricEvent.notHappend = new NotHappend();


export = ElectricEvent;
