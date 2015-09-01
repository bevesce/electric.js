var point = require('./point');
var _maxX;
var _minX;
var _maxY;
var _minY;
var Velocity = (function () {
    function Velocity(x, y) {
        this.x = within(x, _minX, _maxX);
        this.y = within(y, _minY, _maxY);
    }
    Velocity.of = function (x, y) {
        return new Velocity(x, y);
    };
    Velocity.zero = function () {
        return Velocity.of(0, 0);
    };
    Velocity.setBounds = function (minX, maxX, minY, maxY) {
        _minX = minX;
        _maxX = maxX;
        _minY = minY;
        _maxY = maxY;
    };
    Velocity.prototype.add = function (other) {
        var x = within(this.x + other.x, _minX, _maxX);
        var y = within(this.y + other.y, _minY, _maxY);
        return Velocity.of(x, y);
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
        return point.of(dx, dy);
    };
    Velocity.prototype.withX = function (x) {
        return Velocity.of(x, this.y);
    };
    Velocity.prototype.withY = function (y) {
        return Velocity.of(this.x, y);
    };
    return Velocity;
})();
function within(v, min, max) {
    if (min === undefined || max === undefined) {
        return v;
    }
    return Math.min(Math.max(v, min), max);
}
module.exports = Velocity;
