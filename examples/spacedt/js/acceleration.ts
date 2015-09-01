import calculus = require('./calculus');
import velocity = require('./velocity');


export class Acceleration
	implements calculus.Integrable {
	x: number;
	y: number;

	static of(x: number, y: number) {
		return new Acceleration(x, y);
	}

	static zero() {
		return Acceleration.of(0, 0)
	}

	constructor(x: number, y: number) {
		this.x;
		this.y;
	}

	add(other: Acceleration) {
		var x = this.x + other.x;
		var y = this.y + other.y;
		return Acceleration.of(x, y);
	}

	equals(other: Acceleration) {
		return this.x === other.x && this.y === other.y;
	}

	mulT(dt: number) {
		var dx = this.x * dt;
		var dy = this.y * dt;
		return velocity.Velocity.of(dx, dy);
	}
}


export class AngularAcceleration
	implements calculus.Antiderivative, calculus.Integrable {
	angle: number;
	speed: number;

	static of(angle: number, speed: number) {
		return new AngularAcceleration(angle, speed);
	}

	static zero() {
		return AngularAcceleration.of(0, 0);
	}

	constructor(angle: number, speed: number) {
		this.angle = angle;
		this.speed = speed;
	}

	mulT(dt: number) {
		var dangle = this.angle * dt / 1000;
		var dspeed = this.speed * dt / 1000;
		return velocity.AngularVelocity.of(dangle, dspeed);
	}

	add(other: AngularAcceleration) {
		var angle = this.angle + other.angle
		var speed = this.speed + other.speed;
		return AngularAcceleration.of(angle, speed);
	}

	withAngle(angle: number) {
		return AngularAcceleration.of(angle, this.speed);
	}

	withSpeed(speed: number) {
		return AngularAcceleration.of(this.angle, speed);
	}

	equals(other: AngularAcceleration) {
		return this.angle === other.angle && this.speed === other.speed;
	}
}
