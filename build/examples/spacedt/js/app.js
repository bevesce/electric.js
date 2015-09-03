(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Acceleration = (function () {
    function Acceleration(x, y, antiderivative) {
        this.x = x;
        this.y = y;
        this.antiderivative = antiderivative;
    }
    Acceleration.of = function (x, y, antiderivative) {
        return new Acceleration(x, y, antiderivative);
    };
    Acceleration.zero = function (antiderivative) {
        return Acceleration.of(0, 0, antiderivative);
    };
    Acceleration.prototype.add = function (other) {
        var x = this.x + other.x;
        var y = this.y + other.y;
        return Acceleration.of(x, y, this.antiderivative);
    };
    Acceleration.prototype.equals = function (other) {
        return this.x === other.x && this.y === other.y && this.antiderivative === other.antiderivative;
    };
    Acceleration.prototype.withX = function (x) {
        return Acceleration.of(x, this.y, this.antiderivative);
    };
    Acceleration.prototype.withY = function (y) {
        return Acceleration.of(this.x, y, this.antiderivative);
    };
    Acceleration.prototype.mulT = function (dt) {
        var dx = this.x * dt / 1000;
        var dy = this.y * dt / 1000;
        return this.antiderivative(dx, dy);
    };
    return Acceleration;
})();
module.exports = Acceleration;

},{}],2:[function(require,module,exports){
var electric = require('../../../src/electric');
var eevent = require('../../../src/electric-event');
var eui = require('../../../src/emitters/ui');
var clock = require('./clock');
var c = require('./constants');
var Point = require('./point');
var createShip = require('./ship');
var createAsteroidMother = require('./asteroid-mother');
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
var ship = createShip(shipStartingPoint, shipInput);
//// mother
var asteroidMotherStartingPoint = Point.of(3 * window.innerWidth / 4, window.innerHeight / 2, -Math.PI / 2);
var asteroidMother = createAsteroidMother(asteroidMotherStartingPoint);
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
    to: function (cs, _) { return cont(cs.slice(1)); },
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
var gameOver = cont(eevent.notHappend).change({ to: clock.intervalValue(true, { inMs: 1000 }), when: gameEnd });
gameOver.plugReceiver(function (e) {
    if (e.happend) {
        draw.gameOver(width, height);
    }
});
ship.v.plugReceiver(dashboard.speed());

},{"../../../src/electric":22,"../../../src/electric-event":21,"../../../src/emitters/ui":24,"./asteroid-mother":3,"./asteroids":4,"./bullets":5,"./clock":7,"./collisions":8,"./constants":9,"./dashboard":10,"./draw":11,"./point":13,"./score":14,"./ship":15,"./utils/insert":16}],3:[function(require,module,exports){
var electric = require('../../../src/electric');
var clock = require('./clock');
var calculus = require('./calculus');
var c = require('./constants');
var Point = require('./point');
var Velocity = require('./velocity');
var Acceleration = require('./acceleration');
var random = require('./utils/random');
var cont = electric.emitter.constant;
function acceleration(x, y) {
    return Acceleration.of(x, y, velocity);
}
function velocity(x, y) {
    return Velocity.of(x, y, Point.of);
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

},{"../../../src/electric":22,"./acceleration":1,"./calculus":6,"./clock":7,"./constants":9,"./point":13,"./utils/random":17,"./velocity":19}],4:[function(require,module,exports){
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

},{"../../../src/electric":22,"./moving-point":12,"./utils/insert":16,"./utils/random":17,"./utils/remove":18}],5:[function(require,module,exports){
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

},{"../../../src/electric":22,"./constants":9,"./moving-point":12,"./utils/insert":16,"./utils/remove":18}],6:[function(require,module,exports){
var clock = require('./clock');
var electric = require('../../../src/electric');
function integral(initialValue, emitter, options) {
    var timmed = timeValue(emitter, options);
    var result = timmed.accumulate({
        time: electric.scheduler.now(),
        value: emitter.dirtyCurrentValue(),
        sum: initialValue
    }, function (acc, v) {
        var now = electric.scheduler.now();
        var dt = now - acc.time;
        var nv = v.value.add(acc.value).mulT(dt / 2);
        var sum = acc.sum.addDelta(nv);
        return {
            time: now,
            value: v.value,
            sum: sum
        };
    }).map(function (v) { return v.sum; });
    result.name = '<| integral |>';
    result.setEquals(function (x, y) { return x.equals(y); });
    result.stabilize = function () { return timmed.stabilize(); };
    return result;
}
exports.integral = integral;
function differential(initialValue, emitter, options) {
    var timmed = timeValue(emitter, options);
    var result = timmed.accumulate({
        time: electric.scheduler.now(),
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
    result.name = '<| differential |>';
    return result;
}
exports.differential = differential;
function timeValue(emitter, options) {
    var time = clock.time(options);
    var transformator = electric.transformator.map(function (t, v) { return ({ time: t, value: v }); }, time, emitter);
    transformator.stabilize = function () { return time.stabilize(); };
    return transformator;
}

},{"../../../src/electric":22,"./clock":7}],7:[function(require,module,exports){
var electric = require('../../../src/electric');
function interval(options) {
    var timer = electric.emitter.manualEvent();
    electric.scheduler.scheduleInterval(function () {
        timer.impulse(Date.now());
    }, calculateInterval(options.inMs, options.fps));
    timer.name = '| interval |>';
    return timer;
}
exports.interval = interval;
function intervalValue(value, options) {
    var timer = electric.emitter.manualEvent();
    electric.scheduler.scheduleInterval(function () {
        timer.impulse(value);
    }, calculateInterval(options.inMs, options.fps));
    timer.name = '| interval |>';
    return timer;
}
exports.intervalValue = intervalValue;
function time(options) {
    var interval = calculateInterval(options.intervalInMs, options.fps);
    var emitter = electric.emitter.manual(electric.scheduler.now());
    var id = electric.scheduler.scheduleInterval(function () { return emitter.emit((electric.scheduler.now())); }, interval);
    emitter.setReleaseResources(function () { return electric.scheduler.unscheduleInterval(id); });
    emitter.name = calculateEmitterName(options);
    return emitter;
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
    if (options.intervalInMs === undefined) {
        return '| fps: ' + options.fps + ' |>';
    }
    else {
        return '| interval: ' + options.intervalInMs + 'ms |>';
    }
}

},{"../../../src/electric":22}],8:[function(require,module,exports){
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

},{"../../../src/electric":22,"./constants":9}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
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

},{"../../../src/receivers/ui":28,"./constants":9}],11:[function(require,module,exports){
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
    _ctx.fillText('GAME OVERdt', random(0, width - 300), random(50, height - 50));
}
exports.gameOver = gameOver;

},{"./constants":9,"./utils/random":17}],12:[function(require,module,exports){
var electric = require('../../../src/electric');
var calculus = require('./calculus');
var c = require('./constants');
var Point = require('./point');
var Velocity = require('./velocity');
var cont = electric.emitter.constant;
function velocity(x, y) {
    return Velocity.of(x, y, Point.of);
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

},{"../../../src/electric":22,"./calculus":6,"./constants":9,"./point":13,"./velocity":19}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
var electric = require('../../../src/electric');
var c = require('./constants');
var cont = electric.emitter.constant;
function score(input) {
    return cont(0).change({ to: function (s, _) { return cont(s + c.score.forAsteroid); }, when: input.asteroidHit }, { to: function (s, _) { return cont(s + c.score.forMother); }, when: input.motherHit }).change({ to: function (s, _) { return cont(s); }, when: input.gameEnd });
}
module.exports = score;

},{"../../../src/electric":22,"./constants":9}],15:[function(require,module,exports){
var electric = require('../../../src/electric');
var eevent = require('../../../src/electric-event');
var eui = require('../../../src/emitters/ui');
var calculus = require('./calculus');
var c = require('./constants');
var Acceleration = require('./acceleration');
var Velocity = require('./velocity');
var Point = require('./point');
var cont = electric.emitter.constant;
function shipAcceleration(x, y) {
    return Acceleration.of(x, y, shipVelocity);
}
function shipVelocity(x, y) {
    return Velocity.of(x, y, Point.of, c.ship.vbounds);
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

},{"../../../src/electric":22,"../../../src/electric-event":21,"../../../src/emitters/ui":24,"./acceleration":1,"./calculus":6,"./constants":9,"./point":13,"./velocity":19}],16:[function(require,module,exports){
var electric = require('../../../../src/electric');
var cont = electric.emitter.constant;
function insert(list, item) {
    var l = list.slice();
    l.push(item);
    return cont(l);
}
module.exports = insert;

},{"../../../../src/electric":22}],17:[function(require,module,exports){
function random(min, max) {
    return Math.random() * (max - min) + min;
}
module.exports = random;

},{}],18:[function(require,module,exports){
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

},{"../../../../src/electric":22}],19:[function(require,module,exports){
var Velocity = (function () {
    function Velocity(x, y, antiderivative, bounds) {
        this.bounds = bounds || {};
        this.x = within(x, this.bounds.minX, this.bounds.maxX);
        this.y = within(y, this.bounds.minY, this.bounds.maxY);
        this.antiderivative = antiderivative;
    }
    Velocity.of = function (x, y, antiderivative, bounds) {
        return new Velocity(x, y, antiderivative, bounds);
    };
    Velocity.zero = function (antiderivative, bounds) {
        return Velocity.of(0, 0, antiderivative, bounds);
    };
    Velocity.prototype.add = function (other) {
        var x = within(this.x + other.x, this.bounds.minX, this.bounds.maxX);
        var y = within(this.y + other.y, this.bounds.minY, this.bounds.maxY);
        return Velocity.of(x, y, this.antiderivative, this.bounds);
    };
    Velocity.prototype.addDelta = function (delta) {
        return this.add(delta);
    };
    Velocity.prototype.equals = function (other) {
        return this.x === other.x && this.y === other.y;
    };
    Velocity.prototype.mulT = function (dt) {
        var dx = this.x * dt / 1000;
        var dy = this.y * dt / 1000;
        return this.antiderivative(dx, dy);
    };
    Velocity.prototype.withX = function (x) {
        return Velocity.of(x, this.y, this.antiderivative, this.bounds);
    };
    Velocity.prototype.withY = function (y) {
        return Velocity.of(this.x, y, this.antiderivative, this.bounds);
    };
    return Velocity;
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
module.exports = Velocity;

},{}],20:[function(require,module,exports){
exports.scheduler = require('./scheduler');
exports.emitter = require('./emitter');
exports.transformator = require('./transformator');
function interval(intervalInMs) {
    var timer = exports.emitter.manualEvent();
    exports.scheduler.scheduleInterval(function () {
        timer.impulse(Date.now());
    }, intervalInMs);
    timer.name = '| interval |>';
    return timer;
}
exports.interval = interval;
var TimeValue = (function () {
    function TimeValue(time, value) {
        this.time = time;
        this.value = value;
    }
    TimeValue.of = function (time, value) {
        if (value === void 0) { value = undefined; }
        return new TimeValue(time, value);
    };
    TimeValue.lift = function (f) {
        return function () {
            var vs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                vs[_i - 0] = arguments[_i];
            }
            return TimeValue.of(Math.max.apply(Math, vs.map(function (v) { return v.time; })), f.apply(null, vs.map(function (v) { return v.value; })));
        };
    };
    TimeValue.prototype.map = function (f) {
        return TimeValue.of(this.time, f(this.value));
    };
    return TimeValue;
})();
exports.TimeValue = TimeValue;
function _time(args, transform) {
    var e = exports.emitter.manual(transform(exports.scheduler.now()));
    var subname;
    var interval;
    if (args.intervalInMs === undefined) {
        subname = 'fps: ' + args.fps;
        interval = 1 / args.fps * 1000;
    }
    else {
        subname = 'interval: ' + args.intervalInMs + 'ms';
        interval = args.intervalInMs;
    }
    var id = exports.scheduler.scheduleInterval(function () { return e.emit(transform(exports.scheduler.now())); }, interval);
    e.name = 'clock<' + subname + '>';
    function releaseResoueces() {
        exports.scheduler.unscheduleInterval(id);
    }
    e.setReleaseResources(releaseResoueces);
    return e;
}
function time(args) {
    return _time(args, function (t) { return TimeValue.of(t, undefined); });
}
exports.time = time;
function timeFunction(f, args, t0) {
    if (t0 === void 0) { t0 = 0; }
    return _time(args, function (t) { return (TimeValue.of(t, f(t - t0))); });
}
exports.timeFunction = timeFunction;
function equalsWithTime(x, y) {
    return x.time === y.time && x.value === y.value;
}
function integral(f) {
    var initialAcc = { time: exports.scheduler.now(), value: 0, integral: 0 };
    var result = f.accumulate(initialAcc, function (acc, v) {
        var dt = (v.time - acc.time) / 1000;
        return {
            time: v.time,
            value: v.value,
            integral: acc.integral + (acc.value + v.value) / 2 * dt
        };
    }).map(function (v) { return TimeValue.of(v.time, v.integral); });
    result.setEquals(equalsWithTime);
    return result;
}
exports.integral = integral;
function derivative(f) {
    var initialAcc = { time: exports.scheduler.now(), value: undefined, derivative: 0 };
    var result = f.accumulate(initialAcc, function (acc, v) {
        var dt = (v.time - acc.time) / 1000;
        var diff = 0;
        if (dt !== 0) {
            diff = (v.value - acc.value) / dt / 1000;
        }
        return {
            time: v.time,
            value: v.value,
            derivative: diff
        };
    }).map(function (v) { return TimeValue.of(v.time, v.derivative); });
    result.setEquals(equalsWithTime);
    return result;
}
exports.derivative = derivative;

},{"./emitter":23,"./scheduler":30,"./transformator":32}],21:[function(require,module,exports){
var utils = require('./utils');
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
            if (utils.all(vs.map(function (v) { return v.happend; }))) {
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

},{"./utils":34}],22:[function(require,module,exports){
exports.scheduler = require('./scheduler');
exports.emitter = require('./emitter');
exports.transformator = require('./transformator');
exports.receiver = require('./receiver');
exports.clock = require('./clock');
exports.transmitter = require('./transmitter');
// export import device = require('./device');
// export import fp = require('./fp');

},{"./clock":20,"./emitter":23,"./receiver":27,"./scheduler":30,"./transformator":32,"./transmitter":33}],23:[function(require,module,exports){
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
exports.placeholder = require('./placeholder');
function en(name) {
    return '| ' + name + ' |>';
}
var Emitter = (function () {
    function Emitter(initialValue) {
        if (initialValue === void 0) { initialValue = undefined; }
        this._receivers = [];
        this._currentValue = initialValue;
        this.name = en(this.name);
    }
    // when reveiver is plugged current value is not emitted to him
    // instantaneously, but instead it's done asynchronously
    Emitter.prototype.plugReceiver = function (receiver) {
        if (typeof receiver !== 'function' && receiver.wire) {
            receiver = receiver.wire(this);
        }
        this._receivers.push(receiver);
        this._ayncDispatchToReceiver(receiver, this._currentValue);
        return this._receivers.length - 1;
    };
    Emitter.prototype._dirtyPlugReceiver = function (receiver) {
        if (typeof receiver !== 'function' && receiver.wire) {
            receiver = receiver.wire(this);
        }
        this._receivers.push(receiver);
        // this._ayncDispatchToReceiver(receiver, this._currentValue);
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
    Emitter.prototype._ayncDispatchToReceivers = function (value) {
        var currentReceivers = this._receivers.slice();
        for (var _i = 0; _i < currentReceivers.length; _i++) {
            var receiver = currentReceivers[_i];
            this._ayncDispatchToReceiver(receiver, value);
        }
    };
    Emitter.prototype._ayncDispatchToReceiver = function (receiver, value) {
        var _this = this;
        scheduler.scheduleTimeout(function () { return _this._dispatchToReceiver(receiver, value); }, 0);
    };
    // transformators
    Emitter.prototype.map = function (mapping) {
        return namedTransformator('map' + this._enclosedName(), [this], transformators.map(mapping, 1), mapping(this._currentValue));
    };
    Emitter.prototype.filter = function (initialValue, predicate) {
        return namedTransformator('filter' + this._enclosedName(), [this], transformators.filter(predicate), initialValue);
    };
    Emitter.prototype.filterMap = function (initialValue, mapping) {
        return namedTransformator('filter' + this._enclosedName(), [this], transformators.filterMap(mapping), initialValue);
    };
    Emitter.prototype.transformTime = function (initialValue, timeShift, t0) {
        if (t0 === void 0) { t0 = 0; }
        var t = namedTransformator('transform time' + this._enclosedName(), [this], transformators.transformTime(timeShift, t0), initialValue);
        this._dispatchToReceiver(t._dirtyGetWireTo(this), this.dirtyCurrentValue());
        return t;
    };
    Emitter.prototype.accumulate = function (initialValue, accumulator) {
        var acc = accumulator(initialValue, this.dirtyCurrentValue());
        return namedTransformator('accumulate' + this._enclosedName(), [this], transformators.accumulate(acc, accumulator), acc);
    };
    Emitter.prototype.merge = function () {
        var emitters = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            emitters[_i - 0] = arguments[_i];
        }
        return namedTransformator('merge' + this._enclosedName() + ' with ' + emitters.map(function (e) { return e.name; }).join(', '), [this].concat(emitters), transformators.merge(), this.dirtyCurrentValue());
    };
    Emitter.prototype.when = function (switcher) {
        var t = namedTransformator('when happens then', [this], transformators.when(switcher.happens, switcher.then), eevent.notHappend);
        return t;
    };
    Emitter.prototype.whenThen = function (happens) {
        var t = namedTransformator('when then', [this], transformators.whenThen(happens), eevent.notHappend);
        return t;
    };
    Emitter.prototype.sample = function (initialValue, samplingEvent) {
        var t = namedTransformator('sample' + this._enclosedName() + ' on ' + this._enclosedName(samplingEvent), [this, samplingEvent], transformators.sample(), initialValue);
        return t;
    };
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
    //     switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
    //     switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
    //     switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
    //     switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
    //     switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
    //     switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
    //     switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
    //     switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
    //     switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) },
    //     switcher14: { when: inf.IEmitter<eevent<S14>>, to: inf.IEmitter<T> | ((t: T, k: S14) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
    //     switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
    //     switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
    //     switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) },
    //     switcher14: { when: inf.IEmitter<eevent<S14>>, to: inf.IEmitter<T> | ((t: T, k: S14) => inf.IEmitter<T>) },
    //     switcher15: { when: inf.IEmitter<eevent<S15>>, to: inf.IEmitter<T> | ((t: T, k: S15) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
    //     switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
    //     switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
    //     switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) },
    //     switcher14: { when: inf.IEmitter<eevent<S14>>, to: inf.IEmitter<T> | ((t: T, k: S14) => inf.IEmitter<T>) },
    //     switcher15: { when: inf.IEmitter<eevent<S15>>, to: inf.IEmitter<T> | ((t: T, k: S15) => inf.IEmitter<T>) },
    //     switcher16: { when: inf.IEmitter<eevent<S16>>, to: inf.IEmitter<T> | ((t: T, k: S16) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
    //     switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
    //     switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
    //     switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) },
    //     switcher14: { when: inf.IEmitter<eevent<S14>>, to: inf.IEmitter<T> | ((t: T, k: S14) => inf.IEmitter<T>) },
    //     switcher15: { when: inf.IEmitter<eevent<S15>>, to: inf.IEmitter<T> | ((t: T, k: S15) => inf.IEmitter<T>) },
    //     switcher16: { when: inf.IEmitter<eevent<S16>>, to: inf.IEmitter<T> | ((t: T, k: S16) => inf.IEmitter<T>) },
    //     switcher17: { when: inf.IEmitter<eevent<S17>>, to: inf.IEmitter<T> | ((t: T, k: S17) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
    //     switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
    //     switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
    //     switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) },
    //     switcher14: { when: inf.IEmitter<eevent<S14>>, to: inf.IEmitter<T> | ((t: T, k: S14) => inf.IEmitter<T>) },
    //     switcher15: { when: inf.IEmitter<eevent<S15>>, to: inf.IEmitter<T> | ((t: T, k: S15) => inf.IEmitter<T>) },
    //     switcher16: { when: inf.IEmitter<eevent<S16>>, to: inf.IEmitter<T> | ((t: T, k: S16) => inf.IEmitter<T>) },
    //     switcher17: { when: inf.IEmitter<eevent<S17>>, to: inf.IEmitter<T> | ((t: T, k: S17) => inf.IEmitter<T>) },
    //     switcher18: { when: inf.IEmitter<eevent<S18>>, to: inf.IEmitter<T> | ((t: T, k: S18) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18, S19>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
    //     switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
    //     switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
    //     switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) },
    //     switcher14: { when: inf.IEmitter<eevent<S14>>, to: inf.IEmitter<T> | ((t: T, k: S14) => inf.IEmitter<T>) },
    //     switcher15: { when: inf.IEmitter<eevent<S15>>, to: inf.IEmitter<T> | ((t: T, k: S15) => inf.IEmitter<T>) },
    //     switcher16: { when: inf.IEmitter<eevent<S16>>, to: inf.IEmitter<T> | ((t: T, k: S16) => inf.IEmitter<T>) },
    //     switcher17: { when: inf.IEmitter<eevent<S17>>, to: inf.IEmitter<T> | ((t: T, k: S17) => inf.IEmitter<T>) },
    //     switcher18: { when: inf.IEmitter<eevent<S18>>, to: inf.IEmitter<T> | ((t: T, k: S18) => inf.IEmitter<T>) },
    //     switcher19: { when: inf.IEmitter<eevent<S19>>, to: inf.IEmitter<T> | ((t: T, k: S19) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18, S19, S20>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
    //     switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
    //     switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
    //     switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) },
    //     switcher14: { when: inf.IEmitter<eevent<S14>>, to: inf.IEmitter<T> | ((t: T, k: S14) => inf.IEmitter<T>) },
    //     switcher15: { when: inf.IEmitter<eevent<S15>>, to: inf.IEmitter<T> | ((t: T, k: S15) => inf.IEmitter<T>) },
    //     switcher16: { when: inf.IEmitter<eevent<S16>>, to: inf.IEmitter<T> | ((t: T, k: S16) => inf.IEmitter<T>) },
    //     switcher17: { when: inf.IEmitter<eevent<S17>>, to: inf.IEmitter<T> | ((t: T, k: S17) => inf.IEmitter<T>) },
    //     switcher18: { when: inf.IEmitter<eevent<S18>>, to: inf.IEmitter<T> | ((t: T, k: S18) => inf.IEmitter<T>) },
    //     switcher19: { when: inf.IEmitter<eevent<S19>>, to: inf.IEmitter<T> | ((t: T, k: S19) => inf.IEmitter<T>) },
    //     switcher20: { when: inf.IEmitter<eevent<S20>>, to: inf.IEmitter<T> | ((t: T, k: S20) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    Emitter.prototype.change = function () {
        var switchers = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            switchers[_i - 0] = arguments[_i];
        }
        return namedTransformator('change to when', [this].concat(switchers.map(function (s) { return s.when; })), transformators.change(switchers), this._currentValue);
    };
    Emitter.prototype._enclosedName = function (emitter) {
        if (emitter === void 0) { emitter = null; }
        return '<' + (emitter ? emitter.name : this.name) + '>';
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
function manual(initialValue) {
    var e = new ManualEmitter(initialValue);
    e.name = en('manual');
    return e;
}
exports.manual = manual;
function constant(value) {
    var e = new Emitter(value);
    e.name = en('constant *' + value + '*');
    return e;
}
exports.constant = constant;
function manualEvent(name) {
    // manual event emitter should
    // pack impulsed values into event
    // and not allow to emit values
    // it's done by monkey patching ManualEmitter
    var e = manual(eevent.notHappend);
    e.name = en('manual event');
    var oldImpulse = e.impulse;
    e.impulse = function (v) { return oldImpulse.apply(e, [eevent.of(v)]); };
    e.emit = function (v) {
        throw Error("can't emit from event emitter, only impulse");
    };
    e.name = name ? en(name) : e.name;
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
        this.name = '<| transformator |>';
        this._values = Array(emitters.length);
        if (transform) {
            this.setTransform(transform);
        }
        this._wires = [];
        this.plugEmitters(emitters);
    }
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
    t.name = '<| ' + name + ' |>';
    return t;
}
exports.namedTransformator = namedTransformator;

},{"./electric-event":21,"./placeholder":26,"./scheduler":30,"./transformator-helpers":31,"./wire":35}],24:[function(require,module,exports){
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

},{"../electric":22,"../electric-event":21,"../fp":25,"../receivers/utils":29,"../transformator":32}],25:[function(require,module,exports){
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

},{}],26:[function(require,module,exports){
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
        this._initialValue = initialValue;
        this.name = '| placeholder |>';
    }
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
        this.name = '| ph ' + emitter.name;
    };
    Placeholder.prototype.dirtyCurrentValue = function () {
        if (this._emitter) {
            return this._emitter.dirtyCurrentValue();
        }
        else if (this._initialValue !== undefined) {
            return this._initialValue;
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

},{}],27:[function(require,module,exports){
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
        console.log(emitter.name, '--', x);
    });
}
exports.log = log;
function logEvents(emitter) {
    emitter.plugReceiver(function (x) {
        if (!x.happend) {
            return;
        }
        console.log(emitter.name, '--', x.value);
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

},{}],28:[function(require,module,exports){
function htmlReceiverById(id) {
    var element = document.getElementById(id);
    return function (html) {
        element.innerHTML = html;
    };
}
exports.htmlReceiverById = htmlReceiverById;

},{}],29:[function(require,module,exports){
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

},{}],30:[function(require,module,exports){
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

},{}],31:[function(require,module,exports){
var utils = require('./utils');
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
                var e = utils.callIfFunction(to, v[0], v[i].value);
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

},{"./electric-event":21,"./scheduler":30,"./utils":34,"./wire":35}],32:[function(require,module,exports){
var emitter = require('./emitter');
var namedTransformator = emitter.namedTransformator;
var transformators = require('./transformator-helpers');
var eevent = require('../src/electric-event');
function map(mapping, emitter1, emitter2, emitter3, emitter4, emitter5, emitter6, emitter7) {
    var emitters = Array.prototype.slice.apply(arguments, [1]);
    return namedTransformator('map', emitters, transformators.map(mapping, emitters.length), mapping.apply(null, emitters.map(function (e) { return e.dirtyCurrentValue(); })));
}
exports.map = map;
;
function mapMany(mapping) {
    var emitters = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        emitters[_i - 1] = arguments[_i];
    }
    return namedTransformator('map many', emitters, transformators.map(mapping, emitters.length), mapping.apply(null, emitters.map(function (e) { return e.dirtyCurrentValue(); })));
}
exports.mapMany = mapMany;
function filter(initialValue, predicate, emitter1, emitter2, emitter3, emitter4, emitter5, emitter6, emitter7) {
    var emitters = Array.prototype.slice.apply(arguments, [2]);
    return namedTransformator('filter', emitters, transformators.filter(predicate, emitters.length), initialValue);
}
exports.filter = filter;
;
function filterMap(initialValue, filterMapping, emitter1, emitter2, emitter3, emitter4, emitter5, emitter6, emitter7) {
    var emitters = Array.prototype.slice.apply(arguments, [2]);
    return namedTransformator('filter map', emitters, transformators.filterMap(filterMapping, emitters.length), initialValue);
}
exports.filterMap = filterMap;
;
function accumulate(initialValue, accumulator, emitter1, emitter2, emitter3, emitter4, emitter5, emitter6, emitter7) {
    var emitters = Array.prototype.slice.apply(arguments, [2]);
    var acc = accumulator.apply([], [initialValue].concat(emitters.map(function (e) { return e.dirtyCurrentValue(); })));
    return namedTransformator('accumulate', emitters, transformators.accumulate(acc, accumulator), acc);
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
    return namedTransformator('cumulate', [emitter], transformators.cumulateOverTime(overInMs), eevent.notHappend);
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
    return namedTransformator('skip 1', [emitter], transform, eevent.notHappend);
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
    var transformator = namedTransformator('flatten many', [emitter].concat(emitter.dirtyCurrentValue()), transform, currentValues);
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

},{"../src/electric-event":21,"./emitter":23,"./transformator-helpers":31}],33:[function(require,module,exports){
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
    t.name = '?| transmitter |>';
    return t;
}
module.exports = transmitter;

},{"./emitter":23,"./wire":35}],34:[function(require,module,exports){
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
exports.callIfFunction = callIfFunction;
function any(list) {
    for (var i = 0; i < list.length; i++) {
        if (list[i]) {
            return true;
        }
    }
    return false;
}
exports.any = any;
function all(list) {
    for (var i = 0; i < list.length; i++) {
        if (!list[i]) {
            return false;
        }
    }
    return true;
}
exports.all = all;

},{}],35:[function(require,module,exports){
var Wire = (function () {
    function Wire(input, output, receive, set) {
        this.input = input;
        this.output = output;
        this.name = '-w-';
        if (set) {
            this._set = set;
            this._futureReceive = receive;
        }
        else {
            this.receive = receive;
        }
        this.receiverId = this.input.plugReceiver(this);
    }
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
