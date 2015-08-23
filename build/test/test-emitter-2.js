/// <reference path="../d/chai.d.ts" />
/// <reference path="../d/mocha.d.ts" />
var chai = require('chai');
var electricKettle = require('./electric-kettle');
electricKettle.pourAsync(chai);
var expect = chai.expect;
var electric = require('../src/electric');
var eevent = require('../src/electric-event');
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
        var emitter = electric.emitter.manual(0);
        var released = false;
        emitter.setReleaseResources(function () { return released = true; });
        emitter.stabilize();
        expect(released).to.be.true;
    });
    it('should throw at emit after stabilization', function () {
        var emitter = electric.emitter.manual(0);
        emitter.stabilize();
        expect(emitter.emit).to.throw(Error);
        expect(emitter.impulse).to.throw(Error);
    });
    it('should pass value to new receiver even after stabilization', function (done) {
        var emitter = electric.emitter.manual(0);
        emitter.stabilize();
        expect(emitter)
            .to.emit(0)
            .then.finish(done);
    });
    it('should be mappable', function (done) {
        var emitter = electric.emitter.manual(0);
        var mapped = emitter.map(function (x) { return 2 * x; });
        var c = electric.receiver.collect(mapped);
        expect(mapped)
            .to.emit(0)
            .then.after(function () { return emitter.emit(1); })
            .to.emit(2)
            .then.after(function () { return emitter.emit(13); })
            .to.emit(26)
            .then.finish(done);
    });
    it('should be filterable', function (done) {
        var emitter = electric.emitter.manual(0);
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
        var emitter = electric.emitter.manual(0);
        var filterMapped = emitter.filterMap(2, doubleIfOver2);
        expect(filterMapped)
            .to.emit(2)
            .then.after(function () { return emitter.emit(1); })
            .then.after(function () { return emitter.emit(3); })
            .to.emit(6)
            .then.after(function () { return emitter.emit(1); })
            .finish(done);
    });
    it('should be timeTransformable', function (done) {
        var emitter = electric.emitter.manual(0);
        var shifted = emitter.transformTime(-1, function (x) { return x + 5; });
        expect(shifted)
            .to.emit(-1)
            .to.emit(0)
            .then.after(function () { return emitter.emit(1); })
            .to.emit(1)
            .then.finish(done);
    });
    it('should be sampleable', function (done) {
        var emitter = electric.emitter.manual(0);
        var sampler = electric.emitter.manual(eevent.notHappend);
        var sampled = emitter.sample(-1, sampler);
        expect(sampled)
            .to.emit(-1)
            .then.after(function () { return sampler.impulse(eevent.of(true)); })
            .to.emit(0)
            .then.after(function () { return emitter.emit(1); })
            .then.after(function () { return sampler.impulse(eevent.of(true)); })
            .to.emit(1)
            .then.finish(done);
    });
    it('should be changeable', function (done) {
        var emitter0 = electric.emitter.constant('0a');
        var emitter1 = electric.emitter.manual('1a');
        var event1 = electric.emitter.manual(eevent.notHappend);
        var event2 = electric.emitter.emitter(eevent.notHappend);
        var changing = emitter0.change({ to: emitter1, when: event1 }, {
            to: function (x, s) { return electric.emitter.constant('2a<' + s + '><' + x + '>'); },
            when: event2
        });
        expect(changing)
            .to.emit('0a')
            .then.after(function () { return event1.impulse(eevent.of(1)); })
            .to.emit('1a')
            .then.after(function () { return emitter1.emit('1b'); })
            .to.emit('1b')
            .then.after(function () { return emitter1.emit('1c'); })
            .to.emit('1c')
            .then.after(function () { return event2.impulse(eevent.of(13)); })
            .to.emit('2a<13><1c>')
            .then.finish(done);
    });
});
describe('event emitter', function () {
    it('should be mappable without worring about not happend');
    it('should be filterable without worring about not happend');
    it('should be filterMappable without worring about not happend');
    it('should be mergeable');
    it('should be acumulateable');
    it('should be cummulateOverTimeable');
});
