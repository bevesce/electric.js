function insert(list, item) {
    var l = list.slice();
    l.push(item);
    return l;
}
module.exports = insert;
