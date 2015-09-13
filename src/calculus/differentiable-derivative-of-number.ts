import calculus = require('./calculus');

export = DifferentiableDerivativeOfNumber;



class DifferentiableDerivativeOfNumber<K extends calculus.Derivative>
	implements calculus.Differentiable, calculus.Derivative {
	x: number;
	derivative: (x: number) => K;


	static of<K extends calculus.Derivative>(
		x: number,
		derivative?: (x: number) => K
	) {
		return new DifferentiableDerivativeOfNumber(x, derivative);
	}

	static zero<K extends calculus.Derivative>(
		derivative: (x: number) => K
	) {
		return DifferentiableDerivativeOfNumber.of(0, derivative);
	}

	constructor(
		x: number,
		derivative: (x: number) => K
	) {
		this.x = x;
		this.derivative = derivative;
	}

	sub(other: DifferentiableDerivativeOfNumber<K>){
		var x = this.x - other.x
		return DifferentiableDerivativeOfNumber.of(x, this.derivative);
	}

	equals(other: DifferentiableDerivativeOfNumber<K>){
		return this.x === other.x;
	}

	divT(dt: number) {
		var dx = this.x * 1000 / dt;
		return this.derivative(dx);
	}

	withX(x: number) {
		return DifferentiableDerivativeOfNumber.of(x, this.derivative);
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