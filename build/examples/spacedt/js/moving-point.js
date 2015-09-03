var electric = require('../../../src/electric');
var calculus = require('./calculus');
var c = require('./constants');
var Point = require('./point');
var Velocity = require('./velocity');
var cont = electric.emitter.constant;
function velocity(x, y) {
    return Velocity.of(x, y, Point.of);
}
var MovingPoint = (function () {
    function MovingPoint(speed, x0, y0, angle) {
        this.v = cont(velocity(0, speed));
        this.xya = calculus.integral(Point.of(x0, y0, angle), this.v, { fps: c.fps });
    }
    MovingPoint.start = function (speed, x0, y0, angle) {
        return new MovingPoint(speed, x0, y0, angle);
    };
    return MovingPoint;
})();
module.exports = MovingPoint;
