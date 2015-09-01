var _maxX;
var _minX;
var _maxY;
var _minY;
function setBounds(minX, maxX, minY, maxY) {
    _minX = minX;
    _maxX = maxX;
    _minY = minY;
    _maxY = maxY;
}
exports.setBounds = setBounds;
var Point = (function () {
    function Point(x, y) {
        this.x;
        this.y;
    }
    Point.of = function (x, y) {
        return new Point(x, y);
    };
    Point.zero = function () {
        return Point.of(0, 0);
    };
    Point.prototype.add = function (other) {
        var x = boundTo(this.x + other.x, _minX, _maxX);
        var y = boundTo(this.y + other.y, _minY, _maxY);
        return Point.of(x, y);
    };
    Point.prototype.equals = function (other) {
        return this.x === other.x && this.y === other.y;
    };
    return Point;
})();
exports.Point = Point;
var PointWithAngle = (function () {
    function PointWithAngle(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
    }
    PointWithAngle.of = function (x, y, angle) {
        return new PointWithAngle(x, y, angle);
    };
    PointWithAngle.zero = function () {
        return PointWithAngle.of(0, 0, -Math.PI / 2);
    };
    PointWithAngle.prototype.add = function (other) {
        var x = boundTo(this.x + other.x, _minX, _maxX);
        var y = boundTo(this.y + other.y, _minY, _maxY);
        var angle = this.angle + other.angle;
        return PointWithAngle.of(x, y, angle);
    };
    PointWithAngle.prototype.equals = function (other) {
        return this.x === other.x && this.y === other.y && this.angle === other.angle;
    };
    return PointWithAngle;
})();
exports.PointWithAngle = PointWithAngle;
function boundTo(v, min, max) {
    if (min == undefined || max == undefined) {
        return v;
    }
    if (v < min) {
        return max + v;
    }
    else if (v > max) {
        return min - v;
    }
    return v;
}
