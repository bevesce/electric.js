var electric = require('../../../src/electric');
var eevent = require('../../../src/electric-event');
var calculus = require('../../../src/calculus/calculus');
var IntegrableAntiderivativeOfTwoNumbers = require('../../../src/calculus/integrable-antiderivative-of-two-numbers');
var c = require('./constants');
var Point = require('./angled-point');
var cont = electric.emitter.constant;
function shipAcceleration(x, y) {
    return IntegrableAntiderivativeOfTwoNumbers.of(x, y, shipVelocity);
}
function shipVelocity(x, y) {
    return IntegrableAntiderivativeOfTwoNumbers.of(x, y, Point.of, c.ship.vbounds);
}
function create(startingPoint, input) {
    var fps = { fps: c.fps };
    var acceleration = cont(shipAcceleration(0, 0)).change({ to: function (a, _) { return cont(a.withX(-c.ship.acceleration.angular)); },
        when: input.rotateLeft }, { to: function (a, _) { return cont(a.withX(c.ship.acceleration.angular)); },
        when: input.rotateRight }, { to: function (a, _) { return cont(a.withY(c.ship.acceleration.linear)); },
        when: input.accelerate }, { to: function (a, _) { return cont(a.withY(-c.ship.acceleration.de)); },
        when: input.deccelerate }, { to: function (a, _) { return cont(a.withY(0)); },
        when: input.stopAcceleration }, { to: function (a, _) { return cont(a.withY(0)); },
        when: input.stopDecceleration }, { to: function (a, _) { return cont(a.withX(0)); },
        when: input.stopRotation });
    acceleration.name = 'ship acceleration';
    var velocity = calculus.integral(shipVelocity(0, 0), acceleration, fps).change({
        to: function (v, _) { return calculus.integral(v.withX(0), acceleration, fps); },
        when: input.stopRotation.transformTime(eevent.notHappend, function (t) { return t + c.ship.rotationStopDelay; })
    });
    velocity.name = 'ship velocity';
    var position = calculus.integral(startingPoint, velocity, fps);
    position.name = 'ship position';
    var shot = electric.transformator.map(function (space, xya, v) { return space.map(function (_) { return ({ xya: xya, velocity: v }); }); }, input.shoot, position, velocity);
    shot.name = 'shot';
    return {
        a: acceleration,
        v: velocity,
        xya: position,
        shot: shot
    };
}
module.exports = create;
