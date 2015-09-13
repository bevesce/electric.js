import electric = require('../../../src/electric');
import calculus = require('../../../src/calculus/calculus');
import IntegrableAntiderivativeOfTwoNumbers = require('../../../src/calculus/integrable-antiderivative-of-two-numbers');

import c = require('./constants');
import Point = require('./angled-point');


export = MovingPoint;

var cont = electric.emitter.constant;


type Velocity = IntegrableAntiderivativeOfTwoNumbers<Point>

function velocity(x: number, y: number) {
	return IntegrableAntiderivativeOfTwoNumbers.of(x, y, Point.of);
}



class MovingPoint {
	v: electric.emitter.Emitter<Velocity>;
	xya: electric.emitter.Emitter<Point>;

	static start(speed: number, x0: number, y0: number, angle: number) {
		return new MovingPoint(speed, x0, y0, angle);
	}

	constructor(speed: number, x0: number, y0: number, angle: number) {
		this.v = cont(velocity(0, speed));
		this.v = 'velocity';
		this.xya = calculus.integral(
			Point.of(x0, y0, angle), this.v, { fps: c.fps }
		);
		this.xya = 'position';
	}
}
