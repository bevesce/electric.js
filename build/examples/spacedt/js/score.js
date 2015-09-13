var electric = require('../../../src/electric');
var c = require('./constants');
var cont = electric.emitter.constant;
function score(input) {
    var t = cont(0).change({ to: function (s, _) { return cont(s + c.score.forAsteroid); }, when: input.asteroidHit }, { to: function (s, _) { return cont(s + c.score.forMother); }, when: input.motherHit }).change({ to: function (s, _) { return cont(s); }, when: input.gameEnd });
    t.name = 'score';
    return t;
}
module.exports = score;
