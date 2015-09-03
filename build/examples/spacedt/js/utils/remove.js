var electric = require('../../../../src/electric');
var cont = electric.emitter.constant;
function remove(bullets) {
    var indices = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        indices[_i - 1] = arguments[_i];
    }
    var bullets = bullets.slice();
    indices.sort(function (a, b) { return -(a - b); }).forEach(function (i) { return bullets.splice(i, 1); });
    return cont(bullets);
}
module.exports = remove;
