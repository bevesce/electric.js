/// <reference path="../d/chai.d.ts" />
/// <reference path="../d/mocha.d.ts" />
var chai = require("chai");
var electricKettle = require('./electric-kettle');
electricKettle.pourAsync(chai);
var expect = chai.expect;
var electric = require("../src/electric");
describe('expect to emit then after to emit then finish', function () {
    it('should work...', function (done) {
        var emitter = electric.emitter.manual(0);
        expect(emitter)
            .to.emit(0)
            .then.after(function () { return emitter.emit(1); })
            .to.emit(1)
            .then.after(function () { return emitter.emit(2); })
            .to.emit(2)
            .then.finish(done);
    });
});
