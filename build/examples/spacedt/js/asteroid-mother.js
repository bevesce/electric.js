var electric = require('../../../src/electric');
var clock = require('./clock');
var calculus = require('./calculus');
var c = require('./constants');
var Point = require('./point');
var Velocity = require('./velocity');
var random = require('./utils/random');
var cont = electric.emitter.constant;
function acceleration(x, y) {
    return Velocity.of(x, y, velocity);
}
function velocity(x, y) {
    return Velocity.of(x, y, Point.of);
}
function create(startingPoint) {
    var v = cont(velocity(-Math.PI / 2, 100)).change({ to: function (a, _) { return cont(a.withX(random(-1, 1))); }, when: clock.interval({ inMs: 2000 }) });
    var xya = calculus.integral(startingPoint, v, { fps: c.fps });
    var birth = electric.transformator.map(function (time, xya) { return time.map(function (_) { return xya; }); }, clock.interval({ inMs: c.asteroidMother.birthIntervalInMs }), xya);
    return {
        v: v,
        xya: xya,
        birth: birth
    };
}
module.exports = create;
