var electric = require('../../../src/electric');
var MovingPoint = require('./moving-point');
var remove = require('./utils/remove');
var insert = require('./utils/insert');
var c = require('./constants');
var cont = electric.emitter.constant;
function createAsteroid(asteroids, xya) {
    var speed = c.asteroid.speed;
    var angle = xya.angle;
    var x = xya.x;
    var y = xya.y;
    var newAsteroid = MovingPoint.start(speed, x, y, angle);
    return insert(asteroids, newAsteroid);
}
function create(input) {
    var asteroids = cont([]).change({ to: function (as, xya) { return createAsteroid(as, xya); }, when: input.createNew }, { to: function (as, c) { return remove(as, c.index2); }, when: input.removeSecond });
    asteroids.name = 'asteroids';
    var asteroidsXY = electric.transformator.flattenMany(asteroids.map(function (as) { return as.map(function (a) { return a.xya; }); }));
    asteroidsXY.name = 'asteroids positions';
    return {
        all: asteroids,
        xy: asteroidsXY
    };
}
module.exports = create;
