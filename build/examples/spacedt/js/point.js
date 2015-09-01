var _maxX;
var _minX;
var _maxY;
var _minY;
var Point = (function () {
    function Point(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
    }
    Point.of = function (x, y, angle) {
        return new Point(x, y, angle);
    };
    Point.zero = function () {
        return Point.of(0, 0);
    };
    Point.setBounds = function (minX, maxX, minY, maxY) {
        _minX = minX;
        _maxX = maxX;
        _minY = minY;
        _maxY = maxY;
    };
    Point.prototype.addDelta = function (delta) {
        var dangle = delta.x;
        var ddist = delta.y;
        var dx = Math.cos(this.angle + dangle) * ddist;
        var dy = Math.sin(this.angle + dangle) * ddist;
        var x = boundTo(this.x + dx, _minX, _maxX);
        var y = boundTo(this.y + dy, _minY, _maxY);
        return Point.of(x, y, this.angle + dangle);
    };
    Point.prototype.equals = function (other) {
        return this.x === other.x && this.y === other.y && this.angle === other.angle;
        ;
    };
    return Point;
})();
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
module.exports = Point;
