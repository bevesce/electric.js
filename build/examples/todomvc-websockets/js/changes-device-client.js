var eevent = require('../../../src/electric-event');
var Change = require('./change');
var io = require('socket.io-client');
var electricSocket = require('../../../src/devices/electric-socket');
var electric = require('../../../src/electric');
var ACTIVE = '#/active';
var COMPLETED = '#/completed';
function collection(input) {
    var socket = io('http://localhost:8080');
    for (var name in input) {
        input[name].plugReceiver(electricSocket.eventReceiver(name, socket));
    }
    var changes = electricSocket.eventEmitter('changes', socket).map(eevent.lift(function (c) { return c.map(Change.restore); }));
    var tasks = electric.emitter.placeholder([]);
    var $ = eevent.lift;
    var filteringChanges = electric.transformator.map(function (tasks, filter) { return filter.flattenMap(function (f) { return visibilityChangesOfTask(tasks, f); }); }, tasks, electric.transformator.changes(input.filter));
    var changesVisibleWithFilter = electric.transformator.map(function (changes, filter, tasks) {
        var r = changes.flattenMap(function (c) { return calculateVisibleChanges(c, filter, tasks); });
        return r;
    }, changes, input.filter, tasks);
    var visibleChanges = electric.transformator.merge(changesVisibleWithFilter, filteringChanges);
    var allCount = tasks.map(function (ts) { return ts.length; });
    var completedCount = tasks.map(function (ts) { return onlyCompleted(ts).length; });
    var activeCount = tasks.map(function (ts) { return onlyActive(ts).length; });
    tasks.is(changes.accumulate([], applyChanges));
    var initialVisibleTasks = [];
    var visible = visibleChanges.accumulate(initialVisibleTasks, applyChanges);
    visibleChanges.name = '<| visible changes |>';
    changes.name = '<| changes |>';
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
function visibilityChangesOfTask(tasks, f) {
    var changes = [];
    if (f.previous === f.next) {
        return eevent.notHappend;
    }
    else if (f.previous === '#/' && f.next === ACTIVE) {
        changes = onlyCompleted(tasks).map(Change.removeTask);
    }
    else if (f.previous === '#/' && f.next === COMPLETED) {
        changes = onlyActive(tasks).map(Change.removeTask);
    }
    else if (f.previous === ACTIVE && f.next === '#/') {
        for (var i = 0; i < tasks.length; i++) {
            var task = tasks[i];
            if (task.isCompleted()) {
                changes.push(Change.insertTask(task, i));
            }
        }
    }
    else if (f.previous === ACTIVE && f.next === COMPLETED) {
        changes = tasks.map(function (t) { return t.isCompleted() ? Change.appendTask(t) : Change.removeTask(t); });
    }
    else if (f.previous === COMPLETED && f.next === '#/') {
        for (var i = 0; i < tasks.length; i++) {
            var task = tasks[i];
            if (!task.isCompleted()) {
                changes.push(Change.insertTask(task, i));
            }
        }
    }
    else if (f.previous === COMPLETED && f.next === ACTIVE) {
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
        return Change.insert(change.id, task.title(), change.complted, index);
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
        return Change.insert(change.id, task.title(), change.completed, index);
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
