import inf = require('./interfaces');


class ElectricEvent<T> implements inf.IElectricEvent<T>{
	happend: boolean;
	value: T;
	static of<K>(value: K): ElectricEvent<K> {
		return new Happend(value)
	}
	static notHappend: NotHappend<any>;
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
