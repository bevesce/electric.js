var chai = require("chai");
var electricKettle = require('./electric-kettle');
electricKettle.pour(chai);
var expect = chai.expect;
var electric = require("../server/electric");
describe('electric emitter', function () {
    var emitted;
    function receiver(x) {
        emitted = x;
    }
    it('should be pluggable', function () {
        var emitter = electric.emitter.manual(0);
        emitter.plugReceiver(receiver);
        emitter.emit(1);
        expect(emitted).to.equal(1);
    });
    it('should be unpluggable be id', function () {
        var emitter = electric.emitter.manual(0);
        var id = emitter.plugReceiver(receiver);
        emitter.unplugReceiver(id);
        emitter.emit(1);
        expect(emitted).to.equal(0);
    });
    it('should be unpluggable be receiver itself', function () {
        var emitter = electric.emitter.manual(0);
        emitter.plugReceiver(receiver);
        emitter.unplugReceiver(receiver);
        emitter.emit(1);
        expect(emitted).to.equal(0);
    });
});
describe('electric manual emitter', function () {
    it('should be exported', function () {
        expect(electric.emitter.manual).to.not.be.undefined;
    });
    it('should pass values to receivers', function () {
        var emitter = electric.emitter.manual(0);
        expect(2).receivers.ofA(emitter)
            .to.receive(2).when.emitted(2).from(emitter)
            .to.receive(3).when.emitted(3).from(emitter);
    });
    it('should provide current value on pluggin', function () {
        var emitter = electric.emitter.manual(13);
        var r;
        emitter.plugReceiver(function (x) { return r = x; });
        expect(r).to.equal(13);
        var r2;
        emitter.emit(2);
        emitter.plugReceiver(function (x) { return r2 = x; });
        expect(r).to.equal(2);
        expect(r2).to.equal(2);
    });
    it('should be pluggable by receivers', function () {
        var r;
        var i;
        var emitter = electric.emitter.manual(13);
        var receiver = electric.receiver.hanging();
        receiver.receiveOn = function (x, y) {
            r = x;
            i = y;
        };
        emitter.plugReceiver(receiver);
        expect(r).to.equal(13);
        expect(i).to.equal(0);
        emitter.emit(14);
        expect(r).to.equal(14);
        expect(i).to.equal(0);
    });
});
describe('emitters impulse', function () {
    it('should return to value before impulse', function () {
        var emitter = electric.emitter.manual(0);
        expect(emitter).to.emit
            .values(0)
            .after(function () {
            emitter.impulse(1);
        })
            .values(1, 0);
    });
    it('it should not go to new receivers', function () {
        var emitter = electric.emitter.manual(0);
        var r = [];
        emitter.plugReceiver(function (x) { return r.push('a' + x); });
        emitter.impulse(1);
        emitter.plugReceiver(function (x) { return r.push('b' + x); });
        emitter.impulse(2);
        expect(r).to.deep.equal([
            'a0', 'a1', 'a0', 'b0', 'a2', 'b2', 'a0', 'b0'
        ]);
    });
});
