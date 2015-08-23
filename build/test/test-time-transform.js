/// <reference path="../d/chai.d.ts" />
/// <reference path="../d/mocha.d.ts" />
var chai = require("chai");
var electricKettle = require('./electric-kettle');
electricKettle.pour(chai);
var expect = chai.expect;
var electric = require("../src/electric");
describe('time transform', function () {
    it('should reach to the future', function () {
        electric.scheduler.stop();
        var emitter = electric.emitter.manual(0);
        var r = [];
        // optional t0
        emitter.transformTime(0, function (t) { return t + 2; }).plugReceiver(function (x) { return r.push(x); });
        expect(r).to.deep.equal([0]);
        electric.scheduler.advance();
        emitter.emit(1);
        expect(r).to.deep.equal([0]);
        electric.scheduler.advance();
        expect(r).to.deep.equal([0]);
        electric.scheduler.advance();
        expect(r).to.deep.equal([0]);
        electric.scheduler.advance();
        expect(r).to.deep.equal([0, 1]);
        emitter.emit(2);
        expect(r).to.deep.equal([0, 1]);
        electric.scheduler.advance();
        expect(r).to.deep.equal([0, 1]);
        electric.scheduler.advance();
        expect(r).to.deep.equal([0, 1]);
        electric.scheduler.advance();
        expect(r).to.deep.equal([0, 1, 2]);
    });
    it('should work with wrong time transformations', function () {
        var time = electric.scheduler.stop();
        var emitter = electric.emitter.manual(0);
        var r = [];
        emitter.transformTime(0, function (t) { return -1; }).plugReceiver(function (x) { return r.push(x); });
        emitter.emit(1);
        emitter.emit(2);
        expect(r).to.deep.equal([0, 1, 2]);
    });
    it('should work with custom start time', function () {
        var time = electric.scheduler.stop();
        var emitter = electric.emitter.manual(0);
        var r = [];
        emitter.transformTime(0, function (t) { return t * 2; }, time).plugReceiver(function (x) { return r.push([electric.scheduler.now(), x]); });
        electric.scheduler.advance(1);
        emitter.emit(1);
        electric.scheduler.advance(1);
        electric.scheduler.advance(1);
        expect(r).to.deep.equal([[time, 0], [time + 2, 1]]);
        emitter.emit(2);
        expect(r).to.deep.equal([[time, 0], [time + 2, 1]]);
        electric.scheduler.advance(1);
        expect(r).to.deep.equal([[time, 0], [time + 2, 1]]);
        electric.scheduler.advance(1);
        expect(r).to.deep.equal([[time, 0], [time + 2, 1]]);
        electric.scheduler.advance(1);
        expect(r).to.deep.equal([[time, 0], [time + 2, 1]]);
        electric.scheduler.advance(1);
        expect(r).to.deep.equal([
            [time, 0], [time + 2, 1], [time + 6, 2]
        ]);
    });
    after(electric.scheduler.resume);
});
