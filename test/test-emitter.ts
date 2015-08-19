import chai = require("chai");
import electricKettle = require('./electric-kettle');
electricKettle.pour(chai);
var expect = chai.expect;
import electric = require("../src/electric");
import ui = require('../src/emitters/ui');
import emitterFromPromise = require('../src/emitters/fromPromise');


describe('electric emitter', function() {
    var emitted: number;
    function receiver(x: number) {
        emitted = x;
    }

    it('should be pluggable', function() {
        var emitter = electric.emitter.manual(0);
        emitter.plugReceiver(receiver);
        emitter.emit(1);
        expect(emitted).to.equal(1);
    });
    it('should be unpluggable be id', function() {
        var emitter = electric.emitter.manual(0);
        var id = emitter.plugReceiver(receiver);
        emitter.unplugReceiver(id);
        emitter.emit(1);
        expect(emitted).to.equal(0);
    });
    it('should be unpluggable be receiver itself', function() {
        var emitter = electric.emitter.manual(0);
        emitter.plugReceiver(receiver);
        emitter.unplugReceiver(receiver);
        emitter.emit(1);
        expect(emitted).to.equal(0);
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
    it('should pass value to new receiver even after stabilization', function() {
        var emitter = electric.emitter.manual(2);
        emitter.stabilize();
        (<any>expect(emitter)).to.emit.values(2);
    });
});

describe('electric placeholder / recursion', function() {
    it('should pass receivers to what it is', function() {
        var placeholder = electric.emitter.placeholder();
        var emitter = electric.emitter.manual(0);
        placeholder.is(emitter);
        (<any>expect(placeholder)).to.emit
            .values(0)
            .after(() => emitter.emit(1))
            .values(1);
    });
    it('should pass receivers to what it is even if receiver was plugged before is', function() {
        var placeholder = electric.emitter.placeholder();
        var emitter = electric.emitter.manual(0);
        (<any>expect(placeholder)).to.emit
            .after(() => {
                placeholder.is(emitter);
                emitter.emit(1);
            })
            .values(0, 1);
    });
    it('should have same transformator methods as Emitter', function() {
        var placeholder = electric.emitter.placeholder();
        var emitter = electric.emitter.manual(1);
        placeholder.is(emitter);
        (<any>expect(placeholder.map((x: number) => x * 2))).to.emit
            .values(2)
            .after(() => emitter.emit(3))
            .values(6);
    });
    it('should allow recursion', function() {
        var mouseclick = electric.emitter.manual(undefined);
        var animationBegins = electric.emitter.placeholder();
        var animating = electric.emitter.constant(false).change(
            { to: electric.emitter.constant(true), when: animationBegins }
        )
        animationBegins.is(
            electric.transformator.map(
                (a: any, c: any) => a ? undefined : c,
                animating,
                mouseclick
            )
        );
        (<any>expect(animating)).to.emit
            .values(false)
            .after(() => mouseclick.impulse(1))
            .values(true);
    });
    it('should allow recursion with time transformation', function() {
        var constant = electric.emitter.constant;
        electric.scheduler.stop();
        var mouseclick = electric.emitter.manual(undefined);
        var animationBegins = electric.emitter.placeholder();
        var animationEnds = electric.emitter.placeholder();

        var animating = constant(false).change(
            { to: constant(true), when: animationBegins },
            { to: constant(false), when: animationEnds }
        )
        // semantics:
        // animating =
        //    true(t) for t in (tb_i, te_i) for every i in {0, 1, 2, ...}
        //        where tb_i is that animationBegins(tb_i) is true
        //        and te_i is that animationEnds(te_i) is true
        //            and animationBegins(tx) is false for every tx from (tb_i, te_i)
        //    false(t) otherwise

        animationBegins.is(
            electric.transformator.map(
                (a: any, c: any) => a ? undefined : c,
                animating,
                mouseclick
            )
        );
        animationEnds.is(
            animating
                .transformTime(undefined, (t: number) => t + 1)
                .map((v: any) => v ? true : undefined)
        );
        (<any>expect(animating)).to.emit
            .values(false)
            .after(() => mouseclick.impulse(1))
            .values(true)
            .after(() => electric.scheduler.advance(2))
            .values(false)
            .after(() => mouseclick.impulse(1))
            .values(true)
            .after(() => electric.scheduler.advance(2))
            .values(false)
    });
    it('should work with integrals', function() {
        var c = electric.clock;
        electric.scheduler.stop();
        function a(t: number) {
            return 10
        };
        // v = ∫ a - kv dt
        var aT = electric.clock.fclock(a, { intervalInMs: 1 });
        var vTs = electric.emitter.placeholder();
        var vT = electric.clock.integral(
            electric.transformator.map(
                (a: electric.clock.ITimeValue, v: electric.clock.ITimeValue) => {
                    if (!v){ return a; }
                    return {
                        value: a.value - 0.1 * v.value,
                        time: a.time
                    };
                },
                aT,
                vTs
            )
        );
        var now = electric.scheduler.now();
        vTs.is(vT.transformTime({ value: 0, time: now }, (t: number) => t + 1));
        var r: electric.clock.ITimeValue[] = [];
        vT.plugReceiver((x: electric.clock.ITimeValue) => r.push(x));
        electric.scheduler.advance(5)
        var expecteds = [
            { time: now + 0, value: 0 },
            { time: now + 1, value: 0.001 * (10) },
            { time: now + 2, value: 0.001 * (20 - 10 * 0.1) },
            { time: now + 3, value: 0.001 * (30 - 10 * 0.1 - 0.1 * (20 - 10 * 0.1)) },
            { time: now + 4, value: 0.001 * (40 - 10 * 0.1 - 0.1 * (20 - 10 * 0.1) - 0.1 * (30 - 10 * 0.1 - 0.1 * (20 - 10 * 0.1))) }
        ];

        for (var i in expecteds) {
            var expected = expecteds[i];
            var given = r[i];
        	expect(given.time).to.equal(expected.time);
        	expect(given.value).to.be.within(expected.value - 0.01, expected.value + 0.01);
        }
    });
});

describe('electric manual emitter', function() {
    it('should be exported', function() {
        expect(electric.emitter.manual).to.not.be.undefined;
    });
    it('should pass values to receivers', function() {
        var emitter = electric.emitter.manual(0);
        (<any>expect(2)).receivers.ofA(emitter)
            .to.receive(2).when.emitted(2).from(emitter)
            .to.receive(3).when.emitted(3).from(emitter);
    });
    it('should provide current value on pluggin', function() {
        var emitter = electric.emitter.manual(13);
        var r: number;
        emitter.plugReceiver((x: number) => r = x);
        expect(r).to.equal(13);
        var r2: number;
        emitter.emit(2);
        emitter.plugReceiver((x: number) => r2 = x);
        expect(r).to.equal(2);
        expect(r2).to.equal(2);
    });
    it('should be pluggable by receivers', function() {
        var r: number;
        var i: number;
        var emitter = electric.emitter.manual(13);
        var receiver: any = electric.receiver.hanging();
        receiver.receiveOn = function(x: number, y: number){
            r = x;
            i = y;
        }
        emitter.plugReceiver(receiver)
        expect(r).to.equal(13);
        expect(i).to.equal(0);
        emitter.emit(14);
        expect(r).to.equal(14);
        expect(i).to.equal(0);
    });
});


describe('emitters impulse', function() {
    it('should return to value before impulse', function() {
        var emitter = electric.emitter.manual(0);
        (<any>expect(emitter)).to.emit
            .values(0)
            .after(() => {
                emitter.impulse(1);
            })
            .values(1, 0);
    });
    it('it should not go to new receivers', function() {
        var emitter = electric.emitter.manual(0);
        var r: string[] = [];
        emitter.plugReceiver((x: number) => r.push('a' + x));
        emitter.impulse(1);
        emitter.plugReceiver((x: number) => r.push('b' + x));
        emitter.impulse(2);
        expect(r).to.deep.equal([
            'a0', 'a1', 'a0', 'b0', 'a2', 'b2', 'a0', 'b0'
        ]);
    })
});
