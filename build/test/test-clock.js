/// <reference path="../d/chai.d.ts" />
/// <reference path="../d/mocha.d.ts" />
var chai = require('chai');
var expect = chai.expect;
var electric = require('../src/electric');
var clock = require('../src/clock');
var tv = clock.TimeValue;
function constant(x) {
    return function (t) {
        return x;
    };
}
function times(x) {
    return function (t) {
        return x * t;
    };
}
describe('clock', function () {
    afterEach(function () {
        electric.scheduler.resume();
    });
    it.only('should measure time', function () {
        var time = electric.scheduler.stop();
        var timer = clock.time({ intervalInMs: 1 });
        var r = [];
        timer.plugReceiver(function (x) { return r.push(x); });
        expect(r).to.deep.equal([tv.of(time)]);
        electric.scheduler.advance(2);
        expect(r).to.deep.equal([tv.of(time), tv.of(time + 1)]);
        electric.scheduler.advance(2);
        expect(r).to.deep.equal([
            tv.of(time), tv.of(time + 1), tv.of(time + 2), tv.of(time + 3)
        ]);
    });
    it('should sample function', function () {
        var f = constant(2);
        var time = electric.scheduler.stop();
        var timer = clock.timeFunction(f, { intervalInMs: 1 });
        var r = [];
        timer.plugReceiver(function (x) { return r.push(x); });
        electric.scheduler.advance(4);
        expect(r).to.deep.equal([
            tv.of(time + 0, f(time + 0)),
            tv.of(time + 1, f(time + 1)),
            tv.of(time + 2, f(time + 2)),
            tv.of(time + 3, f(time + 3))
        ]);
    });
    it('should stop measuring time on stabilization', function () {
        var time = electric.scheduler.stop();
        var timer = clock.time({ intervalInMs: 1 });
        var collected = electric.receiver.collect(timer);
        electric.scheduler.advance(10);
        var previousCollected = collected.slice();
        timer.stabilize();
        electric.scheduler.advance(20);
        expect(collected).to.be.eql(previousCollected);
    });
});
describe('integral transformator', function () {
    afterEach(function () {
        electric.scheduler.resume();
    });
    it('should calculate integral of f(t) = 2', function () {
        var time = electric.scheduler.stop();
        var v = constant(2);
        var vT = clock.timeFunction(v, { intervalInMs: 1 });
        var sT = clock.integral(vT);
        var r = [];
        sT.plugReceiver(function (x) { return r.push(x); });
        electric.scheduler.advance(4);
        // value in v is expressed in [unit/s]
        expect(r).to.deep.equal([
            tv.of(time + 0, 0.000),
            tv.of(time + 1, 0.002),
            tv.of(time + 2, 0.004),
            tv.of(time + 3, 0.006),
        ]);
    });
    it('should calculate integral of f(t) = 2 * t', function () {
        var time = electric.scheduler.stop();
        // value in v is expressed in [unit/s]
        var v = times(2);
        var vT = clock.timeFunction(v, { intervalInMs: 1 }, time);
        var sT = clock.integral(vT);
        var r = [];
        sT.plugReceiver(function (x) { return r.push(x); });
        electric.scheduler.advance(4);
        expect(r).to.deep.equal([
            tv.of(time + 0, 0.000),
            tv.of(time + 1, 0.001),
            tv.of(time + 2, 0.004),
            tv.of(time + 3, 0.009000000000000001),
        ]);
    });
    it('should be composable', function () {
        var time = electric.scheduler.stop();
        // value in a is expressed in [unit/s]
        var a = constant(2);
        var aT = clock.timeFunction(a, { intervalInMs: 1 });
        var vT = clock.integral(aT);
        var sT = clock.integral(vT);
        var c = electric.receiver.collect(sT);
        electric.scheduler.advance(6);
        expect(c).to.eql([
            tv.of(time + 0, 0.000000),
            tv.of(time + 1, 0.000001),
            tv.of(time + 2, 0.000004),
            tv.of(time + 3, 0.000009),
            tv.of(time + 4, 0.000016),
            tv.of(time + 5, 0.000025)
        ]);
    });
});
describe('derivative transformator', function () {
    afterEach(function () {
        electric.scheduler.resume();
    });
    it('should calculate derivative of f(t) = 2 function', function () {
        var time = electric.scheduler.stop();
        var s = constant(2);
        var sT = clock.timeFunction(s, { intervalInMs: 1 });
        var vT = clock.derivative(sT);
        var aT = clock.derivative(vT);
        var vTc = electric.receiver.collect(vT);
        var aTc = electric.receiver.collect(aT);
        electric.scheduler.advance(6);
        expect(vTc).to.eql([
            tv.of(time + 0, 0),
            tv.of(time + 1, 0),
            tv.of(time + 2, 0),
            tv.of(time + 3, 0),
            tv.of(time + 4, 0),
            tv.of(time + 5, 0)
        ]);
        expect(aTc).to.eql([
            tv.of(time + 0, 0),
            tv.of(time + 1, 0),
            tv.of(time + 2, 0),
            tv.of(time + 3, 0),
            tv.of(time + 4, 0),
            tv.of(time + 5, 0)
        ]);
    });
    it('should calculate derivative of f(t) = 2 * t^2 function', function () {
        var time = electric.scheduler.stop();
        function s(t) {
            return 2 * t * t;
        }
        var sT = clock.timeFunction(s, { intervalInMs: 1 }, time);
        var vT = clock.derivative(sT);
        var aT = clock.derivative(vT);
        var vTc = electric.receiver.collect(vT);
        var aTc = electric.receiver.collect(aT);
        electric.scheduler.advance(6);
        expect(vTc).to.eql([
            tv.of(time + 0, 0),
            tv.of(time + 1, 2),
            tv.of(time + 2, 6),
            tv.of(time + 3, 10),
            tv.of(time + 4, 14),
            tv.of(time + 5, 18)
        ]);
        expect(aTc).to.eql([
            tv.of(time + 0, 0),
            tv.of(time + 1, 2),
            tv.of(time + 2, 4),
            tv.of(time + 3, 4),
            tv.of(time + 4, 4),
            tv.of(time + 5, 4)
        ]);
    });
});
describe('time value', function () {
    function double(x) {
        return 2 * x;
    }
    function sum4(v1, v2, v3, v4) {
        return v1 + v2 + v3 + v4;
    }
    it('should be createable', function () {
        var t = tv.of(1, 2);
        expect(t.time).to.equal(1);
        expect(t.value).to.equal(2);
    });
    it('should be mappable', function () {
        var t = tv.of(1, 2);
        expect(t.map(double))
            .to.eql(tv.of(1, double(2)));
    });
    it('should lift functions with arity 1', function () {
        var ldouble = tv.lift(double);
        expect(ldouble(tv.of(1, 2)))
            .to.eql(tv.of(1, double(2)));
    });
    // should lift function with arity 2-3
    it('should lift functions with arity 4', function () {
        var lsum4 = tv.lift(sum4);
        expect(lsum4(tv.of(1, 1), tv.of(2, 2), tv.of(3, 3), tv.of(4, 4))).to.eql(tv.of(4, sum4(1, 2, 3, 4)));
    });
    // should lift function with arity 5-7
});
