import electric = require('../../../src/electric');

import c = require('./constants');

export = score;

var cont = electric.emitter.constant;


function score(input: {
	asteroidHit: electric.emitter.EventEmitter<{}>,
	motherHit: electric.emitter.EventEmitter<{}>,
	gameEnd: electric.emitter.EventEmitter<{}>
}) {
	var t = cont(0).change(
		{ to: (s, _) => cont(s + c.score.forAsteroid), when: input.asteroidHit },
		{ to: (s, _) => cont(s + c.score.forMother), when: input.motherHit }
	).change(
		{ to: (s, _) => cont(s), when: input.gameEnd }
	);
	t.name = 'score';
	return t;
}
