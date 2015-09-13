var electric = require('../../../src/electric');
var calculus = require('../../../src/calculus/calculus');
var IntegrableAntiderivativeOfTwoNumbers = require('../../../src/calculus/integrable-antiderivative-of-two-numbers');
var c = require('./constants');
var Point = require('./angled-point');
var cont = electric.emitter.constant;
function acceleration(x, y) {
    return IntegrableAntiderivativeOfTwoNumbers.of(x, y, velocity);
}
function velocity(x, y) {
    return IntegrableAntiderivativeOfTwoNumbers.of(x, y, Point.of);
}
function create(startingPoint, changeVelocity) {
    var v = cont(velocity(-Math.PI / 2, 100)).change({
        to: function (a, v) { return cont(a.withX(v)); },
        when: changeVelocity
    });
    v.name = 'asteroid mother velocity';
    var xya = calculus.integral(startingPoint, v, { fps: c.fps });
    xya.name = 'asteroid mother position';
    return {
        v: v,
        xya: xya
    };
}
module.exports = create;
