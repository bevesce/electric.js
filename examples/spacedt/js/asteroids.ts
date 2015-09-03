import inf = require('../../../src/interfaces');
import electric = require('../../../src/electric');

import Point = require('./point');
import MovingPoint = require('./moving-point');
import random = require('./utils/random');
import remove = require('./utils/remove');
import insert = require('./utils/insert');
import collision = require('./collision');

export = create;

var cont = electric.emitter.constant;

function bearAsteroid(asteroids: MovingPoint[], xya: Point) {
	var speed = 100;
	var angle = random(-Math.PI, Math.PI);
	var x = xya.x;
	var y = xya.y
	var newBullet = MovingPoint.start(speed, x, y, angle)
	return insert(asteroids, newBullet);
}

function create(input: {
	birth: inf.IEmitter<inf.IElectricEvent<Point>>,
	removeSecond: inf.IEmitter<inf.IElectricEvent<collision.Collision>>
}) {
	var asteroids = cont(<MovingPoint[]>[]).change(
		{ to: (as, xya) => bearAsteroid(as, xya), when: input.birth },
		{ to: (as, c) => remove(as, c.index2), when: input.removeSecond }
	);
	var asteroidsXY = electric.transformator.flattenMany(
		asteroids.map(bs => bs.map(b => b.xya))
	);
	return {
		all: asteroids,
		xy: asteroidsXY
	}
}