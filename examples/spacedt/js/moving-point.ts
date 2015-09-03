import inf = require('../../../src/interfaces');
import electric = require('../../../src/electric');

import calculus = require('./calculus');

import c = require('./constants');
import Point = require('./point');
import Velocity = require('./velocity');

export = MovingPoint;

var cont = electric.emitter.constant;


function velocity(x: number, y: number) {
	return Velocity.of(x, y, Point.of);
}



class MovingPoint {
	v: inf.IEmitter<Velocity<Point>>;
	xya: inf.IEmitter<Point>;

	static start(speed: number, x0: number, y0: number, angle: number) {
		return new MovingPoint(speed, x0, y0, angle);
	}

	constructor(speed: number, x0: number, y0: number, angle: number) {
		this.v = cont(velocity(0, speed));
		this.xya = calculus.integral(
			Point.of(x0, y0, angle), this.v, { fps: c.fps }
		);
	}
}