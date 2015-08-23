/// <reference path="../d/chai.d.ts" />
/// <reference path="../d/mocha.d.ts" />
var chai = require('chai');
var electricKettle = require('./electric-kettle');
electricKettle.pour(chai);
var expect = chai.expect;
var electric = require('../src/electric');
var clock = require('../src/clock');
var tv = clock.TimeValue;
describe('clock', function () {
    it('should measure time', function () {
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
        function f(t) {
            return 2 * t;
        }
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
});
describe('integral transformator', function () {
    it('should calculate integral over constant', function () {
        var time = electric.scheduler.stop();
        function v(t) {
            return 2;
        }
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
    it('should be composable', function () {
        var time = electric.scheduler.stop();
        // value in a is expressed in [unit/s]
        function a(t) {
            return 2;
        }
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
    it('should calculate derivative');
    it('should be composable');
});
