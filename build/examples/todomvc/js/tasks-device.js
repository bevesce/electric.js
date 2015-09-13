var item = require('./item');
var electric = require('../../../src/electric');
var eevent = require('../../../src/electric-event');
function collection(initial, input) {
    var initialTasks = electric.emitter.constant(initial);
    var tasks = initialTasks.change({ to: appended, when: notEmpty(input.insert) }, { to: checked, when: input.check }, { to: toggled, when: input.toggle }, { to: retitled, when: input.retitle }, { to: deleted, when: input.del }, { to: cleared, when: input.clear });
    tasks.name = 'tasks';
    var visible = electric.transformator.map(filterWithRoute, tasks, input.filter);
    visible.name = 'visible';
    var allCount = tasks.map(function (ts) { return ts.length; });
    allCount.name = 'count of all tasks';
    var completedCount = tasks.map(function (ts) { return onlyCompleted(ts).length; });
    completedCount.name = 'count of completed tasks';
    var activeCount = tasks.map(function (ts) { return onlyActive(ts).length; });
    activeCount.name = 'count of active tasks';
    return {
        all: tasks,
        visible: visible,
        count: {
            active: activeCount,
            completed: completedCount,
            all: allCount
        }
    };
}
;
function notEmpty(insert) {
    var t = insert.map(function (v) { return v.flattenMap(function (text) {
        text = text.trim();
        if (text !== '') {
            return eevent.of(item.of(text));
        }
        return eevent.notHappend;
    }); });
    t.name = 'not empty';
    return t;
}
function appended(items, newItem) {
    return cont(items.concat(newItem));
}
var cont = electric.emitter.constant;
function matchMap(items, match, map) {
    return items.map(function (v) {
        if (match(v)) {
            return map(v);
        }
        return v;
    });
}
function checked(items, arg) {
    return cont(matchMap(items, function (v) { return v.id() === arg.id; }, function (v) { return v.withCompleted(arg.completed); }));
}
function toggled(items, completed) {
    var noAll = items.length;
    console.log(items);
    var noCompleted = items.filter(function (t) { return t.isCompleted(); }).length;
    var completed = noAll !== noCompleted;
    console.log(noAll, noCompleted, completed);
    return cont(items.map(function (i) { return i.withCompleted(completed); }));
}
function retitled(items, arg) {
    return cont(matchMap(items, function (v) { return v.id() === arg.id; }, function (v) { return v.withTitle(arg.title); }));
}
function deleted(items, id) {
    return cont(items.filter(function (v) { return v.id() !== id; }));
}
function cleared(items, _) {
    return cont(onlyActive(items));
}
function filterWithRoute(items, route) {
    if (route === '#/active') {
        return onlyActive(items);
    }
    else if (route === '#/completed') {
        return onlyCompleted(items);
    }
    return items;
}
function onlyActive(tasks) {
    return tasks.filter(function (t) { return !t.isCompleted(); });
}
function onlyCompleted(tasks) {
    return tasks.filter(function (t) { return t.isCompleted(); });
}
module.exports = collection;
