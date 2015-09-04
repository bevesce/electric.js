function any(list) {
    for (var i = 0; i < list.length; i++) {
        if (list[i]) {
            return true;
        }
    }
    return false;
}
module.exports = any;
