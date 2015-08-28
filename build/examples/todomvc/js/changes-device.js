var item = require('./item');
var electric = require('../../../src/electric');
var eevent = require('../../../src/electric-event');
var Change = require('./change');
function collection(initial, input) {
    var initialTasks = electric.emitter.constant(initial);
    var ac = electric.emitter.placeholder(13);
    var cc = electric.emitter.placeholder(26);
    var toggleTo = electric.transformator.map(function (a, c, t) {
        return t.map(function (_) { return a !== c; });
    }, ac, cc, input.toggle);
    var insert = notEmpty(input.insert);
    var tasks = initialTasks.change({ to: appended, when: insert }, { to: checked, when: input.check }, { to: allWithCompleted, when: toggleTo }, { to: retitled, when: input.retitle }, { to: deleted, when: input.del }, { to: cleared, when: input.clear });
    var $ = eevent.lift;
    var changes = electric.transformator.merge(
    // init
    electric.emitter.constant(eevent.of(initial.map(function (t) { return Change.append(t.id(), t.isCompleted(), t.title()); }))), 
    // append
    insert.map($(function (t) { return [Change.append(t.id(), t.isCompleted(), t.title())]; })), 
    // check
    input.check.map($(function (t) { return [Change.check(t.id, t.completed)]; })), 
    // toggle
    electric.transformator.map(function (toggle, tasks) { return toggle.flattenMap(function (toWhat) {
        var toggledTasks = tasks.filter(function (t) { return t.isCompleted() != toWhat; });
        var changes = toggledTasks.map(function (t) { return Change.check(t.id(), t.isCompleted()); });
        return changes.length > 0 ? eevent.of(changes) : eevent.notHappend;
    }); }, toggleTo, tasks), 
    // retitle
    input.retitle.map($(function (rt) { return [Change.retitle(rt.id, rt.title)]; })), 
    // remove
    input.del.map($(function (id) { return [Change.remove(id)]; })), 
    // clear
    electric.transformator.map(function (clear, tasks) { return clear.flattenMap(function (_) {
        var changes = onlyCompleted(tasks).map(function (t) { return Change.remove(t.id()); });
        return changes.length > 0 ? eevent.of(changes) : eevent.notHappend;
    }); }, input.clear, tasks));
    var filteringChanges = electric.transformator.map(function (tasks, filter) { return filter.flattenMap(function (f) { return visibilityChangesOfTask(tasks, f); }); }, tasks, electric.transformator.changes(input.filter));
    var changesVisibleWithFilter = electric.transformator.map(function (changes, filter, tasks) { return changes.flattenMap(function (c) { return calculateVisibleChanges(c, filter, tasks); }); }, changes, input.filter, tasks);
    var visibleChanges = electric.transformator.merge(changesVisibleWithFilter, filteringChanges);
    var visible = electric.transformator.map(filterWithRoute, tasks, input.filter);
    var allCount = tasks.map(function (ts) { return ts.length; });
    ac.is(allCount);
    var completedCount = tasks.map(function (ts) { return onlyCompleted(ts).length; });
    cc.is(completedCount);
    var activeCount = tasks.map(function (ts) { return onlyActive(ts).length; });
    return {
        all: tasks,
        visible: visible,
        count: {
            active: activeCount,
            completed: completedCount,
            all: allCount
        },
        changes: {
            all: changes,
            visible: visibleChanges
        }
    };
}
;
function notEmpty(insert) {
    return insert.map(function (v) { return v.flattenMap(function (text) {
        text = text.trim();
        if (text !== '') {
            return eevent.of(item.of(text));
        }
        return eevent.notHappend;
    }); });
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
function allWithCompleted(items, completed) {
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
function visibilityChangesOfTask(tasks, f) {
    var changes = [];
    if (f.previous === f.next) {
        return eevent.notHappend;
    }
    else if (f.previous === '#/' && f.next === '#/active') {
        changes = onlyCompleted(tasks).map(Change.removeTask);
    }
    else if (f.previous === '#/' && f.next === '#/completed') {
        changes = onlyActive(tasks).map(Change.removeTask);
    }
    else if (f.previous === '#/active' && f.next === '#/') {
        for (var i = 0; i < tasks.length; i++) {
            var task = tasks[i];
            if (task.isCompleted()) {
                changes.push(Change.insertTask(task, i));
            }
        }
    }
    else if (f.previous === '#/active' && f.next === '#/completed') {
        changes = tasks.map(function (t) { return t.isCompleted() ? Change.appendTask(t) : Change.removeTask(t); });
    }
    else if (f.previous === '#/completed' && f.next === '#/') {
        for (var i = 0; i < tasks.length; i++) {
            var task = tasks[i];
            if (!task.isCompleted()) {
                changes.push(Change.insertTask(task, i));
            }
        }
    }
    else if (f.previous === '#/completed' && f.next === '#/active') {
        changes = tasks.map(function (t) { return !t.isCompleted() ? Change.appendTask(t) : Change.removeTask(t); });
    }
    return changes.length > 0 ? eevent.of(changes) : eevent.notHappend;
}
function calculateVisibleChanges(changes, filter, tasks) {
    var visibleChanges = filterMap(changes, changesFilterMap(filter, tasks));
    return visibleChanges.length > 0 ? eevent.of(visibleChanges) : eevent.notHappend;
}
function filterMap(items, f) {
    return items.map(f).filter(function (x) { return x !== undefined; });
}
function changesFilterMap(filter, tasks) {
    if (filter === '#/active') {
        return function (c) { return changeOverActive(c, tasks); };
    }
    else if (filter === '#/completed') {
        return function (c) { return changeOverCompleted(c, tasks); };
        ;
    }
    else {
        return function (c) { return c; };
    }
}
// check
// insert
function changeOverActive(change, tasks) {
    if (justPassIt(change)) {
        return change;
    }
    else if (change.type === 'append' && !change.completed) {
        return change;
    }
    else if (change.type === 'check' && change.completed) {
        return Change.remove(change.id);
    }
    else if (change.type === 'check' && !change.completed) {
        var index = howManyMatchingBefore(function (t) { return !t.isCompleted(); }, change.id, tasks);
        var task = findById(change.id, tasks);
        return Change.insertTask(task, index);
    }
    else if (change.type === 'insert' && change.completed) {
        return;
    }
    else if (change.type === 'insert' && !change.completed) {
        var index = howManyMatchingBefore(function (t) { return !t.isCompleted(); }, change.id, tasks);
        return Change.insert(change.id, change.title, change.completed, index);
    }
}
function changeOverCompleted(change, tasks) {
    if (justPassIt(change)) {
        return change;
    }
    else if (change.type === 'append' && change.completed) {
        return change;
    }
    else if (change.type === 'check' && !change.completed) {
        return Change.remove(change.id);
    }
    else if (change.type === 'check' && change.completed) {
        var index = howManyMatchingBefore(function (t) { return t.isCompleted(); }, change.id, tasks);
        var task = findById(change.id, tasks);
        return Change.insertTask(task, index);
    }
    else if (change.type === 'insert' && !change.completed) {
        return;
    }
    else if (change.type === 'insert' && change.completed) {
        var index = howManyMatchingBefore(function (t) { return t.isCompleted(); }, change.id, tasks);
        return Change.insert(change.id, change.title, change.completed, index);
    }
}
function justPassIt(change) {
    return change.type === 'retitle' || change.type === 'remove';
}
function howManyMatchingBefore(match, id, tasks) {
    var count = 0;
    for (var i = 0; i < tasks.length; i++) {
        var task = tasks[i];
        if (task.id() === id) {
            return count;
        }
        if (match(task)) {
            count += 1;
        }
    }
}
function findById(id, tasks) {
    for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].id() === id) {
            return tasks[i];
        }
    }
}
module.exports = collection;
