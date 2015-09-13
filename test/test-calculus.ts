/// <reference path="../d/chai.d.ts" />
/// <reference path="../d/mocha.d.ts" />
import chai = require('chai');
import electricKettle = require('./electric-kettle');
var expect = chai.expect;
import electric = require('../src/electric');
import clock = require('../src/clock');
import IntegrableAntiderivativeOfNumber = require('../src/calculus/integrable-antiderivative-of-number');
import DifferentiableDerivativeOfNumber = require('../src/calculus/differentiable-derivative-of-number');

var sh = electric.scheduler;


function iacceleration(x: number) {
    return IntegrableAntiderivativeOfNumber.of(x, ivelocity);
}

function ivelocity(x: number) {
    return IntegrableAntiderivativeOfNumber.of(x, ishift);
}

function ishift(x: number) {
    return IntegrableAntiderivativeOfNumber.of(x);
}

var interval = { intervalInMs: 1 };

describe('integral', function() {
	afterEach(() => sh.resume());

	it('should calculate value over time', function(done) {
		sh.stop();
		var aT = electric.e.constant(iacceleration(5));
		var vT = electric.calculus.integral(ivelocity(0), aT, interval);
		var v = electric.receiver.collect(vT);
		sh.advance(5);
		setTimeout(()=>{
			var values = v.map(x => x.x);
			floatArrayEql(values, [
				0.000,
				0.005,
				0.010,
				0.015,
				0.020
			]);
			done();
		}, 1)
	});

	it('should be composable', function(done) {
		sh.stop();
		var aT = electric.e.constant(iacceleration(5));
		var vT = electric.calculus.integral(ivelocity(0), aT, interval);
		var sT = electric.calculus.integral(ishift(0), vT, interval);
		var s = electric.receiver.collect(sT);
		sh.advance(4);
		setTimeout(()=>{
			var values = s.map(x => x.x);
			floatArrayEql(values, [
				0.0000000,
				0.0000025,
				0.0000100,
				0.0000225
			]);
			done();
		}, 1)
	});
});

function dshift(x: number) {
	return DifferentiableDerivativeOfNumber.of(x, dvelocity)
}

function dvelocity(x: number) {
	return DifferentiableDerivativeOfNumber.of(x, dacceleration)
}

function dacceleration(x: number) {
	return DifferentiableDerivativeOfNumber.of(x)
}

describe('differential', function() {
	afterEach(() => sh.resume());

	it('should calculate value over time', function(done) {
		sh.stop();
		var sT = clock.time({ intervalInMs: 1}).map(t => dshift(2 * t));
		var vT = electric.calculus.differential(dvelocity(0), sT, interval);
		var v = electric.receiver.collect(vT);
		sh.advance(5);
		setTimeout(()=>{
			var values = v.map(x => x.x);
			floatArrayEql(values, [
				0, 2000
			]);
			done();
		}, 10)
	});

	it('should be composable', function(done) {
		sh.stop();
		var sT = clock.time({ intervalInMs: 1}).map(t => dshift(2 * t));
		var vT = electric.calculus.differential(dvelocity(0), sT, interval);
		var aT = electric.calculus.differential(dacceleration(0), vT, interval);
		var a = electric.receiver.collect(aT);
		sh.advance(5);
		setTimeout(()=>{
			var values = a.map(x => x.x);
			floatArrayEql(values, [
				0, 2000000, 0
			]);
			done();
		}, 1)
	});
});

function floatArrayEql(actual: number[], expected: number[]) {
	var delta = 0.000000001
	expect(actual.length).to.equal(expected.length);
	for (var i = 0; i < expected.length; i++) {
		expect(actual[i]).to.be.within(
			expected[i] - delta, expected[i] + delta
		);
	}
}
