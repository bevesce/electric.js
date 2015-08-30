var item = require('./item');
var electric = require('../../../src/electric');
var eevent = require('../../../src/electric-event');
var Change = require('./change');
var ACTIVE = '#/active';
var COMPLETED = '#/completed';
function collection(initialTasks, input) {
    var ac = electric.emitter.placeholder(13);
    var cc = electric.emitter.placeholder(26);
    var toggleTo = electric.transformator.map(function (a, c, t) {
        return t.map(function (_) { return a !== c; });
    }, ac, cc, input.toggle);
    var insert = notEmpty(input.insert);
    var tasks = electric.emitter.placeholder([]);
    var $ = eevent.lift;
    var changes = electric.transformator.merge(
    // append
    insert.map($(function (t) { return [Change.append(t.id(), t.isCompleted(), t.title())]; })), 
    // check
    input.check.map($(function (t) { return [Change.check(t.id, t.completed)]; })), 
    // toggle
    electric.transformator.map(function (toggle, tasks) { return toggle.flattenMap(function (toWhat) {
        var toggledTasks = tasks.filter(function (t) { return t.isCompleted() != toWhat; });
        var changes = toggledTasks.map(function (t) { return Change.check(t.id(), toWhat); });
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
    var allCount = tasks.map(function (ts) { return ts.length; });
    ac.is(allCount);
    var completedCount = tasks.map(function (ts) { return onlyCompleted(ts).length; });
    cc.is(completedCount);
    var activeCount = tasks.map(function (ts) { return onlyActive(ts).length; });
    tasks.is(changes.accumulate(initialTasks, applyChanges));
    return {
        all: tasks,
        changes: changes
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
