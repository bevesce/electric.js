/// <reference path="../d/chai.d.ts" />
/// <reference path="../d/mocha.d.ts" />
import chai = require("chai");
import electricKettle = require('./electric-kettle');
electricKettle.pourAsync(chai);
var expect = chai.expect;
import electric = require("../src/electric");
// import ui = require('../src/emitters/ui');
import emitterFromPromise = require('../src/emitters/fromPromise');


describe('electric emitter', function() {
    it('should be pluggable', function(done) {
        var emitter = electric.emitter.manual(0);
        var emitted = -1;
        emitter.plugReceiver(x => {
			emitted = x;

		});
        expect(emitter)
        	.to.emit(0)
			.then.after(() => emitter.emit(1))
			.to.emit(1)
			.andBe(() => {
				expect(emitted).to.eql(1);
				done();
			});
    });

    it('should be unpluggable be id', function(done) {
        var emitted = -1;
        var receiver = (x: number) => emitted = x;
        var emitter = electric.emitter.manual(0);
        var id = emitter.plugReceiver(receiver);
        expect(emitter)
			.to.emit(0)
			.then.after(() => emitter.unplugReceiver(id))
			.then.after(() => emitter.emit(1))
			.to.emit(1)
			.and.finish(() => {
				expect(emitted).to.equal(0);
				done();
			});
    });

    it('should be unpluggable be receiver itself', function(done) {
        var emitted = -1;
        var receiver = (x: number) => emitted = x;
        var emitter = electric.emitter.manual(0);
        emitter.plugReceiver(receiver);
        expect(emitter)
			.to.emit(0)
			.after(() => emitter.unplugReceiver(receiver))
			.after(() => emitter.emit(1))
			.to.emit(1)
			.and.finish(() => {
				expect(emitted).to.equal(0);
				done();
			});
    });

    it('should release resources when stabilized', function() {
        var emitter = electric.emitter.manual(0);
        var r = 0;
        emitter.setReleaseResources(() => r = 1);
        emitter.stabilize();
        expect(r).to.equal(1);
    });

    it('should throw at emit after stabilization', function() {
        var emitter = electric.emitter.manual(0);
        emitter.stabilize();
        expect(emitter.emit).to.throw(Error);
        expect(emitter.impulse).to.throw(Error);
    });

    it('should pass value to new receiver even after stabilization', function(done) {
        var emitter = electric.emitter.manual(2);
        emitter.stabilize();
        expect(emitter)
        	.to.emit(2)
        	.andBe(done);
    });
});

describe('emitters impulse', function() {
    it('should return to value before impulse', function(done) {
        var emitter = electric.emitter.manual(0);
        expect(emitter)
            .to.emit(0)
            .after(() => {
                emitter.impulse(1);
            })
            .to.emit(1)
            .to.emit(0)
            .andBe(done);
    });

	it('it should not go to new receivers', function(done) {
        var emitter = electric.emitter.manual(0);
        var r: string[] = [];
        expect(emitter)
			.to.emit(0)
			.after(() => emitter.impulse(1))
			.to.emit(1, 0)
			.after(() => emitter.plugReceiver((x: number) => r.push('b' + x)))
			.after(() => emitter.impulse(2))
			.to.emit(2, 0)
			.waitFor(
				() => expect(r).to.deep.equal(['b0', 'b2', 'b0'])
			)
			.andBe(done);
    });

    it('it should not go to new receivers 2', function(done) {
        var emitter = electric.emitter.manual(0);
        var r: string[] = [];
        emitter.plugReceiver((x: number) => r.push('a' + x));
        expect(emitter)
			.to.emit(0)
			.after(() => emitter.impulse(1))
			.to.emit(1)
			.to.emit(0)
			.after(() => emitter.plugReceiver((x: number) => r.push('b' + x)))
			.after(() => emitter.impulse(2))
			.to.emit(2)
			.to.emit(0)
			.waitFor(
				() => expect(r).to.deep.equal([
					'a0',
					'a1',
					'a0', 'b0',
				    'a2', 'b2',
				    'a0', 'b0'
				])
			)
			.andBe(done);
    });
});
