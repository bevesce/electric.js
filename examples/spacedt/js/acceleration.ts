import calculus = require('./calculus');
import velocity = require('./velocity');


export = Acceleration;

class Acceleration<K extends calculus.IntegrableAntiderivative>
	implements calculus.Integrable {
	x: number;
	y: number;
	antiderivative: (x: number, y: number) => K;

	static of<K extends calculus.IntegrableAntiderivative>(
		x: number, y: number, antiderivative: (x: number, y: number) => K
	) {
		return new Acceleration(x, y, antiderivative);
	}

	static zero<K extends calculus.IntegrableAntiderivative>(
		antiderivative: (x: number, y: number) => K
	) {
		return Acceleration.of(0, 0, antiderivative)
	}

	constructor(x: number, y: number, antiderivative: (x: number, y: number) => K) {
		this.x = x;
		this.y = y;
		this.antiderivative = antiderivative;
	}

	add(other: Acceleration<K>) {
		var x = this.x + other.x;
		var y = this.y + other.y;
		return Acceleration.of(x, y, this.antiderivative);
	}

	equals(other: Acceleration<K>) {
		return this.x === other.x && this.y === other.y && this.antiderivative === other.antiderivative;
	}

	withX(x: number) {
		return Acceleration.of(x, this.y, this.antiderivative);
	}

	withY(y: number) {
		return Acceleration.of(this.x, y, this.antiderivative);
	}

	mulT(dt: number) {
		var dx = this.x * dt / 1000;
		var dy = this.y * dt / 1000;
		return this.antiderivative(dx, dy);
	}
}

