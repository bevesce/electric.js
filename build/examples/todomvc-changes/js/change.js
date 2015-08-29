var item = require('./item');
var Change = (function () {
    function Change(type, id, completed, title, index) {
        this.type = type;
        this.id = id;
        this.completed = completed;
        this.title = title;
        this.index = index;
    }
    Change.check = function (id, completed) {
        return new Change('check', id, completed);
    };
    Change.retitle = function (id, title) {
        return new Change('retitle', id, undefined, title);
    };
    Change.append = function (id, completed, title) {
        return new Change('append', id, completed, title);
    };
    Change.remove = function (id) {
        return new Change('remove', id);
    };
    Change.insert = function (id, title, completed, index) {
        return new Change('insert', id, completed, title, index);
    };
    //
    Change.appendTask = function (task) {
        return Change.append(task.id(), task.isCompleted(), task.title());
    };
    Change.insertTask = function (task, index) {
        return Change.insert(task.id(), task.title(), task.isCompleted(), index);
    };
    Change.removeTask = function (task) {
        return Change.remove(task.id());
    };
    Change.prototype.item = function () {
        return new item(this.id, this.title, this.completed);
    };
    return Change;
})();
module.exports = Change;
