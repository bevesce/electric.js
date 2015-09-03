import inf = require('../../../src/interfaces');
import electric = require('../../../src/electric');

import c = require('./constants');

export = score;

var cont = electric.emitter.constant;


function score(input: {
	asteroidHit: inf.IEmitter<inf.IElectricEvent<any>>,
	motherHit: inf.IEmitter<inf.IElectricEvent<any>>,
	gameEnd: inf.IEmitter<inf.IElectricEvent<any>>
}) {
	return cont(0).change(
		{ to: (s, _) => cont(s + c.score.forAsteroid), when: input.asteroidHit },
		{ to: (s, _) => cont(s + c.score.forMother), when: input.motherHit }
	).change(
		{ to: (s, _) => cont(s), when: input.gameEnd }
	);
}