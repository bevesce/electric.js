/// <reference path="../d/chai.d.ts" />
/// <reference path="../d/mocha.d.ts" />
var chai = require('chai');
var electricKettle = require('./electric-kettle');
electricKettle.pourAsync(chai);
var expect = chai.expect;
var electric = require('../src/electric');
function double(x) {
    return x * 2;
}
;
function doubleIfOver2(x) {
    if (x > 2) {
        return x * 2;
    }
}
;
describe('emitter', function () {
    it('should be pluggable', function () {
        var emitter = electric.emitter.emitter(0);
        emitter.plugReceiver(double);
    });
    it('should emit initial value asynchronously', function (done) {
        var emitter = electric.emitter.emitter(0);
        expect(electric.receiver.collect(emitter)).to.deep.equal([]);
        // it's emty bacause value will be emitted after
        // current event in event loop is processed
        expect(emitter)
            .to.emit(0)
            .then.finish(done);
    });
    it('should emit values synchronously', function () {
        // the asumption is that .emit
        // is always called in not initial even
        // in js event loop so there's no need
        // for more asynchronicity
        // to manually emit values when main code is loading
        // use emitter.manual
        var emitter = electric.emitter.emitter(0);
        var collected = electric.receiver.collect(emitter);
        emitter.emit(1);
        emitter.emit(2);
        expect(collected).to.eql([1, 2]);
    });
    it('should impulse values synchronously', function () {
        var emitter = electric.emitter.emitter(0);
        var collected = electric.receiver.collect(emitter);
        emitter.impulse(1);
        emitter.impulse(2);
        expect(collected).to.eql([1, 0, 2, 0]);
    });
    it('should be unpluggable', function () {
        var emitter = electric.emitter.emitter(0);
        var emitted = 0;
        var disposable = emitter.plugReceiver(function (x) { return emitted = x; });
        emitter.emit(1);
        expect(emitted).to.equal(1);
        emitter.unplugReceiver(disposable);
        emitter.emit(2);
        expect(emitted).to.equal(1);
    });
    it('should release resources when stabilized', function () {
        var emitter = electric.emitter.emitter(0);
        var released = false;
        emitter.setReleaseResources(function () { return released = true; });
        emitter.stabilize();
        expect(released).to.be.true;
    });
    it('should throw at emit after stabilization', function () {
        var emitter = electric.emitter.emitter(0);
        emitter.stabilize();
        expect(emitter.emit).to.throw(Error);
        expect(emitter.impulse).to.throw(Error);
    });
    it('should pass value to new receiver even after stabilization', function (done) {
        var emitter = electric.emitter.emitter(0);
        emitter.stabilize();
        expect(emitter)
            .to.emit(0)
            .then.finish(done);
    });
    it('should be mappable', function (done) {
        var emitter = electric.emitter.emitter(0);
        var mapped = emitter.map(function (x) { return 2 * x; });
        expect(mapped)
            .to.emit(0)
            .then.after(function () { return emitter.emit(1); })
            .to.emit(2)
            .then.after(function () { return emitter.emit(13); })
            .to.emit(26)
            .then.finish(done);
    });
    it('should be filterable', function (done) {
        var emitter = electric.emitter.emitter(0);
        var filtered = emitter.filter(2, function (x) { return x > 2; });
        expect(filtered)
            .to.emit(2)
            .then.after(function () { return emitter.emit(1); })
            .then.after(function () { return emitter.emit(3); })
            .to.emit(3)
            .then.after(function () { return emitter.emit(1); })
            .finish(done);
    });
    it('should be filterMappable', function (done) {
        var emitter = electric.emitter.emitter(0);
        var filterMapped = emitter.filterMap(2, doubleIfOver2);
        expect(filterMapped)
            .to.emit(2)
            .then.after(function () { return emitter.emit(1); })
            .then.after(function () { return emitter.emit(3); })
            .to.emit(6)
            .then.after(function () { return emitter.emit(1); })
            .finish(done);
    });
    it('should be mergeable', function (done) {
        var emitter1 = electric.emitter.emitter(1);
        var emitter2 = electric.emitter.emitter(2);
        var emitter3 = electric.emitter.emitter(3);
        var merged = emitter1.merge(emitter2, emitter3);
        expect(merged)
            .to.emit(1)
            .to.emit(2)
            .to.emit(3)
            .to.emit(3)
            .then.finish(done);
    });
    it('should be accumulateable');
    it('should be changeable');
    it('should be sampleable');
    it('should be timeTransformable');
    it('should be cummulateOverTimeable');
});
