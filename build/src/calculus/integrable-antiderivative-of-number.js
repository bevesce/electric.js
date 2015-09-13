var IntegrableAntiderivativeOfNumber = (function () {
    function IntegrableAntiderivativeOfNumber(x, antiderivative, bounds) {
        this.bounds = bounds || {};
        this.x = within(x, this.bounds.minX, this.bounds.maxX);
        this.antiderivative = antiderivative;
    }
    IntegrableAntiderivativeOfNumber.of = function (x, antiderivative, bounds) {
        return new IntegrableAntiderivativeOfNumber(x, antiderivative, bounds);
    };
    IntegrableAntiderivativeOfNumber.zero = function (antiderivative, bounds) {
        return IntegrableAntiderivativeOfNumber.of(0, antiderivative, bounds);
    };
    IntegrableAntiderivativeOfNumber.prototype.add = function (other) {
        var x = within(this.x + other.x, this.bounds.minX, this.bounds.maxX);
        return IntegrableAntiderivativeOfNumber.of(x, this.antiderivative, this.bounds);
    };
    IntegrableAntiderivativeOfNumber.prototype.addDelta = function (delta) {
        return this.add(delta);
    };
    IntegrableAntiderivativeOfNumber.prototype.equals = function (other) {
        return this.x === other.x;
    };
    IntegrableAntiderivativeOfNumber.prototype.mulT = function (dt) {
        var dx = this.x * dt / 1000;
        return this.antiderivative(dx);
    };
    IntegrableAntiderivativeOfNumber.prototype.withX = function (x) {
        return IntegrableAntiderivativeOfNumber.of(x, this.antiderivative, this.bounds);
    };
    return IntegrableAntiderivativeOfNumber;
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
module.exports = IntegrableAntiderivativeOfNumber;
