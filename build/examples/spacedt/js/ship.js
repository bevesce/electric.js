var electric = require('../../../src/electric');
var eevent = require('../../../src/electric-event');
var eui = require('../../../src/emitters/ui');
var calculus = require('./calculus');
var c = require('./constants');
var IntegrableAntiderivativeOfTwoNumbers = require('./integrable-antiderivative-of-two-numbers');
var Point = require('./angled-point');
var cont = electric.emitter.constant;
function shipAcceleration(x, y) {
    return IntegrableAntiderivativeOfTwoNumbers.of(x, y, shipVelocity);
}
function shipVelocity(x, y) {
    return IntegrableAntiderivativeOfTwoNumbers.of(x, y, Point.of, c.ship.vbounds);
}
function create(startingPoint, input) {
    var shipA = cont(shipAcceleration(0, 0)).change({ to: function (a, _) { return cont(a.withX(-c.ship.acceleration.angular)); }, when: input.rotateLeft }, { to: function (a, _) { return cont(a.withX(c.ship.acceleration.angular)); }, when: input.rotateRight }, { to: function (a, _) { return cont(a.withX(0)); }, when: input.stopRotateRight }, { to: function (a, _) { return cont(a.withX(0)); }, when: input.stopRotateLeft }, { to: function (a, _) { return cont(a.withY(-c.ship.acceleration.de)); }, when: input.deccelerate }, { to: function (a, _) { return cont(a.withY(c.ship.acceleration.linear)); }, when: input.accelerate }, { to: function (a, _) { return cont(a.withY(0)); }, when: input.stopAcceleration }, { to: function (a, _) { return cont(a.withY(0)); }, when: input.stopDecceleration });
    var shipV = calculus.integral(shipVelocity(0, 0), shipA, { fps: c.fps }).change({ to: function (v, _) { return calculus.integral(v.withX(0), shipA, { fps: c.fps }); }, when: input.stopRotateRight.transformTime(eevent.notHappend, function (t) { return t + 10; }) }, { to: function (v, _) { return calculus.integral(v.withX(0), shipA, { fps: c.fps }); }, when: input.stopRotateLeft.transformTime(eevent.notHappend, function (t) { return t + 10; }) });
    var shipXYA = calculus.integral(startingPoint, shipV, { fps: c.fps });
    var shot = electric.transformator.map(function (space, xya, v) { return space.map(function (_) { return ({ xya: xya, velocity: v }); }); }, eui.key('space', 'up'), shipXYA, shipV);
    return {
        a: shipA,
        v: shipV,
        xya: shipXYA,
        shot: shot
    };
}
module.exports = create;
