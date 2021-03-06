/// <reference path="../../../d/chai.d.ts" />
/// <reference path="../../../d/mocha.d.ts" />

import chai = require('chai');
import electric = require('../../../src/electric');
import counter = require('../js/counter');
import kettle = require('../../../test/electric-kettle');
kettle.pourAsync(chai);

var expect = chai.expect;

describe('counter', function() {
	it('should emit count', function(done) {
		var emitter = electric.emitter.manual([]);
		expect(counter(emitter).count)
			.to.emit(0)
			.then.after(() => emitter.emit([1, 2, 3]))
			.to.emit(3)
			.then.after(() => emitter.emit([1, 2]))
			.to.emit(2)
			.andBe(done);
	});

	it('should emit properly proralised word', function(done) {
		var emitter = electric.emitter.manual([]);
		expect(counter(emitter).word)
			.to.emit('items')
			.then.after(() => emitter.emit([1]))
			.to.emit('item')
			.then.after(() => emitter.emit([1, 2]))
			.to.emit('items')
			.then.after(() => emitter.emit([3, 1]))
			.andBe(done);
	});
});
