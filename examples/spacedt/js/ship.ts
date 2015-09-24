import electric = require('../../../src/electric');
import eevent = require('../../../src/electric-event');
import eui = require('../../../src/emitters/ui');
import calculus = require('../../../src/calculus/calculus');
import IntegrableAntiderivativeOfTwoNumbers = require('../../../src/calculus/integrable-antiderivative-of-two-numbers');

import c = require('./constants');
import Point = require('./angled-point');

export = create;


var cont = electric.emitter.constant;


function shipAcceleration(x: number, y: number) {
	return IntegrableAntiderivativeOfTwoNumbers.of(x, y, shipVelocity);
}

function shipVelocity(x: number, y: number) {
	return IntegrableAntiderivativeOfTwoNumbers.of(x, y, Point.of, c.ship.vbounds);
}

function create(
	startingPoint: Point,
	input: {
		accelerate: electric.emitter.EventEmitter<{}>,
		deccelerate: electric.emitter.EventEmitter<{}>,
		stopAcceleration: electric.emitter.EventEmitter<{}>,
		stopDecceleration: electric.emitter.EventEmitter<{}>,
		rotateLeft: electric.emitter.EventEmitter<{}>,
		rotateRight: electric.emitter.EventEmitter<{}>,
		stopRotation: electric.emitter.EventEmitter<{}>,
		shoot: electric.emitter.EventEmitter<{}>
	}
) {
	var fps = { fps: c.fps };
	var acceleration = cont(shipAcceleration(0, 0)).change(
		{ to: (a, _) => cont(a.withX(-c.ship.acceleration.angular)),
			when: input.rotateLeft },
		{ to: (a, _) => cont(a.withX(c.ship.acceleration.angular)),
			when: input.rotateRight },

		{ to: (a, _) => cont(a.withY(c.ship.acceleration.linear)),
			when: input.accelerate },
		{ to: (a, _) => cont(a.withY(-c.ship.acceleration.de)),
			when: input.deccelerate },

		{ to: (a, _) => cont(a.withY(0)),
			when: input.stopAcceleration },
		{ to: (a, _) => cont(a.withY(0)),
			when: input.stopDecceleration },
		{ to: (a, _) => cont(a.withX(0)),
			when: input.stopRotation }
	);
	acceleration.name = 'ship acceleration';
	var velocity = calculus.integral(shipVelocity(0, 0), acceleration, fps).change({
		to: (v, _) => calculus.integral(v.withX(0), acceleration, fps),
		when: input.stopRotation.transformTime(
			eevent.notHappened, t => t + c.ship.rotationStopDelay
		)
	});
	velocity.name = 'ship velocity';
	var position = calculus.integral(startingPoint, velocity, fps);
	position.name = 'ship position'
	var shot = electric.transformator.map(
		(space, xya, v) => space.map(_ => ({ xya: xya, velocity: v })),
		input.shoot, position, velocity
	);
	shot.name = 'shot';

	return {
		a: acceleration,
		v: velocity,
		xya: position,
		shot: shot
	};
}
