var IntegrableAntiderivativeOfTwoNumbers = (function () {
    function IntegrableAntiderivativeOfTwoNumbers(x, y, antiderivative, bounds) {
        this.bounds = bounds || {};
        this.x = within(x, this.bounds.minX, this.bounds.maxX);
        this.y = within(y, this.bounds.minY, this.bounds.maxY);
        this.antiderivative = antiderivative;
    }
    IntegrableAntiderivativeOfTwoNumbers.of = function (x, y, antiderivative, bounds) {
        return new IntegrableAntiderivativeOfTwoNumbers(x, y, antiderivative, bounds);
    };
    IntegrableAntiderivativeOfTwoNumbers.zero = function (antiderivative, bounds) {
        return IntegrableAntiderivativeOfTwoNumbers.of(0, 0, antiderivative, bounds);
    };
    IntegrableAntiderivativeOfTwoNumbers.prototype.add = function (other) {
        var x = within(this.x + other.x, this.bounds.minX, this.bounds.maxX);
        var y = within(this.y + other.y, this.bounds.minY, this.bounds.maxY);
        return IntegrableAntiderivativeOfTwoNumbers.of(x, y, this.antiderivative, this.bounds);
    };
    IntegrableAntiderivativeOfTwoNumbers.prototype.addDelta = function (delta) {
        return this.add(delta);
    };
    IntegrableAntiderivativeOfTwoNumbers.prototype.equals = function (other) {
        return this.x === other.x && this.y === other.y;
    };
    IntegrableAntiderivativeOfTwoNumbers.prototype.mulT = function (dt) {
        var dx = this.x * dt / 1000;
        var dy = this.y * dt / 1000;
        return this.antiderivative(dx, dy);
    };
    IntegrableAntiderivativeOfTwoNumbers.prototype.withX = function (x) {
        return IntegrableAntiderivativeOfTwoNumbers.of(x, this.y, this.antiderivative, this.bounds);
    };
    IntegrableAntiderivativeOfTwoNumbers.prototype.withY = function (y) {
        return IntegrableAntiderivativeOfTwoNumbers.of(this.x, y, this.antiderivative, this.bounds);
    };
    return IntegrableAntiderivativeOfTwoNumbers;
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
module.exports = IntegrableAntiderivativeOfTwoNumbers;
