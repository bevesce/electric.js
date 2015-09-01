var velocity = require('./velocity');
var Acceleration = (function () {
    function Acceleration(x, y) {
        this.x;
        this.y;
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
    Acceleration.prototype.mulT = function (dt) {
        var dx = this.x * dt;
        var dy = this.y * dt;
        return velocity.Velocity.of(dx, dy);
    };
    return Acceleration;
})();
exports.Acceleration = Acceleration;
var AngularAcceleration = (function () {
    function AngularAcceleration(angle, speed) {
        this.angle = angle;
        this.speed = speed;
    }
    AngularAcceleration.of = function (angle, speed) {
        return new AngularAcceleration(angle, speed);
    };
    AngularAcceleration.zero = function () {
        return AngularAcceleration.of(0, 0);
    };
    AngularAcceleration.prototype.mulT = function (dt) {
        var dangle = this.angle * dt / 1000;
        var dspeed = this.speed * dt / 1000;
        return velocity.AngularVelocity.of(dangle, dspeed);
    };
    AngularAcceleration.prototype.add = function (other) {
        var angle = this.angle + other.angle;
        var speed = this.speed + other.speed;
        return AngularAcceleration.of(angle, speed);
    };
    AngularAcceleration.prototype.withAngle = function (angle) {
        return AngularAcceleration.of(angle, this.speed);
    };
    AngularAcceleration.prototype.withSpeed = function (speed) {
        return AngularAcceleration.of(this.angle, speed);
    };
    AngularAcceleration.prototype.equals = function (other) {
        return this.angle === other.angle && this.speed === other.speed;
    };
    return AngularAcceleration;
})();
exports.AngularAcceleration = AngularAcceleration;
