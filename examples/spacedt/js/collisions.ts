import inf = require('../../../src/interfaces');
import electric = require('../../../src/electric');

import c = require('./constants');
import Point = require('./angled-point');
import collision = require('./collision');

export = create;

var map = electric.transformator.map;


interface PreCollision {
	index1: number;
	index2: number;
	point1: Point;
	point2: Point;
}


function create(input: {
	asteroidsXY: inf.IEmitter<Point[]>,
	bulletsXY: inf.IEmitter<Point[]>,
	motherXY: inf.IEmitter<Point>,
	shipXY: inf.IEmitter<Point>,
}) {
	var checkBulletBullet = checkIfCollidingWithDistance(c.bullet.radius + c.bullet.radius);
	var bulletBullet = input.bulletsXY.whenThen(
		bullets => collisionCenterMiddle(
			checkIfCollidingInOneArray(checkBulletBullet, bullets)
		)
	);

	var checkBulletShip = checkIfCollidingWithDistance(c.bullet.radius + c.ship.radius);
	var bulletsXYshipXY = map(
		(bs, s) => ({ points: bs, point: s }),
		input.bulletsXY, input.shipXY
	)
	var bulletShip = bulletsXYshipXY.whenThen(
		(a) => collisionCenterFirstPoint(
			checkIfCollidingInArrayVsPoint(checkBulletShip, a.points, a.point)
		)
	);

	var checkShipAsteroid = checkIfCollidingWithDistance(c.ship.radius + c.asteroid.radius);
	var shipXYasteroidsXY = map(
		(s, as) => ({ point: s, points: as }),
		input.shipXY, input.asteroidsXY
	);
	var shipAsteroid = shipXYasteroidsXY.whenThen(
		(a) => collisionCenterMiddle(
			checkIfCollidingInArrayVsPoint(checkShipAsteroid, a.points, a.point)
		)
	);

	var checkBulletAsteroid = checkIfCollidingWithDistance(c.bullet.radius + c.asteroid.radius);
	var bulletsXYasteroidsXY = electric.transformator.map(
		(bs, as) => ({ points1: bs, points2: as }),
		input.bulletsXY, input.asteroidsXY
	);
	var bulletAsteroid = bulletsXYasteroidsXY.whenThen(
		(a) => collisionCenterSecondPoint(
			checkIfCollidingBetweenTwoArrays(checkBulletAsteroid, a.points1, a.points2)
		)
	);

	var checkBulletMother = checkIfCollidingWithDistance(c.bullet.radius + c.asteroidMother.radius);
	var bulletsXYmotherXY = electric.transformator.map(
		(bs, m) => ({ points: bs, point: m }),
		input.bulletsXY, input.motherXY
	)
	var bulletMother = bulletsXYmotherXY.whenThen(
		(a) => collisionCenterFirstPoint(
			checkIfCollidingInArrayVsPoint(checkBulletMother, a.points, a.point)
		)
	);
	var checkShipMother = checkIfCollidingWithDistance(c.ship.radius + c.asteroidMother.radius);
	var shipXYmotherXY = electric.transformator.map(
		(s, m) => ({ point1: s, point2: m }),
		input.shipXY, input.motherXY
	)
	var shipMother = shipXYmotherXY.whenThen(
		(a) => collisionCenterFirstPoint(
			checkIfCollidingPoints(checkShipMother, a.point1, a.point2)
		)
	)

	var all = electric.transformator.merge(
		bulletBullet,
		bulletAsteroid,
		bulletMother,
		shipMother,
		bulletShip,
		shipAsteroid
	);

	var gameEnding = electric.transformator.merge(
		shipMother, shipAsteroid, bulletShip
	);

	return {
		all: all,
		asteroid: {
			bullet: bulletAsteroid,
			ship: shipAsteroid
		},
		bullet: {
			asteroid: bulletAsteroid,
			bullet: bulletBullet,
			mother: bulletMother,
			ship: bulletShip
		},
		gameEnding: gameEnding,
		mother: {
			bullet: bulletMother,
			ship: shipMother
		},
		ship: {
			bullet: bulletShip,
			asteroid: shipAsteroid,
			mother: shipMother
		}
	}
}


function checkIfCollidingPoints(check: (p1: Point, p2: Point) => boolean, point1: Point, point2: Point) {
	if (check(point1, point2)) {
		return {
			index1: 0,
			index2: 0,
			point1: point1,
			point2: point2
		}
	}
}


function checkIfCollidingInOneArray(check: (p1: Point, p2: Point) => boolean, points: Point[]) {
	for (var i = 0; i < points.length; i++) {
		var point1 = points[i];
		for (var j = i + 1; j < points.length; j++) {
			var point2 = points[j]
			if (check(point1, point2)) {
				return {
					index1: i,
					index2: j,
					point1: point1,
					point2: point2
				}
			}
		}
	}
}

function checkIfCollidingInArrayVsPoint(check: (p1: Point, p2: Point) => boolean, points: Point[], point: Point) {
	for (var i = 0; i < points.length; i++) {
		var point1 = points[i];
		if (check(point1, point)) {
			return {
				index1: i,
				index2: 0,
				point1: point1,
				point2: point
			}
		}
	}
}

function checkIfCollidingBetweenTwoArrays(check: (p1: Point, p2: Point) => boolean, points1: Point[], points2: Point[]) {
	for (var i = 0; i < points1.length; i++) {
		var point1 = points1[i];
		for (var j = 0; j < points2.length; j++) {
			var point2 = points2[j];
			if (check(point1, point2)) {
				return {
					index1: i,
					index2: j,
					point1: point1,
					point2: point2
				}
			}
		}
	}
}

function collisionCenterFirstPoint(collision: PreCollision | void) {
	if (collision === undefined) {
		return;
	}
	return {
		index1: (<PreCollision>collision).index1,
		index2: (<PreCollision>collision).index2,
		x: (<PreCollision>collision).point1.x,
		y: (<PreCollision>collision).point1.y,
	}
}

function collisionCenterSecondPoint(collision: PreCollision | void) {
	if (collision === undefined) {
		return;
	}
	return {
		index1: (<PreCollision>collision).index1,
		index2: (<PreCollision>collision).index2,
		x: (<PreCollision>collision).point2.x,
		y: (<PreCollision>collision).point2.y,
	}
}

function collisionCenterMiddle(collision: PreCollision | void) {
	if (collision === undefined) {
		return;
	}
	return {
		index1: (<PreCollision>collision).index1,
		index2: (<PreCollision>collision).index2,
		x: ((<PreCollision>collision).point1.x + (<PreCollision>collision).point2.x) / 2,
		y: (  (<PreCollision>collision).point1.y + (<PreCollision>collision).point2.y) / 2,
	}
}

function checkIfCollidingWithDistance(distance: number) {
	var powDistance = distance * distance;
	return function(p1: Point, p2: Point) {
		var dx = p1.x - p2.x;
		var dy = p1.y - p2.y;
		var dist = dx * dx + dy * dy;
		return (dist <= powDistance);
	}
}
