/// <reference path="../d/chai.d.ts" />
/// <reference path="../d/mocha.d.ts" />
import chai = require("chai");
import electricKettle = require('./electric-kettle');
electricKettle.pourAsync(chai);
var expect = chai.expect;
import electric = require("../src/electric");
// import ui = require('../src/emitters/ui');
import emitterFromPromise = require('../src/emitters/fromPromise');
import eevent = require('../src/electric-event');
import inf = require('../src/interfaces');


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



function double(x: number) {
    return x * 2;
};

function doubleIfOver2(x: number) {
    if (x > 2) {
        return x * 2
    }
};

describe('emitter', function() {
    it('should be pluggable', function() {
        var emitter = electric.emitter.emitter(0);
        emitter.plugReceiver(double);
    });

    it('should emit initial value asynchronously', function(done) {
        var emitter = electric.emitter.emitter(0);
        expect(
            electric.receiver.collect(emitter)
            ).to.deep.equal([]);
        // it's emty bacause value will be emitted after
        // current event in event loop is processed
        expect(emitter)
            .to.emit(0)
            .andBe(done)
    });

    it('should emit values synchronously', function() {
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

    it('should impulse values synchronously', function() {
        var emitter = electric.emitter.emitter(0);
        var collected = electric.receiver.collect(emitter);
        emitter.impulse(1);
        emitter.impulse(2);
        expect(collected).to.eql([1, 0, 2, 0]);
    });

    it('should be unpluggable', function() {
        var emitter = electric.emitter.emitter(0);
        var emitted = 0;
        var disposable = emitter.plugReceiver(
            (x: number) => emitted = x
            );
        emitter.emit(1);
        expect(emitted).to.equal(1);
        emitter.unplugReceiver(disposable);
        emitter.emit(2);
        expect(emitted).to.equal(1);
    });

    it('should release resources when stabilized', function() {
        var emitter = electric.emitter.manual(0);
        var released = false;
        emitter.setReleaseResources(() => released = true);
        emitter.stabilize();
        expect(released).to.be.true;
    });

    it('should throw at emit after stabilization', function() {
        var emitter = electric.emitter.manual(0);
        emitter.stabilize();
        expect(emitter.emit).to.throw(Error);
        expect(emitter.impulse).to.throw(Error);
    });

    it('should pass value to new receiver even after stabilization', function(done) {
        var emitter = electric.emitter.manual(0);
        emitter.stabilize();
        expect(emitter)
            .to.emit(0)
            .andBe(done);
    });

    it('should be mappable', function(done) {
        var emitter = electric.emitter.manual(0);
        var mapped = emitter.map(x => 2 * x);
        expect(mapped)
            .to.emit(0)
            .then.after(() => emitter.emit(1))
            .to.emit(2)
            .then.after(() => emitter.emit(13))
            .to.emit(26)
            .andBe(done);
    });

    it('should be filterable', function(done) {
        var emitter = electric.emitter.manual(0);
        var filtered = emitter.filter(2, x => x > 2);
        expect(filtered)
            .to.emit(2)
            .then.after(() => emitter.emit(1))
            .then.after(() => emitter.emit(3))
            .to.emit(3)
            .then.after(() => emitter.emit(1))
            .andBe(done);
    });

    it('should be filterMappable', function(done) {
        var emitter = electric.emitter.manual(0);
        var filterMapped = emitter.filterMap(
            2, doubleIfOver2
            );
        expect(filterMapped)
            .to.emit(2)
            .then.after(() => emitter.emit(1))
            .then.after(() => emitter.emit(3))
            .to.emit(6)
            .then.after(() => emitter.emit(1))
            .andBe(done);
    });

    it('should be timeTransformable', function(done) {
        var emitter = electric.emitter.manual(0);
        var shifted = emitter.transformTime(-1, x => x + 5);
        expect(shifted)
            .to.emit(-1)
            .to.emit(0)
            .then.after(() => emitter.emit(1))
            .to.emit(1)
            .andBe(done);
    });

    it('should be sampleable', function(done) {
        var emitter = electric.emitter.manual(0);
        var sampler = electric.emitter.manual(eevent.notHappend);
        var sampled = emitter.sample(-1, sampler);
        expect(sampled)
            .to.emit(-1)
            .then.after(() => sampler.impulse(eevent.of(true)))
            .to.emit(0)
            .then.after(() => emitter.emit(1))
            .then.after(() => sampler.impulse(eevent.of(true)))
            .to.emit(1)
            .andBe(done);
    });

    it('should be changeable', function(done) {
        var emitter0 = electric.emitter.constant('0a');
        var emitter1 = electric.emitter.manual('1a');
        var event1 = electric.emitter.manual(eevent.notHappend);
        var event2 = electric.emitter.emitter(<eevent<number>>eevent.notHappend);
        var changing = emitter0.change(
            { to: emitter1, when: event1 },
            {
                to: (x: string, s: number) => electric.emitter.constant('2a<' + s + '><' + x + '>'),
                when: event2
            }
            );
        expect(changing)
            .to.emit('0a')
            .then.after(() => event1.impulse(eevent.of(1)))
            .to.emit('1a')
            .then.after(() => emitter1.emit('1b'))
            .to.emit('1b')
            .then.after(() => emitter1.emit('1c'))
            .to.emit('1c')
            .then.after(() => event2.impulse(eevent.of(13)))
            .to.emit('2a<13><1c>')
            .andBe(done);
    });

    it('should be acumulateable', function(done) {
        var emitter = electric.emitter.manual(0);
        var acuumulated = emitter.accumulate([], (acc, x) => acc.concat(x));
        expect(acuumulated)
            .to.emit([0])
            .then.after(() => emitter.emit(1))
            .to.emit([0, 1])
            .then.after(() => emitter.emit(1))
            .and.after(() => emitter.emit(2))
            .to.emit([0, 1, 2])
            .andBe(done)
    });

    it('should be mergeable', function(done) {
        // value of emitter1 is initial value
        // of merged
        var emitter1 = electric.emitter.manual('1a');
        var emitter2 = electric.emitter.manual('2a');
        var merged = emitter1.merge(emitter2);
        expect(merged)
            .to.emit('1a')
            .then.after(() => emitter2.emit('2b'))
            .to.emit('2b')
            .then.after(() => emitter1.emit('1a'))
        // value of emitter1 doesn't change
        // so it's not emitted in merged
            .and.after(() => emitter1.emit('1c'))
            .to.emit('1c')
            .andBe(done);
    });

    it('should be whenable', function(done) {
        var emitter = electric.emitter.manual(0);
        var whened = emitter.when({
            happens: x => x > 2,
            then: x => x + '!'
        });
        expect(whened)
            .to.emit(eevent.notHappend)
            .then.after(() => emitter.emit(1))
            .then.after(() => emitter.emit(3))
            .to.emit(eevent.of('3!'))
            .to.emit(eevent.notHappend)
            .then.after(() => emitter.emit(1))
            .and.after(() => emitter.emit(4))
            .to.emit(eevent.of('4!'))
            .to.emit(eevent.notHappend)
            .andBe(done);
    });
});

describe('emitters recursion', function() {
    it('should work...', function(done) {
        var constant = electric.emitter.constant;
        var emitter1 = electric.emitter.manual(eevent.notHappend);
        var emitter2 = electric.emitter.manual(eevent.notHappend);

        function color(): inf.IEmitter<string> {
            return constant('red').change({
                to: () => constant('blue'), when: emitter1
            }).change({
                to: () => color(), when: emitter2
            });
        };

        var r: string[] = [];
        expect(color())
            .to.emit('red')
            .then.after(() => emitter1.impulse(eevent.of(null)))
            .to.emit('blue')
            .andBe(done);
    });
});

describe('manual event emitter', function() {
    it('should be created with notHappend as initial value', function(done) {
        var e = electric.emitter.manualEvent();
        expect(e)
            .to.emit(eevent.notHappend)
            .andBe(done);
    });

    it('should throw on manual emit', function() {
        var e = electric.emitter.manualEvent();
        expect(() => (<any>e).emit(null)).to.throw(Error);
    });

    it('should impulse values packed in ElectricEvent', function(done) {
        var e = electric.emitter.manualEvent();
        expect(e)
            .to.emit(eevent.notHappend)
            .then.after(() => e.impulse(1))
            .to.emit(eevent.of(1), eevent.notHappend)
            .then.after(() => e.impulse(1))
            .to.emit(eevent.of(1), eevent.notHappend)
            .then.after(() => e.impulse(2))
            .to.emit(eevent.of(2), eevent.notHappend)
            .andBe(done);

    });
});