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
