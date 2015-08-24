import inf = require('./interfaces');
import utils = require('./utils');


class ElectricEvent<T> implements inf.IElectricEvent<T>{
	static notHappend: NotHappend<any>;

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
			if (utils.all(vs.map(v => v.happend))) {
				return ElectricEvent.of(f.apply(null, vs.map(v => v.value)));
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
}

class Happend<T> implements ElectricEvent<T> {
	value: T;
	happend = true;
	constructor(value: T) {
		this.value = value;
	}
	map<Out>(f: (v: T) => Out): ElectricEvent<Out> {
		return ElectricEvent.of(f(this.value));
	}

}

class NotHappend<T> implements ElectricEvent<T> {
	happend = false;
	value: T = undefined;
	map<Out>(f: (v: T) => Out): ElectricEvent<Out> {
		return ElectricEvent.notHappend;
	}
}

ElectricEvent.notHappend = new NotHappend();


export = ElectricEvent;
