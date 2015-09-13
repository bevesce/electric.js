var Item = (function () {
    function Item(id, title, completed) {
        this._id = id;
        this._title = title;
        this._completed = completed;
    }
    Item.of = function (title) {
        return new Item(Item._counter++, title, false);
    };
    Item.equal = function (item1, item2) {
        return item1._id === item2._id &&
            item1._title === item2._title &&
            item1._completed === item2._completed;
    };
    Item.restore = function (args) {
        return new Item(Item._counter++, args._title, args._completed);
    };
    Item.prototype.withTitle = function (newTitle) {
        return new Item(this._id, newTitle, this._completed);
    };
    Item.prototype.complete = function () {
        return new Item(this._id, this._title, true);
    };
    Item.prototype.uncomplete = function () {
        return new Item(this._id, this._title, false);
    };
    Item.prototype.toggle = function () {
        return new Item(this._id, this._title, !this._completed);
    };
    Item.prototype.title = function () {
        return this._title;
    };
    Item.prototype.isCompleted = function () {
        return this._completed;
    };
    Item.prototype.withCompleted = function (complted) {
        return new Item(this._id, this._title, complted);
    };
    Item.prototype.id = function () {
        return this._id;
    };
    Item.prototype.equals = function (otherItem) {
        return Item.equal(this, otherItem);
    };
    Item._counter = 0;
    return Item;
})();
module.exports = Item;
