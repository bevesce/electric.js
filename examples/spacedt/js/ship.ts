import inf = require('../../../src/interfaces');
import electric = require('../../../src/electric');
import eevent = require('../../../src/electric-event');
import eui = require('../../../src/emitters/ui');
import calculus = require('./calculus');

import c = require('./constants');
import Acceleration = require('./acceleration');
import Velocity = require('./velocity');
import Point = require('./point');

export = create;


var cont = electric.emitter.constant;


function shipAcceleration(x: number, y: number) {
	return Acceleration.of(x, y, shipVelocity);
}

function shipVelocity(x: number, y: number) {
	return Velocity.of(x, y, Point.of, c.ship.vbounds);
}



function create(
	startingPoint: Point,
	input: {
		accelerate: inf.IEmitter<eevent<any>>,
		deccelerate: inf.IEmitter<eevent<any>>,
		stopAcceleration: inf.IEmitter<eevent<any>>,
		stopDecceleration: inf.IEmitter<eevent<any>>,
		rotateLeft: inf.IEmitter<eevent<any>>,
		rotateRight: inf.IEmitter<eevent<any>>,
		stopRotateLeft: inf.IEmitter<eevent<any>>,
		stopRotateRight: inf.IEmitter<eevent<any>>,
		shoot: inf.IEmitter<eevent<any>>
	}
) {
	var shipA = cont(shipAcceleration(0, 0)).change(
		{ to: (a, _) => cont(a.withX(-c.ship.acceleration.angular)), when: input.rotateLeft },
		{ to: (a, _) => cont(a.withX(c.ship.acceleration.angular)), when: input.rotateRight },

		{ to: (a, _) => cont(a.withX(0)), when: input.stopRotateRight },
		{ to: (a, _) => cont(a.withX(0)), when: input.stopRotateLeft },

		{ to: (a, _) => cont(a.withY(-c.ship.acceleration.de)), when: input.deccelerate },
		{ to: (a, _) => cont(a.withY(c.ship.acceleration.linear)), when: input.accelerate },

		{ to: (a, _) => cont(a.withY(0)), when: input.stopAcceleration },
		{ to: (a, _) => cont(a.withY(0)), when: input.stopDecceleration }
	);
	var shipV = calculus.integral(shipVelocity(0, 0), shipA, { fps: c.fps }).change(
		{ to: (v, _) => calculus.integral(v.withX(0), shipA, { fps: c.fps }), when: input.stopRotateRight.transformTime(eevent.notHappend, t => t + 10) },
		{ to: (v, _) => calculus.integral(v.withX(0), shipA, { fps: c.fps }), when: input.stopRotateLeft.transformTime(eevent.notHappend, t => t + 10) }
	);
	var shipXYA = calculus.integral(startingPoint, shipV, { fps: c.fps });

	var shot = electric.transformator.map(
		(space, xya, v) => space.map(_ => ({ xya: xya, velocity: v })),
		eui.key('space', 'up'), shipXYA, shipV
	);

	return {
		a: shipA,
		v: shipV,
		xya: shipXYA,
		shot: shot
	};
}
