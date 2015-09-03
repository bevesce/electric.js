import calculus = require('./calculus');



interface Dict<T> {
	[key: number]: T;
}


export class IntegrableCollection<T extends calculus.Integrable> implements calculus.Integrable {
	items: Dict<T>

	static of<K extends calculus.Integrable>(items: Dict<K>) {
		return new IntegrableCollection(items);
	}

	constructor(items: Dict<T>) {
		this.items = items;
	}

	add(other: IntegrableCollection<T>) {
		var result: Dict<T> = {}
		for (var key in other.items) {
			var otherItem = other.items[key];
			var thisItem = this.items[key];
			result[key] = <T>(thisItem ? thisItem.add(otherItem) : otherItem);
		}
		return IntegrableCollection.of(result);
	}

	mulT(dt: number) {
		var result: Dict<calculus.Antiderivative> = {}
		for (var key in this.items) {
			result[key] = this.items[key].mulT(dt);
		}
		return AntiderivativeCollection.of(result);
	}

	insert(key: number, item: T) {
		var result = IntegrableCollection.of(cop(this.items));
		result.items[key] = item;
		return result;
	}

	remove(key: number) {
		var result = IntegrableCollection.of(cop(this.items));
		result.items[key] = undefined;
		return result;
	}
}

export class AntiderivativeCollection<T extends calculus.Antiderivative> implements calculus.Antiderivative {
	items: Dict<T>

	static of<K extends calculus.Antiderivative>(items: Dict<K>) {
		return new AntiderivativeCollection(items);
	}

	constructor(items: Dict<T>) {
		this.items = items;
	}

	addDelta(delta: AntiderivativeCollection<T>): AntiderivativeCollection<T> {
		var result: Dict<calculus.Antiderivative> = {}
		for (var key in this.items) {
			result[key] = this.items[key].addDelta(delta.items[key]);
		}
		return AntiderivativeCollection.of(<Dict<T>>result);
	}

	equals(other: AntiderivativeCollection<T>) {
		return this._sameKeysAs(other) && this._sameValuesAs(other);
	}

	private _sameKeysAs(other: AntiderivativeCollection<T>) {
		for (var key in this.items) {
			if (other.items[key] === undefined) {
				return false;
			}
		}
		for (var key in other.items) {
			if (this.items[key] === undefined) {
				return false;
			}
		}
		return true;
	}

	private _sameValuesAs(other: AntiderivativeCollection<T>) {
		for (var key in this.items) {
			if (!this.items[key].equals(other.items[key])) {
				return false;
			}
		}
		return true;
	}
}

function cop<T>(d: Dict<T>) {
	var result: Dict<T> = {};
	for (var k in d) {
		result[k] = d[k];
	}
	return result;
}
