var electric = require('../../../../src/electric');
var cont = electric.emitter.constant;
function insert(list, item) {
    var l = list.slice();
    l.push(item);
    return cont(l);
}
module.exports = insert;
