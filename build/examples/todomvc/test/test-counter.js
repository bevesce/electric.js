/// <reference path="../../../d/chai.d.ts" />
/// <reference path="../../../d/mocha.d.ts" />
var chai = require('chai');
var electric = require('../../../src/electric');
var counter = require('../js/counter');
var kettle = require('../../../test/electric-kettle');
kettle.pourAsync(chai);
var expect = chai.expect;
describe('counter', function () {
    it('should emit count', function (done) {
        var emitter = electric.emitter.manual([]);
        expect(counter(emitter).count)
            .to.emit(0)
            .then.after(function () { return emitter.emit([1, 2, 3]); })
            .to.emit(3)
            .then.after(function () { return emitter.emit([1, 2]); })
            .to.emit(2)
            .andBe(done);
    });
    it('should emit properly proralised word', function (done) {
        var emitter = electric.emitter.manual([]);
        expect(counter(emitter).word)
            .to.emit('items')
            .then.after(function () { return emitter.emit([1]); })
            .to.emit('item')
            .then.after(function () { return emitter.emit([1, 2]); })
            .to.emit('items')
            .then.after(function () { return emitter.emit([3, 1]); })
            .andBe(done);
    });
});
