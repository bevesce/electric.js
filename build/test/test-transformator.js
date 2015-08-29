/// <reference path="../d/chai.d.ts" />
/// <reference path="../d/mocha.d.ts" />
var chai = require('chai');
var electricKettle = require('./electric-kettle');
electricKettle.pourAsync(chai);
var expect = chai.expect;
var electric = require('../src/electric');
var t = require('../src/transformator');
var eevent = require('../src/electric-event');
var transformator = it;
describe('transformators', function () {
    transformator('map1', function (done) {
        var emitter = electric.emitter.manual(0);
        var mapped = t.map(function (x) { return x + '!'; }, emitter);
        expect(mapped)
            .to.emit('0!')
            .then.after(function () { return emitter.emit(1); })
            .to.emit('1!')
            .that.finish(done);
    });
    transformator('map4', function (done) {
        var emitter1 = electric.emitter.manual(0);
        var emitter2 = electric.emitter.manual('a');
        var emitter3 = electric.emitter.manual('a');
        var emitter4 = electric.emitter.manual('a');
        var mapped = t.map(function (x, y, w, z) { return x + '!' + y; }, emitter1, emitter2, emitter3, emitter4);
        expect(mapped)
            .to.emit('0!a')
            .then.after(function () { return emitter1.emit(1); })
            .to.emit('1!a')
            .then.after(function () { return emitter2.emit('b'); })
            .to.emit('1!b')
            .then.finish(done);
    });
    transformator('filter1', function (done) {
        var emitter = electric.emitter.emitter(0);
        var filtered = t.filter(2, function (x) { return x > 2; }, emitter);
        expect(filtered)
            .to.emit(2)
            .then.after(function () { return emitter.emit(3); })
            .to.emit(3)
            .that.finish(done);
    });
    transformator('filter4', function (done) {
        var emitter1 = electric.emitter.manual(0);
        var emitter2 = electric.emitter.manual(1);
        var emitter3 = electric.emitter.manual(1);
        var emitter4 = electric.emitter.manual(1);
        var filtered = t.filter(2, function (x, y, z, w) { return x > 2 && y == 1; }, emitter1, emitter2, emitter3, emitter4);
        expect(filtered)
            .to.emit(2)
            .then.after(function () { return emitter1.emit(3); })
            .to.emit(3)
            .that.finish(done);
    });
    transformator('filterMap1', function (done) {
        var emitter = electric.emitter.emitter(0);
        var filterMapped = t.filterMap('2!', function (x) {
            if (x > 2) {
                return x + '!';
            }
        }, emitter);
        expect(filterMapped)
            .to.emit('2!')
            .then.after(function () { return emitter.emit(3); })
            .to.emit('3!')
            .that.finish(done);
    });
    transformator('filterMap4', function (done) {
        var emitter1 = electric.emitter.manual(0);
        var emitter2 = electric.emitter.manual('a');
        var emitter3 = electric.emitter.manual('a');
        var emitter4 = electric.emitter.manual('a');
        var filterMapped = t.filterMap('2!', function (x, y, z, w) {
            if (x > 2) {
                return x + '!' + y + z + w;
            }
        }, emitter1, emitter2, emitter3, emitter4);
        expect(filterMapped)
            .to.emit('2!')
            .then.after(function () { return emitter1.emit(3); })
            .to.emit('3!aaa')
            .that.finish(done);
    });
    transformator('accumulate1', function (done) {
        var emitter = electric.emitter.manual(0);
        var accumulated = t.accumulate([], function (acc, x) { return acc.concat(x); }, emitter);
        expect(accumulated)
            .to.emit([0])
            .then.after(function () { return emitter.emit(1); })
            .to.emit([0, 1])
            .then.finish(done);
    });
    transformator('accumulate4', function (done) {
        var emitter1 = electric.emitter.manual('1a');
        var emitter2 = electric.emitter.manual('2a');
        var emitter3 = electric.emitter.manual('3a');
        var emitter4 = electric.emitter.manual('4a');
        var accumulated = t.accumulate([], function (l, x, y, z, w) { return l.concat(x, y, z, w); }, emitter1, emitter2, emitter3, emitter4);
        expect(accumulated)
            .to.emit(['1a', '2a', '3a', '4a'])
            .then.after(function () { return emitter2.emit('2b'); })
            .to.emit(['1a', '2a', '3a', '4a', '1a', '2b', '3a', '4a'])
            .then.finish(done);
    });
    transformator('merge1', function (done) {
        // merge1 does nothing...
        var emitter = electric.emitter.manual(0);
        var merged = t.merge(emitter);
        expect(merged)
            .to.emit(0)
            .then.after(function () { return emitter.emit(1); })
            .to.emit(1)
            .that.finish(done);
    });
    transformator('merge4', function (done) {
        var emitter1 = electric.emitter.manual('1a');
        var emitter2 = electric.emitter.manual('2a');
        var emitter3 = electric.emitter.manual('3a');
        var emitter4 = electric.emitter.manual('4a');
        var merged = t.merge(emitter1, emitter2, emitter3, emitter4);
        expect(merged)
            .to.emit('1a')
            .then.after(function () { return emitter1.emit('1b'); })
            .to.emit('1b')
            .then.after(function () { return emitter2.emit('2b'); })
            .to.emit('2b')
            .then.after(function () { return emitter3.emit('3b'); })
            .to.emit('3b')
            .then.after(function () { return emitter4.emit('4b'); })
            .to.emit('4b')
            .then.after(function () { return emitter2.emit('2c'); })
            .to.emit('2c')
            .that.finish(done);
    });
    transformator('cummulateOverTime', function (done) {
        var emitter = electric.emitter.manual(eevent.notHappend);
        var cumulated = t.cumulateOverTime(emitter, 10);
        expect(cumulated)
            .to.emit(eevent.notHappend)
            .then.after(function () { return emitter.impulse(eevent.of(1)); })
            .and.after(function () { return emitter.impulse(eevent.of(2)); })
            .to.emit(eevent.of([1, 2]))
            .to.emit(eevent.notHappend)
            .and.then.to.finish(done);
    });
    transformator('flatten', function (done) {
        var initial = electric.emitter.manual('i1');
        var emitter = electric.emitter.manual(initial);
        var flattened = t.flatten(emitter);
        var toBeEmitted = electric.emitter.manual('t1');
        expect(flattened)
            .to.emit('i1')
            .then.after(function () { return initial.emit('i2'); })
            .to.emit('i2')
            .then.after(function () { return emitter.emit(toBeEmitted); })
            .to.emit('t1')
            .then.after(function () { return initial.emit('i3'); })
            .to.emit('i3')
            .then.after(function () { return toBeEmitted.emit('t2'); })
            .to.emit('t2')
            .andBe(done);
    });
    transformator('hold', function (done) {
        var emitter = electric.emitter.manual(eevent.notHappend);
        var holded = t.hold(0, emitter);
        expect(holded)
            .to.emit(0)
            .then.after(function () { return emitter.impulse(eevent.of(1)); })
            .to.emit(1)
            .then.after(function () { return emitter.impulse(eevent.of(1)); })
            .then.after(function () { return emitter.impulse(eevent.of(2)); })
            .to.emit(2)
            .andBe(done);
    });
    transformator('changes', function (done) {
        var emitter = electric.emitter.manual(0);
        var changes = t.changes(emitter);
        expect(changes)
            .to.emit(eevent.notHappend)
            .then.after(function () { return emitter.emit(1); })
            .to.emit(eevent.of({ previous: 0, next: 1 }))
            .to.emit(eevent.notHappend)
            .then.after(function () { return emitter.emit(2); })
            .to.emit(eevent.of({ previous: 1, next: 2 }))
            .to.emit(eevent.notHappend)
            .andBe(done);
    });
});
