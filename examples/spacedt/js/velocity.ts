import calculus = require('./calculus');
import point = require('./point');

export = Velocity;


var _maxX: number;
var _minX: number;
var _maxY: number;
var _minY: number;


class Velocity
	implements calculus.Antiderivative, calculus.Integrable
{
	x: number;
	y: number;

	static of(x: number, y: number) {
		return new Velocity(x, y);
	}

	static zero() {
		return Velocity.of(0, 0)
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

	constructor(x: number, y: number) {
		this.x = within(x, _minX, _maxX);
		this.y = within(y, _minY, _maxY);
	}

	add(other: Velocity) {
		var x = within(this.x + other.x, _minX, _maxX);
		var y = within(this.y + other.y, _minY, _maxY);
		return Velocity.of(x, y);
	}

	addDelta(delta: Velocity) {
		return this.add(delta);
	}

	equals(other: Velocity) {
		return this.x === other.x && this.y === other.y;
	}

	mulT(dt: number) {
		var dx = this.x * dt / 1000;
		var dy = this.y * dt / 1000;
		return point.of(dx, dy);
	}

	withX(x: number) {
		return Velocity.of(x, this.y);
	}

	withY(y: number) {
		return Velocity.of(this.x, y);
	}
}


function within(v: number, min: number, max: number) {
	if (min === undefined || max === undefined) {
		return v;
	}
	return Math.min(Math.max(v, min), max);
}