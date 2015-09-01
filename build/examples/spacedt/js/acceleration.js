var velocity = require('./velocity');
var Acceleration = (function () {
    function Acceleration(x, y) {
        this.x = x;
        this.y = y;
    }
    Acceleration.of = function (x, y) {
        return new Acceleration(x, y);
    };
    Acceleration.zero = function () {
        return Acceleration.of(0, 0);
    };
    Acceleration.prototype.add = function (other) {
        var x = this.x + other.x;
        var y = this.y + other.y;
        return Acceleration.of(x, y);
    };
    Acceleration.prototype.equals = function (other) {
        return this.x === other.x && this.y === other.y;
    };
    Acceleration.prototype.withX = function (x) {
        return Acceleration.of(x, this.y);
    };
    Acceleration.prototype.withY = function (y) {
        return Acceleration.of(this.x, y);
    };
    Acceleration.prototype.mulT = function (dt) {
        var dx = this.x * dt / 1000;
        var dy = this.y * dt / 1000;
        return velocity.of(dx, dy);
    };
    return Acceleration;
})();
module.exports = Acceleration;
