var item = require('./item');
var electric = require('../../../src/electric');
var eevent = require('../../../src/electric-event');
var Change = require('./change');
var ACTIVE = '#/active';
var COMPLETED = '#/completed';
var ALL = '#/';
function collection(initialTasks, input) {
    var insert = notEmpty(input.insert);
    var tasks = electric.emitter.placeholder([]);
    var delayedTasks = tasks.transformTime([], function (t) { return t + 1; });
    delayedTasks.initialValue = [];
    var $ = eevent.lift;
    var appendChanges = insert.map($(function (t) { return [Change.append(t.id(), t.isCompleted(), t.title())]; }));
    var checkChanges = input.check.map($(function (t) { return [Change.check(t.id, t.completed)]; }));
    var toggleChanges = electric.transformator.map(function (toggle, tasks) { return toggle.flattenMap(function (_) {
        var noAll = tasks.length;
        var noCompleted = tasks.filter(function (t) { return t.isCompleted(); }).length;
        var toWhat = noAll !== noCompleted;
        var toggledTasks = tasks.filter(function (t) { return t.isCompleted() != toWhat; });
        var changes = toggledTasks.map(function (t) { return Change.check(t.id(), toWhat); });
        return changes.length > 0 ? eevent.of(changes) : eevent.notHappend;
    }); }, input.toggle, delayedTasks);
    var retitleChanges = input.retitle.map($(function (rt) { return [Change.retitle(rt.id, rt.title)]; }));
    var deleteChanges = input.del.map($(function (id) { return [Change.remove(id)]; }));
    var clearChanges = electric.transformator.map(function (clear, tasks) { return clear.flattenMap(function (_) {
        var changes = onlyCompleted(tasks).map(function (t) { return Change.remove(t.id()); });
        return changes.length > 0 ? eevent.of(changes) : eevent.notHappend;
    }); }, input.clear, tasks);
    var changes = electric.transformator.merge(appendChanges, checkChanges, toggleChanges, retitleChanges, deleteChanges, clearChanges);
    changes.name = 'tasks changes';
    var filteringChanges = electric.transformator.map(function (tasks, filter) { return filter.flattenMap(function (f) { return visibilityChangesOfTask(tasks, f); }); }, tasks, electric.transformator.changes(input.filter));
    var changesVisibleWithFilter = electric.transformator.map(function (changes, filter, tasks) {
        var r = changes.flattenMap(function (c) { return calculateVisibleChanges(c, filter, tasks); });
        return r;
    }, changes.transformTime(eevent.notHappend, function (t) { return t + 1; }), input.filter, tasks);
    var visibleChanges = electric.transformator.merge(changesVisibleWithFilter, filteringChanges);
    visibleChanges.name = 'visible changes';
    var allCount = tasks.map(function (ts) { return ts.length; });
    var completedCount = tasks.map(function (ts) { return onlyCompleted(ts).length; });
    var activeCount = tasks.map(function (ts) { return onlyActive(ts).length; });
    allCount.name = 'count of all tasks';
    completedCount.name = 'count of completed tasks';
    activeCount.name = 'count of active tasks';
    var accumulatedChanges = changes.accumulate(initialTasks, applyChanges);
    accumulatedChanges.name = 'tasks';
    tasks.is(accumulatedChanges);
    var initialVisibleTasks = initialTasks;
    if (input.filter.dirtyCurrentValue() === ACTIVE) {
        initialVisibleTasks = onlyActive(initialTasks);
    }
    else if (input.filter.dirtyCurrentValue() === COMPLETED) {
        initialVisibleTasks = onlyCompleted(initialTasks);
    }
    var visible = visibleChanges.accumulate(initialVisibleTasks, applyChanges);
    visible.name = 'visible tasks';
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
function visibilityChangesOfTask(tasks, filter) {
    var changes = [];
    if (filter.previous === filter.next) {
        return eevent.notHappend;
    }
    else if (filter.previous === ALL && filter.next === ACTIVE) {
        changes = onlyCompleted(tasks).map(Change.removeTask);
    }
    else if (filter.previous === ALL && filter.next === COMPLETED) {
        changes = onlyActive(tasks).map(Change.removeTask);
    }
    else if (filter.previous === ACTIVE && filter.next === ALL) {
        for (var i = 0; i < tasks.length; i++) {
            var task = tasks[i];
            if (task.isCompleted()) {
                changes.push(Change.insertTask(task, i));
            }
        }
    }
    else if (filter.previous === ACTIVE && filter.next === COMPLETED) {
        changes = tasks.map(function (t) { return t.isCompleted() ? Change.appendTask(t) : Change.removeTask(t); });
    }
    else if (filter.previous === COMPLETED && filter.next === ALL) {
        for (var i = 0; i < tasks.length; i++) {
            var task = tasks[i];
            if (!task.isCompleted()) {
                changes.push(Change.insertTask(task, i));
            }
        }
    }
    else if (filter.previous === COMPLETED && filter.next === ACTIVE) {
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
    if (filter === ACTIVE) {
        return function (c) { return changeOverActive(c, tasks); };
    }
    else if (filter === COMPLETED) {
        return function (c) { return changeOverCompleted(c, tasks); };
        ;
    }
    else {
        return function (c) { return c; };
    }
}
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
function applyChanges(tasks, changes) {
    if (!changes.happend) {
        return tasks;
    }
    var cs = changes.value;
    var newTasks = tasks.slice();
    cs.forEach(function (c) { return applyChange(c, newTasks); });
    return newTasks;
}
function applyChange(change, tasks) {
    if (change.type === 'append') {
        tasks.push(change.item());
    }
    else if (change.type === 'insert') {
        tasks.splice(change.index, 0, change.item());
    }
    else if (change.type === 'remove') {
        var index = indexById(change.id, tasks);
        tasks.splice(index, 1);
    }
    else if (change.type === 'check') {
        var index = indexById(change.id, tasks);
        var task = tasks[index];
        tasks.splice(index, 1, task.withCompleted(change.completed));
    }
    else if (change.type === 'retitle') {
        var index = indexById(change.id, tasks);
        var task = tasks[index];
        tasks.splice(index, 1, task.withTitle(change.title));
    }
}
function indexById(id, tasks) {
    for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].id() === id) {
            return i;
        }
    }
}
function onlyActive(tasks) {
    return tasks.filter(function (t) { return !t.isCompleted(); });
}
function onlyCompleted(tasks) {
    return tasks.filter(function (t) { return t.isCompleted(); });
}
function matchMap(items, match, map) {
    return items.map(function (v) {
        if (match(v)) {
            return map(v);
        }
        return v;
    });
}
module.exports = collection;
