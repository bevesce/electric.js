import calculus = require('./calculus');


var _maxX: number;
var _minX: number;
var _maxY: number;
var _minY: number;


export function setBounds(
	minX: number, maxX: number,
	minY: number, maxY: number
) {
	_minX = minX;
	_maxX = maxX;
	_minY = minY;
	_maxY = maxY;
}


export class Point implements calculus.Antiderivative {
	x: number;
	y: number;

	static of(x: number, y: number) {
		return new Point(x, y);
	}

	static zero() {
		return Point.of(0, 0)
	}

	constructor(x: number, y: number) {
		this.x;
		this.y;
	}

	add(other: Point) {
		var x = boundTo(this.x + other.x, _minX, _maxX);
		var y = boundTo(this.y + other.y, _minY, _maxY);
		return Point.of(x, y);
	}

	equals(other: Point) {
		return this.x === other.x && this.y === other.y;
	}
}


export class PointWithAngle implements calculus.Antiderivative {
	x: number;
	y: number;
	angle: number;

	static of(x: number, y: number, angle: number) {
		return new PointWithAngle(x, y, angle);
	}

	static zero() {
		return PointWithAngle.of(0, 0, -Math.PI / 2);
	}

	constructor(x: number, y: number, angle: number) {
		this.x = x;
		this.y = y;
		this.angle = angle;
	}

	add(other: PointWithAngle) {
		var x = boundTo(this.x + other.x, _minX, _maxX);
		var y = boundTo(this.y + other.y, _minY, _maxY);
		var angle = this.angle + other.angle
		return PointWithAngle.of(x, y, angle);
	}

	equals(other: PointWithAngle): boolean {
		return this.x === other.x && this.y === other.y && this.angle === other.angle;
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
