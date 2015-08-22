var electric = require('../../src/electric');
function identity(v) {
    return v;
}
function collection(initialValue) {
    return electric.device.create(function (input, output) {
        var changes = input('changes', identity);
        var collected = electric.emitter.constant(initialValue)
            .change({
            to: function (c, f) { return electric.emitter.constant(f(c)); },
            when: changes
        });
        output('collected', collected);
    });
}
;
module.exports = collection;
