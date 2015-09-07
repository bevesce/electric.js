var DifferentiableDerivativeOfNumber = (function () {
    function DifferentiableDerivativeOfNumber(x, derivative) {
        this.x = x;
        this.derivative = derivative;
    }
    DifferentiableDerivativeOfNumber.of = function (x, derivative) {
        return new DifferentiableDerivativeOfNumber(x, derivative);
    };
    DifferentiableDerivativeOfNumber.zero = function (derivative) {
        return DifferentiableDerivativeOfNumber.of(0, derivative);
    };
    DifferentiableDerivativeOfNumber.prototype.sub = function (other) {
        var x = this.x - other.x;
        return DifferentiableDerivativeOfNumber.of(x, this.derivative);
    };
    DifferentiableDerivativeOfNumber.prototype.equals = function (other) {
        return this.x === other.x;
    };
    DifferentiableDerivativeOfNumber.prototype.divT = function (dt) {
        var dx = this.x * 1000 / dt;
        return this.derivative(dx);
    };
    DifferentiableDerivativeOfNumber.prototype.withX = function (x) {
        return DifferentiableDerivativeOfNumber.of(x, this.derivative);
    };
    return DifferentiableDerivativeOfNumber;
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
module.exports = DifferentiableDerivativeOfNumber;
