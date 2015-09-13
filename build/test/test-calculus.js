/// <reference path="../d/chai.d.ts" />
/// <reference path="../d/mocha.d.ts" />
var chai = require('chai');
var expect = chai.expect;
var electric = require('../src/electric');
var clock = require('../src/clock');
var IntegrableAntiderivativeOfNumber = require('../src/calculus/integrable-antiderivative-of-number');
var DifferentiableDerivativeOfNumber = require('../src/calculus/differentiable-derivative-of-number');
var sh = electric.scheduler;
function iacceleration(x) {
    return IntegrableAntiderivativeOfNumber.of(x, ivelocity);
}
function ivelocity(x) {
    return IntegrableAntiderivativeOfNumber.of(x, ishift);
}
function ishift(x) {
    return IntegrableAntiderivativeOfNumber.of(x);
}
var interval = { intervalInMs: 1 };
describe('integral', function () {
    afterEach(function () { return sh.resume(); });
    it('should calculate value over time', function (done) {
        sh.stop();
        var aT = electric.e.constant(iacceleration(5));
        var vT = electric.calculus.integral(ivelocity(0), aT, interval);
        var v = electric.receiver.collect(vT);
        sh.advance(5);
        setTimeout(function () {
            var values = v.map(function (x) { return x.x; });
            floatArrayEql(values, [
                0.000,
                0.005,
                0.010,
                0.015,
                0.020
            ]);
            done();
        }, 1);
    });
    it('should be composable', function (done) {
        sh.stop();
        var aT = electric.e.constant(iacceleration(5));
        var vT = electric.calculus.integral(ivelocity(0), aT, interval);
        var sT = electric.calculus.integral(ishift(0), vT, interval);
        var s = electric.receiver.collect(sT);
        sh.advance(4);
        setTimeout(function () {
            var values = s.map(function (x) { return x.x; });
            floatArrayEql(values, [
                0.0000000,
                0.0000025,
                0.0000100,
                0.0000225
            ]);
            done();
        }, 1);
    });
});
function dshift(x) {
    return DifferentiableDerivativeOfNumber.of(x, dvelocity);
}
function dvelocity(x) {
    return DifferentiableDerivativeOfNumber.of(x, dacceleration);
}
function dacceleration(x) {
    return DifferentiableDerivativeOfNumber.of(x);
}
describe('differential', function () {
    afterEach(function () { return sh.resume(); });
    it('should calculate value over time', function (done) {
        sh.stop();
        var sT = clock.time({ intervalInMs: 1 }).map(function (t) { return dshift(2 * t); });
        var vT = electric.calculus.differential(dvelocity(0), sT, interval);
        var v = electric.receiver.collect(vT);
        sh.advance(5);
        setTimeout(function () {
            var values = v.map(function (x) { return x.x; });
            floatArrayEql(values, [
                0, 2000
            ]);
            done();
        }, 10);
    });
    it('should be composable', function (done) {
        sh.stop();
        var sT = clock.time({ intervalInMs: 1 }).map(function (t) { return dshift(2 * t); });
        var vT = electric.calculus.differential(dvelocity(0), sT, interval);
        var aT = electric.calculus.differential(dacceleration(0), vT, interval);
        var a = electric.receiver.collect(aT);
        sh.advance(5);
        setTimeout(function () {
            var values = a.map(function (x) { return x.x; });
            floatArrayEql(values, [
                0, 2000000, 0
            ]);
            done();
        }, 1);
    });
});
function floatArrayEql(actual, expected) {
    var delta = 0.000000001;
    expect(actual.length).to.equal(expected.length);
    for (var i = 0; i < expected.length; i++) {
        expect(actual[i]).to.be.within(expected[i] - delta, expected[i] + delta);
    }
}
