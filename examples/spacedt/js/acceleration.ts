import calculus = require('./calculus');
import velocity = require('./velocity');


export = Acceleration;

class Acceleration
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
		this.x = x;
		this.y = y;
	}

	add(other: Acceleration) {
		var x = this.x + other.x;
		var y = this.y + other.y;
		return Acceleration.of(x, y);
	}

	equals(other: Acceleration) {
		return this.x === other.x && this.y === other.y;
	}

	withX(x: number) {
		return Acceleration.of(x, this.y);
	}

	withY(y: number) {
		return Acceleration.of(this.x, y);
	}

	mulT(dt: number) {
		var dx = this.x * dt / 1000;
		var dy = this.y * dt / 1000;
		return velocity.of(dx, dy);
	}
}

