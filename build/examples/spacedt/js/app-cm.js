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
var ANGLE_A = 0.1;
var MAX_SPEED = 400;
var SPEED_A = 20;
var MIN_SPEED = 50;
var FPS = 1;
point.setBounds(0, width, 0, height);
velocity.setBounds(undefined, undefined, undefined, undefined, -0.2, 0.2);
var center = point.PointWithAngle.of(window.innerWidth / 2, window.innerHeight / 2, 0);
var shipA = cont(acceleration.AngularAcceleration.zero()).change({ to: function (a, _) { return cont(a.withAngle(-ANGLE_A)); }, when: eui.key('a', 'down') }, { to: function (a, _) { return cont(a.withAngle(0)); }, when: eui.key('a', 'up') }, { to: function (a, _) { return cont(a.withAngle(ANGLE_A)); }, when: eui.key('d', 'down') }, { to: function (a, _) { return cont(a.withAngle(0)); }, when: eui.key('d', 'up') }, { to: function (a, _) { return cont(a.withSpeed(SPEED_A)); }, when: eui.key('s', 'down') }, { to: function (a, _) { return cont(a.withSpeed(0)); }, when: eui.key('s', 'up') }, { to: function (a, _) { return cont(a.withSpeed(-SPEED_A)); }, when: eui.key('w', 'down') }, { to: function (a, _) { return cont(a.withSpeed(0)); }, when: eui.key('w', 'up') });
shipA.name = '| a |>';
var shipV = calculus.integral(velocity.AngularVelocity.zero(), shipA, { fps: FPS });
var shipXY = calculus.integral(center, shipV, { fps: FPS });
ctx.strokeStyle = 'white';
var prevx = 0;
var prevy = 0;
var prevdx = 0;
var prevdy = 0;
var prevAngle = Math.PI;
shipXY.plugReceiver(function (p) {
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = canvas.width;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    var angle = p.angle;
    var dx = Math.sin(angle) * 20;
    var dy = Math.cos(angle) * 20;
    ;
    prevx = p.x - dx;
    prevy = p.y - dy;
    prevdx = p.x + dx * 2;
    prevdy = p.y + dy * 2;
    ctx.moveTo(prevx, prevy);
    ctx.lineTo(prevdx, prevdy);
    ctx.stroke();
    // prevAngle = angle
});
// shipV.map(v => v.speed).plugReceiver(
// 	speedReceiver()
// );
// function speedReceiver() {
// 	var speedBar = document.getElementById('speed');
// 	var speedCurrent = document.getElementById('speed-current');
// 	var speedLeft = document.getElementById('speed-tomax');
// 	return function(s: number) {
// 		var w = speedBar.offsetWidth;
// 		var sc = s / MAX_SPEED * w;
// 		var sl = w - sc;
// 		speedCurrent.style.width = sc + 'px';
// 		speedLeft.style.width = sl + 'px';
// 	}
// }
console.log('\n\n\n\n\n\n\n\n\n\n\n\n\n\n\nSPACEdt!\n\n');
