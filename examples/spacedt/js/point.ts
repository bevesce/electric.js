import calculus = require('./calculus');

export = Point;


var _maxX: number;
var _minX: number;
var _maxY: number;
var _minY: number;


class Point implements calculus.Antiderivative {
	x: number;
	y: number;
	angle: number;

	static of(x: number, y: number, angle?: number) {
		return new Point(x, y, angle);
	}

	static zero() {
		return Point.of(0, 0)
	}

	static setBounds(
		minX: number, maxX: number,
		minY: number, maxY: number
	) {
		_minX = minX;
		_maxX = maxX;
		_minY = minY;
		_maxY = maxY;
	}

	constructor(x: number, y: number, angle: number) {
		this.x = x;
		this.y = y;
		this.angle = angle
	}

	addDelta(delta: Point) {
		var dangle = delta.x;
		var ddist = delta.y;

		var dx = Math.cos(this.angle + dangle) * ddist;
		var dy = Math.sin(this.angle + dangle) * ddist;

		var x = boundTo(this.x + dx, _minX, _maxX);
		var y = boundTo(this.y + dy, _minY, _maxY)
		return Point.of(x, y, this.angle + dangle);
	}

	equals(other: Point) {
		return this.x === other.x && this.y === other.y && this.angle === other.angle;;
	}
}



function boundTo(v: number, min: number, max: number) {
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
