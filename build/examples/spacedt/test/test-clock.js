/// <reference path="../../../d/chai.d.ts" />
/// <reference path="../../../d/mocha.d.ts" />
var chai = require('chai');
var kettle = require('../../../test/electric-kettle');
kettle.pourAsync(chai);
var expect = chai.expect;
var electric = require('../../../src/electric');
var clock = require('../js/clock');
describe('clock', function () {
    afterEach(function () { return electric.scheduler.resume; });
    it('should measure time', function (done) {
        var t0 = electric.scheduler.stop();
        var time = clock({ intervalInMs: 1 });
        expect(time)
            .to.emit(t0)
            .then.after(function () { return electric.scheduler.advance(3); })
            .to.emit(t0 + 1, t0 + 2)
            .andBe(done);
    });
});
