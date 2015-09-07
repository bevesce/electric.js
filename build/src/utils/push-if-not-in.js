function pushIfNotIn(list, item) {
    if (list.indexOf(item) === -1) {
        list.push(item);
    }
}
module.exports = pushIfNotIn;
