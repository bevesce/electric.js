/// <reference path="../d/chai.d.ts" />
/// <reference path="../d/mocha.d.ts" />
import chai = require('chai');
import electricKettle = require('./electric-kettle');
var expect = chai.expect;
import electric = require('../src/electric');
import clock = require('../src/clock');

var sh = electric.scheduler;

describe('clock', function() {
	afterEach(() => sh.resume());

	it('should measure time', function(done) {
		var time = sh.stop();
		expect(clock.time({ intervalInMs: 1}))
			.to.emit(time)
			.after(() => sh.advance(3))
			.to.emit(time + 1)
			.to.emit(time + 2)
			.andBe(done);
	});

	it('should time intervals', function(done) {
		var time = sh.stop();
		expect(clock.interval({ inMs: 1}))
			.to.emit(electric.event.notHappend)
			.after(() => sh.advance(3))
			.to.emit(electric.event.of(time + 1))
			.to.emit(electric.event.notHappend)
			.to.emit(electric.event.of(time + 2))
			.to.emit(electric.event.notHappend)
			.andBe(done)
	});

	it('should time intervals with value', function(done) {
		var time = sh.stop();
		expect(clock.intervalValue('test', { inMs: 1}))
			.to.emit(electric.event.notHappend)
			.after(() => sh.advance(3))
			.to.emit(electric.event.of('test'))
			.to.emit(electric.event.notHappend)
			.to.emit(electric.event.of('test'))
			.to.emit(electric.event.notHappend)
			.andBe(done)
	});

	it('should strop measuring time after stabilization', function(done) {
		var time = sh.stop();
		var timer = clock.time({ intervalInMs: 1});
		expect(timer)
			.to.emit(time)
			.after(() => timer.stabilize())
			.after(() => sh.advance(3))
			.andBe(done);
	});

	it('should count down to one event', function(done) {
		var time = sh.stop();
		var once = clock.once(1, '!');
		expect(once)
			.to.emit(electric.event.notHappend)
			.then.after(() => sh.advance(2))
			.to.emit(electric.event.of('!'))
			.then.to.emit(electric.event.notHappend)
			.andBe(done);
	});
});
