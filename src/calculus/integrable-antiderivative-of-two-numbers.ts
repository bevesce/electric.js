import calculus = require('./calculus');

export = IntegrableAntiderivativeOfTwoNumbers;


interface Bounds {
	minX?: number;
	maxX?: number;
	minY?: number;
	maxY?: number;
}


class IntegrableAntiderivativeOfTwoNumbers<K extends calculus.Antiderivative>
	implements calculus.Antiderivative, calculus.Integrable
{
	x: number;
	y: number;
	antiderivative: (x: number, y: number) => K;
	bounds: Bounds;

	static of<K extends calculus.Antiderivative>(
		x: number,
		y: number,
		antiderivative?: (x: number, y: number) => K,
		bounds?: Bounds
	) {
		return new IntegrableAntiderivativeOfTwoNumbers(x, y, antiderivative, bounds);
	}

	static zero<K extends calculus.Antiderivative>(antiderivative: (x: number, y: number) => K, bounds?: Bounds) {
		return IntegrableAntiderivativeOfTwoNumbers.of(0, 0, antiderivative, bounds);
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

	add(other: IntegrableAntiderivativeOfTwoNumbers<K>) {
		var x = within(this.x + other.x, this.bounds.minX, this.bounds.maxX);
		var y = within(this.y + other.y, this.bounds.minY, this.bounds.maxY);
		return IntegrableAntiderivativeOfTwoNumbers.of(x, y, this.antiderivative, this.bounds);
	}

	addDelta(delta: IntegrableAntiderivativeOfTwoNumbers<K>) {
		return this.add(delta);
	}

	equals(other: IntegrableAntiderivativeOfTwoNumbers<K>) {
		return this.x === other.x && this.y === other.y;
	}

	mulT(dt: number) {
		var dx = this.x * dt / 1000;
		var dy = this.y * dt / 1000;
		return this.antiderivative(dx, dy);
	}

	withX(x: number) {
		return IntegrableAntiderivativeOfTwoNumbers.of(x, this.y, this.antiderivative, this.bounds);
	}

	withY(y: number) {
		return IntegrableAntiderivativeOfTwoNumbers.of(this.x, y, this.antiderivative, this.bounds);
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