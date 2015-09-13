import electric = require('../../../src/electric');
import clock = require('../../../src/clock');
import calculus = require('../../../src/calculus/calculus');
import IntegrableAntiderivativeOfTwoNumbers = require('../../../src/calculus/integrable-antiderivative-of-two-numbers');

import c = require('./constants');
import Point = require('./angled-point');
import random = require('./utils/random');

export = create;

var cont = electric.emitter.constant;


function acceleration(x: number, y: number) {
	return IntegrableAntiderivativeOfTwoNumbers.of(x, y, velocity);
}

function velocity(x: number, y: number) {
	return IntegrableAntiderivativeOfTwoNumbers.of(x, y, Point.of);
}


function create(startingPoint: Point) {
	var v = cont(velocity(-Math.PI / 2, 100)).change(
		{ to: (a, _) => cont(a.withX(random(-1, 1))), when: clock.interval({ inMs: 2000 }) }
	);
	var xya = calculus.integral(startingPoint, v, { fps: c.fps });
	var birth = electric.transformator.map(
		(time, xya) => time.map(_ => xya),
		clock.interval({ inMs: c.asteroidMother.birthIntervalInMs }), xya
	)

	return {
		v: v,
		xya: xya,
		birth: birth
	}
}