/// <reference path="../d/chai.d.ts" />
/// <reference path="../d/mocha.d.ts" />
var chai = require('chai');
var expect = chai.expect;
var electric = require('../src/electric');
var clock = require('../src/clock');
var sh = electric.scheduler;
describe('clock', function () {
    afterEach(function () { return sh.resume(); });
    it('should measure time', function (done) {
        var time = sh.stop();
        expect(clock.time({ intervalInMs: 1 }))
            .to.emit(time)
            .after(function () { return sh.advance(3); })
            .to.emit(time + 1)
            .to.emit(time + 2)
            .andBe(done);
    });
    it('should time intervals', function (done) {
        var time = sh.stop();
        expect(clock.interval({ inMs: 1 }))
            .to.emit(electric.event.notHappend)
            .after(function () { return sh.advance(3); })
            .to.emit(electric.event.of(time + 1))
            .to.emit(electric.event.notHappend)
            .to.emit(electric.event.of(time + 2))
            .to.emit(electric.event.notHappend)
            .andBe(done);
    });
    it('should time intervals with value', function (done) {
        var time = sh.stop();
        expect(clock.intervalValue('test', { inMs: 1 }))
            .to.emit(electric.event.notHappend)
            .after(function () { return sh.advance(3); })
            .to.emit(electric.event.of('test'))
            .to.emit(electric.event.notHappend)
            .to.emit(electric.event.of('test'))
            .to.emit(electric.event.notHappend)
            .andBe(done);
    });
    it('should strop measuring time after stabilization', function (done) {
        var time = sh.stop();
        var timer = clock.time({ intervalInMs: 1 });
        expect(timer)
            .to.emit(time)
            .after(function () { return timer.stabilize(); })
            .after(function () { return sh.advance(3); })
            .andBe(done);
    });
    it('should count down to one event', function (done) {
        var time = sh.stop();
        var once = clock.once(1, '!');
        expect(once)
            .to.emit(electric.event.notHappend)
            .then.after(function () { return sh.advance(2); })
            .to.emit(electric.event.of('!'))
            .then.to.emit(electric.event.notHappend)
            .andBe(done);
    });
});
