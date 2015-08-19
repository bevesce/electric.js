var chai = require("chai");
var electricKettle = require('./electric-kettle');
electricKettle.pour(chai);
var expect = chai.expect;
var electric = require("../src/electric");
describe('electric generic transformator', function () {
    it('should be exported', function () {
        expect(electric.transformator.generic).to.not.be.undefined;
    });
    it('should pass values from emitters to receivers by default', function () {
        var emitter1 = electric.emitter.manual(0);
        var emitter2 = electric.emitter.manual(0);
        var transformator = electric.transformator.generic([emitter1, emitter2]);
        expect(2).receivers.ofA(transformator)
            .to.receive(2).when.emitted(2).from(emitter1)
            .to.receive(3).when.emitted(3).from(emitter2);
    });
    it('should pass transformed values from emitters to receivers', function () {
        var emitter1 = electric.emitter.manual(0);
        var emitter2 = electric.emitter.manual(0);
        var toTransform = [];
        var emittersSequence = [];
        var transformator = electric.transformator.generic([emitter1, emitter2], function (emit) {
            return function (v, i) {
                toTransform.push(v.slice());
                emittersSequence.push(i);
                emit(2 * v[i]);
            };
        });
        expect(2).receivers.ofA(transformator)
            .to.receive(2).when.emitted(1).from(emitter1)
            .to.receive(4).when.emitted(2).from(emitter1)
            .to.receive(6).when.emitted(3).from(emitter2);
        expect(emittersSequence).to.deep.equal([0, 1, 0, 0, 1]);
        expect(toTransform).to.deep.equal([[0,], [0, 0], [1, 0], [2, 0], [2, 3]]);
    });
});
describe('electric map transformator', function () {
    it('should map values from multiple emitters', function () {
        var emitter1 = electric.emitter.manual(0);
        var emitter2 = electric.emitter.manual(0);
        var transformator = electric.transformator.map(function (x, y) {
            if (x && y) {
                return x + y;
            }
            return x || y;
        }, emitter1, emitter2);
        expect(2).receivers.ofA(transformator)
            .to.receive(1).when.emitted(1).from(emitter1)
            .to.receive(3).when.emitted(2).from(emitter2)
            .to.receive(4).when.emitted(3).from(emitter2);
    });
    it('should map values from single emitter', function () {
        var emitter = electric.emitter.manual(0);
        var mappedEmitter = emitter.map(function (x) { return 2 * x; });
        expect(2).receivers.ofA(mappedEmitter)
            .to.receive(2).when.emitted(1).from(emitter)
            .to.receive(4).when.emitted(2).from(emitter)
            .to.receive(6).when.emitted(3).from(emitter);
    });
    it('should have initial value', function () {
        var emitter1 = electric.emitter.manual(0);
        var emitter2 = electric.emitter.manual(0);
        r = [];
        var transformator = electric.transformator.map(function (x, y) { return ({ x: x, y: y }); }, emitter1, emitter2);
        expect(transformator).to.emit.values({ x: 0, y: 0 });
    });
});
describe('electric filter transformator', function () {
    it('should filter values from multiple emitters', function () {
        var emitter1 = electric.emitter.manual(0);
        var emitter2 = electric.emitter.manual(0);
        var filteredEmitter = electric.transformator.filter(0, function (x) { return x > 2; }, emitter1, emitter2);
        expect(2).receivers.ofA(filteredEmitter)
            .to.receive(3).when.emitted(3).from(emitter1)
            .to.receive(4).when.emitted(4).from(emitter2)
            .to.not.receive(1).when.emitted(1).from(emitter2)
            .to.not.receive(2).when.emitted(2).from(emitter1);
    });
    it('should filter values from single emitter', function () {
        var emitter = electric.emitter.manual(0);
        var filteredEmitter = emitter.filter(2, function (x) { return x > 2; });
        expect(2).receivers.ofA(filteredEmitter)
            .to.receive(3).when.emitted(3).from(emitter)
            .to.receive(4).when.emitted(4).from(emitter)
            .to.not.receive(1).when.emitted(1).from(emitter)
            .to.not.receive(2).when.emitted(2).from(emitter);
    });
    it('should have initial value', function () {
        var emitter = electric.emitter.manual(0);
        var filteredEmitter = emitter.filter(2, function (x) { return x > 2; });
        expect(filteredEmitter).to.emit.values(2);
    });
});
describe('electric merge transformator', function () {
    it('should merge values from multiple emitters', function () {
        var emitter1 = electric.emitter.manual(0);
        var emitter2 = electric.emitter.manual(0);
        var mergedEmitter = electric.transformator.merge(emitter1, emitter2);
        expect(2).receivers.ofA(mergedEmitter)
            .to.receive(3).when.emitted(3).from(emitter1)
            .to.receive(4).when.emitted(4).from(emitter2)
            .to.receive(1).when.emitted(1).from(emitter2)
            .to.receive(2).when.emitted(2).from(emitter1);
    });
    it('should merge as method', function () {
        var emitter1 = electric.emitter.manual(0);
        var emitter2 = electric.emitter.manual(0);
        var emitter3 = electric.emitter.manual(0);
        var mergedEmitter = emitter1.merge(emitter2, emitter3);
        expect(2).receivers.ofA(mergedEmitter)
            .to.receive(3).when.emitted(3).from(emitter1)
            .to.receive(4).when.emitted(4).from(emitter2)
            .to.receive(1).when.emitted(1).from(emitter2)
            .to.receive(2).when.emitted(2).from(emitter3);
    });
    it('should have initial value', function () {
        var emitter1 = electric.emitter.manual(0);
        var emitter2 = electric.emitter.manual(1);
        var mergedEmitter = electric.transformator.merge(emitter1, emitter2);
        expect(mergedEmitter).to.emit.values(1);
    });
});
describe('electric accumulate transformator', function () {
    it('should accumulate values from multiple emitters', function () {
        var emitter1 = electric.emitter.manual(0);
        var emitter2 = electric.emitter.manual(0);
        var accumulatedEmitter = electric.transformator.accumulate(1, function (acc, v) { return acc + v || acc || v; }, emitter1, emitter2);
        expect(2).receivers.ofA(accumulatedEmitter)
            .to.receive(4).when.emitted(3).from(emitter1)
            .to.receive(8).when.emitted(4).from(emitter2)
            .to.receive(9).when.emitted(1).from(emitter2)
            .to.receive(11).when.emitted(2).from(emitter1);
    });
    it('should accumulate values from single emitter', function () {
        var emitter = electric.emitter.manual(0);
        var accumulatedEmitter = emitter.accumulate(1, function (acc, v) { return acc + v || acc || v; });
        expect(2).receivers.ofA(accumulatedEmitter)
            .to.receive(4).when.emitted(3).from(emitter)
            .to.receive(8).when.emitted(4).from(emitter)
            .to.receive(9).when.emitted(1).from(emitter)
            .to.receive(11).when.emitted(2).from(emitter);
    });
    it('should have initial value', function () {
        var emitter1 = electric.emitter.manual(0);
        var emitter2 = electric.emitter.manual(0);
        var accumulatedEmitter = electric.transformator.accumulate(1, function (acc, v) { return acc + v || acc || v; }, emitter1, emitter2);
        expect(accumulatedEmitter).to.emit.values(1);
    });
});
describe('electric flatten transformator', function () {
    it('should re-emitt values from emitted emitters...', function () {
        var emitter = electric.emitter.manual(electric.emitter.constant(0));
        var emittedEmitter1 = electric.emitter.manual(0);
        var emittedEmitter2 = electric.emitter.manual(0);
        var flattenedEmitter = electric.transformator.flatten(emitter);
        emitter.emit(emittedEmitter1);
        emitter.emit(emittedEmitter2);
        expect(2).receivers.ofA(flattenedEmitter)
            .to.receive(1).when.emitted(1).from(emittedEmitter1)
            .to.receive(2).when.emitted(2).from(emittedEmitter2);
    });
    it('should re-emitt values from emitted emitters from multiple amitters...', function () {
        var emitter1 = electric.emitter.manual(electric.emitter.constant(0));
        var emitter2 = electric.emitter.manual(electric.emitter.constant(0));
        var emittedEmitter1 = electric.emitter.manual(0);
        var emittedEmitter2 = electric.emitter.manual(0);
        var flattenedEmitter = electric.transformator.flatten(emitter1, emitter2);
        emitter1.emit(emittedEmitter1);
        emitter2.emit(emittedEmitter2);
        expect(2).receivers.ofA(flattenedEmitter)
            .to.receive(1).when.emitted(1).from(emittedEmitter1)
            .to.receive(2).when.emitted(2).from(emittedEmitter2);
    });
    it('should re-emitt values from emitted emitters as method', function () {
        var emitter = electric.emitter.manual(electric.emitter.constant(0));
        var emittedEmitter1 = electric.emitter.manual(0);
        var emittedEmitter2 = electric.emitter.manual(0);
        var flattenedEmitter = emitter.flatten();
        emitter.emit(emittedEmitter1);
        emitter.emit(emittedEmitter2);
        expect(2).receivers.ofA(flattenedEmitter)
            .to.receive(1).when.emitted(1).from(emittedEmitter1)
            .to.receive(2).when.emitted(2).from(emittedEmitter2);
    });
    it('should have initial value', function () {
        var emitter = electric.emitter.manual(electric.emitter.constant(2));
        var emittedEmitter1 = electric.emitter.manual(0);
        var emittedEmitter2 = electric.emitter.manual(0);
        var flattenedEmitter = electric.transformator.flatten(emitter);
        expect(flattenedEmitter).to.emit.values(2);
    });
});
describe('electric sampler transformator', function () {
    it('should sample single emitter by many sampler', function () {
        var emitter = electric.emitter.manual(0);
        var sampler1 = electric.emitter.manual(0);
        var sampler2 = electric.emitter.manual(0);
        var samplingTransformator = electric.transformator.sample(emitter, sampler1, sampler2);
        expect(samplingTransformator).to.emit
            .values(0)
            .then.after(function () {
            sampler1.impulse(1);
            sampler2.impulse(2);
        })
            .values()
            .then.after(function () {
            emitter.emit(1);
        })
            .values()
            .then.after(function () {
            sampler1.impulse(1);
        })
            .values(1)
            .then.after(function () {
            emitter.emit(2);
        })
            .values()
            .then.after(function () {
            sampler2.impulse(2);
        })
            .values(2);
    });
    it('should have initial value', function () {
        var emitter = electric.emitter.manual(1);
        var sampler1 = electric.emitter.manual(0);
        var sampler2 = electric.emitter.manual(0);
        var samplingTransformator = electric.transformator.sample(emitter, sampler1, sampler2);
        expect(samplingTransformator).to.emit.values(1);
    });
});
describe('electric throttle transformator', function () {
    it('should throttle emitted values an group them into list', function () {
        electric.scheduler.stop();
        var emitter = electric.emitter.manual(0);
        var throttleTransformator = electric.transformator.throttle(1, emitter);
        var results = [];
        throttleTransformator.plugReceiver(function (x) {
            results.push(x.slice());
        });
        electric.scheduler.advance(0);
        emitter.emit(1);
        emitter.emit(2);
        expect(results).to.deep.equal([[]]);
        electric.scheduler.advance(2);
        expect(results).to.deep.equal([[], [0, 1, 2]]);
        electric.scheduler.advance(1);
        electric.scheduler.advance(1);
        expect(results).to.deep.equal([[], [0, 1, 2]]);
        emitter.emit(3);
        electric.scheduler.advance(2);
        expect(results).to.deep.equal([[], [0, 1, 2], [3]]);
    });
    it('should have initial value', function () {
        electric.scheduler.stop();
        var emitter = electric.emitter.manual(0);
        var throttleTransformator = electric.transformator.throttle(1, emitter);
        expect(throttleTransformator).to.emit.values([]);
    });
});
// describe('electric dropRepeates transformator', function() {
//     it('should not emit repeated values', function() {
//         var emitter = electric.emitter.manual(0);
//         var droppingTransformator = electric.transformator.dropRepeats(emitter);
//         var r: number = 0;
//         droppingTransformator.plugReceiver(function(x) {
//             r += x;
//         });
//         expect(r).to.equal(0);
//         emitter.emit(1);
//         expect(r).to.equal(1);
//         emitter.emit(1);
//         expect(r).to.equal(1);
//         emitter.emit(2);
//         expect(r).to.equal(3);
//         emitter.emit(2);
//         expect(r).to.equal(3);
//         emitter.emit(1);
//         expect(r).to.equal(4);
//     });
// });
describe('changes transformator', function () {
    it('should pass previos and current value on change', function () {
        var emitter = electric.emitter.manual(0);
        var r = [];
        emitter.changes().plugReceiver(function (x) { return r.push(x); });
        emitter.emit(1);
        emitter.emit(1);
        expect(r).to.deep.equal([
            { previous: undefined, current: 0 },
            { previous: 0, current: 1 }
        ]);
    });
    it('should have initial value', function () {
        var emitter = electric.emitter.manual(0);
        expect(emitter.changes()).to.emit.values({ previous: undefined, current: 0 });
    });
});
describe('change to when', function () {
    it('should work on emitters', function () {
        var emitter1 = electric.emitter.manual('1-0');
        var emitter2 = electric.emitter.manual(undefined);
        var emitter3 = electric.emitter.manual('3-0');
        var emitter4 = electric.emitter.manual('4-0');
        var done = false;
        var switcher = emitter1.change({
            to: function (x, y) {
                if (!done) {
                    done = true;
                    return emitter3;
                }
                return emitter4;
            },
            when: emitter2
        });
        expect(switcher).to.emit.after(function () {
            emitter1.emit('1-1');
            emitter2.impulse(2);
            emitter1.emit('1-2');
            emitter1.emit('1-3');
            emitter3.emit('3-1');
            emitter3.emit('3-2');
            emitter2.impulse(2);
            emitter3.emit('3-3');
            emitter3.emit('3-4');
            emitter4.emit('4-1');
        }).values('1-0', '1-1', '3-0', '3-1', '3-2', '4-0', '4-1');
    });
    it('should emit from initial emitter before when', function () {
        var emmiter = electric.emitter.manual(undefined);
        var r;
        electric.emitter.constant(1).change({
            to: function (x, y) { return electric.emitter.constant(2); },
            when: emmiter
        }).plugReceiver(function (x) { return r = x; });
        expect(r).to.equal(1);
    });
    it('should change to resulting emitter after when', function () {
        it('should emit from initial emitter before when', function () {
            var emmiter = electric.emitter.manual(undefined);
            var r;
            electric.emitter.constant(1).change({
                to: function (x, y) { return electric.emitter.constant(2); },
                when: emmiter
            }).plugReceiver(function (x) { return r = x; });
            expect(r).to.equal(1);
            emmiter.emit(1);
            expect(r).to.equal(2);
        });
    });
    it('should ignore changes from first emitter after when', function () {
        it('should emit from initial emitter before when', function () {
            var emmiter0 = electric.emitter.manual(0);
            var emmiter1 = electric.emitter.manual(undefined);
            var r;
            emmiter0.change({
                when: emmiter1,
                to: function (x, y) { return electric.emitter.constant(2); }
            }).plugReceiver(function (x) { return r = x; });
            expect(r).to.equal(0);
            emmiter1.emit(1);
            expect(r).to.equal(2);
            emmiter0.emit(13);
            expect(r).to.equal(2);
        });
    });
    it('should do something when composed with itself', function () {
        var emmiter0 = electric.emitter.manual(undefined);
        var emmiter1 = electric.emitter.manual(undefined);
        var emmiter2 = electric.emitter.manual(undefined);
        expect(electric.emitter.constant('_').change({
            to: function (x, y) { return electric.emitter.constant('a' + y); },
            when: emmiter0
        }).change({
            to: function (x, y) { return electric.emitter.constant('b' + y); },
            when: emmiter1
        })).to.emit.after(function () {
            emmiter0.emit(1);
            emmiter0.emit(2);
            emmiter1.emit(3);
            emmiter1.emit(4);
            emmiter1.emit(5);
            emmiter0.emit(6);
            emmiter0.emit(7);
        }).values('_', 'a1', 'a2', 'b3', 'b4', 'b5');
    });
    it('should work on multiple switchers', function () {
        var emitter2 = electric.emitter.manual(undefined);
        var emitter3 = electric.emitter.manual(undefined);
        var emitter4 = electric.emitter.manual(undefined);
        var constant = electric.emitter.constant;
        expect(constant(1).change({ to: function () { return constant(2); }, when: emitter2 }, { to: function () { return constant(3); }, when: emitter3 }, { to: function () { return constant(4); }, when: emitter4 })).to.emit.after(function () {
            emitter2.impulse(null);
            emitter3.impulse(null);
            emitter4.impulse(null);
            emitter2.impulse(null);
            emitter4.impulse(null);
        }).values(1, 2, 3, 4, 2, 4);
    });
    it('should have initial value', function () {
        var emitter1 = electric.emitter.manual('1-0');
        var emitter2 = electric.emitter.manual(undefined);
        var done = false;
        var switcher = emitter1.change({
            to: function (x, y) {
                emitter2;
            },
            when: emitter2
        });
        expect(switcher).to.emit.values('1-0');
    });
    it('should work when "to" is an emitter, not a function', function () {
        var m = electric.emitter.manual(undefined);
        var t = electric.emitter.manual(2);
        var s = electric.emitter.constant(1).change({ to: t, when: m });
        expect(s).to.emit
            .values(1)
            .after(function () { return m.impulse(null); })
            .values(2)
            .after(function () { return t.emit(3); })
            .values(3);
    });
    it('should work when "to" is the same emitter as "when', function () {
        var m = electric.emitter.manual(undefined);
        var s = electric.emitter.constant(1).change({ to: function () { return m; }, when: m });
        expect(s).to.emit
            .values(1)
            .after(function () { return m.impulse(0); })
            .after(function () { return m.emit(3); })
            .after(function () { return m.emit(4); })
            .values(undefined, 3, 4);
        // semantics
        // f.change({to: g, when: h})(t)
        // = f(t) if t <= tx where tx: h(tx) is true and ty < tx where h(ty) is false
        // = g(f(ts), h(ts))(t) where ts: h(ts) is true and t > ts and h(tx) if false where tx: ts < tx < t
        // so s doesnt see 0 (from impulse(0)) because its time is ts, so t > ts is not met
    });
});
