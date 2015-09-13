var electric = require('../../../src/electric');
var eui = require('../../../src/emitters/ui');
var clock = require('../../../src/clock');
var c = require('./constants');
var Point = require('./angled-point');
var shipDevice = require('./ship');
var motherDevice = require('./asteroid-mother');
var scoreDevice = require('./score');
var bulletsDevice = require('./bullets');
var collisionsDevice = require('./collisions');
var asteroidsDevice = require('./asteroids');
var insert = require('./utils/insert');
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
    stopRotation: electric.transformator.merge(eui.key('a', 'up'), eui.key('d', 'up')),
    shoot: eui.key('space', 'up')
};
// transformators
//// ship
var shipStartingPoint = Point.of(window.innerWidth / 4, window.innerHeight / 2, -Math.PI / 2);
var ship = shipDevice(shipStartingPoint, shipInput);
//// mother
var asteroidMotherStartingPoint = Point.of(3 * window.innerWidth / 4, window.innerHeight / 2, -Math.PI / 2);
var asteroidMother = motherDevice(asteroidMotherStartingPoint, clock.intervalOfRandom(-1, 1, { inMs: c.asteroidMother.velocityShangeInterval }));
//// bullets, asteroids & collisions
var bulletBulletCollision = electric.emitter.placeholder(electric.event.notHappend);
var bulletAsteroidCollision = electric.emitter.placeholder(electric.event.notHappend);
var bulletMotherCollision = electric.emitter.placeholder(electric.event.notHappend);
var bulletShipCollision = electric.emitter.placeholder(electric.event.notHappend);
var bullets = bulletsDevice({
    shoot: ship.shot,
    removeBoth: bulletBulletCollision,
    removeFirst: electric.transformator.merge(bulletMotherCollision, bulletAsteroidCollision)
});
var birth = electric.transformator.map(function (xy, t) { return t.map(function (v) { return Point.of(xy.x, xy.y, v); }); }, asteroidMother.xya, clock.intervalOfRandom(-Math.PI, +Math.PI, { inMs: c.asteroidMother.birthIntervalInMs }));
var asteroids = asteroidsDevice({
    createNew: birth,
    removeSecond: bulletAsteroidCollision
});
var collisions = collisionsDevice({
    bulletsXY: bullets.xy,
    shipXY: ship.xya,
    asteroidsXY: asteroids.xy,
    motherXY: asteroidMother.xya
});
bulletBulletCollision.is(collisions.bullet.bullet);
bulletShipCollision.is(collisions.bullet.ship);
bulletAsteroidCollision.is(collisions.bullet.asteroid);
bulletMotherCollision.is(collisions.bullet.mother);
var score = scoreDevice({
    asteroidHit: collisions.bullet.asteroid,
    motherHit: collisions.bullet.mother,
    gameEnd: collisions.gameEnding
});
// receivers
var draw = require('./draw');
draw.setCtx(canvas.getContext('2d'));
var dashboard = require('./dashboard');
score.plugReceiver(dashboard.score());
var collisionsToDraw = cont([]).change({ to: function (cs, c) { return insert(cs, c); }, when: collisions.all }, {
    to: function (cs, _) { return cont([]); },
    when: collisions.all.transformTime(electric.event.notHappend, function (t) { return t + c.collision.duration; })
});
collisionsToDraw.name = 'visible collisions';
var allToDraw = electric.transformator.map(function (s, bs, ms, ebs, cs) { return ({
    ship: s, bullets: bs, mothership: ms, asteroids: ebs, collisions: cs, state: 'ok'
}); }, ship.xya, bullets.xy, asteroidMother.xya, asteroids.xy, collisionsToDraw);
allToDraw.name = 'objects positions';
var gameEnd = collisions.gameEnding.transformTime(electric.event.notHappend, function (t) { return t + 10; });
gameEnd.name = 'game over';
var spaceState = allToDraw.change({
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
    when: gameEnd
});
spaceState.name = 'space state';
spaceState.plugReceiver(function renderOnCanvas(a) {
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
var gameOver = cont(electric.event.notHappend).change({ to: clock.intervalValue(true, { inMs: c.gameover.interval }), when: gameEnd });
gameOver.plugReceiver(function (e) {
    if (e.happend) {
        draw.gameOver(width, height);
    }
});
ship.v.plugReceiver(dashboard.speed());
var g = electric.graph.of(spaceState);
console.log(g.stringify());
