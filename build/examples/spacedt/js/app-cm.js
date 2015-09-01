var electric = require('../../../src/electric');
var eui = require('../../../src/emitters/ui');
var calculus = require('./calculus');
var point = require('./point');
var velocity = require('./velocity');
var acceleration = require('./acceleration');
var cont = electric.emitter.constant;
var canvas = document.getElementById('space');
var width = window.innerWidth;
var height = window.innerHeight;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var ctx = canvas.getContext('2d');
ctx.fillStyle = 'white';
var MAX_ANGULAR_SPEED = 5;
var MIN_ANGULAR_SPEED = -MAX_ANGULAR_SPEED;
var ANGULAR_SPEED_ACCELERATION = 100;
var MAX_LINEAR_SPEED = 1600;
var MIN_LINEAR_SPEED = -10;
var LINEAR_SPEED_ACCELERATION = 400;
var FPS = 60;
point.setBounds(0, width, 0, height);
velocity.setBounds(MIN_ANGULAR_SPEED, MAX_ANGULAR_SPEED, MIN_LINEAR_SPEED, MAX_LINEAR_SPEED);
var center = point.of(window.innerWidth / 2, window.innerHeight / 2, -Math.PI / 2);
var shipA = cont(acceleration.zero()).change({ to: function (a, _) { return cont(a.withX(-ANGULAR_SPEED_ACCELERATION)); }, when: eui.key('a', 'down') }, { to: function (a, _) { return cont(a.withX(ANGULAR_SPEED_ACCELERATION)); }, when: eui.key('d', 'down') }, { to: function (a, _) { return cont(a.withX(0)); }, when: eui.key('d', 'up') }, { to: function (a, _) { return cont(a.withX(0)); }, when: eui.key('a', 'up') }, { to: function (a, _) { return cont(a.withY(-LINEAR_SPEED_ACCELERATION)); }, when: eui.key('s', 'down') }, { to: function (a, _) { return cont(a.withY(LINEAR_SPEED_ACCELERATION)); }, when: eui.key('w', 'down') }, { to: function (a, _) { return cont(a.withY(0)); }, when: eui.key('w', 'up') }, { to: function (a, _) { return cont(a.withY(0)); }, when: eui.key('s', 'up') });
var shipV = calculus.integral(velocity.zero(), shipA, { fps: FPS }).change({ to: function (v, _) { return calculus.integral(v.withX(0), shipA, { fps: FPS }); }, when: eui.key('d', 'up') }, { to: function (v, _) { return calculus.integral(v.withX(0), shipA, { fps: FPS }); }, when: eui.key('a', 'up') });
var shipXY = calculus.integral(center, shipV, { fps: FPS });
shipXY.plugReceiver(shipDrawer());
function shipDrawer() {
    return function (ship) {
        canvas.width = canvas.width;
        ctx.strokeStyle = 'white';
        ctx.fillStyle = 'blue';
        ctx.lineWidth = 3;
        var lShift = Math.cos(ship.angle) * 20;
        var pShift = Math.sin(ship.angle) * 20;
        var lShift2 = Math.cos(ship.angle + Math.PI / 2) * 10;
        var pShift2 = Math.sin(ship.angle + Math.PI / 2) * 10;
        var pX = -lShift + ship.x;
        var pY = -pShift + ship.y;
        ctx.moveTo(ship.x + lShift * 0.5, ship.y + pShift * 0.5);
        ctx.lineTo(pX + lShift2, pY + pShift2);
        ctx.lineTo(pX - lShift2, pY - pShift2);
        ctx.lineTo(ship.x + lShift * 0.5, ship.y + pShift * 0.5);
        ctx.fill();
        pX = ship.x;
        pY = ship.y;
        ctx.stroke();
    };
}
shipV.map(function (v) { return v.y; }).plugReceiver(speedReceiver());
function speedReceiver() {
    var speedBar = document.getElementById('speed');
    var speedCurrent = document.getElementById('speed-current');
    var speedLeft = document.getElementById('speed-tomax');
    return function (s) {
        s = Math.abs(s);
        var w = speedBar.offsetWidth;
        var sc = s / MAX_LINEAR_SPEED * w;
        var sl = w - sc;
        speedCurrent.style.width = sc + 'px';
        speedLeft.style.width = sl + 'px';
    };
}
