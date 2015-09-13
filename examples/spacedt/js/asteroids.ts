import electric = require('../../../src/electric');

import Point = require('./angled-point');
import MovingPoint = require('./moving-point');
import remove = require('./utils/remove');
import insert = require('./utils/insert');
import collision = require('./collision');
import c = require('./constants');

export = create;

var cont = electric.emitter.constant;

function createAsteroid(asteroids: MovingPoint[], xya: Point) {
	var speed = c.asteroid.speed;
	var angle = xya.angle;
	var x = xya.x;
	var y = xya.y
	var newAsteroid = MovingPoint.start(speed, x, y, angle)
	return insert(asteroids, newAsteroid);
}

function create(input: {
	createNew: electric.emitter.EventEmitter<Point>,
	removeSecond: electric.emitter.EventEmitter<collision.Collision>
}) {
	var asteroids = cont(<MovingPoint[]>[]).change(
		{ to: (as, xya) => createAsteroid(as, xya), when: input.createNew },
		{ to: (as, c) => remove(as, c.index2), when: input.removeSecond }
	);
	asteroids.name = 'asteroids';
	var asteroidsXY = electric.transformator.flattenMany(
		asteroids.map(as => as.map(a => a.xya))
	);
	asteroidsXY.name = 'asteroids positions'
	return {
		all: asteroids,
		xy: asteroidsXY
	}
}

