import c = require('./constants');
import Point = require('./point');
import random = require('./utils/random');

var _ctx: any;

export function setCtx(ctx: AnalyserNode) {
	_ctx = ctx;
}


export function ship(ship: Point) {
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



export function bullets(bullets: Point[], radius: number, color: string) {
	_ctx.fillStyle = color
	for (var k in bullets) {
		var bullet = bullets[k];
		_ctx.beginPath();
		_ctx.arc(bullet.x, bullet.y, radius, 0, 2 * Math.PI, true);
		_ctx.fill();
	}
}

export function collisions(collisions: { x: number, y: number }[]) {
	_ctx.fillStyle = c.collision.color;
	collisions.forEach(collision => {
		_ctx.beginPath();
		_ctx.arc(collision.x, collision.y, c.collision.radius, 0, 2 * Math.PI, true);
		_ctx.fill();
	});
}

export function asteroidMother(mothership: Point) {
	_ctx.beginPath();
	_ctx.fillStyle = c.asteroidMother.color;
	_ctx.arc(mothership.x, mothership.y, c.asteroidMother.radius, 0, 2 * Math.PI, true);
	_ctx.fill();
}

export function gameOver(width: number, height: number) {
	_ctx.beginPath();
	_ctx.font = 'bold 48px Avenir, sans-serif';
	_ctx.fillStyle = c.collision.color;
	_ctx.fillText('∫GAME OVERdt', random(0, width - 300), random(50, height - 50))
}