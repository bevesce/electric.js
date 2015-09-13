import electric = require('../../src/electric');

export = collection;


function identity<T>(v: T): T {
	return v
}


function collection<T>(
	initialValue: T, changes: electric.emitter.Emitter<electric.event<(v: T) => T>>
) {
	var collected = electric.emitter.constant(initialValue)
		.change({
			to: (c, f) => electric.emitter.constant(f(c)),
			when: changes
		});
	return collected;
};
