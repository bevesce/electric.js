function shallowCopy(obj) {
    var copy = {};
    for (var k in obj) {
        copy[k] = obj[k];
    }
    return copy;
}
module.exports = shallowCopy;
