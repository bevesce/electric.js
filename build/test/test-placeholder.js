/// <reference path="../d/chai.d.ts" />
/// <reference path="../d/mocha.d.ts" />
var chai = require('chai');
var electricKettle = require('./electric-kettle');
electricKettle.pourAsync(chai);
var expect = chai.expect;
var electric = require('../src/electric');
var placeholder = require('../src/placeholder');
function double(x) {
    return x * 2;
}
describe('emitter placeholder', function () {
    it('should work after `is()`', function (done) {
        var p = placeholder();
        var m = electric.emitter.manual(0);
        p.is(m);
        var t = p.map(double);
        expect(t)
            .to.emit(0)
            .then.after(function () { return m.emit(1); })
            .to.emit(2)
            .then.after(function () { return m.emit(14); })
            .to.emit(28)
            .andBe(done);
    });
    it('should work before `is()`', function (done) {
        var p = placeholder();
        var m = electric.emitter.manual(0);
        var t = p.map(double);
        p.is(m);
        expect(t)
            .to.emit(0)
            .then.after(function () { return m.emit(1); })
            .to.emit(2)
            .then.after(function () { return m.emit(14); })
            .to.emit(28)
            .andBe(done);
    });
    it('should be composable', function (done) {
        var p = placeholder();
        var m = electric.emitter.manual(0);
        var t = p.map(double).map(double).filter(0, function (x) { return x > 16; });
        p.is(m);
        expect(t)
            .to.emit(0)
            .then.after(function () { return m.emit(1); })
            .then.after(function () { return m.emit(14); })
            .to.emit(56)
            .andBe(done);
    });
    it('should throw before `is()` when function should return something other than emitter', function () {
        var p = placeholder();
        expect(function () { return p.dirtyCurrentValue(); }).to.throw(Error);
    });
});
// describe('electric placeholder / recursion', function() {
//     it('should pass receivers to what it is', function() {
//         var placeholder = placeholder();
//         var emitter = electric.emitter.manual(0);
//         placeholder.is(emitter);
//         expect(placeholder).to.emit
//             .values(0)
//             .after(() => emitter.emit(1))
//             .values(1);
//     });
//     it('should pass receivers to what it is even if receiver was plugged before is', function() {
//         var placeholder = placeholder();
//         var emitter = electric.emitter.manual(0);
//         (<any>expect(placeholder)).to.emit
//             .after(() => {
//                 placeholder.is(emitter);
//                 emitter.emit(1);
//             })
//             .values(0, 1);
//     });
//     it('should have same transformator methods as Emitter', function() {
//         var placeholder = placeholder();
//         var emitter = electric.emitter.manual(1);
//         placeholder.is(emitter);
//         expect(placeholder.map((x: number) => x * 2)).to.emit
//             .values(2)
//             .after(() => emitter.emit(3))
//             .values(6);
//     });
//     it('should allow recursion', function() {
//         var mouseclick = electric.emitter.manual(undefined);
//         var animationBegins = placeholder();
//         var animating = electric.emitter.constant(false).change(
//             { to: electric.emitter.constant(true), when: animationBegins }
//         )
//         animationBegins.is(
//             electric.transformator.map(
//                 (a: any, c: any) => a ? undefined : c,
//                 animating,
//                 mouseclick
//             )
//         );
//         expect(animating).to.emit
//             .values(false)
//             .after(() => mouseclick.impulse(1))
//             .values(true);
//     });
//     it('should allow recursion with time transformation', function() {
//         var constant = electric.emitter.constant;
//         electric.scheduler.stop();
//         var mouseclick = electric.emitter.manual(undefined);
//         var animationBegins = placeholder();
//         var animationEnds = placeholder();
//         var animating = constant(false).change(
//             { to: constant(true), when: animationBegins },
//             { to: constant(false), when: animationEnds }
//         )
//         // semantics:
//         // animating =
//         //    true(t) for t in (tb_i, te_i) for every i in {0, 1, 2, ...}
//         //        where tb_i is that animationBegins(tb_i) is true
//         //        and te_i is that animationEnds(te_i) is true
//         //            and animationBegins(tx) is false for every tx from (tb_i, te_i)
//         //    false(t) otherwise
//         animationBegins.is(
//             electric.transformator.map(
//                 (a: any, c: any) => a ? undefined : c,
//                 animating,
//                 mouseclick
//             )
//         );
//         animationEnds.is(
//             animating
//                 .transformTime(undefined, (t: number) => t + 1)
//                 .map((v: any) => v ? true : undefined)
//         );
//         expect(animating).to.emit
//             .values(false)
//             .after(() => mouseclick.impulse(1))
//             .values(true)
//             .after(() => electric.scheduler.advance(2))
//             .values(false)
//             .after(() => mouseclick.impulse(1))
//             .values(true)
//             .after(() => electric.scheduler.advance(2))
//             .values(false)
//     });
//     it('should work with integrals', function() {
//         var c = electric.clock;
//         electric.scheduler.stop();
//         function a(t: number) {
//             return 10
//         };
//         // v = ∫ a - kv dt
//         var aT = electric.clock.fclock(a, { intervalInMs: 1 });
//         var vTs = placeholder();
//         var vT = electric.clock.integral(
//             electric.transformator.map(
//                 (a: electric.clock.ITimeValue, v: electric.clock.ITimeValue) => {
//                     if (!v){ return a; }
//                     return {
//                         value: a.value - 0.1 * v.value,
//                         time: a.time
//                     };
//                 },
//                 aT,
//                 vTs
//             )
//         );
//         var now = electric.scheduler.now();
//         vTs.is(vT.transformTime({ value: 0, time: now }, (t: number) => t + 1));
//         var r: electric.clock.ITimeValue[] = [];
//         vT.plugReceiver((x: electric.clock.ITimeValue) => r.push(x));
//         electric.scheduler.advance(5)
//         var expecteds = [
//             { time: now + 0, value: 0 },
//             { time: now + 1, value: 0.001 * (10) },
//             { time: now + 2, value: 0.001 * (20 - 10 * 0.1) },
//             { time: now + 3, value: 0.001 * (30 - 10 * 0.1 - 0.1 * (20 - 10 * 0.1)) },
//             { time: now + 4, value: 0.001 * (40 - 10 * 0.1 - 0.1 * (20 - 10 * 0.1) - 0.1 * (30 - 10 * 0.1 - 0.1 * (20 - 10 * 0.1))) }
//         ];
//         for (var i in expecteds) {
//             var expected = expecteds[i];
//             var given = r[i];
//         	expect(given.time).to.equal(expected.time);
//         	expect(given.value).to.be.within(expected.value - 0.01, expected.value + 0.01);
//         }
//     });
// }); 
