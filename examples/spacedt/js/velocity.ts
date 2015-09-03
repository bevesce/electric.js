import calculus = require('./calculus');

export = Velocity;


interface Bounds {
	minX?: number;
	maxX?: number;
	minY?: number;
	maxY?: number;
}

class Velocity<K extends calculus.Antiderivative>
	implements calculus.Antiderivative, calculus.Integrable
{
	x: number;
	y: number;
	antiderivative: (x: number, y: number) => K;
	bounds: Bounds;

	static of<K extends calculus.Antiderivative>(
		x: number,
		y: number,
		antiderivative: (x: number, y: number) => K,
		bounds?: Bounds
	) {
		return new Velocity(x, y, antiderivative, bounds);
	}

	static zero<K extends calculus.Antiderivative>(antiderivative: (x: number, y: number) => K, bounds?: Bounds) {
		return Velocity.of(0, 0, antiderivative, bounds);
	}

	constructor(
		x: number, y: number,
		antiderivative: (x: number, y: number) => K,
		bounds?: Bounds
	) {
		this.bounds = bounds || {};
		this.x = within(x, this.bounds.minX, this.bounds.maxX);
		this.y = within(y, this.bounds.minY, this.bounds.maxY);
		this.antiderivative = antiderivative;
	}

	add(other: Velocity<K>) {
		var x = within(this.x + other.x, this.bounds.minX, this.bounds.maxX);
		var y = within(this.y + other.y, this.bounds.minY, this.bounds.maxY);
		return Velocity.of(x, y, this.antiderivative, this.bounds);
	}

	addDelta(delta: Velocity<K>) {
		return this.add(delta);
	}

	equals(other: Velocity<K>) {
		return this.x === other.x && this.y === other.y;
	}

	mulT(dt: number) {
		var dx = this.x * dt / 1000;
		var dy = this.y * dt / 1000;
		return this.antiderivative(dx, dy);
	}

	withX(x: number) {
		return Velocity.of(x, this.y, this.antiderivative, this.bounds);
	}

	withY(y: number) {
		return Velocity.of(this.x, y, this.antiderivative, this.bounds);
	}
}


function within(v: number, min: number, max: number) {
	if (max !== undefined && v > max) {
		return max;
	}
	if (min !== undefined && v < min) {
		return min;
	}
	return v;
}