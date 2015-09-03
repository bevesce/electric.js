import electric = require('../../../../src/electric');
export = remove;

var cont = electric.emitter.constant;

function remove<T>(bullets: T[], ...indices: number[]) {
	var bullets = bullets.slice();
	indices.sort((a, b) => -(a - b)).forEach(i => bullets.splice(i, 1))
	return cont(bullets);
}