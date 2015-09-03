var Acceleration = (function () {
    function Acceleration(x, y, antiderivative) {
        this.x = x;
        this.y = y;
        this.antiderivative = antiderivative;
    }
    Acceleration.of = function (x, y, antiderivative) {
        return new Acceleration(x, y, antiderivative);
    };
    Acceleration.zero = function (antiderivative) {
        return Acceleration.of(0, 0, antiderivative);
    };
    Acceleration.prototype.add = function (other) {
        var x = this.x + other.x;
        var y = this.y + other.y;
        return Acceleration.of(x, y, this.antiderivative);
    };
    Acceleration.prototype.equals = function (other) {
        return this.x === other.x && this.y === other.y && this.antiderivative === other.antiderivative;
    };
    Acceleration.prototype.withX = function (x) {
        return Acceleration.of(x, this.y, this.antiderivative);
    };
    Acceleration.prototype.withY = function (y) {
        return Acceleration.of(this.x, y, this.antiderivative);
    };
    Acceleration.prototype.mulT = function (dt) {
        var dx = this.x * dt / 1000;
        var dy = this.y * dt / 1000;
        return this.antiderivative(dx, dy);
    };
    return Acceleration;
})();
module.exports = Acceleration;
