(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var _maxX;
var _minX;
var _maxY;
var _minY;
var Point = (function () {
    function Point(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
    }
    Point.of = function (x, y, angle) {
        return new Point(x, y, angle);
    };
    Point.zero = function () {
        return Point.of(0, 0);
    };
    Point.setBounds = function (minX, maxX, minY, maxY) {
        _minX = minX;
        _maxX = maxX;
        _minY = minY;
        _maxY = maxY;
    };
    Point.prototype.addDelta = function (delta) {
        var dangle = delta.x;
        var ddist = delta.y;
        var dx = Math.cos(this.angle + dangle) * ddist;
        var dy = Math.sin(this.angle + dangle) * ddist;
        var x = boundTo(this.x + dx, _minX, _maxX);
        var y = boundTo(this.y + dy, _minY, _maxY);
        return Point.of(x, y, this.angle + dangle);
    };
    Point.prototype.equals = function (other) {
        return this.x === other.x && this.y === other.y && this.angle === other.angle;
        ;
    };
    return Point;
})();
function boundTo(v, min, max) {
    if (min == undefined || max == undefined) {
        return v;
    }
    if (v < min) {
        return max + v;
    }
    else if (v > max) {
        return min - v;
    }
    return v;
}
module.exports = Point;

},{}],2:[function(require,module,exports){
var electric = require('../../../src/electric');
var eevent = require('../../../src/electric-event');
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
    stopRotateLeft: eui.key('a', 'up'),
    stopRotateRight: eui.key('d', 'up'),
    shoot: eui.key('space', 'up')
};
// transformators
//// ship
var shipStartingPoint = Point.of(window.innerWidth / 4, window.innerHeight / 2, -Math.PI / 2);
var ship = shipDevice(shipStartingPoint, shipInput);
//// mother
var asteroidMotherStartingPoint = Point.of(3 * window.innerWidth / 4, window.innerHeight / 2, -Math.PI / 2);
var asteroidMother = motherDevice(asteroidMotherStartingPoint);
//// bullets, asteroids & collisions
var bulletBulletCollision = electric.emitter.placeholder(eevent.notHappend);
var bulletAsteroidCollision = electric.emitter.placeholder(eevent.notHappend);
var bulletMotherCollision = electric.emitter.placeholder(eevent.notHappend);
var bulletShipCollision = electric.emitter.placeholder(eevent.notHappend);
var bullets = bulletsDevice({
    shoot: ship.shot,
    removeBoth: bulletBulletCollision,
    removeFirst: electric.transformator.merge(bulletMotherCollision, bulletAsteroidCollision)
});
var asteroids = asteroidsDevice({
    birth: asteroidMother.birth,
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
    when: collisions.all.transformTime(eevent.notHappend, function (t) { return t + c.collision.duration; })
});
var allToDraw = electric.transformator.map(function (s, bs, ms, ebs, cs) { return ({
    ship: s, bullets: bs, mothership: ms, asteroids: ebs, collisions: cs, state: 'ok'
}); }, ship.xya, bullets.xy, asteroidMother.xya, asteroids.xy, collisionsToDraw);
var gameEnd = collisions.gameEnding.transformTime(eevent.notHappend, function (t) { return t + 10; });
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
    when: gameEnd
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
var gameOver = cont(eevent.notHappend).change({ to: clock.intervalValue(true, { inMs: c.gameover.interval }), when: gameEnd });
gameOver.plugReceiver(function (e) {
    if (e.happend) {
        draw.gameOver(width, height);
    }
});
ship.v.plugReceiver(dashboard.speed());
var v = require('../../../src/visualize');
var g = v.Graph.of(bullets.xy);
var nodes = g.nodes;
var links = g.links;
// console.log(JSON.stringify(nodes));
console.log(JSON.stringify(links));

},{"../../../src/clock":18,"../../../src/electric":20,"../../../src/electric-event":19,"../../../src/emitters/ui":22,"../../../src/visualize":35,"./angled-point":1,"./asteroid-mother":3,"./asteroids":4,"./bullets":5,"./collisions":6,"./constants":7,"./dashboard":8,"./draw":9,"./score":11,"./ship":12,"./utils/insert":13}],3:[function(require,module,exports){
var electric = require('../../../src/electric');
var clock = require('../../../src/clock');
var calculus = require('../../../src/calculus/calculus');
var IntegrableAntiderivativeOfTwoNumbers = require('../../../src/calculus/integrable-antiderivative-of-two-numbers');
var c = require('./constants');
var Point = require('./angled-point');
var random = require('./utils/random');
var cont = electric.emitter.constant;
function acceleration(x, y) {
    return IntegrableAntiderivativeOfTwoNumbers.of(x, y, velocity);
}
function velocity(x, y) {
    return IntegrableAntiderivativeOfTwoNumbers.of(x, y, Point.of);
}
function create(startingPoint) {
    var v = cont(velocity(-Math.PI / 2, 100)).change({ to: function (a, _) { return cont(a.withX(random(-1, 1))); }, when: clock.interval({ inMs: 2000 }) });
    var xya = calculus.integral(startingPoint, v, { fps: c.fps });
    var birth = electric.transformator.map(function (time, xya) { return time.map(function (_) { return xya; }); }, clock.interval({ inMs: c.asteroidMother.birthIntervalInMs }), xya);
    return {
        v: v,
        xya: xya,
        birth: birth
    };
}
module.exports = create;

},{"../../../src/calculus/calculus":16,"../../../src/calculus/integrable-antiderivative-of-two-numbers":17,"../../../src/clock":18,"../../../src/electric":20,"./angled-point":1,"./constants":7,"./utils/random":14}],4:[function(require,module,exports){
var electric = require('../../../src/electric');
var MovingPoint = require('./moving-point');
var random = require('./utils/random');
var remove = require('./utils/remove');
var insert = require('./utils/insert');
var cont = electric.emitter.constant;
function bearAsteroid(asteroids, xya) {
    var speed = 100;
    var angle = random(-Math.PI, Math.PI);
    var x = xya.x;
    var y = xya.y;
    var newBullet = MovingPoint.start(speed, x, y, angle);
    return insert(asteroids, newBullet);
}
function create(input) {
    var asteroids = cont([]).change({ to: function (as, xya) { return bearAsteroid(as, xya); }, when: input.birth }, { to: function (as, c) { return remove(as, c.index2); }, when: input.removeSecond });
    var asteroidsXY = electric.transformator.flattenMany(asteroids.map(function (bs) { return bs.map(function (b) { return b.xya; }); }));
    return {
        all: asteroids,
        xy: asteroidsXY
    };
}
module.exports = create;

},{"../../../src/electric":20,"./moving-point":10,"./utils/insert":13,"./utils/random":14,"./utils/remove":15}],5:[function(require,module,exports){
var electric = require('../../../src/electric');
var c = require('./constants');
var MovingPoint = require('./moving-point');
var remove = require('./utils/remove');
var insert = require('./utils/insert');
var cont = electric.emitter.constant;
function shootBullet(bullets, xya, velocity) {
    var speed = velocity.y + c.bullet.speed;
    var angle = xya.angle;
    var vshift = Math.sqrt(Math.max(velocity.y, 0)) + 30;
    var x = xya.x + Math.cos(xya.angle) * vshift;
    var y = xya.y + Math.sin(xya.angle) * vshift;
    var newBullet = MovingPoint.start(speed, x, y, angle);
    return insert(bullets, newBullet);
}
function create(input) {
    var bullets = cont([]).change({ to: function (bs, s) { return shootBullet(bs, s.xya, s.velocity); }, when: input.shoot }, { to: function (bs, c) { return remove(bs, c.index1, c.index2); }, when: input.removeBoth }, { to: function (bs, c) { return remove(bs, c.index1); }, when: input.removeFirst });
    var bulletsXY = electric.transformator.flattenMany(bullets.map(function (bs) { return bs.map(function (b) { return b.xya; }); }));
    return {
        all: bullets,
        xy: bulletsXY
    };
}
module.exports = create;

},{"../../../src/electric":20,"./constants":7,"./moving-point":10,"./utils/insert":13,"./utils/remove":15}],6:[function(require,module,exports){
var electric = require('../../../src/electric');
var c = require('./constants');
var map = electric.transformator.map;
function create(input) {
    var checkBulletBullet = checkIfCollidingWithDistance(c.bullet.radius + c.bullet.radius);
    var bulletBullet = input.bulletsXY.whenThen(function (bullets) { return collisionCenterMiddle(checkIfCollidingInOneArray(checkBulletBullet, bullets)); });
    var checkBulletShip = checkIfCollidingWithDistance(c.bullet.radius + c.ship.radius);
    var bulletsXYshipXY = map(function (bs, s) { return ({ points: bs, point: s }); }, input.bulletsXY, input.shipXY);
    var bulletShip = bulletsXYshipXY.whenThen(function (a) { return collisionCenterFirstPoint(checkIfCollidingInArrayVsPoint(checkBulletShip, a.points, a.point)); });
    var checkShipAsteroid = checkIfCollidingWithDistance(c.ship.radius + c.asteroid.radius);
    var shipXYasteroidsXY = map(function (s, as) { return ({ point: s, points: as }); }, input.shipXY, input.asteroidsXY);
    var shipAsteroid = shipXYasteroidsXY.whenThen(function (a) { return collisionCenterMiddle(checkIfCollidingInArrayVsPoint(checkShipAsteroid, a.points, a.point)); });
    var checkBulletAsteroid = checkIfCollidingWithDistance(c.bullet.radius + c.asteroid.radius);
    var bulletsXYasteroidsXY = electric.transformator.map(function (bs, as) { return ({ points1: bs, points2: as }); }, input.bulletsXY, input.asteroidsXY);
    var bulletAsteroid = bulletsXYasteroidsXY.whenThen(function (a) { return collisionCenterSecondPoint(checkIfCollidingBetweenTwoArrays(checkBulletAsteroid, a.points1, a.points2)); });
    var checkBulletMother = checkIfCollidingWithDistance(c.bullet.radius + c.asteroidMother.radius);
    var bulletsXYmotherXY = electric.transformator.map(function (bs, m) { return ({ points: bs, point: m }); }, input.bulletsXY, input.motherXY);
    var bulletMother = bulletsXYmotherXY.whenThen(function (a) { return collisionCenterFirstPoint(checkIfCollidingInArrayVsPoint(checkBulletMother, a.points, a.point)); });
    var checkShipMother = checkIfCollidingWithDistance(c.ship.radius + c.asteroidMother.radius);
    var shipXYmotherXY = electric.transformator.map(function (s, m) { return ({ point1: s, point2: m }); }, input.shipXY, input.motherXY);
    var shipMother = shipXYmotherXY.whenThen(function (a) { return collisionCenterFirstPoint(checkIfCollidingPoints(checkShipMother, a.point1, a.point2)); });
    var all = electric.transformator.merge(bulletBullet, bulletAsteroid, bulletMother, shipMother, bulletShip, shipAsteroid);
    var gameEnding = electric.transformator.merge(shipMother, shipAsteroid, bulletShip);
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
function collisionCenterFirstPoint(collision) {
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
function collisionCenterSecondPoint(collision) {
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
function collisionCenterMiddle(collision) {
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

},{"../../../src/electric":20,"./constants":7}],7:[function(require,module,exports){
var BULLET_RADIUS = 3;
var values = {
    asteroid: {
        color: '#BCACFA',
        radius: 20
    },
    asteroidMother: {
        birthIntervalInMs: 2000,
        color: '#A691FA',
        radius: 50
    },
    collision: {
        color: '#FA4141',
        duration: 100,
        radius: 30
    },
    bullet: {
        color: 'white',
        radius: 3,
        speed: 100
    },
    fps: 60,
    gameover: {
        interval: 1000
    },
    score: {
        forAsteroid: 3,
        forMother: 100
    },
    ship: {
        acceleration: {
            angular: 10,
            de: 1600,
            linear: 400
        },
        color: 'white',
        radius: 5,
        vbounds: {
            maxX: 5,
            maxY: 2000,
            minX: -5,
            minY: -50
        }
    }
};
module.exports = values;

},{}],8:[function(require,module,exports){
var rui = require('../../../src/receivers/ui');
var c = require('./constants');
function speed() {
    var speedBar = document.getElementById('speed');
    var speedCurrent = document.getElementById('speed-current');
    var speedLeft = document.getElementById('speed-tomax');
    var aSpeedLeft = document.getElementById('angular-speed-left');
    var aSpeedCurrent = document.getElementById('angular-speed-current');
    var aSpeedRight = document.getElementById('angular-speed-right');
    return function (s) {
        var speed = Math.abs(s.y);
        var w = speedBar.offsetWidth;
        var wh = w / 2;
        var sc = speed / c.ship.vbounds.maxY * w;
        var sl = w - sc;
        speedCurrent.style.width = sc + 'px';
        speedLeft.style.width = sl + 'px';
        var anulgarSpeed = s.x;
        if (anulgarSpeed < 0) {
            aSpeedRight.style.width = wh + 'px';
            var l = (anulgarSpeed / c.ship.vbounds.minX) * wh;
            aSpeedLeft.style.width = (wh - l) + 'px';
            aSpeedCurrent.style.width = l + 'px';
        }
        else {
            aSpeedLeft.style.width = wh + 'px';
            var l = (anulgarSpeed / c.ship.vbounds.maxX) * wh;
            aSpeedRight.style.width = (wh - l) + 'px';
            aSpeedCurrent.style.width = l + 'px';
        }
    };
}
exports.speed = speed;
function score() {
    return rui.htmlReceiverById('score');
}
exports.score = score;

},{"../../../src/receivers/ui":26,"./constants":7}],9:[function(require,module,exports){
var c = require('./constants');
var random = require('./utils/random');
var _ctx;
function setCtx(ctx) {
    _ctx = ctx;
}
exports.setCtx = setCtx;
function ship(ship) {
    _ctx.strokeStyle = c.ship.color;
    _ctx.fillStyle = c.ship.color;
    _ctx.lineWidth = 3;
    var lShift = Math.cos(ship.angle) * 20;
    var pShift = Math.sin(ship.angle) * 20;
    var lShift2 = Math.cos(ship.angle + Math.PI / 2) * 5;
    var pShift2 = Math.sin(ship.angle + Math.PI / 2) * 5;
    var pX = -lShift * 0.5 + ship.x;
    var pY = -pShift * 0.5 + ship.y;
    _ctx.beginPath();
    _ctx.moveTo(ship.x + lShift * 0.5, ship.y + pShift * 0.5);
    _ctx.lineTo(pX + lShift2, pY + pShift2);
    _ctx.lineTo(pX - lShift2, pY - pShift2);
    _ctx.lineTo(ship.x + lShift * 0.5, ship.y + pShift * 0.5);
    _ctx.fill();
    pX = ship.x;
    pY = ship.y;
    _ctx.stroke();
}
exports.ship = ship;
function bullets(bullets, radius, color) {
    _ctx.fillStyle = color;
    for (var k in bullets) {
        var bullet = bullets[k];
        _ctx.beginPath();
        _ctx.arc(bullet.x, bullet.y, radius, 0, 2 * Math.PI, true);
        _ctx.fill();
    }
}
exports.bullets = bullets;
function collisions(collisions) {
    _ctx.fillStyle = c.collision.color;
    collisions.forEach(function (collision) {
        _ctx.beginPath();
        _ctx.arc(collision.x, collision.y, c.collision.radius, 0, 2 * Math.PI, true);
        _ctx.fill();
    });
}
exports.collisions = collisions;
function asteroidMother(mothership) {
    _ctx.beginPath();
    _ctx.fillStyle = c.asteroidMother.color;
    _ctx.arc(mothership.x, mothership.y, c.asteroidMother.radius, 0, 2 * Math.PI, true);
    _ctx.fill();
}
exports.asteroidMother = asteroidMother;
function gameOver(width, height) {
    _ctx.beginPath();
    _ctx.font = 'bold 48px Avenir, sans-serif';
    _ctx.fillStyle = c.collision.color;
    _ctx.fillText('∫GAME OVERdt', random(0, width - 300), random(50, height - 50));
}
exports.gameOver = gameOver;

},{"./constants":7,"./utils/random":14}],10:[function(require,module,exports){
var electric = require('../../../src/electric');
var calculus = require('../../../src/calculus/calculus');
var IntegrableAntiderivativeOfTwoNumbers = require('../../../src/calculus/integrable-antiderivative-of-two-numbers');
var c = require('./constants');
var Point = require('./angled-point');
var cont = electric.emitter.constant;
function velocity(x, y) {
    return IntegrableAntiderivativeOfTwoNumbers.of(x, y, Point.of);
}
var MovingPoint = (function () {
    function MovingPoint(speed, x0, y0, angle) {
        this.v = cont(velocity(0, speed));
        this.xya = calculus.integral(Point.of(x0, y0, angle), this.v, { fps: c.fps });
    }
    MovingPoint.start = function (speed, x0, y0, angle) {
        return new MovingPoint(speed, x0, y0, angle);
    };
    return MovingPoint;
})();
module.exports = MovingPoint;

},{"../../../src/calculus/calculus":16,"../../../src/calculus/integrable-antiderivative-of-two-numbers":17,"../../../src/electric":20,"./angled-point":1,"./constants":7}],11:[function(require,module,exports){
var electric = require('../../../src/electric');
var c = require('./constants');
var cont = electric.emitter.constant;
function score(input) {
    return cont(0).change({ to: function (s, _) { return cont(s + c.score.forAsteroid); }, when: input.asteroidHit }, { to: function (s, _) { return cont(s + c.score.forMother); }, when: input.motherHit }).change({ to: function (s, _) { return cont(s); }, when: input.gameEnd });
}
module.exports = score;

},{"../../../src/electric":20,"./constants":7}],12:[function(require,module,exports){
var electric = require('../../../src/electric');
var eevent = require('../../../src/electric-event');
var eui = require('../../../src/emitters/ui');
var calculus = require('../../../src/calculus/calculus');
var IntegrableAntiderivativeOfTwoNumbers = require('../../../src/calculus/integrable-antiderivative-of-two-numbers');
var c = require('./constants');
var Point = require('./angled-point');
var cont = electric.emitter.constant;
function shipAcceleration(x, y) {
    return IntegrableAntiderivativeOfTwoNumbers.of(x, y, shipVelocity);
}
function shipVelocity(x, y) {
    return IntegrableAntiderivativeOfTwoNumbers.of(x, y, Point.of, c.ship.vbounds);
}
function create(startingPoint, input) {
    var shipA = cont(shipAcceleration(0, 0)).change({ to: function (a, _) { return cont(a.withX(-c.ship.acceleration.angular)); }, when: input.rotateLeft }, { to: function (a, _) { return cont(a.withX(c.ship.acceleration.angular)); }, when: input.rotateRight }, { to: function (a, _) { return cont(a.withX(0)); }, when: input.stopRotateRight }, { to: function (a, _) { return cont(a.withX(0)); }, when: input.stopRotateLeft }, { to: function (a, _) { return cont(a.withY(-c.ship.acceleration.de)); }, when: input.deccelerate }, { to: function (a, _) { return cont(a.withY(c.ship.acceleration.linear)); }, when: input.accelerate }, { to: function (a, _) { return cont(a.withY(0)); }, when: input.stopAcceleration }, { to: function (a, _) { return cont(a.withY(0)); }, when: input.stopDecceleration });
    var shipV = calculus.integral(shipVelocity(0, 0), shipA, { fps: c.fps }).change({ to: function (v, _) { return calculus.integral(v.withX(0), shipA, { fps: c.fps }); }, when: input.stopRotateRight.transformTime(eevent.notHappend, function (t) { return t + 10; }) }, { to: function (v, _) { return calculus.integral(v.withX(0), shipA, { fps: c.fps }); }, when: input.stopRotateLeft.transformTime(eevent.notHappend, function (t) { return t + 10; }) });
    var shipXYA = calculus.integral(startingPoint, shipV, { fps: c.fps });
    var shot = electric.transformator.map(function (space, xya, v) { return space.map(function (_) { return ({ xya: xya, velocity: v }); }); }, eui.key('space', 'up'), shipXYA, shipV);
    return {
        a: shipA,
        v: shipV,
        xya: shipXYA,
        shot: shot
    };
}
module.exports = create;

},{"../../../src/calculus/calculus":16,"../../../src/calculus/integrable-antiderivative-of-two-numbers":17,"../../../src/electric":20,"../../../src/electric-event":19,"../../../src/emitters/ui":22,"./angled-point":1,"./constants":7}],13:[function(require,module,exports){
var electric = require('../../../../src/electric');
var cont = electric.emitter.constant;
function insert(list, item) {
    var l = list.slice();
    l.push(item);
    return cont(l);
}
module.exports = insert;

},{"../../../../src/electric":20}],14:[function(require,module,exports){
function random(min, max) {
    return Math.random() * (max - min) + min;
}
module.exports = random;

},{}],15:[function(require,module,exports){
var electric = require('../../../../src/electric');
var cont = electric.emitter.constant;
function remove(bullets) {
    var indices = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        indices[_i - 1] = arguments[_i];
    }
    var bullets = bullets.slice();
    indices.sort(function (a, b) { return -(a - b); }).forEach(function (i) { return bullets.splice(i, 1); });
    return cont(bullets);
}
module.exports = remove;

},{"../../../../src/electric":20}],16:[function(require,module,exports){
var clock = require('../clock');
var scheduler = require('../scheduler');
var transformator = require('../transformator');
function integral(initialValue, emitter, options) {
    var timmed = timeValue(emitter, options);
    var result = timmed.accumulate({
        time: scheduler.now(),
        value: emitter.dirtyCurrentValue(),
        sum: initialValue
    }, function (acc, v) {
        var now = scheduler.now();
        var dt = now - acc.time;
        var nv = v.value.add(acc.value).mulT(dt / 2);
        var sum = acc.sum.addDelta(nv);
        return {
            time: now,
            value: v.value,
            sum: sum
        };
    }).map(function (v) { return v.sum; });
    result.name = 'integral';
    result.setEquals(function (x, y) { return x.equals(y); });
    result.stabilize = function () { return timmed.stabilize(); };
    return result;
}
exports.integral = integral;
function differential(initialValue, emitter, options) {
    var timmed = timeValue(emitter, options);
    var result = timmed.accumulate({
        time: scheduler.now(),
        value: emitter.dirtyCurrentValue(),
        diff: initialValue
    }, function (acc, v) {
        var dt = v.time - acc.time;
        var diff = v.value.sub(acc.value).divT(dt);
        return {
            time: v.time,
            value: v.value,
            diff: diff
        };
    }).map(function (v) { return v.diff; });
    result.setEquals(function (x, y) { return x.equals(y); });
    result.name = 'differential';
    return result;
}
exports.differential = differential;
function timeValue(emitter, options) {
    var time = clock.time(options);
    var trans = transformator.map(function (t, v) { return ({ time: t, value: v }); }, time, emitter);
    trans.stabilize = function () { return time.stabilize(); };
    trans.name = 'timeValue';
    return trans;
}

},{"../clock":18,"../scheduler":28,"../transformator":30}],17:[function(require,module,exports){
var IntegrableAntiderivativeOfTwoNumbers = (function () {
    function IntegrableAntiderivativeOfTwoNumbers(x, y, antiderivative, bounds) {
        this.bounds = bounds || {};
        this.x = within(x, this.bounds.minX, this.bounds.maxX);
        this.y = within(y, this.bounds.minY, this.bounds.maxY);
        this.antiderivative = antiderivative;
    }
    IntegrableAntiderivativeOfTwoNumbers.of = function (x, y, antiderivative, bounds) {
        return new IntegrableAntiderivativeOfTwoNumbers(x, y, antiderivative, bounds);
    };
    IntegrableAntiderivativeOfTwoNumbers.zero = function (antiderivative, bounds) {
        return IntegrableAntiderivativeOfTwoNumbers.of(0, 0, antiderivative, bounds);
    };
    IntegrableAntiderivativeOfTwoNumbers.prototype.add = function (other) {
        var x = within(this.x + other.x, this.bounds.minX, this.bounds.maxX);
        var y = within(this.y + other.y, this.bounds.minY, this.bounds.maxY);
        return IntegrableAntiderivativeOfTwoNumbers.of(x, y, this.antiderivative, this.bounds);
    };
    IntegrableAntiderivativeOfTwoNumbers.prototype.addDelta = function (delta) {
        return this.add(delta);
    };
    IntegrableAntiderivativeOfTwoNumbers.prototype.equals = function (other) {
        return this.x === other.x && this.y === other.y;
    };
    IntegrableAntiderivativeOfTwoNumbers.prototype.mulT = function (dt) {
        var dx = this.x * dt / 1000;
        var dy = this.y * dt / 1000;
        return this.antiderivative(dx, dy);
    };
    IntegrableAntiderivativeOfTwoNumbers.prototype.withX = function (x) {
        return IntegrableAntiderivativeOfTwoNumbers.of(x, this.y, this.antiderivative, this.bounds);
    };
    IntegrableAntiderivativeOfTwoNumbers.prototype.withY = function (y) {
        return IntegrableAntiderivativeOfTwoNumbers.of(this.x, y, this.antiderivative, this.bounds);
    };
    return IntegrableAntiderivativeOfTwoNumbers;
})();
function within(v, min, max) {
    if (max !== undefined && v > max) {
        return max;
    }
    if (min !== undefined && v < min) {
        return min;
    }
    return v;
}
module.exports = IntegrableAntiderivativeOfTwoNumbers;

},{}],18:[function(require,module,exports){
var scheduler = require('./scheduler');
var emitter = require('./emitter');
function interval(options) {
    var timer = emitter.manualEvent();
    scheduler.scheduleInterval(function () {
        timer.impulse(Date.now());
    }, calculateInterval(options.inMs, options.fps));
    timer.name = "interval(" + calculateEmitterName(options) + ")";
    return timer;
}
exports.interval = interval;
function intervalValue(value, options) {
    var timer = emitter.manualEvent();
    scheduler.scheduleInterval(function () {
        timer.impulse(value);
    }, calculateInterval(options.inMs, options.fps));
    timer.name = "intervalValue(" + value + ", " + calculateEmitterName(options) + ")";
    return timer;
}
exports.intervalValue = intervalValue;
function time(options) {
    var interval = calculateInterval(options.intervalInMs, options.fps);
    var timeEmitter = emitter.manual(scheduler.now());
    var id = scheduler.scheduleInterval(function () { return timeEmitter.emit((scheduler.now())); }, interval);
    timeEmitter.setReleaseResources(function () { return scheduler.unscheduleInterval(id); });
    timeEmitter.name = "time(" + calculateEmitterName(options) + ")";
    return timeEmitter;
}
exports.time = time;
function calculateInterval(intervalInMs, fps) {
    if (intervalInMs === undefined) {
        return 1 / fps * 1000;
    }
    else {
        return intervalInMs;
    }
}
function calculateEmitterName(options) {
    if (options.fps !== undefined) {
        return 'fps: ' + options.fps;
    }
    else if (options.inMs !== undefined) {
        return 'interval: ' + options.inMs + 'ms';
    }
    else {
        return 'interval: ' + options.intervalInMs + 'ms';
    }
}

},{"./emitter":21,"./scheduler":28}],19:[function(require,module,exports){
var all = require('./utils/all');
var ElectricEvent = (function () {
    function ElectricEvent() {
    }
    ElectricEvent.restore = function (e) {
        if (e.happend) {
            return ElectricEvent.of(e.value);
        }
        return ElectricEvent.notHappend;
    };
    ElectricEvent.of = function (value) {
        return new Happend(value);
    };
    ElectricEvent.lift = function (f) {
        return function () {
            var vs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                vs[_i - 0] = arguments[_i];
            }
            if (all(vs.map(function (v) { return v.happend; }))) {
                return ElectricEvent.of(f.apply(null, vs.map(function (v) { return v.value; })));
            }
            else {
                return ElectricEvent.notHappend;
            }
        };
    };
    ElectricEvent.flatLift = function (f) {
        return function (v1) {
            if (v1.happend) {
                return f(v1.value);
            }
            else {
                return ElectricEvent.notHappend;
            }
        };
    };
    ElectricEvent.liftOnFirst = function (f) {
        return function (v1, v2) {
            if (v1.happend) {
                return ElectricEvent.of(f(v1.value, v2));
            }
            else {
                return ElectricEvent.notHappend;
            }
        };
    };
    ElectricEvent.prototype.map = function (f) {
        throw Error('ElectricEvent is abstract class, use Happend and NotHappend');
    };
    ;
    ElectricEvent.prototype.flattenMap = function (f) {
        throw Error('ElectricEvent is abstract class, use Happend and NotHappend');
    };
    return ElectricEvent;
})();
var Happend = (function () {
    function Happend(value) {
        this.happend = true;
        this.value = value;
    }
    Happend.prototype.toString = function () {
        return "Happend: " + this.value.toString();
    };
    Happend.prototype.map = function (f) {
        return ElectricEvent.of(f(this.value));
    };
    Happend.prototype.flattenMap = function (f) {
        return f(this.value);
    };
    return Happend;
})();
var NotHappend = (function () {
    function NotHappend() {
        this.happend = false;
        this.value = undefined;
    }
    NotHappend.prototype.toString = function () {
        return 'NotHappend';
    };
    NotHappend.prototype.map = function (f) {
        return ElectricEvent.notHappend;
    };
    NotHappend.prototype.flattenMap = function (f) {
        return ElectricEvent.notHappend;
    };
    return NotHappend;
})();
ElectricEvent.notHappend = new NotHappend();
module.exports = ElectricEvent;

},{"./utils/all":32}],20:[function(require,module,exports){
exports.scheduler = require('./scheduler');
exports.emitter = require('./emitter');
exports.transformator = require('./transformator');
exports.receiver = require('./receiver');
exports.clock = require('./clock');
exports.transmitter = require('./transmitter');
exports.calculus = require('./calculus/calculus');
exports.event = require('./electric-event');
exports.e = exports.emitter;
exports.t = exports.transformator;
exports.r = exports.receiver;
exports.c = exports.calculus;

},{"./calculus/calculus":16,"./clock":18,"./electric-event":19,"./emitter":21,"./receiver":25,"./scheduler":28,"./transformator":30,"./transmitter":31}],21:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var scheduler = require('./scheduler');
var transformators = require('./transformator-helpers');
var eevent = require('./electric-event');
var Wire = require('./wire');
var fn = require('./utils/fn');
exports.placeholder = require('./placeholder');
var Emitter = (function () {
    function Emitter(initialValue) {
        if (initialValue === void 0) { initialValue = undefined; }
        this._receivers = [];
        this._currentValue = initialValue;
        this.name = (this.name);
    }
    Emitter.prototype.toString = function () {
        return "| " + this.name + " | " + this.dirtyCurrentValue().toString() + " |>";
    };
    // when reveiver is plugged current value is not emitted to him
    // instantaneously, but instead it's done asynchronously
    Emitter.prototype.plugReceiver = function (receiver) {
        if (typeof receiver !== 'function' && receiver.wire) {
            receiver = receiver.wire(this);
        }
        this._receivers.push(receiver);
        this._asyncDispatchToReceiver(receiver, this._currentValue);
        return this._receivers.length - 1;
    };
    Emitter.prototype._dirtyPlugReceiver = function (receiver) {
        if (typeof receiver !== 'function' && receiver.wire) {
            receiver = receiver.wire(this);
        }
        this._receivers.push(receiver);
        // this._asyncDispatchToReceiver(receiver, this._currentValue);
        return this._receivers.length - 1;
    };
    Emitter.prototype.unplugReceiver = function (receiverOrId) {
        var index = this._getIndexOfReceiver(receiverOrId);
        this._receivers.splice(index, 1);
    };
    Emitter.prototype._getIndexOfReceiver = function (receiverOrId) {
        if (typeof receiverOrId === 'number') {
            return receiverOrId;
        }
        else {
            return this._receivers.indexOf(receiverOrId);
        }
    };
    Emitter.prototype.dirtyCurrentValue = function () {
        return this._currentValue;
    };
    Emitter.prototype.stabilize = function () {
        this.emit = this._throwStabilized;
        this.impulse = this._throwStabilized;
        this._releaseResources();
    };
    Emitter.prototype.setReleaseResources = function (releaseResources) {
        this._releaseResources = releaseResources;
    };
    Emitter.prototype._releaseResources = function () {
        // should be overwritten in more specific emitters
    };
    Emitter.prototype._throwStabilized = function (value) {
        throw Error("can't emit <" + value + "> from " + this.name + ", it's stabilized");
    };
    // let's say that f = constant(y).emit(x) is called at t_e
    // then f(t) = x for t >= t_e, and f(t) = y for t < t_e
    Emitter.prototype.emit = function (value) {
        if (this._equals(this._currentValue, value)) {
            return;
        }
        this._dispatchToReceivers(value);
        this._currentValue = value;
    };
    // let's say that f constant(y).impulse(x) is called at t_i
    // then f(t_i) = x and f(t) = y when t != t_i
    Emitter.prototype.impulse = function (value) {
        if (this._equals(this._currentValue, value)) {
            return;
        }
        this._dispatchToReceivers(value);
        this._dispatchToReceivers(this._currentValue);
    };
    Emitter.prototype._equals = function (x, y) {
        return x === y;
    };
    Emitter.prototype.setEquals = function (equals) {
        this._equals = equals;
    };
    Emitter.prototype._dispatchToReceivers = function (value) {
        var currentReceivers = this._receivers.slice();
        for (var _i = 0; _i < currentReceivers.length; _i++) {
            var receiver = currentReceivers[_i];
            // this._asyncDispatchToReceiver(receiver, value);
            this._dispatchToReceiver(receiver, value);
        }
    };
    Emitter.prototype._dispatchToReceiver = function (receiver, value) {
        if (typeof receiver === 'function') {
            receiver(value);
        }
        else {
            receiver.receive(value);
        }
    };
    Emitter.prototype._asyncDispatchToReceivers = function (value) {
        var currentReceivers = this._receivers.slice();
        for (var _i = 0; _i < currentReceivers.length; _i++) {
            var receiver = currentReceivers[_i];
            this._asyncDispatchToReceiver(receiver, value);
        }
    };
    Emitter.prototype._asyncDispatchToReceiver = function (receiver, value) {
        var _this = this;
        scheduler.scheduleTimeout(function () { return _this._dispatchToReceiver(receiver, value); }, 0);
    };
    // transformators
    Emitter.prototype.map = function (mapping) {
        return namedTransformator("map(" + fn(mapping) + ")", [this], transformators.map(mapping, 1), mapping(this._currentValue));
    };
    Emitter.prototype.filter = function (initialValue, predicate) {
        return namedTransformator("filter(" + fn(predicate) + ")", [this], transformators.filter(predicate), initialValue);
    };
    Emitter.prototype.filterMap = function (initialValue, mapping) {
        return namedTransformator("filterMap(" + fn(mapping) + ")", [this], transformators.filterMap(mapping), initialValue);
    };
    Emitter.prototype.transformTime = function (initialValue, timeShift, t0) {
        if (t0 === void 0) { t0 = 0; }
        var t = namedTransformator("transformTime(" + fn(timeShift) + ")", [this], transformators.transformTime(timeShift, t0), initialValue);
        this._dispatchToReceiver(t._dirtyGetWireTo(this), this.dirtyCurrentValue());
        return t;
    };
    Emitter.prototype.accumulate = function (initialValue, accumulator) {
        var acc = accumulator(initialValue, this.dirtyCurrentValue());
        return namedTransformator("accumulate(" + fn(accumulator) + ")", [this], transformators.accumulate(acc, accumulator), acc);
    };
    Emitter.prototype.merge = function () {
        var emitters = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            emitters[_i - 0] = arguments[_i];
        }
        return namedTransformator('merge', [this].concat(emitters), transformators.merge(), this.dirtyCurrentValue());
    };
    Emitter.prototype.when = function (switcher) {
        var t = namedTransformator('whenHappensThen', [this], transformators.when(switcher.happens, switcher.then), eevent.notHappend);
        return t;
    };
    Emitter.prototype.whenThen = function (happens) {
        var t = namedTransformator('whenThen', [this], transformators.whenThen(happens), eevent.notHappend);
        return t;
    };
    Emitter.prototype.sample = function (initialValue, samplingEvent) {
        var t = namedTransformator('sample', [this, samplingEvent], transformators.sample(), initialValue);
        return t;
    };
    Emitter.prototype.change = function () {
        var switchers = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            switchers[_i - 0] = arguments[_i];
        }
        return namedTransformator('changeToWhen', [this].concat(switchers.map(function (s) { return s.when; })), transformators.change(switchers), this._currentValue);
    };
    return Emitter;
})();
exports.Emitter = Emitter;
function emitter(initialValue) {
    return new Emitter(initialValue);
}
exports.emitter = emitter;
var ManualEmitter = (function (_super) {
    __extends(ManualEmitter, _super);
    function ManualEmitter() {
        _super.apply(this, arguments);
    }
    ManualEmitter.prototype.emit = function (v) {
        var _this = this;
        scheduler.scheduleTimeout(function () { return _super.prototype.emit.call(_this, v); }, 0);
    };
    ManualEmitter.prototype.impulse = function (v) {
        var _this = this;
        scheduler.scheduleTimeout(function () { return _super.prototype.impulse.call(_this, v); }, 0);
    };
    ManualEmitter.prototype.stabilize = function () {
        _super.prototype.stabilize.call(this);
        this.emit = this.emit;
        this.impulse = this.impulse;
    };
    return ManualEmitter;
})(Emitter);
function manual(initialValue, name) {
    var e = new ManualEmitter(initialValue);
    e.name = name || 'manual';
    return e;
}
exports.manual = manual;
function constant(value) {
    var e = new Emitter(value);
    e.name = "constant(" + value + ")";
    return e;
}
exports.constant = constant;
function manualEvent(name) {
    // manual event emitter should
    // pack impulsed values into event
    // and not allow to emit values
    // it's done by monkey patching ManualEmitter
    var e = manual(eevent.notHappend);
    var oldImpulse = e.impulse;
    e.impulse = function (v) { return oldImpulse.apply(e, [eevent.of(v)]); };
    e.emit = function (v) {
        throw Error("can't emit from event emitter, only impulse");
    };
    e.name = name || 'manualEvent';
    // monkey patching requires ugly casting...
    return e;
}
exports.manualEvent = manualEvent;
var Transformator = (function (_super) {
    __extends(Transformator, _super);
    function Transformator(emitters, transform, initialValue) {
        if (transform === void 0) { transform = undefined; }
        if (initialValue === void 0) { initialValue = undefined; }
        _super.call(this, initialValue);
        this.name = 'transformator';
        this._values = Array(emitters.length);
        if (transform) {
            this.setTransform(transform);
        }
        this._wires = [];
        this.plugEmitters(emitters);
    }
    Transformator.prototype.toString = function () {
        return "<| " + this.name + " | " + this.dirtyCurrentValue().toString() + " |>";
    };
    Transformator.prototype.setTransform = function (transform) {
        var _this = this;
        this._transform = transform(function (x) { return _this.emit(x); }, function (x) { return _this.impulse(x); });
    };
    Transformator.prototype._transform = function (values, index) {
        // Default implementation that just passes values
        // Should be overwritten in functions that create Transformators
        this.emit(values[index]);
    };
    Transformator.prototype.plugEmitters = function (emitters) {
        var _this = this;
        emitters.forEach(function (e) { return _this.wire(e); });
        for (var i = 0; i < emitters.length; i++) {
            this._values[i] = emitters[i].dirtyCurrentValue();
        }
    };
    Transformator.prototype.plugEmitter = function (emitter) {
        this.wire(emitter);
        this._values[this._wires.length - 1] = emitter.dirtyCurrentValue();
        return this._wires.length - 1;
    };
    Transformator.prototype.unplugEmitter = function (emitter) {
        this._wires.filter(function (w) { return w.input === emitter; }).forEach(function (w) { return w.unplug(); });
    };
    Transformator.prototype.dropEmitters = function (start) {
        var wiresToDrop = this._wires.slice(1);
        wiresToDrop.forEach(function (w) { return w.unplug(); });
        this._wires.splice(start, this._wires.length);
        this._values.splice(start, this._values.length);
    };
    Transformator.prototype.wire = function (emitter) {
        var _this = this;
        var index = this._wires.length;
        this._wires[index] = new Wire(emitter, this, (function (index) { return function (x) { return _this.receiveOn(x, index); }; })(index), (function (index) { return function (x) { return _this.setOn(x, index); }; })(index));
        return this._wires[index];
    };
    Transformator.prototype._dirtyGetWireTo = function (emitter) {
        return this._wires.filter(function (w) { return w.input === emitter; })[0];
    };
    Transformator.prototype.receiveOn = function (value, index) {
        this._values[index] = value;
        this._transform(this._values, index);
    };
    Transformator.prototype.setOn = function (value, index) {
        this._values[index] = value;
    };
    return Transformator;
})(Emitter);
exports.Transformator = Transformator;
function namedTransformator(name, emitters, transform, initialValue) {
    if (transform === void 0) { transform = undefined; }
    var t = new Transformator(emitters, transform, initialValue);
    t.name = name;
    return t;
}
exports.namedTransformator = namedTransformator;

},{"./electric-event":19,"./placeholder":24,"./scheduler":28,"./transformator-helpers":29,"./utils/fn":34,"./wire":36}],22:[function(require,module,exports){
var electric = require('../electric');
var utils = require('../receivers/utils');
var transformator = require('../transformator');
var eevent = require('../electric-event');
var fp = require('../fp');
var keyCodes = {
    up: 38,
    down: 40,
    left: 37,
    right: 39,
    w: 87,
    a: 65,
    s: 83,
    d: 68,
    enter: 13,
    space: 32
};
// NEW
function clicks(nodeOrId, mapping) {
    if (mapping === void 0) { mapping = fp.identity; }
    var button = utils.getNode(nodeOrId);
    var emitter = electric.emitter.manualEvent();
    function emitterListener(event) {
        emitter.impulse(mapping(event));
    }
    button.addEventListener('click', emitterListener, false);
    emitter.setReleaseResources(function () { return button.removeEventListener('click', emitterListener); });
    emitter.name = '| clicks on ' + nodeOrId + ' |>';
    return emitter;
}
exports.clicks = clicks;
function arrows(layout, nodeOrId, type) {
    if (layout === void 0) { layout = 'arrows'; }
    if (nodeOrId === void 0) { nodeOrId = document; }
    if (type === void 0) { type = 'keydown'; }
    var layouts = {
        'arrows': {
            38: 'up', 40: 'down', 37: 'left', 39: 'right'
        },
        'wasd': {
            87: 'up', 83: 'down', 65: 'left', 68: 'right'
        },
        'hjkl': {
            75: 'up', 74: 'down', 72: 'left', 76: 'right'
        },
        'ijkl': {
            73: 'up', 75: 'down', 74: 'left', 76: 'right'
        }
    };
    var keyCodes = layouts[layout];
    var target = utils.getNode(nodeOrId);
    var emitter = electric.emitter.manualEvent();
    function emitterListener(event) {
        var direction = keyCodes[event.keyCode];
        if (direction) {
            event.preventDefault();
            emitter.impulse(direction);
        }
    }
    target.addEventListener(type, emitterListener);
    emitter.name = '| arrows |>';
    return emitter;
}
exports.arrows = arrows;
function key(name, type, nodeOrId) {
    if (nodeOrId === void 0) { nodeOrId = document; }
    var target = utils.getNode(nodeOrId);
    var emitter = electric.emitter.manualEvent();
    var keyCode = keyCodes[name];
    function emitterListener(event) {
        if (event.keyCode === keyCode) {
            event.preventDefault();
            emitter.impulse(name);
        }
    }
    target.addEventListener('key' + type, emitterListener);
    emitter.name = '| key ' + name + ' on ' + type + ' |>';
    return emitter;
}
exports.key = key;
// OLD
function em(text) {
    return '`' + text + '`';
}
function fromEvent(target, type, name, useCapture) {
    if (name === void 0) { name = ''; }
    if (useCapture === void 0) { useCapture = false; }
    var emitter = electric.emitter.manualEvent();
    emitter.name = name || '| event: ' + type + ' on ' + em(target) + '|>';
    var impulse = function (event) {
        // event.preventDefault();
        emitter.impulse(event);
    };
    target.addEventListener(type, impulse, useCapture);
    emitter.setReleaseResources(function () { return target.removeEventListener(type, impulse, useCapture); });
    return emitter;
}
exports.fromEvent = fromEvent;
function fromButton(nodeOrId) {
    var button = utils.getNode(nodeOrId);
    return fromEvent(button, 'click', 'button clicks on ' + em(nodeOrId));
}
exports.fromButton = fromButton;
function fromInputText(nodeOrId, type) {
    if (type === void 0) { type = 'keyup'; }
    var input = utils.getNode(nodeOrId);
    return fromEvent(input, 'keyup', 'text of ' + em(nodeOrId)).map(function () { return input.value; });
}
exports.fromInputText = fromInputText;
function fromInputTextEnter(nodeOrId) {
    var input = utils.getNode(nodeOrId);
    var e = electric.emitter.manualEvent();
    e.name = '| enter on ' + em(nodeOrId) + ' |>';
    var impulse = function (event) {
        if (event.keyCode === 13) {
            e.impulse(input.value);
        }
    };
    input.addEventListener('keydown', impulse, false);
    e.setReleaseResources(function () { return input.removeEventListener('keydown', impulse, false); });
    return e;
}
exports.fromInputTextEnter = fromInputTextEnter;
function fromCheckbox(nodeOrId) {
    var checkbox = utils.getNode(nodeOrId);
    var e = fromEvent(checkbox, 'click', 'checked of ' + em(nodeOrId));
    return e.map(function () { return checkbox.checked; });
}
exports.fromCheckbox = fromCheckbox;
;
function fromCheckboxEvent(nodeOrId) {
    var checkbox = utils.getNode(nodeOrId);
    var e = electric.emitter.manualEvent();
    e.name = '| click on checkbox ' + nodeOrId + ' |>';
    var impulse = function (event) {
        e.impulse(checkbox.checked);
    };
    checkbox.addEventListener('click', impulse, false);
    e.setReleaseResources(function () { return checkbox.removeEventListener('click', impulse, false); });
    return e;
}
exports.fromCheckboxEvent = fromCheckboxEvent;
;
function joinObjects(objs) {
    var o = {};
    objs.forEach(function (e) {
        if (e === undefined) {
            return;
        }
        o[e.key] = e.value;
    });
    return o;
}
function fromCheckboxes(nodeOrIds) {
    var emitters = nodeOrIds.map(function (nodeOrId) {
        var checkbox = utils.getNode(nodeOrId);
        return fromEvent(checkbox, 'click').map(function () { return ({ key: checkbox.id, value: checkbox.checked }); });
    });
    var e = transformator.mapMany.apply(transformator, [function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        return joinObjects(args);
    }].concat(emitters));
    e.name = 'state of checkboxes ' + em(nodeOrIds);
    return e;
}
exports.fromCheckboxes = fromCheckboxes;
;
function fromRadioGroup(nodesOrName) {
    var nodes = utils.getNodes(nodesOrName);
    var emitters = nodes.map(function (radio) { return fromEvent(radio, 'click').map(function (v) { return v.happend ? eevent.of(radio.id) : eevent.notHappend; }); });
    var e = transformator.hold('', transformator.merge.apply(transformator, emitters));
    e.name = 'state of radio group ' + em(nodesOrName);
    return e;
}
exports.fromRadioGroup = fromRadioGroup;
function fromSelect(nodeOrId) {
    var select = utils.getNode(nodeOrId);
    return fromEvent(select, 'change', 'selected of ' + em(nodeOrId)).map(function () { return select.value; });
}
exports.fromSelect = fromSelect;
;
function mouse(nodeOrId) {
    var mouse = utils.getNode(nodeOrId);
    var emitters = ['down', 'up', 'over', 'out', 'move'].map(function (type) { return fromEvent(mouse, 'mouse' + type).map(function (e) { return (e.happend ? eevent.of({ type: type, data: e.value }) : eevent.notHappend); }); });
    var emitter = transformator.merge.apply(transformator, emitters);
    emitter.name = '| mouse on ' + em(nodeOrId) + ' |>';
    return emitter;
}
exports.mouse = mouse;
;
var hashEmitter = null;
function hash() {
    if (!hashEmitter) {
        hashEmitter = electric.emitter.manual(window.location.hash);
        hashEmitter.name = '| window.location.hash |>';
        window.addEventListener('hashchange', function () {
            hashEmitter.emit(window.location.hash);
        });
    }
    return hashEmitter;
}
exports.hash = hash;
function enter(nodeOrId) {
    var target = utils.getNode(nodeOrId);
    var e = electric.emitter.manualEvent();
    e.name = '| enter on ' + em(nodeOrId) + ' |>';
    var impulse = function (event) {
        if (event.keyCode === 13) {
            e.impulse(null);
        }
    };
    target.addEventListener('keydown', impulse, false);
    e.setReleaseResources(function () { return target.removeEventListener('keydown', impulse, false); });
    return e;
}
exports.enter = enter;

},{"../electric":20,"../electric-event":19,"../fp":23,"../receivers/utils":27,"../transformator":30}],23:[function(require,module,exports){
function identity(x) {
    return x;
}
exports.identity = identity;
;
function curry(f, arity) {
    if (arity === void 0) { arity = 2; }
    function partial(prevArgs) {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            var nextArgs = prevArgs.slice();
            nextArgs.splice.apply(nextArgs, [nextArgs.length, 0].concat(args));
            if (nextArgs.length >= arity) {
                return f.apply(void 0, nextArgs);
            }
            return partial(nextArgs);
        };
    }
    return partial([]);
}
exports.curry = curry;
;
function property(name) {
    return function (obj) {
        return obj[name];
    };
}
exports.property = property;
;
function compose(f, g) {
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        return f(g.apply(void 0, args));
    };
}
exports.compose = compose;
var maybe;
(function (maybe) {
    var Just = (function () {
        function Just(value) {
            this.value = value;
        }
        Just.prototype.map = function (f) {
            var result = f(this.flatten());
            return just(result);
        };
        Just.prototype.flatten = function () {
            return this.value;
        };
        Just.prototype.chain = function (f) {
            return this.map(f).flatten();
        };
        return Just;
    })();
    function just(value) {
        return new Just(value);
    }
    maybe.just = just;
    var Nothing = (function () {
        function Nothing() {
        }
        Nothing.prototype.map = function (f) {
            return maybe.nothing;
        };
        Nothing.prototype.bind = function (f) {
            return maybe.nothing;
        };
        Nothing.prototype.flatten = function () {
            throw Error("can't flatten Nothing");
        };
        Nothing.prototype.chain = function (f) {
            return maybe.nothing;
        };
        return Nothing;
    })();
    maybe.nothing = new Nothing();
})(maybe = exports.maybe || (exports.maybe = {}));
var either;
(function (either) {
    var Right = (function () {
        function Right(value) {
            this.value = value;
        }
        Right.prototype.map = function (f) {
            var result = f(this.flatten());
            return right(result);
        };
        Right.prototype.flatten = function () {
            return this.value;
        };
        Right.prototype.chain = function (f) {
            return this.map(f).flatten();
        };
        Right.prototype.isRight = function () {
            return true;
        };
        Right.prototype.isLeft = function () {
            return false;
        };
        return Right;
    })();
    function right(value) {
        return new Right(value);
    }
    either.right = right;
    var Left = (function () {
        function Left(value) {
            this.lvalue = value;
        }
        Left.prototype.map = function (f) {
            return left(this.lvalue);
        };
        Left.prototype.flatten = function () {
            throw Error("can't flatten Left");
        };
        Left.prototype.chain = function (f) {
            return left(this.lvalue);
        };
        Left.prototype.isRight = function () {
            return false;
        };
        Left.prototype.isLeft = function () {
            return true;
        };
        return Left;
    })();
    function left(value) {
        return (new Left(value));
        // when remove <any> casting:
        // Neither type 'Left<L, {}>' nor type 'Either<L, R>' is assignable to the other.
        // Types of property 'flatten' are incompatible.
        // Type '() => {} | Either<L, {}>' is not assignable to type '() => R | Monad<R>'.
        // Type '{} | Either<L, {}>' is not assignable to type 'R | Monad<R>'.
        // Type '{}' is not assignable to type 'R | Monad<R>'.
        // Type '{}' is not assignable to type 'Monad<R>'.
        // Property 'flatten' is missing in type '{}'.
    }
    either.left = left;
})(either = exports.either || (exports.either = {}));

},{}],24:[function(require,module,exports){
// functions that can be simply queued
var functionsToVoid = [
    'plugReceiver',
    'unplugReceiver',
    'stabilize',
    'setReleaseResources',
    'setEquals'
];
// functions that should return another placeholder
var functionsToEmitter = [
    'plugReceiver',
    'unplugReceiver',
    'stabilize',
    'setReleaseResources',
    'setEquals',
    'map',
    'filter',
    'filterMap',
    'transformTime',
    'accumulate',
    'sample',
    'change',
    'merge'
];
// function to throw if called before is()
var functionsToSomething = [];
var Placeholder = (function () {
    function Placeholder(initialValue) {
        this._actions = [];
        this.initialValue = initialValue;
        this.name = '| placeholder |>';
    }
    Placeholder.prototype.toString = function () {
        var subname = this._emitter ? this._emitter.toString() : "| " + this.dirtyCurrentValue() + " |>";
        return "| placeholder " + subname;
    };
    Placeholder.prototype.is = function (emitter) {
        if (this._emitter) {
            throw Error("placeholder is " + this._emitter.name + " so cannot be " + emitter.name);
        }
        this._emitter = emitter;
        for (var _i = 0, _a = this._actions; _i < _a.length; _i++) {
            var action = _a[_i];
            action(this._emitter);
        }
        this._actions = undefined;
        this.name = '| placeholder | ' + emitter.name;
    };
    Placeholder.prototype.dirtyCurrentValue = function () {
        if (this._emitter) {
            return this._emitter.dirtyCurrentValue();
        }
        else if (this.initialValue !== undefined) {
            return this.initialValue;
        }
        throw Error('called dirtyCurrentValue() on placeholder without initial value');
    };
    return Placeholder;
})();
function doOrQueue(name) {
    return function placeholding() {
        var args = arguments;
        if (this._emitter) {
            this._emitter[name].apply(this._emitter, arguments);
        }
        else {
            this._actions.push(function (emitter) {
                emitter[name].apply(emitter, args);
            });
        }
    };
}
functionsToVoid.forEach(function (name) {
    Placeholder.prototype[name] = doOrQueue(name);
});
function doOrQueueAndReturnPlaceholder(name) {
    return function placeholding() {
        var args = arguments;
        if (this._emitter) {
            return this._emitter[name].apply(this._emitter, args);
        }
        else {
            var p = placeholder();
            this._actions.push(function (emitter) {
                p.is(emitter[name].apply(emitter, args));
            });
            return p;
        }
    };
}
functionsToEmitter.forEach(function (name) {
    Placeholder.prototype[name] = doOrQueueAndReturnPlaceholder(name);
});
function doOrThrow(name) {
    return function placeholding() {
        var args = arguments;
        if (this._emitter) {
            return this._emitter[name].apply(this._emitter, args);
        }
        throw Error('called <' + name + '> on empty placeholder');
    };
}
functionsToSomething.forEach(function (name) {
    Placeholder.prototype[name] = doOrThrow(name);
});
function placeholder(initialValue) {
    return (new Placeholder(initialValue));
}
module.exports = placeholder;

},{}],25:[function(require,module,exports){
function logReceiver(message) {
    if (!message) {
        message = '<<<';
    }
    return function (x) {
        console.log(message, x);
    };
}
exports.logReceiver = logReceiver;
function log(emitter) {
    emitter.plugReceiver(function (x) {
        console.log(emitter.name, '>>>', x);
    });
}
exports.log = log;
function logEvents(emitter) {
    emitter.plugReceiver(function (x) {
        if (!x.happend) {
            return;
        }
        console.log(emitter.name, '>>>', x.value);
    });
}
exports.logEvents = logEvents;
function collect(emitter) {
    var r = [];
    emitter.plugReceiver(function (x) {
        r.push(x);
    });
    return r;
}
exports.collect = collect;

},{}],26:[function(require,module,exports){
function htmlReceiverById(id) {
    var element = document.getElementById(id);
    return function htmlReceiver(html) {
        element.innerHTML = html;
    };
}
exports.htmlReceiverById = htmlReceiverById;

},{}],27:[function(require,module,exports){
function getNode(nodeOrId) {
    if (typeof nodeOrId === 'string') {
        return document.getElementById(nodeOrId);
    }
    else {
        return nodeOrId;
    }
}
exports.getNode = getNode;
function getNodes(nodesOfName) {
    if (typeof nodesOfName === 'string') {
        return Array.prototype.slice.call(document.getElementsByName(nodesOfName));
    }
    else {
        return nodesOfName;
    }
}
exports.getNodes = getNodes;

},{}],28:[function(require,module,exports){
var stopTime = Date.now();
var callbacks = {};
var stopped = false;
function stop() {
    stopTime = Date.now();
    stopped = true;
    return stopTime;
}
exports.stop = stop;
function resume() {
    stopped = false;
    callbacks = {};
}
exports.resume = resume;
function advance(timeShiftInMiliseconds) {
    if (timeShiftInMiliseconds === void 0) { timeShiftInMiliseconds = 1; }
    if (!stopped) {
        return;
    }
    var newTime = stopTime + timeShiftInMiliseconds;
    for (; stopTime < newTime; stopTime++) {
        executeCallbacksForTime(stopTime);
    }
    return stopTime;
}
exports.advance = advance;
function executeCallbacksForTime(currentTime) {
    var toExecute = callbacks[stopTime];
    if (toExecute) {
        toExecute.forEach(function (f) { return f(); });
    }
}
function currentTime() {
    return stopTime;
}
exports.currentTime = currentTime;
function scheduleTimeout(callback, delayInMs) {
    if (delayInMs === void 0) { delayInMs = 0; }
    if (!stopped) {
        return setTimeout(callback, delayInMs);
    }
    var whenToExecute = stopTime + delayInMs;
    if (delayInMs <= 0) {
        callback();
    }
    else if (callbacks[whenToExecute]) {
        callbacks[whenToExecute].push(callback);
    }
    else {
        callbacks[whenToExecute] = [callback];
    }
    return callback;
}
exports.scheduleTimeout = scheduleTimeout;
function scheduleInterval(callback, intervalInMs) {
    if (intervalInMs === void 0) { intervalInMs = 0; }
    if (!stopped) {
        return setInterval(callback, intervalInMs);
    }
    var cancelable = [];
    function intervalCallback() {
        callback();
        cancelable.push(scheduleTimeout(intervalCallback, intervalInMs));
    }
    var id = scheduleTimeout(intervalCallback, intervalInMs);
    cancelable.push(id);
    return cancelable;
}
exports.scheduleInterval = scheduleInterval;
function now() {
    if (!stopped) {
        return Date.now();
    }
    return stopTime;
}
exports.now = now;
function unscheduleInterval(id) {
    if (!stopped) {
        return clearInterval(id);
    }
    id.forEach(removeFromCallbacks);
}
exports.unscheduleInterval = unscheduleInterval;
function removeFromCallbacks(callback) {
    for (var k in callbacks) {
        removeFromCallbacksAtTime(callbacks[k], callback);
    }
}
function removeFromCallbacksAtTime(callbacksAtTime, callback) {
    var i = callbacksAtTime.indexOf(callback);
    while (i !== -1) {
        callbacksAtTime.splice(i, 1);
        i = callbacksAtTime.indexOf(callback);
    }
}

},{}],29:[function(require,module,exports){
var callIfFunction = require('./utils/call-if-function');
var Wire = require('./wire');
var scheduler = require('./scheduler');
var eevent = require('./electric-event');
function map(f, noOfEmitters) {
    return function mapTransform(emit) {
        return function mapTransform(v, i) {
            emit(f.apply(null, v));
        };
    };
}
exports.map = map;
function filter(predicate, noOfEmitters) {
    if (noOfEmitters === void 0) { noOfEmitters = 1; }
    return function transform(emit) {
        var eaten = 0;
        return function filterTransform(v, i) {
            if (predicate.apply(null, v)) {
                emit(v[i]);
            }
        };
    };
}
exports.filter = filter;
;
function filterMap(mapping, noOfEmitters) {
    if (noOfEmitters === void 0) { noOfEmitters = 1; }
    return function transform(emit) {
        var eaten = 0;
        return function filterMapTransform(v, i) {
            var result = mapping.apply(null, v);
            if (result !== undefined) {
                emit(result);
            }
        };
    };
}
exports.filterMap = filterMap;
;
function merge() {
    return function mergeTransform(emit) {
        var prev;
        return function mergeTransform(v, i) {
            if (prev !== v[i]) {
                emit(v[i]);
            }
            prev = v[i];
        };
    };
}
exports.merge = merge;
function accumulate(initialValue, accumulator) {
    var accumulated = initialValue;
    return function transform(emit) {
        return function accumulateTransform(v, i) {
            accumulated = accumulator.apply(void 0, [accumulated].concat(v));
            emit(accumulated);
        };
    };
}
exports.accumulate = accumulate;
;
function transformTime(timeTransformation, t0) {
    // var firstEmitted = false;
    return function transform(emit) {
        return function timeTransform(v, i) {
            var delay = timeTransformation(scheduler.now() - t0) + t0 - scheduler.now();
            var toEmit = v[i];
            scheduler.scheduleTimeout(function () {
                emit(toEmit);
            }, delay);
        };
    };
}
exports.transformTime = transformTime;
function sample() {
    return function transform(emit) {
        return function sampleTransform(v, i) {
            if (i > 0 && v[i].happend) {
                emit(v[0]);
            }
        };
    };
}
exports.sample = sample;
;
function change(switchers) {
    return function transform(emit) {
        return function changeTransform(v, i) {
            var _this = this;
            if (i == 0) {
                emit(v[0]);
            }
            else if (v[i].happend) {
                this._wires[0].unplug();
                var to = switchers[i - 1].to;
                var e = callIfFunction(to, v[0], v[i].value);
                this._wires[0] = new Wire(e, this, function (x) { return _this.receiveOn(x, 0); });
            }
        };
    };
}
exports.change = change;
function when(happend, then) {
    return function transform(emit, impulse) {
        return function whenTransform(v, i) {
            if (happend(v[i])) {
                impulse(eevent.of(then(v[i])));
            }
        };
    };
}
exports.when = when;
function whenThen(happens) {
    return function transform(emit, impulse) {
        var prevHappend;
        return function whenTransform(v, i) {
            var happend = happens(v[i]);
            if (happend && !prevHappend) {
                impulse(eevent.of(happend));
                prevHappend = happend;
            }
            else if (!happend) {
                prevHappend = null;
            }
        };
    };
}
exports.whenThen = whenThen;
function cumulateOverTime(delayInMiliseconds) {
    return function transform(emit, impulse) {
        var accumulated = [];
        var accumulating = false;
        return function throttleTransform(v, i) {
            if (!v[i].happend) {
                return;
            }
            accumulated.push(v[i].value);
            if (!accumulating) {
                accumulating = true;
                scheduler.scheduleTimeout(function () {
                    impulse(eevent.of(accumulated));
                    accumulating = false;
                    accumulated = [];
                }, delayInMiliseconds);
            }
        };
    };
}
exports.cumulateOverTime = cumulateOverTime;
;

},{"./electric-event":19,"./scheduler":28,"./utils/call-if-function":33,"./wire":36}],30:[function(require,module,exports){
var emitter = require('./emitter');
var namedTransformator = emitter.namedTransformator;
var transformators = require('./transformator-helpers');
var eevent = require('../src/electric-event');
var fn = require('./utils/fn');
function map(mapping, emitter1, emitter2, emitter3, emitter4, emitter5, emitter6, emitter7) {
    var emitters = Array.prototype.slice.apply(arguments, [1]);
    return namedTransformator("map(" + fn(mapping) + ")", emitters, transformators.map(mapping, emitters.length), mapping.apply(null, emitters.map(function (e) { return e.dirtyCurrentValue(); })));
}
exports.map = map;
;
function mapMany(mapping) {
    var emitters = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        emitters[_i - 1] = arguments[_i];
    }
    return namedTransformator("mapMany(" + fn(mapping) + ")", emitters, transformators.map(mapping, emitters.length), mapping.apply(null, emitters.map(function (e) { return e.dirtyCurrentValue(); })));
}
exports.mapMany = mapMany;
function filter(initialValue, predicate, emitter1, emitter2, emitter3, emitter4, emitter5, emitter6, emitter7) {
    var emitters = Array.prototype.slice.apply(arguments, [2]);
    return namedTransformator("filter(" + fn(predicate) + ")", emitters, transformators.filter(predicate, emitters.length), initialValue);
}
exports.filter = filter;
;
function filterMap(initialValue, filterMapping, emitter1, emitter2, emitter3, emitter4, emitter5, emitter6, emitter7) {
    var emitters = Array.prototype.slice.apply(arguments, [2]);
    return namedTransformator("filterMap(" + fn(filterMapping) + ")", emitters, transformators.filterMap(filterMapping, emitters.length), initialValue);
}
exports.filterMap = filterMap;
;
function accumulate(initialValue, accumulator, emitter1, emitter2, emitter3, emitter4, emitter5, emitter6, emitter7) {
    var emitters = Array.prototype.slice.apply(arguments, [2]);
    var acc = accumulator.apply([], [initialValue].concat(emitters.map(function (e) { return e.dirtyCurrentValue(); })));
    return namedTransformator("accumulate(" + fn(accumulator) + ")", emitters, transformators.accumulate(acc, accumulator), acc);
}
exports.accumulate = accumulate;
function merge() {
    var emitters = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        emitters[_i - 0] = arguments[_i];
    }
    return namedTransformator('merge', emitters, transformators.merge(), emitters[0].dirtyCurrentValue());
}
exports.merge = merge;
function cumulateOverTime(emitter, overInMs) {
    return namedTransformator("cumulateOverTime(" + overInMs + "ms)", [emitter], transformators.cumulateOverTime(overInMs), eevent.notHappend);
}
exports.cumulateOverTime = cumulateOverTime;
function hold(initialValue, emitter) {
    function transform(emit) {
        return function holdTransform(v, i) {
            if (v[i].happend) {
                emit(v[i].value);
            }
        };
    }
    return namedTransformator('hold', [emitter], transform, initialValue);
}
exports.hold = hold;
;
function changes(emitter) {
    var previous = emitter.dirtyCurrentValue();
    function transform(emit, impulse) {
        return function changesTransform(v, i) {
            impulse(eevent.of({
                previous: previous,
                next: v[i]
            }));
            previous = v[i];
        };
    }
    return namedTransformator('changes', [emitter], transform, eevent.notHappend);
}
exports.changes = changes;
function skipFirst(emitter) {
    function transform(emit, impulse) {
        var skipped = false;
        return function skipFirstTransform(v, i) {
            if (v[i].happend) {
                if (skipped) {
                    impulse(v[i]);
                }
                else {
                    skipped = true;
                }
            }
        };
    }
    return namedTransformator('skip(1)', [emitter], transform, eevent.notHappend);
}
exports.skipFirst = skipFirst;
;
// semantics:
// f_a :: t -> (t -> a)
// flatten(f_a) = f(t)
// flatten(f_a)(t) = f(t)(t)
function flatten(emitter) {
    var transformator = namedTransformator('flatten', [emitter, emitter.dirtyCurrentValue()], transform, emitter.dirtyCurrentValue().dirtyCurrentValue());
    function transform(emit) {
        return function flattenTransform(v, i) {
            if (i == 0) {
                transformator.dropEmitters(1);
                transformator.plugEmitter(v[0]);
                emit(v[0].dirtyCurrentValue());
            }
            else {
                emit(v[i]);
            }
        };
    }
    ;
    return transformator;
}
exports.flatten = flatten;
;
// semantics:
// f_a :: t -> [t -> a]
// flatten(f_a) = f(t)
// flatten(f_a)(t) = f(t).map(g => g(t))
function flattenMany(emitter) {
    var currentValues = emitter.dirtyCurrentValue().map(function (e) { return e.dirtyCurrentValue(); });
    var transformator = namedTransformator('flattenMany', [emitter].concat(emitter.dirtyCurrentValue()), transform, currentValues);
    function transform(emit) {
        return function flattenTransform(v, i) {
            if (i == 0) {
                transformator.dropEmitters(1);
                v[0].forEach(function (e) { return transformator.plugEmitter(e); });
                emit(v[0].map(function (e) { return e.dirtyCurrentValue(); }));
            }
            else {
                emit(v.slice(1));
            }
        };
    }
    ;
    return transformator;
}
exports.flattenMany = flattenMany;

},{"../src/electric-event":19,"./emitter":21,"./transformator-helpers":29,"./utils/fn":34}],31:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var emitter = require('./emitter');
var Wire = require('./wire');
var Transmitter = (function (_super) {
    __extends(Transmitter, _super);
    function Transmitter() {
        _super.apply(this, arguments);
    }
    Transmitter.prototype.wire = function (emitter) {
        var _this = this;
        var index = this._wires.length;
        this._wires[index] = new Wire(emitter, this, (function (index) { return function (x) { return _this.receiveOn(x, index); }; })(index));
        return this._wires[index];
    };
    Transmitter.prototype.dropEmitters = function () {
        this._wires.forEach(function (w) { return w.input.stabilize(); });
        this._wires = [];
    };
    return Transmitter;
})(emitter.Transformator);
function transmitter(initialValue) {
    var t = new Transmitter([], undefined, initialValue);
    t.name = '? | transmitter';
    return t;
}
module.exports = transmitter;

},{"./emitter":21,"./wire":36}],32:[function(require,module,exports){
function all(list) {
    for (var i = 0; i < list.length; i++) {
        if (!list[i]) {
            return false;
        }
    }
    return true;
}
module.exports = all;

},{}],33:[function(require,module,exports){
function callIfFunction(obj) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    if (typeof obj === 'function') {
        return obj.apply(null, args);
    }
    else {
        return obj;
    }
}
module.exports = callIfFunction;

},{}],34:[function(require,module,exports){
function fn(f) {
    return f.name || '=>';
}
module.exports = fn;

},{}],35:[function(require,module,exports){
function rn(name) {
    return "<| " + name + " |";
}
var inspector;
(function (inspector) {
    function getReceivers(emitter) {
        if (emitter._receivers === undefined) {
            return null;
        }
        return emitter._receivers.map(function (r) { return inspector.describeReceiver(r, emitter); });
    }
    inspector.getReceivers = getReceivers;
    function describeReceiver(receiver, ofEmitter) {
        // function
        if (typeof receiver === 'function') {
            return {
                name: rn(receiver.name),
                value: receiver
            };
        }
        else if (receiver.input = ofEmitter && receiver.output !== undefined) {
            return {
                name: receiver.output.toString(),
                value: receiver.output
            };
        }
        // wire without in/out
        return {
            name: receiver.toString(),
            value: receiver
        };
    }
    inspector.describeReceiver = describeReceiver;
    function getEmitters(transformator) {
        if (transformator._wires === undefined) {
            return null;
        }
        return transformator._wires.map(function (w) { return ({
            name: w.input.toString(),
            value: w.input
        }); });
    }
    inspector.getEmitters = getEmitters;
})(inspector = exports.inspector || (exports.inspector = {}));
var Graph = (function () {
    function Graph(source) {
        this.nodesById = {};
        this.id = 0;
        this._sources = [];
        var lastSourceId = this.insert(source);
        this.makeNodesList();
        this.clean();
    }
    Graph.of = function (source) {
        return new Graph(source);
    };
    Graph.prototype.makeNodesList = function () {
        var _this = this;
        this.nodes = [];
        this.links = [];
        for (var i = 0; i < this.id; i++) {
            var node = this.nodesById[i];
            this.nodes.push(node);
            var type = 'transformator';
            if (node.emitters.length == 0) {
                type = 'emitter';
            }
            node.receivers.forEach(function (e, j) {
                var rec = _this.nodesById[e];
                if (rec.emitters.length === 0) {
                    type = 'receiver';
                }
                _this.links.push({
                    source: i,
                    target: e,
                    type: type
                });
            });
            node.emitters.forEach(function (e, j) {
                _this.links.push({
                    source: e,
                    target: i,
                    type: 'transformator'
                });
            });
        }
    };
    Graph.prototype.insert = function (source) {
        if (source.__$visualize_visited_id$ !== undefined) {
            return source.__$visualize_visited_id$;
        }
        this._sources.push(source);
        var sourceId = this.id++;
        source.__$visualize_visited_id$ = sourceId;
        this.nodesById[sourceId] = {
            id: sourceId,
            name: this.name(source),
            receivers: [],
            emitters: []
        };
        this.goBackwards(source);
        this.goForwards(source);
        return sourceId;
    };
    Graph.prototype.goBackwards = function (source) {
        var _this = this;
        if (source._wires === undefined) {
            return;
        }
        source._wires.forEach(function (w) {
            var e = w.input;
            if (e._emitter !== undefined) {
                e = e._emitter;
            }
            var wId = _this.insert(e);
            _this.nodesById[source.__$visualize_visited_id$].emitters.push(wId);
        });
    };
    Graph.prototype.goForwards = function (source) {
        var _this = this;
        if (source._receivers === undefined) {
            return;
        }
        source._receivers.forEach(function (r) {
            if (r.input !== undefined && r.output !== undefined) {
                r = r.output;
            }
            if (r._emitter !== undefined) {
                r = r._emitter;
            }
            var rId = _this.insert(r);
            _this.nodesById[source.__$visualize_visited_id$].receivers.push(rId);
        });
    };
    Graph.prototype.name = function (source) {
        if (typeof source === 'function') {
            return "<| " + source.name + "() |";
        }
        return source.toString();
    };
    Graph.prototype.clean = function () {
        this._sources.forEach(function (s) { return s.__$visualize_visited_id$ = undefined; });
    };
    return Graph;
})();
exports.Graph = Graph;

},{}],36:[function(require,module,exports){
var Wire = (function () {
    function Wire(input, output, receive, set) {
        this.input = input;
        this.output = output;
        this.name = 'w';
        if (set) {
            this._set = set;
            this._futureReceive = receive;
        }
        else {
            this.receive = receive;
        }
        this.receiverId = this.input.plugReceiver(this);
    }
    Wire.prototype.toString = function () {
        return this.input.toString() + " -" + this.name + "- " + this.output.toString();
    };
    Wire.prototype.receive = function (x) {
        this._set(x);
        this._set = undefined;
        this.receive = this._futureReceive;
        this._futureReceive = undefined;
    };
    Wire.prototype.unplug = function () {
        if (this.input) {
            this.input.unplugReceiver(this.receiverId);
        }
        this.input = undefined;
        this.output = undefined;
    };
    return Wire;
})();
module.exports = Wire;

},{}]},{},[2]);
