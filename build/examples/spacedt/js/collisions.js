var electric = require('../../../src/electric');
var c = require('./constants');
var map = electric.transformator.map;
function create(input) {
    var checkBulletBullet = checkIfCollidingWithDistance(c.bullet.radius + c.bullet.radius);
    var bulletBullet = input.bulletsXY.whenThen(function (bullets) { return collisionCenterInMiddle(checkIfCollidingInOneArray(checkBulletBullet, bullets)); });
    bulletBullet.name = 'bullet-bullet colission';
    var checkBulletShip = checkIfCollidingWithDistance(c.bullet.radius + c.ship.radius);
    var bulletsXYshipXY = map(function (bs, s) { return ({ points: bs, point: s }); }, input.bulletsXY, input.shipXY);
    var bulletShip = bulletsXYshipXY.whenThen(function (a) { return collisionCenterAtFirstPoint(checkIfCollidingInArrayVsPoint(checkBulletShip, a.points, a.point)); });
    bulletBullet.name = 'bullet-ship colission';
    var checkShipAsteroid = checkIfCollidingWithDistance(c.ship.radius + c.asteroid.radius);
    var shipXYasteroidsXY = map(function (s, as) { return ({ point: s, points: as }); }, input.shipXY, input.asteroidsXY);
    var shipAsteroid = shipXYasteroidsXY.whenThen(function (a) { return collisionCenterInMiddle(checkIfCollidingInArrayVsPoint(checkShipAsteroid, a.points, a.point)); });
    var checkBulletAsteroid = checkIfCollidingWithDistance(c.bullet.radius + c.asteroid.radius);
    var bulletsXYasteroidsXY = electric.transformator.map(function (bs, as) { return ({ points1: bs, points2: as }); }, input.bulletsXY, input.asteroidsXY);
    var bulletAsteroid = bulletsXYasteroidsXY.whenThen(function (a) { return collisionCenterAtSecondPoint(checkIfCollidingBetweenTwoArrays(checkBulletAsteroid, a.points1, a.points2)); });
    bulletBullet.name = 'bullet-asteroid colission';
    var checkBulletMother = checkIfCollidingWithDistance(c.bullet.radius + c.asteroidMother.radius);
    var bulletsXYmotherXY = electric.transformator.map(function (bs, m) { return ({ points: bs, point: m }); }, input.bulletsXY, input.motherXY);
    var bulletMother = bulletsXYmotherXY.whenThen(function (a) { return collisionCenterAtFirstPoint(checkIfCollidingInArrayVsPoint(checkBulletMother, a.points, a.point)); });
    bulletBullet.name = 'bullet-mother colission';
    var checkShipMother = checkIfCollidingWithDistance(c.ship.radius + c.asteroidMother.radius);
    var shipXYmotherXY = electric.transformator.map(function (s, m) { return ({ point1: s, point2: m }); }, input.shipXY, input.motherXY);
    var shipMother = shipXYmotherXY.whenThen(function (a) { return collisionCenterAtFirstPoint(checkIfCollidingPoints(checkShipMother, a.point1, a.point2)); });
    bulletBullet.name = 'bullet-bullet collisions';
    bulletAsteroid.name = 'bullet-asteroid collisions';
    bulletMother.name = 'bullet-mother collisions';
    shipMother.name = 'ship-mother collisions';
    bulletShip.name = 'bullet-ship collisions';
    shipAsteroid.name = 'ship-asteroid collisions';
    var all = electric.transformator.merge(bulletBullet, bulletAsteroid, bulletMother, shipMother, bulletShip, shipAsteroid);
    all.name = 'all collisions';
    var gameEnding = electric.transformator.merge(shipMother, shipAsteroid, bulletShip);
    gameEnding.name = 'game ending collisions';
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
    };
}
function checkIfCollidingPoints(check, point1, point2) {
    if (check(point1, point2)) {
        return {
            index1: 0,
            index2: 0,
            point1: point1,
            point2: point2
        };
    }
}
function checkIfCollidingInOneArray(check, points) {
    for (var i = 0; i < points.length; i++) {
        var point1 = points[i];
        for (var j = i + 1; j < points.length; j++) {
            var point2 = points[j];
            if (check(point1, point2)) {
                return {
                    index1: i,
                    index2: j,
                    point1: point1,
                    point2: point2
                };
            }
        }
    }
}
function checkIfCollidingInArrayVsPoint(check, points, point) {
    for (var i = 0; i < points.length; i++) {
        var point1 = points[i];
        if (check(point1, point)) {
            return {
                index1: i,
                index2: 0,
                point1: point1,
                point2: point
            };
        }
    }
}
function checkIfCollidingBetweenTwoArrays(check, points1, points2) {
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
                };
            }
        }
    }
}
function collisionCenterAtFirstPoint(collision) {
    if (collision === undefined) {
        return;
    }
    return {
        index1: collision.index1,
        index2: collision.index2,
        x: collision.point1.x,
        y: collision.point1.y
    };
}
function collisionCenterAtSecondPoint(collision) {
    if (collision === undefined) {
        return;
    }
    return {
        index1: collision.index1,
        index2: collision.index2,
        x: collision.point2.x,
        y: collision.point2.y
    };
}
function collisionCenterInMiddle(collision) {
    if (collision === undefined) {
        return;
    }
    return {
        index1: collision.index1,
        index2: collision.index2,
        x: (collision.point1.x + collision.point2.x) / 2,
        y: (collision.point1.y + collision.point2.y) / 2
    };
}
function checkIfCollidingWithDistance(distance) {
    var powDistance = distance * distance;
    return function (p1, p2) {
        var dx = p1.x - p2.x;
        var dy = p1.y - p2.y;
        var dist = dx * dx + dy * dy;
        return (dist <= powDistance);
    };
}
module.exports = create;
