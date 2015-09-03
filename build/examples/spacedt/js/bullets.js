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
