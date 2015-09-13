import electric = require('../../../src/electric');
import clock = require('../../../src/clock');
import calculus = require('../../../src/calculus/calculus');
import IntegrableAntiderivativeOfTwoNumbers = require('../../../src/calculus/integrable-antiderivative-of-two-numbers');

import c = require('./constants');
import Point = require('./angled-point');

export = create;

var cont = electric.emitter.constant;


function acceleration(x: number, y: number) {
	return IntegrableAntiderivativeOfTwoNumbers.of(x, y, velocity);
}

function velocity(x: number, y: number) {
	return IntegrableAntiderivativeOfTwoNumbers.of(x, y, Point.of);
}


function create(
	startingPoint: Point,
	changeVelocity: electric.emitter.EventEmitter<number>
) {
	var v = cont(velocity(-Math.PI / 2, 100)).change({
		to: (a, v) => cont(a.withX(v)),
		when: changeVelocity
	});
	v.name = 'asteroid mother velocity';
	var xya = calculus.integral(startingPoint, v, { fps: c.fps });
	xya.name = 'asteroid mother position'
	return {
		v: v,
		xya: xya
	}
}