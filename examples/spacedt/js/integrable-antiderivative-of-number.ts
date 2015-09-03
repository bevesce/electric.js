import calculus = require('./calculus');

export = IntegrableAntiderivativeOfNumber;


interface Bounds {
	minX?: number;
	maxX?: number;
}


class IntegrableAntiderivativeOfNumber<K extends calculus.Antiderivative>
	implements calculus.Antiderivative, calculus.Integrable {
	x: number;
	antiderivative: (x: number) => K;
	bounds: Bounds;

	static of<K extends calculus.Antiderivative>(
		x: number,
		antiderivative: (x: number) => K,
		bounds?: Bounds
		) {
		return new IntegrableAntiderivativeOfNumber(x, antiderivative, bounds);
	}

	static zero<K extends calculus.Antiderivative>(antiderivative: (x: number) => K, bounds?: Bounds) {
		return IntegrableAntiderivativeOfNumber.of(0, antiderivative, bounds);
	}

	constructor(
		x: number,
		antiderivative: (x: number) => K,
		bounds?: Bounds
		) {
		this.bounds = bounds || {};
		this.x = within(x, this.bounds.minX, this.bounds.maxX);
		this.antiderivative = antiderivative;
	}

	add(other: IntegrableAntiderivativeOfNumber<K>){
		var x = within(this.x + other.x, this.bounds.minX, this.bounds.maxX);
		return IntegrableAntiderivativeOfNumber.of(x, this.antiderivative, this.bounds);
	}

	addDelta(delta: IntegrableAntiderivativeOfNumber<K>){
		return this.add(delta);
	}

	equals(other: IntegrableAntiderivativeOfNumber<K>){
		return this.x === other.x;
	}

	mulT(dt: number) {
		var dx = this.x * dt / 1000;
		return this.antiderivative(dx);
	}

	withX(x: number) {
		return IntegrableAntiderivativeOfNumber.of(x, this.antiderivative, this.bounds);
	}

	withY(y: number) {
		return IntegrableAntiderivativeOfNumber.of(this.x, this.antiderivative, this.bounds);
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