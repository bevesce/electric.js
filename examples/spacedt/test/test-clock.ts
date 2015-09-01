/// <reference path="../../../d/chai.d.ts" />
/// <reference path="../../../d/mocha.d.ts" />

import chai = require('chai');
import kettle = require('../../../test/electric-kettle');
kettle.pourAsync(chai);
var expect = chai.expect;

import electric = require('../../../src/electric');
import clock = require('../js/clock');

describe('clock', function() {
	afterEach(() => electric.scheduler.resume);

	it('should measure time', function(done) {
		var t0 = electric.scheduler.stop();
		var time = clock({ intervalInMs: 1 });
		expect(time)
			.to.emit(t0)
			.then.after(() => electric.scheduler.advance(3))
			.to.emit(t0 + 1, t0 + 2)
			.andBe(done)
	});
});
