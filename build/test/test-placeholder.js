/// <reference path="../d/chai.d.ts" />
/// <reference path="../d/mocha.d.ts" />
var chai = require('chai');
var electricKettle = require('./electric-kettle');
electricKettle.pourAsync(chai);
var expect = chai.expect;
var electric = require('../src/electric');
var eevent = require('../src/electric-event');
var placeholder = require('../src/placeholder');
var clock = require('../src/clock');
var transformator = require('../src/transformator');
function double(x) {
    return x * 2;
}
describe('emitter placeholder', function () {
    it('should pass receivers to what it is', function (done) {
        var p = placeholder();
        var emitter = electric.emitter.manual(0);
        p.is(emitter);
        expect(p)
            .to.emit(0)
            .after(function () { return emitter.emit(1); })
            .to.emit(1)
            .andBe(done);
    });
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
describe('placeholder in recursion', function () {
    it('should pass receivers to what it is even if receiver was plugged before is', function (done) {
        var p = placeholder(0);
        var emitter = electric.emitter.manual(0);
        var m = p.map(function (x) { return x; });
        p.is(emitter);
        expect(m)
            .after(function () {
            emitter.emit(1);
        })
            .to.emit(0, 1)
            .andBe(done);
    });
    it('should have same transformator methods as Emitter', function (done) {
        var p = placeholder();
        var emitter = electric.emitter.manual(1);
        p.is(emitter);
        expect(p.map(function (x) { return x * 2; }))
            .to.emit(2)
            .after(function () { return emitter.emit(3); })
            .to.emit(6)
            .andBe(done);
    });
    it('should allow recursion', function (done) {
        var mouseclick = electric.emitter.manual(eevent.notHappend);
        var animationBegins = placeholder(eevent.notHappend);
        var animating = electric.emitter.constant(false).change({ to: electric.emitter.constant(true), when: animationBegins });
        animationBegins.is(transformator.map(function (a, c) { return a ? eevent.notHappend : c; }, animating, mouseclick));
        expect(animating)
            .to.emit(false)
            .after(function () { return mouseclick.impulse(eevent.of(null)); })
            .to.emit(true)
            .andBe(done);
    });
    it('should allow recursion with time transformation', function (done) {
        var constant = electric.emitter.constant;
        var mouseclick = electric.emitter.manual(eevent.notHappend);
        var animationBegins = placeholder(eevent.notHappend);
        var animationEnds = placeholder(eevent.notHappend);
        // start animationg on animationBegins
        // and end on animationEnds (1ms after start)
        // BUT! don't allow another start before end
        var animating = constant(false).change({ to: constant(true), when: animationBegins }, { to: constant(false), when: animationEnds });
        // semantics:
        // animating =
        //    true(t) for t in (tb_i, te_i) for every i in {0, 1, 2, ...}
        //        where tb_i is that animationBegins(tb_i) is true
        //        and te_i is that animationEnds(te_i) is true
        //            and animationBegins(tx) is false for every tx from (tb_i, te_i)
        //    false(t) otherwise
        animationBegins.is(transformator.map(function (a, c) { return a ? eevent.notHappend : c; }, animating, mouseclick));
        animationEnds.is(animating
            .transformTime(false, function (t) { return t + 1; })
            .map(function (v) { return v ? eevent.of(null) : eevent.notHappend; }));
        var c = electric.receiver.collect(animating);
        expect(animating)
            .to.emit(false)
            .after(function () { return mouseclick.impulse(eevent.of(null)); })
            .to.emit(true)
            .to.emit(false)
            .after(function () { return mouseclick.impulse(eevent.of(null)); })
            .to.emit(true)
            .to.emit(false)
            .andBe(done);
    });
    it('should work with integrals', function () {
        var time = electric.scheduler.stop();
        function a(t) {
            return 10;
        }
        ;
        // v = ∫ a - 0.1 * v dt
        function akv(a, v) {
            return a - 0.1 * v;
        }
        var aT = clock.timeFunction(a, { intervalInMs: 1 });
        var vTs = placeholder(clock.TimeValue.of(time, 0));
        var vT = clock.integral(transformator.map(clock.TimeValue.lift(akv), aT, vTs));
        var now = electric.scheduler.now();
        vTs.is(vT.transformTime(clock.TimeValue.of(now, 0), function (t) { return t + 1; }));
        var r = electric.receiver.collect(vT);
        electric.scheduler.advance(5);
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
