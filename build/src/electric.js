exports.scheduler = require('./scheduler');
exports.device = require('./device');
exports.emitter = require('./emitter');
exports.transformator = require('./transformator');
exports.receiver = require('./receiver');
exports.clock = require('./clock');
exports.fp = require('./fp');
function lift(f) {
    return function () {
        var emitters = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            emitters[_i - 0] = arguments[_i];
        }
        return exports.transformator.map.apply(exports.transformator, [f].concat(emitters));
    };
}
exports.lift = lift;
