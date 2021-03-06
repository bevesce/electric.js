var electric = require('../../../src/electric');
var calculus = require('../../../src/calculus/calculus');
var IntegrableAntiderivativeOfTwoNumbers = require('../../../src/calculus/integrable-antiderivative-of-two-numbers');
var c = require('./constants');
var Point = require('./angled-point');
var cont = electric.emitter.constant;
function velocity(x, y) {
    return IntegrableAntiderivativeOfTwoNumbers.of(x, y, Point.of);
}
var MovingPoint = (function () {
    function MovingPoint(speed, x0, y0, angle) {
        this.v = cont(velocity(0, speed));
        this.v.name = 'velocity';
        this.xya = calculus.integral(Point.of(x0, y0, angle), this.v, { fps: c.fps });
        this.xya.name = 'position';
    }
    MovingPoint.start = function (speed, x0, y0, angle) {
        return new MovingPoint(speed, x0, y0, angle);
    };
    return MovingPoint;
})();
module.exports = MovingPoint;
