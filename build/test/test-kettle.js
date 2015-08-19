var chai = require("chai");
var electricKettle = require('./electric-kettle');
electricKettle.pour(chai);
var expect = chai.expect;
var electric = require("../src/electric");
describe('expect many receivers of a emitter to receive when emitter from', function () {
    it('should work...', function () {
        var emitter = electric.emitter.manual(0);
        expect(10).receivers.ofA(emitter)
            .to.receive(1).when.emitted(1).from(emitter)
            .to.receive(2).when.emitted(2).from(emitter)
            .to.receive(3).when.emitted(3).from(emitter);
    });
});
describe('expect emitter after to emit', function () {
    it('should work...', function () {
        var emitter = electric.emitter.manual(0);
        expect(emitter).to.emit
            .values(0)
            .after(function () { return emitter.emit(1); })
            .values(1)
            .after(function () { emitter.emit(2); emitter.emit(3); })
            .values(2, 3);
    });
});
