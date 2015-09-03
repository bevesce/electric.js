var electric = require('../../../src/electric');
var eevent = require('../../../src/electric-event');
var eui = require('../../../src/emitters/ui');
var clock = require('./clock');
var c = require('./constants');
var Point = require('./point');
var createShip = require('./ship');
var createAsteroidMother = require('./asteroid-mother');
var random = require('./utils/random');
var insert = require('./utils/insert');
var MovingPoint = require('./moving-point');
var keepScore = require('./score');
var cont = electric.emitter.constant;
// canvas
var canvas = document.getElementById('space');
var width = window.innerWidth;
var height = window.innerHeight;
canvas.style.height = height + 'px';
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
Point.setBounds(0, width, 0, height);
// emitters
var shipInput = {
    accelerate: eui.key('w', 'down'),
    deccelerate: eui.key('s', 'down'),
    stopAcceleration: eui.key('w', 'up'),
    stopDecceleration: eui.key('s', 'up'),
    rotateLeft: eui.key('a', 'down'),
    rotateRight: eui.key('d', 'down'),
    stopRotateLeft: eui.key('a', 'up'),
    stopRotateRight: eui.key('d', 'up'),
    shoot: eui.key('space', 'up')
};
// transformators
var shipStartingPoint = Point.of(window.innerWidth / 4, window.innerHeight / 2, -Math.PI / 2);
var ship = createShip(shipStartingPoint, shipInput);
var asteroidMotherStartingPoint = Point.of(3 * window.innerWidth / 4, window.innerHeight / 2, -Math.PI / 2);
var asteroidMother = createAsteroidMother(asteroidMotherStartingPoint);
//// Collisions
var bulletBulletCollision = electric.emitter.placeholder(eevent.notHappend);
var bulletAsteroidCollision = electric.emitter.placeholder(eevent.notHappend);
var bulletMotherCollision = electric.emitter.placeholder(eevent.notHappend);
var bulletShipCollision = electric.emitter.placeholder(eevent.notHappend);
function shootBullet(bullets, xya, velocity) {
    var speed = velocity.y + c.bullet.speed;
    var angle = xya.angle;
    var vshift = Math.sqrt(Math.max(velocity.y, 0)) + 30;
    var x = xya.x + Math.cos(xya.angle) * vshift;
    var y = xya.y + Math.sin(xya.angle) * vshift;
    var newBullet = MovingPoint.start(speed, x, y, angle);
    return cont(insert(bullets, newBullet));
}
var bullets = cont([]).change({ to: function (bs, s) { return shootBullet(bs, s.xya, s.velocity); }, when: ship.shot }, { to: function (bs, c) { return destroyMovingPoints(bs, c.index1, c.index2); }, when: bulletBulletCollision }, { to: function (bs, c) { return destroyMovingPoints(bs, c.index1); }, when: bulletAsteroidCollision }, { to: function (bs, c) { return destroyMovingPoints(bs, c.index1); }, when: bulletMotherCollision });
function destroyMovingPoints(bullets) {
    var indices = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        indices[_i - 1] = arguments[_i];
    }
    var bullets = bullets.slice();
    indices.sort(function (a, b) { return -(a - b); }).forEach(function (i) { return bullets.splice(i, 1); });
    return cont(bullets);
}
var bulletsXY = electric.transformator.flattenMany(bullets.map(function (bs) { return bs.map(function (b) { return b.xya; }); }));
function bearAsteroid(asteroids, xya) {
    var speed = 100;
    var angle = random(-Math.PI, Math.PI);
    var x = xya.x;
    var y = xya.y;
    var newBullet = MovingPoint.start(speed, x, y, angle);
    return cont(insert(asteroids, newBullet));
}
var asteroids = cont([]).change({ to: function (as, xya) { return bearAsteroid(as, xya); }, when: asteroidMother.birth }, { to: function (as, c) { return destroyMovingPoints(as, c.index2); }, when: bulletAsteroidCollision });
var asteroidsXY = electric.transformator.flattenMany(asteroids.map(function (bs) { return bs.map(function (b) { return b.xya; }); }));
var checkBulletBulletCollision = checkIfCollidingWithDistance(c.bullet.radius + c.bullet.radius);
var checkBulletAsteroidCollision = checkIfCollidingWithDistance(c.bullet.radius + c.asteroid.radius);
var checkBulletMotherCollision = checkIfCollidingWithDistance(c.bullet.radius + c.asteroidMother.radius);
var checkShipMotherCollision = checkIfCollidingWithDistance(c.ship.radius + c.asteroidMother.radius);
var checkBulletShipCollision = checkIfCollidingWithDistance(c.bullet.radius + c.ship.radius);
var checkShipAsteroidCollision = checkIfCollidingWithDistance(c.ship.radius + c.asteroid.radius);
bulletBulletCollision.is(bulletsXY.whenThen(function (bullets) {
    for (var i = 0; i < bullets.length; i++) {
        var bullet1 = bullets[i];
        for (var j = i + 1; j < bullets.length; j++) {
            var bullet2 = bullets[j];
            if (checkBulletBulletCollision(bullet1, bullet2)) {
                return {
                    index1: i,
                    index2: j,
                    x: (bullet1.x + bullet2.x) / 2,
                    y: (bullet1.y + bullet2.y) / 2
                };
            }
        }
    }
}));
var bulletsXYshipXY = electric.transformator.map(function (bs, s) { return ({ bullets: bs, ship: s }); }, bulletsXY, ship.xya);
bulletShipCollision.is(bulletsXYshipXY.whenThen(function (a) {
    for (var i = 0; i < a.bullets.length; i++) {
        var bullet = a.bullets[i];
        if (checkBulletShipCollision(bullet, a.ship)) {
            return {
                index1: i,
                index2: 0,
                x: bullet.x,
                y: bullet.y
            };
        }
    }
}));
var shipXYasteroidsXY = electric.transformator.map(function (s, as) { return ({ ship: s, asteroids: as }); }, ship.xya, asteroidsXY);
var shipAsteroidCollision = shipXYasteroidsXY.whenThen(function (a) {
    for (var i = 0; i < a.asteroids.length; i++) {
        var asteroid = a.asteroids[i];
        if (checkShipAsteroidCollision(a.ship, asteroid)) {
            return {
                index1: 0,
                index2: i,
                x: (asteroid.x + a.ship.x) / 2,
                y: (asteroid.y + a.ship.y) / 2
            };
        }
    }
});
var bulletsXYasteroidsXY = electric.transformator.map(function (bs, as) { return ({ bullets: bs, asteroids: as }); }, bulletsXY, asteroidsXY);
bulletAsteroidCollision.is(bulletsXYasteroidsXY.whenThen(function (a) {
    for (var i = 0; i < a.bullets.length; i++) {
        var bullet = a.bullets[i];
        for (var j = 0; j < a.asteroids.length; j++) {
            var asteroid = a.asteroids[j];
            if (checkBulletAsteroidCollision(bullet, asteroid)) {
                return {
                    index1: i,
                    index2: j,
                    x: asteroid.x,
                    y: asteroid.y
                };
            }
        }
    }
}));
var bulletsXYasteroidMotherXY = electric.transformator.map(function (bs, m) { return ({ bullets: bs, mother: m }); }, bulletsXY, asteroidMother.xya);
bulletMotherCollision.is(bulletsXYasteroidMotherXY.whenThen(function (a) {
    for (var i = 0; i < a.bullets.length; i++) {
        var bullet = a.bullets[i];
        if (checkBulletMotherCollision(bullet, a.mother)) {
            return {
                index1: i,
                index2: 0,
                x: bullet.x,
                y: bullet.y
            };
        }
    }
}));
var shipXYmotherXY = electric.transformator.map(function (s, m) { return ({ ship: s, mother: m }); }, ship.xya, asteroidMother.xya);
var shipMotherCollision = shipXYmotherXY.whenThen(function (a) {
    if (checkShipMotherCollision(a.ship, a.mother)) {
        return {
            index1: 0,
            index2: 0,
            x: a.ship.x,
            y: a.ship.y
        };
    }
});
function checkIfCollidingWithDistance(distance) {
    var powDistance = distance * distance;
    return function (p1, p2) {
        var dx = p1.x - p2.x;
        var dy = p1.y - p2.y;
        var dist = dx * dx + dy * dy;
        return (dist <= powDistance);
    };
}
var allCollisions = electric.transformator.merge(bulletBulletCollision, bulletAsteroidCollision, bulletMotherCollision, shipMotherCollision, bulletShipCollision, shipAsteroidCollision);
var collisionsToDraw = cont([]).change({ to: function (cs, c) { return cont(insert(cs, c)); }, when: allCollisions }, {
    to: function (cs, _) { return cont([]); },
    when: allCollisions.transformTime(eevent.notHappend, function (t) { return t + c.collision.duration; })
});
var gameEndingCollisions = electric.transformator.merge(shipMotherCollision, shipAsteroidCollision, bulletShipCollision).transformTime(eevent.notHappend, function (t) { return t + 10; });
var score = keepScore({
    asteroidHit: bulletAsteroidCollision,
    motherHit: bulletMotherCollision,
    gameEnd: gameEndingCollisions
});
// receivers
var draw = require('./draw');
draw.setCtx(canvas.getContext('2d'));
var dashboard = require('./dashboard');
var allToDraw = electric.transformator.map(function (s, bs, ms, ebs, cs) { return ({
    ship: s, bullets: bs, mothership: ms, asteroids: ebs, collisions: cs, state: 'ok'
}); }, ship.xya, bulletsXY, asteroidMother.xya, asteroidsXY, collisionsToDraw);
var drawingState = allToDraw.change({
    to: function (s, _) {
        return cont({
            ship: s.ship,
            bullets: s.bullets,
            mothership: s.mothership,
            asteroids: s.asteroids,
            collisions: s.collisions,
            state: 'game over'
        });
    },
    when: gameEndingCollisions
});
var gameOver = cont(eevent.notHappend).change({ to: clock.intervalValue(true, { inMs: 1000 }), when: gameEndingCollisions });
gameOver.plugReceiver(function (e) {
    if (e.happend) {
        draw.gameOver(width, height);
    }
});
drawingState.plugReceiver(function (a) {
    if (a.state === 'game over') {
        return;
    }
    canvas.width = canvas.width;
    draw.collisions(a.collisions);
    draw.bullets(a.bullets, c.bullet.radius, c.bullet.color);
    draw.bullets(a.asteroids, c.asteroid.radius, c.asteroid.color);
    draw.asteroidMother(a.mothership);
    draw.ship(a.ship);
});
ship.v.plugReceiver(dashboard.speed());
score.plugReceiver(dashboard.score());
