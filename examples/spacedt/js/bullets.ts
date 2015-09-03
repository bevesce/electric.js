import inf = require('../../../src/interfaces');
import electric = require('../../../src/electric');

import c = require('./constants');
import Point = require('./angled-point');
import IntegrableAntiderivativeOfTwoNumbers = require('./integrable-antiderivative-of-two-numbers');
import MovingPoint = require('./moving-point');
import remove = require('./utils/remove');
import insert = require('./utils/insert');
import collision = require('./collision');

export = create;

var cont = electric.emitter.constant;
type Velocity = IntegrableAntiderivativeOfTwoNumbers<Point>;

function shootBullet(bullets: MovingPoint[], xya: Point, velocity: Velocity) {
	var speed = velocity.y + c.bullet.speed;
	var angle = xya.angle;
	var vshift = Math.sqrt(Math.max(velocity.y, 0)) + 30;
	var x = xya.x + Math.cos(xya.angle) * vshift;
	var y = xya.y + Math.sin(xya.angle) * vshift;
	var newBullet = MovingPoint.start(speed, x, y, angle);
	return insert(bullets, newBullet);
}


function create(input: {
	shoot: inf.IEmitter<inf.IElectricEvent<{ xya: Point, velocity: Velocity }>>,
	removeBoth: inf.IEmitter<inf.IElectricEvent<collision.Collision>>,
	removeFirst: inf.IEmitter<inf.IElectricEvent<collision.Collision>>
}) {
	var bullets = cont(<MovingPoint[]>[]).change(
		{ to: (bs, s) => shootBullet(bs, s.xya, s.velocity), when: input.shoot },
		{ to: (bs, c) => remove(bs, c.index1, c.index2), when: input.removeBoth },
		{ to: (bs, c) => remove(bs, c.index1), when: input.removeFirst }
	);

	var bulletsXY = electric.transformator.flattenMany(
		bullets.map(bs => bs.map(b => b.xya))
	);
	return {
		all: bullets,
		xy: bulletsXY
	}
}
