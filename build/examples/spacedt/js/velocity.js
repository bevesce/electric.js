var Velocity = (function () {
    function Velocity(x, y, antiderivative, bounds) {
        this.bounds = bounds || {};
        this.x = within(x, this.bounds.minX, this.bounds.maxX);
        this.y = within(y, this.bounds.minY, this.bounds.maxY);
        this.antiderivative = antiderivative;
    }
    Velocity.of = function (x, y, antiderivative, bounds) {
        return new Velocity(x, y, antiderivative, bounds);
    };
    Velocity.zero = function (antiderivative, bounds) {
        return Velocity.of(0, 0, antiderivative, bounds);
    };
    Velocity.prototype.add = function (other) {
        var x = within(this.x + other.x, this.bounds.minX, this.bounds.maxX);
        var y = within(this.y + other.y, this.bounds.minY, this.bounds.maxY);
        return Velocity.of(x, y, this.antiderivative, this.bounds);
    };
    Velocity.prototype.addDelta = function (delta) {
        return this.add(delta);
    };
    Velocity.prototype.equals = function (other) {
        return this.x === other.x && this.y === other.y;
    };
    Velocity.prototype.mulT = function (dt) {
        var dx = this.x * dt / 1000;
        var dy = this.y * dt / 1000;
        return this.antiderivative(dx, dy);
    };
    Velocity.prototype.withX = function (x) {
        return Velocity.of(x, this.y, this.antiderivative, this.bounds);
    };
    Velocity.prototype.withY = function (y) {
        return Velocity.of(this.x, y, this.antiderivative, this.bounds);
    };
    return Velocity;
})();
function within(v, min, max) {
    if (max !== undefined && v > max) {
        return max;
    }
    if (min !== undefined && v < min) {
        return min;
    }
    return v;
}
module.exports = Velocity;
