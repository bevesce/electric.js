var point = require('./point');
var _maxX;
var _minX;
var _maxY;
var _minY;
var _maxAngle;
var _minAngle;
function setBounds(minX, maxX, minY, maxY, minAngle, maxAngle) {
    _minX = minX;
    _maxX = maxX;
    _minY = minY;
    _maxY = maxY;
    _maxAngle = maxAngle;
    _minAngle = minAngle;
}
exports.setBounds = setBounds;
var Velocity = (function () {
    function Velocity(x, y) {
        this.x;
        this.y;
    }
    Velocity.of = function (x, y) {
        return new Velocity(x, y);
    };
    Velocity.zero = function () {
        return Velocity.of(0, 0);
    };
    Velocity.prototype.add = function (other) {
        var x = this.x + other.x;
        var y = this.y + other.y;
        return Velocity.of(x, y);
    };
    Velocity.prototype.equals = function (other) {
        return this.x === other.x && this.y === other.y;
    };
    Velocity.prototype.mulT = function (dt) {
        var dx = this.x * dt;
        var dy = this.y * dt;
        return point.Point.of(dx, dy);
    };
    return Velocity;
})();
exports.Velocity = Velocity;
var AngularVelocity = (function () {
    function AngularVelocity(angle, speed) {
        this.angle = angle;
        this.speed = speed;
    }
    AngularVelocity.of = function (angle, speed) {
        return new AngularVelocity(angle, speed);
    };
    AngularVelocity.zero = function () {
        return new AngularVelocity(0, 0);
    };
    AngularVelocity.prototype.mulT = function (dt) {
        var dangle = this.angle * dt / 1000;
        console.log(this.angle, Math.sin(this.angle), Math.cos(this.angle));
        var dx = Math.sin(this.angle) * this.speed * dt / 1000;
        var dy = Math.cos(this.angle) * this.speed * dt / 1000;
        return point.PointWithAngle.of(dx, dy, dangle);
    };
    AngularVelocity.prototype.add = function (other) {
        var d = this._diff(other);
        var speed = this.speed + other.speed;
        return AngularVelocity.of(this.angle + other.angle, speed);
    };
    AngularVelocity.prototype._diff = function (other) {
        var dx1 = Math.sin(this.angle) * this.speed;
        var dx2 = Math.sin(other.angle) * other.speed;
        var dy1 = Math.cos(this.angle) * this.speed;
        var dy2 = Math.cos(other.angle) * other.speed;
        return {
            x: dx1 + dx2,
            y: dy1 + dy2
        };
    };
    AngularVelocity.prototype.equals = function (other) {
        return this.angle === other.angle && this.speed === other.speed;
    };
    return AngularVelocity;
})();
exports.AngularVelocity = AngularVelocity;
function within(v, min, max) {
    console.log('W', v, Math.max(Math.min(v, max), min));
    return Math.max(Math.min(v, max), min);
}
