import calculus = require('./calculus');
import point = require('./point');

var _maxX: number;
var _minX: number;
var _maxY: number;
var _minY: number;
var _maxAngle: number;
var _minAngle: number;

export function setBounds(
	minX: number, maxX: number,
	minY: number, maxY: number,
	minAngle: number, maxAngle: number
	) {
	_minX = minX;
	_maxX = maxX;
	_minY = minY;
	_maxY = maxY;
	_maxAngle = maxAngle;
	_minAngle = minAngle;
}



export class Velocity
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

	constructor(x: number, y: number) {
		this.x;
		this.y;
	}

	add(other: Velocity) {
		var x = this.x + other.x;
		var y = this.y + other.y;
		return Velocity.of(x, y);
	}

	equals(other: Velocity) {
		return this.x === other.x && this.y === other.y;
	}

	mulT(dt: number) {
		var dx = this.x * dt;
		var dy = this.y * dt;
		return point.Point.of(dx, dy);
	}
}


export class AngularVelocity
	implements calculus.Antiderivative, calculus.Integrable
{
	angle: number;
	speed: number;

	static of(angle: number, speed: number) {
		return new AngularVelocity(angle, speed);
	}

	static zero() {
		return new AngularVelocity(0, 0);
	}

	constructor(angle: number, speed: number) {
		this.angle = angle;
		this.speed = speed;
	}

	mulT(dt: number) {
		var dangle = this.angle * dt / 1000;
		console.log(this.angle, Math.sin(this.angle), Math.cos(this.angle));
		var dx = Math.sin(this.angle) * this.speed * dt / 1000;
		var dy = Math.cos(this.angle) * this.speed * dt / 1000;
		return point.PointWithAngle.of(dx, dy, dangle);
	}

	add(other: AngularVelocity) {
		var d = this._diff(other);
		var speed = this.speed + other.speed;
		return AngularVelocity.of(this.angle + other.angle, speed);
	}

	private _diff(other: AngularVelocity) {
		var dx1 = Math.sin(this.angle) * this.speed;
		var dx2 = Math.sin(other.angle) * other.speed;
		var dy1 = Math.cos(this.angle) * this.speed;
		var dy2 = Math.cos(other.angle) * other.speed;
		return {
			x: dx1 + dx2,
			y: dy1 + dy2
		}
	}

	equals(other: AngularVelocity) {
		return this.angle === other.angle && this.speed === other.speed;
	}
}


function within(v: number, min: number, max: number) {
	console.log('W', v, Math.max(Math.min(v, max), min));
	return Math.max(Math.min(v, max), min);
}
