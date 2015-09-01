import inf = require('../../../src/interfaces');
import electric = require('../../../src/electric');
import eui = require('../../../src/emitters/ui');
import rui = require('../../../src/receivers/ui');

import calculus = require('./calculus');
import point = require('./point');
import velocity = require('./velocity');
import acceleration = require('./acceleration');

var cont = electric.emitter.constant;

var canvas = <any>document.getElementById('space');
const width = window.innerWidth;
const height = window.innerHeight;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var ctx = canvas.getContext('2d');
ctx.fillStyle = 'white';


const MAX_ANGULAR_SPEED = 5;
const MIN_ANGULAR_SPEED = -MAX_ANGULAR_SPEED;
const ANGULAR_SPEED_ACCELERATION = 100

const MAX_LINEAR_SPEED = 1600;
const MIN_LINEAR_SPEED = -10;
const LINEAR_SPEED_ACCELERATION = 400;

const FPS = 60;



point.setBounds(0, width, 0, height);
velocity.setBounds(
	MIN_ANGULAR_SPEED, MAX_ANGULAR_SPEED,
	MIN_LINEAR_SPEED, MAX_LINEAR_SPEED
);


var center = point.of(
	window.innerWidth / 2,
	window.innerHeight / 2,
	-Math.PI / 2
);

var shipA = cont(acceleration.zero()).change(
	{ to: (a, _) => cont(a.withX(-ANGULAR_SPEED_ACCELERATION)), when: eui.key('a', 'down') },
	{ to: (a, _) => cont(a.withX(ANGULAR_SPEED_ACCELERATION)), when: eui.key('d', 'down') },

	{ to: (a, _) => cont(a.withX(0)), when: eui.key('d', 'up') },
	{ to: (a, _) => cont(a.withX(0)), when: eui.key('a', 'up') },

	{ to: (a, _) => cont(a.withY(-LINEAR_SPEED_ACCELERATION)), when: eui.key('s', 'down') },
	{ to: (a, _) => cont(a.withY(LINEAR_SPEED_ACCELERATION)), when: eui.key('w', 'down') },

	{ to: (a, _) => cont(a.withY(0)), when: eui.key('w', 'up') },
	{ to: (a, _) => cont(a.withY(0)), when: eui.key('s', 'up') }
);
var shipV = calculus.integral(velocity.zero(), shipA, { fps: FPS }).change(
	{ to: (v, _) => calculus.integral(v.withX(0), shipA, { fps: FPS }), when: eui.key('d', 'up') },
	{ to: (v, _) => calculus.integral(v.withX(0), shipA, { fps: FPS }), when: eui.key('a', 'up') }
);
var shipXY = calculus.integral(center, shipV, { fps: FPS });



shipXY.plugReceiver(shipDrawer());
function shipDrawer() {
	return function(ship: point) {
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
	}
}


shipV.map(v => v.y).plugReceiver(
	speedReceiver()
);
function speedReceiver() {
	var speedBar = document.getElementById('speed');
	var speedCurrent = document.getElementById('speed-current');
	var speedLeft = document.getElementById('speed-tomax');
	return function(s: number) {
		s = Math.abs(s);
		var w = speedBar.offsetWidth;
		var sc = s / MAX_LINEAR_SPEED * w;
		var sl = w - sc;
		speedCurrent.style.width = sc + 'px';
		speedLeft.style.width = sl + 'px';
	}
}
