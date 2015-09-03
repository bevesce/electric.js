var electric = require('../../src/electric');
function identity(v) {
    return v;
}
function collection(initialValue, changes) {
    var collected = electric.emitter.constant(initialValue)
        .change({
        to: function (c, f) { return electric.emitter.constant(f(c)); },
        when: changes
    });
    return collected;
}
;
module.exports = collection;
