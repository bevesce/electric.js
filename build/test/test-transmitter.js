/// <reference path="../d/chai.d.ts" />
/// <reference path="../d/mocha.d.ts" />
var chai = require('chai');
var electricKettle = require('./electric-kettle');
electricKettle.pourAsync(chai);
var expect = chai.expect;
var electric = require('../src/electric');
var transmitter = require('../src/transmitter');
describe('transmitter', function () {
    it('should pass values from emitters added after creation', function (done) {
        var t = transmitter('0a');
        var e1 = electric.emitter.manual('1a');
        var e2 = electric.emitter.manual('2a');
        var c = electric.receiver.collect(t.map(function (x) { return x + '!'; }));
        expect(t.map(function (x) { return x + '!'; }))
            .to.emit('0a!')
            .then.after(function () { return t.plugEmitter(e1); })
            .to.emit('1a!')
            .then.after(function () { return e1.emit('1b'); })
            .to.emit('1b!')
            .then.after(function () { return e1.emit('1c'); })
            .to.emit('1c!')
            .then.after(function () { return t.plugEmitter(e2); })
            .to.emit('2a!')
            .then.after(function () { return e1.emit('1d'); })
            .to.emit('1d!')
            .then.after(function () { return e2.emit('2b'); })
            .to.emit('2b!')
            .then.after(function () { return e1.emit('1e'); })
            .to.emit('1e!')
            .andBe(done);
    });
});
