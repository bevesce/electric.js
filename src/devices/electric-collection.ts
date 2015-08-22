import electric = require('../../src/electric');

function identity<T>(v: T): T {
	return v
}


function collection<T>(initialValue: T) {
	return electric.device.create(function(input, output) {
		var changes = input('changes', identity);
		var collected = electric.emitter.constant(initialValue)
			.change({
				to: (c, f) => electric.emitter.constant(f(c)),
				when: changes
			});
		output('collected', collected);
	});
};

export = collection;
