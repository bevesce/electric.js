/// <reference path="../d/chai.d.ts" />
/// <reference path="../d/mocha.d.ts" />
import chai = require('chai');
import electricKettle = require('./electric-kettle');
electricKettle.pourAsync(chai);
var expect = chai.expect;
import electric = require('../src/electric');
import transmitter = require('../src/transmitter');


describe('transmitter', function() {
	it('should pass values from emitters added after creation', function(done) {
		var t = transmitter('0a');
		var e1 = electric.emitter.manual('1a');
		var e2 = electric.emitter.manual('2a');

		expect(t.map(x => x + '!'))
			.to.emit('0a!')
			.then.after(() => t.plugEmitter(e1))
			.to.emit('1a!')
			.then.after(() => e1.emit('1b'))
			.to.emit('1b!')
			.then.after(() => e1.emit('1c'))
			.to.emit('1c!')
			.then.after(() => t.plugEmitter(e2))
			.to.emit('2a!')
			.then.after(() => e1.emit('1d'))
			.to.emit('1d!')
			.then.after(() => e2.emit('2b'))
			.to.emit('2b!')
			.then.after(() => e1.emit('1e'))
			.to.emit('1e!')
			.andBe(done);
	});
});