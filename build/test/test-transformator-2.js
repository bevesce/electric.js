/// <reference path="../d/chai.d.ts" />
/// <reference path="../d/mocha.d.ts" />
var chai = require('chai');
var electricKettle = require('./electric-kettle');
electricKettle.pourAsync(chai);
var expect = chai.expect;
var electric = require('../src/electric');
var t = require('../src/transformator');
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
        var emitter2 = electric.emitter.manual('a');
        var emitter3 = electric.emitter.manual('a');
        var emitter4 = electric.emitter.manual('a');
        var filtered = t.filter(2, function (x, y, z, w) { return x > 2 && y == 'a'; }, emitter1, emitter2, emitter3, emitter4);
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
});
