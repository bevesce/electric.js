(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var electric = require('../../../src/electric');
var rui = require('../../../src/receivers/ui');
var eui = require('../../../src/emitters/ui');
var storage = require('./storage');
// Emitters
var hash = eui.hash();
var newTask = eui.fromInputTextEnter('new-task');
var clear = eui.fromButton('clear-button');
var check = electric.emitter.manualEvent('check');
var del = electric.emitter.manualEvent('delete');
var toggle = eui.fromCheckboxEvent('toggle');
var editingStart = electric.emitter.manualEvent('editing start');
var retitle = electric.emitter.manualEvent('retitle');
// Transformators
var tasksDevice = require('./changes-device');
var tasks = tasksDevice(storage.restoreTasks(), {
    insert: newTask,
    check: check,
    toggle: toggle,
    retitle: retitle,
    del: del,
    clear: clear,
    filter: hash
});
// Receivers
//// Changes Receiver
var editingId = electric.emitter.constant(undefined).change({ to: function (_, k) { return electric.emitter.constant(k); }, when: editingStart }, { to: electric.emitter.constant(undefined), when: tasks.changes.visible });
var changesRendererReceiver = require('./changes-receiver');
electric.transformator.map(function (tasks, editingId, changes) { return ({ tasks: tasks, editingId: editingId, changes: changes }); }, tasks.visible, editingId, tasks.changes.visible).plugReceiver(changesRendererReceiver(del, retitle, editingStart, check));
//// Tasks Renderer Receiver
// var editingId = electric.emitter.constant(undefined).change(
// 	{ to: (_, k) => electric.emitter.constant(k), when: editingStart },
// 	{ to: electric.emitter.constant(undefined), when: retitle },
// 	{ to: electric.emitter.constant(undefined), when: del }
// );
// import tasksRendererReceiver = require('./tasks-receiver');
// electric.transformator.map(
// 	(ts, editingId) => ({tasks: ts, editing: editingId}),
// 	tasks.visible, editingId
// ).plugReceiver(tasksRendererReceiver(del, retitle, editingStart, check));
//// Other
tasks.all.plugReceiver(storage.tasksReceiver);
newTask.plugReceiver(clearInput);
function clearInput(_) {
    document.getElementById('new-task').value = '';
}
;
tasks.count.all.plugReceiver(allCounterReceiver());
function allCounterReceiver() {
    var main = document.getElementById('main');
    var footer = document.getElementById('footer');
    return function (count) {
        main.className = hidden(main.className, count === 0);
        footer.className = hidden(footer.className, count === 0);
    };
}
;
tasks.count.active.plugReceiver(activeCountReceiver());
function activeCountReceiver() {
    var countReceiver = rui.htmlReceiverById('active-tasks-counter');
    var wordReceiver = rui.htmlReceiverById('active-tasks-word');
    return function (c) {
        countReceiver(c);
        wordReceiver(c === 1 ? 'item' : 'items');
    };
}
;
electric.transformator.map(function (ac, cc) { return ac === cc; }, tasks.count.all, tasks.count.completed).plugReceiver(checkToggleAllReceiver());
tasks.count.completed.plugReceiver(clearCompletedHideReceiver());
function clearCompletedHideReceiver() {
    var button = document.getElementById('clear-button');
    return function (count) {
        button.className = hidden(button.className, count === 0);
    };
}
;
function checkToggleAllReceiver() {
    var toggleCheckbox = document.getElementById('toggle');
    return function (checked) {
        toggleCheckbox.checked = checked;
    };
}
function hidden(className, shouldBe) {
    if (shouldBe) {
        return className += ' hidden';
    }
    return className.replace(/hidden/g, '');
}
hash.plugReceiver(footerFiltersReceiver());
function footerFiltersReceiver() {
    var previousRoute = '';
    return function (route) {
        var routeToId = {
            '#/active': 'button-active',
            '#/completed': 'button-completed'
        };
        if (previousRoute && previousRoute !== route) {
            document.getElementById(routeToId[previousRoute] || 'button-all').className = '';
        }
        document.getElementById(routeToId[route] || 'button-all').className = 'selected';
        previousRoute = route;
    };
}
;

},{"../../../src/electric":10,"../../../src/emitters/ui":12,"../../../src/receivers/ui":15,"./changes-device":3,"./changes-receiver":4,"./storage":7}],2:[function(require,module,exports){
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

},{"./item":6}],3:[function(require,module,exports){
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
    var filteringChanges = electric.transformator.map(function (tasks, filter) { return filter.flattenMap(function (f) { return visibilityChangesOfTask(tasks, f); }); }, tasks, electric.transformator.changes(input.filter));
    var changesVisibleWithFilter = electric.transformator.map(function (changes, filter, tasks) {
        var r = changes.flattenMap(function (c) { return calculateVisibleChanges(c, filter, tasks); });
        return r;
    }, changes, input.filter, tasks);
    var visibleChanges = electric.transformator.merge(changesVisibleWithFilter, filteringChanges);
    var allCount = tasks.map(function (ts) { return ts.length; });
    ac.is(allCount);
    var completedCount = tasks.map(function (ts) { return onlyCompleted(ts).length; });
    cc.is(completedCount);
    var activeCount = tasks.map(function (ts) { return onlyActive(ts).length; });
    tasks.is(changes.accumulate(initialTasks, applyChanges));
    var initialVisibleTasks = initialTasks;
    if (input.filter.dirtyCurrentValue() === ACTIVE) {
        initialVisibleTasks = onlyActive(initialTasks);
    }
    else if (input.filter.dirtyCurrentValue() === COMPLETED) {
        initialVisibleTasks = onlyCompleted(initialTasks);
    }
    var visible = visibleChanges.accumulate(initialVisibleTasks, applyChanges);
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

},{"../../../src/electric":10,"../../../src/electric-event":9,"./change":2,"./item":6}],4:[function(require,module,exports){
var dom = require('./dom');
var Change = require('./change');
var check;
var del;
var editing;
var retitle;
var list = document.getElementById('todo-list');
var listItemById = {};
var labelById = {};
var inputById = {};
function changesRendererReceiver(del_, retitle_, editing_, check_) {
    var renderedInitial = false;
    var previousEditingId;
    del = del_;
    retitle = retitle_;
    editing = editing_;
    check = check_;
    return function renderChanges(arg) {
        var tasks = arg.tasks;
        var editingId = arg.editingId;
        var changes = arg.changes.value;
        if (!renderedInitial) {
            changes = tasks.map(Change.appendTask);
            renderedInitial = true;
        }
        if (changes && changes.length > 0) {
            changes.forEach(function (c) { return renderChange(c); });
        }
        if (editingId != previousEditingId) {
            prepareEditing(editingId, previousEditingId);
            previousEditingId = editingId;
        }
    };
}
function renderChange(change) {
    if (change.type === 'append') {
        renderAppend(change);
    }
    else if (change.type === 'remove') {
        renderRemove(change);
    }
    else if (change.type === 'check') {
        renderCheck(change);
    }
    else if (change.type === 'retitle') {
        renderRetitle(change);
    }
    else if (change.type === 'insert') {
        renderInsert(change);
    }
}
function renderAppend(change) {
    var listItem = createListItem(change);
    list.appendChild(listItem);
}
function createListItem(change) {
    var li = dom.li({ class: change.completed ? 'completed' : '' });
    var div = dom.div({ class: 'view' });
    li.appendChild(div);
    var checkbox = dom.checkbox({ class: 'toggle' });
    if (change.completed) {
        checkbox.setAttribute('checked', 'true');
    }
    on(checkbox, 'click', check.impulse, function () { return ({ id: change.id, completed: checkbox.checked }); });
    div.appendChild(checkbox);
    var label = dom.label();
    var text = dom.text(change.title);
    label.appendChild(text);
    labelById[change.id] = label;
    on(label, 'dblclick', editing.impulse, function () { return change.id; });
    div.appendChild(label);
    var button = dom.button({ class: 'destroy' });
    on(button, 'click', del.impulse, function () { return change.id; });
    div.appendChild(button);
    var input = dom.input({ class: 'edit', value: change.title, autocomplete: 'off' });
    li.appendChild(input);
    inputById[change.id] = input;
    listItemById[change.id] = li;
    return li;
}
function on(target, eventType, call, withArg) {
    target.addEventListener(eventType, function () {
        call(withArg());
    });
}
function renderRemove(change) {
    var elemtent = listItemById[change.id];
    if (elemtent) {
        elemtent.remove();
        listItemById[change.id] = null;
        labelById[change.id] = null;
        inputById[change.id] = null;
    }
}
function renderCheck(change) {
    var elemtent = listItemById[change.id];
    if (elemtent && change.completed) {
        elemtent.className += ' completed';
    }
    else if (elemtent) {
        removeClass(elemtent, 'completed');
    }
}
function removeClass(element, className) {
    element.className = element.className.replace(new RegExp(className, 'g'), '');
}
function renderRetitle(change) {
    var label = labelById[change.id];
    if (label) {
        label.replaceChild(dom.text(change.title), label.firstChild);
        inputById[change.id].setAttribute('value', change.title);
    }
}
function renderInsert(change) {
    var listItem = createListItem(change);
    list.insertBefore(listItem, list.children[change.index]);
    listItemById[change.id] = listItem;
}
function prepareEditing(editingId, previousEditingId) {
    var input;
    if (previousEditingId !== undefined) {
        removeClass(listItemById[previousEditingId], 'editing');
    }
    if (editingId !== undefined) {
        listItemById[editingId].className += ' editing';
        input = inputById[editingId];
    }
    if (!input) {
        return;
    }
    input.focus();
    input.addEventListener('blur', onBlur);
    input.addEventListener('keydown', onKeypress);
    var startValue = input.value;
    function onBlur() {
        removeListeners();
        editTask(this.value);
    }
    function onKeypress(event) {
        if (event.keyCode == 27) {
            removeListeners();
            escapeEditing(this);
        }
        else if (event.keyCode === 13) {
            removeListeners();
            editTask(this.value);
        }
    }
    function editTask(text) {
        if (text === '') {
            del.impulse(editingId);
        }
        else {
            retitle.impulse({ id: editingId, title: text });
        }
    }
    function escapeEditing(that) {
        that.value = startValue;
        editing.impulse(undefined);
    }
    function removeListeners() {
        input.removeEventListener('blur', onBlur);
        input.removeEventListener('keydown', onKeypress);
    }
}
module.exports = changesRendererReceiver;

},{"./change":2,"./dom":5}],5:[function(require,module,exports){
function element(tag, attributes) {
    var result = document.createElement(tag);
    for (var name in attributes) {
        if (!attributes.hasOwnProperty(name)) {
            continue;
        }
        result.setAttribute(name, attributes[name]);
    }
    return result;
}
exports.element = element;
function curryTag(tag) {
    return function (attributes) {
        return element(tag, attributes || {});
    };
}
exports.div = curryTag('div');
exports.label = curryTag('label');
exports.li = curryTag('li');
exports.button = curryTag('button');
exports.input = curryTag('input');
function checkbox(attributes) {
    attributes['type'] = 'checkbox';
    return element('input', attributes);
}
exports.checkbox = checkbox;
function text(txt) {
    return document.createTextNode(txt);
}
exports.text = text;

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
var item = require('./item');
var TASK_KEY = 'todos-electric';
function restoreTasks() {
    var s = localStorage.getItem(TASK_KEY);
    if (s) {
        return JSON.parse(s).map(item.restore);
    }
    return [];
}
exports.restoreTasks = restoreTasks;
function tasksReceiver(tasks) {
    localStorage.setItem(TASK_KEY, JSON.stringify(tasks));
}
exports.tasksReceiver = tasksReceiver;

},{"./item":6}],8:[function(require,module,exports){
exports.scheduler = require('./scheduler');
exports.emitter = require('./emitter');
exports.transformator = require('./transformator');
var TimeValue = (function () {
    function TimeValue(time, value) {
        this.time = time;
        this.value = value;
    }
    TimeValue.of = function (time, value) {
        if (value === void 0) { value = undefined; }
        return new TimeValue(time, value);
    };
    TimeValue.lift = function (f) {
        return function () {
            var vs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                vs[_i - 0] = arguments[_i];
            }
            return TimeValue.of(Math.max.apply(Math, vs.map(function (v) { return v.time; })), f.apply(null, vs.map(function (v) { return v.value; })));
        };
    };
    TimeValue.prototype.map = function (f) {
        return TimeValue.of(this.time, f(this.value));
    };
    return TimeValue;
})();
exports.TimeValue = TimeValue;
function _time(args, transform) {
    var e = exports.emitter.manual(transform(exports.scheduler.now()));
    var subname;
    var interval;
    if (args.intervalInMs === undefined) {
        subname = 'fps: ' + args.fps;
        interval = 1 / args.fps * 1000;
    }
    else {
        subname = 'interval: ' + args.intervalInMs + 'ms';
        interval = args.intervalInMs;
    }
    var id = exports.scheduler.scheduleInterval(function () { return e.emit(transform(exports.scheduler.now())); }, interval);
    e.name = 'clock<' + subname + '>';
    function releaseResoueces() {
        exports.scheduler.unscheduleInterval(id);
    }
    e.setReleaseResources(releaseResoueces);
    return e;
}
function time(args) {
    return _time(args, function (t) { return TimeValue.of(t, undefined); });
}
exports.time = time;
function timeFunction(f, args, t0) {
    if (t0 === void 0) { t0 = 0; }
    return _time(args, function (t) { return (TimeValue.of(t, f(t - t0))); });
}
exports.timeFunction = timeFunction;
function equalsWithTime(x, y) {
    return x.time === y.time && x.value === y.value;
}
function integral(f) {
    var initialAcc = { time: exports.scheduler.now(), value: 0, integral: 0 };
    var result = f.accumulate(initialAcc, function (acc, v) {
        var dt = (v.time - acc.time) / 1000;
        return {
            time: v.time,
            value: v.value,
            integral: acc.integral + (acc.value + v.value) / 2 * dt
        };
    }).map(function (v) { return TimeValue.of(v.time, v.integral); });
    result.setEquals(equalsWithTime);
    return result;
}
exports.integral = integral;
function derivative(f) {
    var initialAcc = { time: exports.scheduler.now(), value: undefined, derivative: 0 };
    var result = f.accumulate(initialAcc, function (acc, v) {
        var dt = (v.time - acc.time) / 1000;
        var diff = 0;
        if (dt !== 0) {
            diff = (v.value - acc.value) / dt / 1000;
        }
        return {
            time: v.time,
            value: v.value,
            derivative: diff
        };
    }).map(function (v) { return TimeValue.of(v.time, v.derivative); });
    result.setEquals(equalsWithTime);
    return result;
}
exports.derivative = derivative;

},{"./emitter":11,"./scheduler":17,"./transformator":19}],9:[function(require,module,exports){
var utils = require('./utils');
var ElectricEvent = (function () {
    function ElectricEvent() {
    }
    ElectricEvent.of = function (value) {
        return new Happend(value);
    };
    ElectricEvent.lift = function (f) {
        return function () {
            var vs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                vs[_i - 0] = arguments[_i];
            }
            if (utils.all(vs.map(function (v) { return v.happend; }))) {
                return ElectricEvent.of(f.apply(null, vs.map(function (v) { return v.value; })));
            }
            else {
                return ElectricEvent.notHappend;
            }
        };
    };
    ElectricEvent.flatLift = function (f) {
        return function (v1) {
            if (v1.happend) {
                return f(v1.value);
            }
            else {
                return ElectricEvent.notHappend;
            }
        };
    };
    ElectricEvent.liftOnFirst = function (f) {
        return function (v1, v2) {
            if (v1.happend) {
                return ElectricEvent.of(f(v1.value, v2));
            }
            else {
                return ElectricEvent.notHappend;
            }
        };
    };
    ElectricEvent.prototype.map = function (f) {
        throw Error('ElectricEvent is abstract class, use Happend and NotHappend');
    };
    ;
    ElectricEvent.prototype.flattenMap = function (f) {
        throw Error('ElectricEvent is abstract class, use Happend and NotHappend');
    };
    return ElectricEvent;
})();
var Happend = (function () {
    function Happend(value) {
        this.happend = true;
        this.value = value;
    }
    Happend.prototype.map = function (f) {
        return ElectricEvent.of(f(this.value));
    };
    Happend.prototype.flattenMap = function (f) {
        return f(this.value);
    };
    return Happend;
})();
var NotHappend = (function () {
    function NotHappend() {
        this.happend = false;
        this.value = undefined;
    }
    NotHappend.prototype.map = function (f) {
        return ElectricEvent.notHappend;
    };
    NotHappend.prototype.flattenMap = function (f) {
        return ElectricEvent.notHappend;
    };
    return NotHappend;
})();
ElectricEvent.notHappend = new NotHappend();
module.exports = ElectricEvent;

},{"./utils":21}],10:[function(require,module,exports){
exports.scheduler = require('./scheduler');
exports.emitter = require('./emitter');
exports.transformator = require('./transformator');
exports.receiver = require('./receiver');
exports.clock = require('./clock');
exports.transmitter = require('./transmitter');
// export import device = require('./device');
// export import fp = require('./fp');

},{"./clock":8,"./emitter":11,"./receiver":14,"./scheduler":17,"./transformator":19,"./transmitter":20}],11:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var scheduler = require('./scheduler');
var transformators = require('./transformator-helpers');
var eevent = require('./electric-event');
var Wire = require('./wire');
exports.placeholder = require('./placeholder');
function en(name) {
    return '| ' + name + ' |>';
}
var Emitter = (function () {
    function Emitter(initialValue) {
        if (initialValue === void 0) { initialValue = undefined; }
        this._receivers = [];
        this._currentValue = initialValue;
        this.name = en(this.name);
    }
    // when reveiver is plugged current value is not emitted to him
    // instantaneously, but instead it's done asynchronously
    Emitter.prototype.plugReceiver = function (receiver) {
        if (typeof receiver !== 'function' && receiver.wire) {
            receiver = receiver.wire(this);
        }
        this._receivers.push(receiver);
        this._ayncDispatchToReceiver(receiver, this._currentValue);
        return this._receivers.length - 1;
    };
    Emitter.prototype._dirtyPlugReceiver = function (receiver) {
        if (typeof receiver !== 'function' && receiver.wire) {
            receiver = receiver.wire(this);
        }
        this._receivers.push(receiver);
        // this._ayncDispatchToReceiver(receiver, this._currentValue);
        return this._receivers.length - 1;
    };
    Emitter.prototype.unplugReceiver = function (receiverOrId) {
        var index = this._getIndexOfReceiver(receiverOrId);
        this._receivers.splice(index, 1);
    };
    Emitter.prototype._getIndexOfReceiver = function (receiverOrId) {
        if (typeof receiverOrId === 'number') {
            return receiverOrId;
        }
        else {
            return this._receivers.indexOf(receiverOrId);
        }
    };
    Emitter.prototype.dirtyCurrentValue = function () {
        return this._currentValue;
    };
    Emitter.prototype.stabilize = function () {
        this.emit = this._throwStabilized;
        this.impulse = this._throwStabilized;
        this._releaseResources();
    };
    Emitter.prototype.setReleaseResources = function (releaseResources) {
        this._releaseResources = releaseResources;
    };
    Emitter.prototype._releaseResources = function () {
        // should be overwritten in more specific emitters
    };
    Emitter.prototype._throwStabilized = function (value) {
        throw Error("can't emit <" + value + "> from " + this.name + ", it's stabilized");
    };
    // let's say that f = constant(y).emit(x) is called at t_e
    // then f(t) = x for t >= t_e, and f(t) = y for t < t_e
    Emitter.prototype.emit = function (value) {
        if (this._equals(this._currentValue, value)) {
            return;
        }
        this._dispatchToReceivers(value);
        this._currentValue = value;
    };
    // let's say that f constant(y).impulse(x) is called at t_i
    // then f(t_i) = x and f(t) = y when t != t_i
    Emitter.prototype.impulse = function (value) {
        if (this._equals(this._currentValue, value)) {
            return;
        }
        this._dispatchToReceivers(value);
        this._dispatchToReceivers(this._currentValue);
    };
    Emitter.prototype._equals = function (x, y) {
        return x === y;
    };
    Emitter.prototype.setEquals = function (equals) {
        this._equals = equals;
    };
    Emitter.prototype._dispatchToReceivers = function (value) {
        var currentReceivers = this._receivers.slice();
        for (var _i = 0; _i < currentReceivers.length; _i++) {
            var receiver = currentReceivers[_i];
            this._ayncDispatchToReceiver(receiver, value);
        }
    };
    Emitter.prototype._dispatchToReceiver = function (receiver, value) {
        if (typeof receiver === 'function') {
            receiver(value);
        }
        else {
            receiver.receive(value);
        }
    };
    Emitter.prototype._ayncDispatchToReceivers = function (value) {
        var currentReceivers = this._receivers.slice();
        for (var _i = 0; _i < currentReceivers.length; _i++) {
            var receiver = currentReceivers[_i];
            this._ayncDispatchToReceiver(receiver, value);
        }
    };
    Emitter.prototype._ayncDispatchToReceiver = function (receiver, value) {
        var _this = this;
        scheduler.scheduleTimeout(function () { return _this._dispatchToReceiver(receiver, value); }, 0);
    };
    // transformators
    Emitter.prototype.map = function (mapping) {
        return namedTransformator('map' + this._enclosedName(), [this], transformators.map(mapping, 1), mapping(this._currentValue));
    };
    Emitter.prototype.filter = function (initialValue, predicate) {
        return namedTransformator('filter' + this._enclosedName(), [this], transformators.filter(predicate), initialValue);
    };
    Emitter.prototype.filterMap = function (initialValue, mapping) {
        return namedTransformator('filter' + this._enclosedName(), [this], transformators.filterMap(mapping), initialValue);
    };
    Emitter.prototype.transformTime = function (initialValue, timeShift, t0) {
        if (t0 === void 0) { t0 = 0; }
        var t = namedTransformator('transform time' + this._enclosedName(), [this], transformators.transformTime(timeShift, t0), initialValue);
        this._dispatchToReceiver(t._dirtyGetWireTo(this), this.dirtyCurrentValue());
        return t;
    };
    Emitter.prototype.accumulate = function (initialValue, accumulator) {
        var acc = accumulator(initialValue, this.dirtyCurrentValue());
        return namedTransformator('accumulate' + this._enclosedName(), [this], transformators.accumulate(acc, accumulator), acc);
    };
    Emitter.prototype.merge = function () {
        var emitters = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            emitters[_i - 0] = arguments[_i];
        }
        return namedTransformator('merge' + this._enclosedName() + ' with ' + emitters.map(function (e) { return e.name; }).join(', '), [this].concat(emitters), transformators.merge(), this.dirtyCurrentValue());
    };
    Emitter.prototype.when = function (switcher) {
        var currentValue = this.dirtyCurrentValue();
        var t = namedTransformator('when' + this._enclosedName(), [this], transformators.when(switcher.happens, switcher.then), eevent.notHappend);
        return t;
    };
    Emitter.prototype.sample = function (initialValue, samplingEvent) {
        var t = namedTransformator('sample' + this._enclosedName() + ' on ' + this._enclosedName(samplingEvent), [this, samplingEvent], transformators.sample(), initialValue);
        return t;
    };
    Emitter.prototype.change = function () {
        var switchers = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            switchers[_i - 0] = arguments[_i];
        }
        return namedTransformator('change' + this._enclosedName(), [this].concat(switchers.map(function (s) { return s.when; })), transformators.change(switchers), this._currentValue);
    };
    Emitter.prototype._enclosedName = function (emitter) {
        if (emitter === void 0) { emitter = null; }
        return '<' + (emitter ? emitter.name : this.name) + '>';
    };
    return Emitter;
})();
exports.Emitter = Emitter;
function emitter(initialValue) {
    return new Emitter(initialValue);
}
exports.emitter = emitter;
var ManualEmitter = (function (_super) {
    __extends(ManualEmitter, _super);
    function ManualEmitter() {
        _super.apply(this, arguments);
    }
    ManualEmitter.prototype.emit = function (v) {
        var _this = this;
        scheduler.scheduleTimeout(function () { return _super.prototype.emit.call(_this, v); }, 0);
    };
    ManualEmitter.prototype.impulse = function (v) {
        var _this = this;
        scheduler.scheduleTimeout(function () { return _super.prototype.impulse.call(_this, v); }, 0);
    };
    ManualEmitter.prototype.stabilize = function () {
        _super.prototype.stabilize.call(this);
        this.emit = this.emit;
        this.impulse = this.impulse;
    };
    return ManualEmitter;
})(Emitter);
function manual(initialValue) {
    var e = new ManualEmitter(initialValue);
    e.name = en('manual');
    return e;
}
exports.manual = manual;
function constant(value) {
    var e = new Emitter(value);
    e.name = en('constant *' + value + '*');
    return e;
}
exports.constant = constant;
function manualEvent(name) {
    // manual event emitter should
    // pack impulsed values into event
    // and not allow to emit values
    // it's done by monkey patching ManualEmitter
    var e = manual(eevent.notHappend);
    e.name = en('manual event');
    var oldImpulse = e.impulse;
    e.impulse = function (v) { return oldImpulse.apply(e, [eevent.of(v)]); };
    e.emit = function (v) {
        throw Error("can't emit from event emitter, only impulse");
    };
    e.name = name ? en(name) : e.name;
    // monkey patching requires ugly casting...
    return e;
}
exports.manualEvent = manualEvent;
var Transformator = (function (_super) {
    __extends(Transformator, _super);
    function Transformator(emitters, transform, initialValue) {
        if (transform === void 0) { transform = undefined; }
        if (initialValue === void 0) { initialValue = undefined; }
        _super.call(this, initialValue);
        this.name = '<| transformator |>';
        this._values = Array(emitters.length);
        ;
        if (transform) {
            this.setTransform(transform);
        }
        this._wires = [];
        this.plugEmitters(emitters);
    }
    Transformator.prototype.setTransform = function (transform) {
        var _this = this;
        this._transform = transform(function (x) { return _this.emit(x); }, function (x) { return _this.impulse(x); });
    };
    Transformator.prototype._transform = function (values, index) {
        // Default implementation that just passes values
        // Should be overwritten in functions that create Transformators
        this.emit(values[index]);
    };
    Transformator.prototype.plugEmitters = function (emitters) {
        var _this = this;
        emitters.forEach(function (e) { return _this.wire(e); });
        for (var i = 0; i < emitters.length; i++) {
            this._values[i] = emitters[i].dirtyCurrentValue();
        }
    };
    Transformator.prototype.plugEmitter = function (emitter) {
        this.wire(emitter);
        this._values[this._wires.length - 1] = emitter.dirtyCurrentValue();
        return this._wires.length - 1;
    };
    Transformator.prototype.wire = function (emitter) {
        var _this = this;
        var index = this._wires.length;
        this._wires[index] = new Wire(emitter, this, (function (index) { return function (x) { return _this.receiveOn(x, index); }; })(index), (function (index) { return function (x) { return _this.setOn(x, index); }; })(index));
        return this._wires[index];
    };
    Transformator.prototype._dirtyGetWireTo = function (emitter) {
        return this._wires.filter(function (w) { return w.input === emitter; })[0];
    };
    Transformator.prototype.receiveOn = function (value, index) {
        this._values[index] = value;
        this._transform(this._values, index);
    };
    Transformator.prototype.setOn = function (value, index) {
        this._values[index] = value;
    };
    return Transformator;
})(Emitter);
exports.Transformator = Transformator;
function namedTransformator(name, emitters, transform, initialValue) {
    if (transform === void 0) { transform = undefined; }
    var t = new Transformator(emitters, transform, initialValue);
    t.name = '<| ' + name + ' |>';
    return t;
}
exports.namedTransformator = namedTransformator;

},{"./electric-event":9,"./placeholder":13,"./scheduler":17,"./transformator-helpers":18,"./wire":22}],12:[function(require,module,exports){
var electric = require('../electric');
var utils = require('../receivers/utils');
var transformator = require('../transformator');
var eevent = require('../electric-event');
function em(text) {
    return '`' + text + '`';
}
function fromEvent(target, type, name, useCapture) {
    if (name === void 0) { name = ''; }
    if (useCapture === void 0) { useCapture = false; }
    var emitter = electric.emitter.manualEvent();
    emitter.name = name || '| event: ' + type + ' on ' + em(target) + '|>';
    var impulse = function (event) {
        // event.preventDefault();
        emitter.impulse(event);
    };
    target.addEventListener(type, impulse, useCapture);
    emitter.setReleaseResources(function () { return target.removeEventListener(type, impulse, useCapture); });
    return emitter;
}
exports.fromEvent = fromEvent;
function fromButton(nodeOrId) {
    var button = utils.getNode(nodeOrId);
    return fromEvent(button, 'click', 'button clicks on ' + em(nodeOrId));
}
exports.fromButton = fromButton;
function fromInputText(nodeOrId, type) {
    if (type === void 0) { type = 'keyup'; }
    var input = utils.getNode(nodeOrId);
    return fromEvent(input, 'keyup', 'text of ' + em(nodeOrId)).map(function () { return input.value; });
}
exports.fromInputText = fromInputText;
function fromInputTextEnter(nodeOrId) {
    var input = utils.getNode(nodeOrId);
    var e = electric.emitter.manualEvent();
    e.name = '| enter on ' + em(nodeOrId) + ' |>';
    var impulse = function (event) {
        if (event.keyCode === 13) {
            e.impulse(input.value);
        }
    };
    input.addEventListener('keydown', impulse, false);
    e.setReleaseResources(function () { return input.removeEventListener('keydown', impulse, false); });
    return e;
}
exports.fromInputTextEnter = fromInputTextEnter;
function fromCheckbox(nodeOrId) {
    var checkbox = utils.getNode(nodeOrId);
    var e = fromEvent(checkbox, 'click', 'checked of ' + em(nodeOrId));
    return e.map(function () { return checkbox.checked; });
}
exports.fromCheckbox = fromCheckbox;
;
function fromCheckboxEvent(nodeOrId) {
    var checkbox = utils.getNode(nodeOrId);
    var e = electric.emitter.manualEvent();
    e.name = '| click on checkbox ' + nodeOrId + ' |>';
    var impulse = function (event) {
        e.impulse(checkbox.checked);
    };
    checkbox.addEventListener('click', impulse, false);
    e.setReleaseResources(function () { return checkbox.removeEventListener('click', impulse, false); });
    return e;
}
exports.fromCheckboxEvent = fromCheckboxEvent;
;
function joinObjects(objs) {
    var o = {};
    objs.forEach(function (e) {
        if (e === undefined) {
            return;
        }
        o[e.key] = e.value;
    });
    return o;
}
function fromCheckboxes(nodeOrIds) {
    var emitters = nodeOrIds.map(function (nodeOrId) {
        var checkbox = utils.getNode(nodeOrId);
        return fromEvent(checkbox, 'click').map(function () { return ({ key: checkbox.id, value: checkbox.checked }); });
    });
    var e = transformator.mapMany.apply(transformator, [function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        return joinObjects(args);
    }].concat(emitters));
    e.name = 'state of checkboxes ' + em(nodeOrIds);
    return e;
}
exports.fromCheckboxes = fromCheckboxes;
;
function fromRadioGroup(nodesOrName) {
    var nodes = utils.getNodes(nodesOrName);
    var emitters = nodes.map(function (radio) { return fromEvent(radio, 'click').map(function (v) { return v.happend ? eevent.of(radio.id) : eevent.notHappend; }); });
    var e = transformator.hold('', transformator.merge.apply(transformator, emitters));
    e.name = 'state of radio group ' + em(nodesOrName);
    return e;
}
exports.fromRadioGroup = fromRadioGroup;
function fromSelect(nodeOrId) {
    var select = utils.getNode(nodeOrId);
    return fromEvent(select, 'change', 'selected of ' + em(nodeOrId)).map(function () { return select.value; });
}
exports.fromSelect = fromSelect;
;
function mouse(nodeOrId) {
    var mouse = utils.getNode(nodeOrId);
    var emitters = ['down', 'up', 'over', 'out', 'move'].map(function (type) { return fromEvent(mouse, 'mouse' + type).map(function (e) { return (e.happend ? eevent.of({ type: type, data: e.value }) : eevent.notHappend); }); });
    var emitter = transformator.merge.apply(transformator, emitters);
    emitter.name = '| mouse on ' + em(nodeOrId) + ' |>';
    return emitter;
}
exports.mouse = mouse;
;
var hashEmitter = null;
function hash() {
    if (!hashEmitter) {
        hashEmitter = electric.emitter.manual(window.location.hash);
        hashEmitter.name = '| window.location.hash |>';
        window.addEventListener('hashchange', function () {
            hashEmitter.emit(window.location.hash);
        });
    }
    return hashEmitter;
}
exports.hash = hash;
function enter(nodeOrId) {
    var target = utils.getNode(nodeOrId);
    var e = electric.emitter.manualEvent();
    e.name = '| enter on ' + em(nodeOrId) + ' |>';
    var impulse = function (event) {
        if (event.keyCode === 13) {
            e.impulse(null);
        }
    };
    target.addEventListener('keydown', impulse, false);
    e.setReleaseResources(function () { return target.removeEventListener('keydown', impulse, false); });
    return e;
}
exports.enter = enter;

},{"../electric":10,"../electric-event":9,"../receivers/utils":16,"../transformator":19}],13:[function(require,module,exports){
// functions that can be simply queued
var functionsToVoid = [
    'plugReceiver',
    'unplugReceiver',
    'stabilize',
    'setReleaseResources',
    'setEquals'
];
// functions that should return another placeholder
var functionsToEmitter = [
    'plugReceiver',
    'unplugReceiver',
    'stabilize',
    'setReleaseResources',
    'setEquals',
    'map',
    'filter',
    'filterMap',
    'transformTime',
    'accumulate',
    'sample',
    'change'
];
// function to throw if called before is()
var functionsToSomething = [];
var Placeholder = (function () {
    function Placeholder(initialValue) {
        this._actions = [];
        this._initialValue = initialValue;
        this.name = '| placeholder |>';
    }
    Placeholder.prototype.is = function (emitter) {
        if (this._emitter) {
            throw Error("placeholder is " + this._emitter.name + " so cannot be " + emitter.name);
        }
        this._emitter = emitter;
        for (var _i = 0, _a = this._actions; _i < _a.length; _i++) {
            var action = _a[_i];
            action(this._emitter);
        }
        this._actions = undefined;
        this.name = '| ph ' + emitter.name;
    };
    Placeholder.prototype.dirtyCurrentValue = function () {
        if (this._emitter) {
            return this._emitter.dirtyCurrentValue();
        }
        else if (this._initialValue !== undefined) {
            return this._initialValue;
        }
        throw Error('called dirtyCurrentValue() on placeholder without initial value');
    };
    return Placeholder;
})();
function doOrQueue(name) {
    return function placeholding() {
        var args = arguments;
        if (this._emitter) {
            this._emitter[name].apply(this._emitter, arguments);
        }
        else {
            this._actions.push(function (emitter) {
                emitter[name].apply(emitter, args);
            });
        }
    };
}
functionsToVoid.forEach(function (name) {
    Placeholder.prototype[name] = doOrQueue(name);
});
function doOrQueueAndReturnPlaceholder(name) {
    return function placeholding() {
        var args = arguments;
        if (this._emitter) {
            return this._emitter[name].apply(this._emitter, args);
        }
        else {
            var p = placeholder();
            this._actions.push(function (emitter) {
                p.is(emitter[name].apply(emitter, args));
            });
            return p;
        }
    };
}
functionsToEmitter.forEach(function (name) {
    Placeholder.prototype[name] = doOrQueueAndReturnPlaceholder(name);
});
function doOrThrow(name) {
    return function placeholding() {
        var args = arguments;
        if (this._emitter) {
            return this._emitter[name].apply(this._emitter, args);
        }
        throw Error('called <' + name + '> on empty placeholder');
    };
}
functionsToSomething.forEach(function (name) {
    Placeholder.prototype[name] = doOrThrow(name);
});
function placeholder(initialValue) {
    return (new Placeholder(initialValue));
}
module.exports = placeholder;

},{}],14:[function(require,module,exports){
function logReceiver(message) {
    if (!message) {
        message = '<<<';
    }
    return function (x) {
        console.log(message, x);
    };
}
exports.logReceiver = logReceiver;
function log(emitter) {
    emitter.plugReceiver(function (x) {
        console.log(emitter.name, '--', x);
    });
}
exports.log = log;
function logEvents(emitter) {
    emitter.plugReceiver(function (x) {
        if (!x.happend) {
            return;
        }
        console.log(emitter.name, '--', x.value);
    });
}
exports.logEvents = logEvents;
function collect(emitter) {
    var r = [];
    emitter.plugReceiver(function (x) {
        r.push(x);
    });
    return r;
}
exports.collect = collect;

},{}],15:[function(require,module,exports){
function htmlReceiverById(id) {
    var element = document.getElementById(id);
    return function (html) {
        element.innerHTML = html;
    };
}
exports.htmlReceiverById = htmlReceiverById;

},{}],16:[function(require,module,exports){
function getNode(nodeOrId) {
    if (typeof nodeOrId === 'string') {
        return document.getElementById(nodeOrId);
    }
    else {
        return nodeOrId;
    }
}
exports.getNode = getNode;
function getNodes(nodesOfName) {
    if (typeof nodesOfName === 'string') {
        return Array.prototype.slice.call(document.getElementsByName(nodesOfName));
    }
    else {
        return nodesOfName;
    }
}
exports.getNodes = getNodes;

},{}],17:[function(require,module,exports){
var stopTime = Date.now();
var callbacks = {};
var stopped = false;
function stop() {
    stopTime = Date.now();
    stopped = true;
    return stopTime;
}
exports.stop = stop;
function resume() {
    stopped = false;
    callbacks = {};
}
exports.resume = resume;
function advance(timeShiftInMiliseconds) {
    if (timeShiftInMiliseconds === void 0) { timeShiftInMiliseconds = 1; }
    if (!stopped) {
        return;
    }
    var newTime = stopTime + timeShiftInMiliseconds;
    for (; stopTime < newTime; stopTime++) {
        executeCallbacksForTime(stopTime);
    }
    return stopTime;
}
exports.advance = advance;
function executeCallbacksForTime(currentTime) {
    var toExecute = callbacks[stopTime];
    if (toExecute) {
        toExecute.forEach(function (f) { return f(); });
    }
}
function currentTime() {
    return stopTime;
}
exports.currentTime = currentTime;
function scheduleTimeout(callback, delayInMs) {
    if (delayInMs === void 0) { delayInMs = 0; }
    if (!stopped) {
        return setTimeout(callback, delayInMs);
    }
    var whenToExecute = stopTime + delayInMs;
    if (delayInMs <= 0) {
        callback();
    }
    else if (callbacks[whenToExecute]) {
        callbacks[whenToExecute].push(callback);
    }
    else {
        callbacks[whenToExecute] = [callback];
    }
    return callback;
}
exports.scheduleTimeout = scheduleTimeout;
function scheduleInterval(callback, intervalInMs) {
    if (intervalInMs === void 0) { intervalInMs = 0; }
    if (!stopped) {
        return setInterval(callback, intervalInMs);
    }
    var cancelable = [];
    function intervalCallback() {
        callback();
        cancelable.push(scheduleTimeout(intervalCallback, intervalInMs));
    }
    var id = scheduleTimeout(intervalCallback, intervalInMs);
    cancelable.push(id);
    return cancelable;
}
exports.scheduleInterval = scheduleInterval;
function now() {
    if (!stopped) {
        return Date.now();
    }
    return stopTime;
}
exports.now = now;
function unscheduleInterval(id) {
    if (!stopped) {
        return clearInterval(id);
    }
    id.forEach(removeFromCallbacks);
}
exports.unscheduleInterval = unscheduleInterval;
function removeFromCallbacks(callback) {
    for (var k in callbacks) {
        removeFromCallbacksAtTime(callbacks[k], callback);
    }
}
function removeFromCallbacksAtTime(callbacksAtTime, callback) {
    var i = callbacksAtTime.indexOf(callback);
    while (i !== -1) {
        callbacksAtTime.splice(i, 1);
        i = callbacksAtTime.indexOf(callback);
    }
}

},{}],18:[function(require,module,exports){
var utils = require('./utils');
var Wire = require('./wire');
var scheduler = require('./scheduler');
var eevent = require('./electric-event');
function map(f, noOfEmitters) {
    return function mapTransform(emit) {
        return function mapTransform(v, i) {
            emit(f.apply(null, v));
        };
    };
}
exports.map = map;
function filter(predicate, noOfEmitters) {
    if (noOfEmitters === void 0) { noOfEmitters = 1; }
    return function transform(emit) {
        var eaten = 0;
        return function filterTransform(v, i) {
            if (predicate.apply(null, v)) {
                emit(v[i]);
            }
        };
    };
}
exports.filter = filter;
;
function filterMap(mapping, noOfEmitters) {
    if (noOfEmitters === void 0) { noOfEmitters = 1; }
    return function transform(emit) {
        var eaten = 0;
        return function filterMapTransform(v, i) {
            var result = mapping.apply(null, v);
            if (result !== undefined) {
                emit(result);
            }
        };
    };
}
exports.filterMap = filterMap;
;
function merge() {
    return function mergeTransform(emit) {
        var prev;
        return function mergeTransform(v, i) {
            if (prev !== v[i]) {
                emit(v[i]);
            }
            prev = v[i];
        };
    };
}
exports.merge = merge;
function accumulate(initialValue, accumulator) {
    var accumulated = initialValue;
    return function transform(emit) {
        return function accumulateTransform(v, i) {
            accumulated = accumulator.apply(void 0, [accumulated].concat(v));
            emit(accumulated);
        };
    };
}
exports.accumulate = accumulate;
;
function transformTime(timeTransformation, t0) {
    // var firstEmitted = false;
    return function transform(emit) {
        return function timeTransform(v, i) {
            var delay = timeTransformation(scheduler.now() - t0) + t0 - scheduler.now();
            var toEmit = v[i];
            scheduler.scheduleTimeout(function () {
                emit(toEmit);
            }, delay);
        };
    };
}
exports.transformTime = transformTime;
function sample() {
    return function transform(emit) {
        return function sampleTransform(v, i) {
            if (i > 0 && v[i].happend) {
                emit(v[0]);
            }
        };
    };
}
exports.sample = sample;
;
function change(switchers) {
    return function transform(emit) {
        return function changeTransform(v, i) {
            var _this = this;
            if (i == 0) {
                emit(v[0]);
            }
            else if (v[i].happend) {
                var to = switchers[i - 1].to;
                var e = utils.callIfFunction(to, v[0], v[i].value);
                this._wires[0].unplug();
                this._wires[0] = new Wire(e, this, function (x) { return _this.receiveOn(x, 0); });
            }
        };
    };
}
exports.change = change;
function when(happend, then) {
    return function transform(emit, impulse) {
        return function whenTransform(v, i) {
            if (happend(v[i])) {
                impulse(eevent.of(then(v[i])));
            }
        };
    };
}
exports.when = when;
function cumulateOverTime(delayInMiliseconds) {
    return function transform(emit, impulse) {
        var accumulated = [];
        var accumulating = false;
        return function throttleTransform(v, i) {
            if (!v[i].happend) {
                return;
            }
            accumulated.push(v[i].value);
            if (!accumulating) {
                accumulating = true;
                scheduler.scheduleTimeout(function () {
                    impulse(eevent.of(accumulated));
                    accumulating = false;
                    accumulated = [];
                }, delayInMiliseconds);
            }
        };
    };
}
exports.cumulateOverTime = cumulateOverTime;
;

},{"./electric-event":9,"./scheduler":17,"./utils":21,"./wire":22}],19:[function(require,module,exports){
var emitter = require('./emitter');
var namedTransformator = emitter.namedTransformator;
var transformators = require('./transformator-helpers');
var eevent = require('../src/electric-event');
function map(mapping, emitter1, emitter2, emitter3, emitter4, emitter5, emitter6, emitter7) {
    var emitters = Array.prototype.slice.apply(arguments, [1]);
    return namedTransformator('map', emitters, transformators.map(mapping, emitters.length), mapping.apply(null, emitters.map(function (e) { return e.dirtyCurrentValue(); })));
}
exports.map = map;
;
function mapMany(mapping) {
    var emitters = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        emitters[_i - 1] = arguments[_i];
    }
    return namedTransformator('map many', emitters, transformators.map(mapping, emitters.length), mapping.apply(null, emitters.map(function (e) { return e.dirtyCurrentValue(); })));
}
exports.mapMany = mapMany;
function filter(initialValue, predicate, emitter1, emitter2, emitter3, emitter4, emitter5, emitter6, emitter7) {
    var emitters = Array.prototype.slice.apply(arguments, [2]);
    return namedTransformator('filter', emitters, transformators.filter(predicate, emitters.length), initialValue);
}
exports.filter = filter;
;
function filterMap(initialValue, filterMapping, emitter1, emitter2, emitter3, emitter4, emitter5, emitter6, emitter7) {
    var emitters = Array.prototype.slice.apply(arguments, [2]);
    return namedTransformator('filter map', emitters, transformators.filterMap(filterMapping, emitters.length), initialValue);
}
exports.filterMap = filterMap;
;
function accumulate(initialValue, accumulator, emitter1, emitter2, emitter3, emitter4, emitter5, emitter6, emitter7) {
    var emitters = Array.prototype.slice.apply(arguments, [2]);
    var acc = accumulator.apply([], [initialValue].concat(emitters.map(function (e) { return e.dirtyCurrentValue(); })));
    return namedTransformator('accumulate', emitters, transformators.accumulate(acc, accumulator), acc);
}
exports.accumulate = accumulate;
function merge() {
    var emitters = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        emitters[_i - 0] = arguments[_i];
    }
    return namedTransformator('merge', emitters, transformators.merge(), emitters[0].dirtyCurrentValue());
}
exports.merge = merge;
function cumulateOverTime(emitter, overInMs) {
    return namedTransformator('cumulate', [emitter], transformators.cumulateOverTime(overInMs), eevent.notHappend);
}
exports.cumulateOverTime = cumulateOverTime;
// what are semantics of flatten!?
function flatten(emitter) {
    var transformator = namedTransformator('flatten', [emitter, emitter.dirtyCurrentValue()], transform, emitter.dirtyCurrentValue().dirtyCurrentValue());
    // var transformator = new Transformator([]);
    function transform(emit) {
        return function flattenTransform(v, i) {
            if (i == 0) {
                transformator.plugEmitter(v[i]);
                emit(v[i].dirtyCurrentValue());
            }
            else {
                emit(v[i]);
            }
        };
    }
    ;
    return transformator;
}
exports.flatten = flatten;
;
function hold(initialValue, emitter) {
    function transform(emit) {
        return function holdTransform(v, i) {
            if (v[i].happend) {
                emit(v[i].value);
            }
        };
    }
    return namedTransformator('hold', [emitter], transform, initialValue);
}
exports.hold = hold;
;
function changes(emitter) {
    var previous = emitter.dirtyCurrentValue();
    function transform(emit, impulse) {
        return function changesTransform(v, i) {
            impulse(eevent.of({
                previous: previous,
                next: v[i]
            }));
            previous = v[i];
        };
    }
    return namedTransformator('changes', [emitter], transform, eevent.notHappend);
}
exports.changes = changes;

},{"../src/electric-event":9,"./emitter":11,"./transformator-helpers":18}],20:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var emitter = require('./emitter');
var Wire = require('./wire');
var Transmitter = (function (_super) {
    __extends(Transmitter, _super);
    function Transmitter() {
        _super.apply(this, arguments);
    }
    Transmitter.prototype.wire = function (emitter) {
        var _this = this;
        var index = this._wires.length;
        this._wires[index] = new Wire(emitter, this, (function (index) { return function (x) { return _this.receiveOn(x, index); }; })(index));
        return this._wires[index];
    };
    Transmitter.prototype.dropEmitters = function () {
        this._wires.forEach(function (w) { return w.input.stabilize(); });
        this._wires = [];
    };
    return Transmitter;
})(emitter.Transformator);
function transmitter(initialValue) {
    var t = new Transmitter([], undefined, initialValue);
    t.name = '?| transmitter |>';
    return t;
}
module.exports = transmitter;

},{"./emitter":11,"./wire":22}],21:[function(require,module,exports){
function callIfFunction(obj) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    if (typeof obj === 'function') {
        return obj.apply(null, args);
    }
    else {
        return obj;
    }
}
exports.callIfFunction = callIfFunction;
function any(list) {
    for (var i = 0; i < list.length; i++) {
        if (list[i]) {
            return true;
        }
    }
    return false;
}
exports.any = any;
function all(list) {
    for (var i = 0; i < list.length; i++) {
        if (!list[i]) {
            return false;
        }
    }
    return true;
}
exports.all = all;

},{}],22:[function(require,module,exports){
var Wire = (function () {
    function Wire(input, output, receive, set) {
        this.input = input;
        this.output = output;
        this.name = '-w-';
        if (set) {
            this._set = set;
            this._futureReceive = receive;
        }
        else {
            this.receive = receive;
        }
        this.receiverId = this.input.plugReceiver(this);
    }
    Wire.prototype.receive = function (x) {
        this._set(x);
        this._set = undefined;
        this.receive = this._futureReceive;
        this._futureReceive = undefined;
    };
    Wire.prototype.unplug = function () {
        if (this.input) {
            this.input.unplugReceiver(this.receiverId);
        }
        this.input = undefined;
        this.output = undefined;
    };
    return Wire;
})();
module.exports = Wire;

},{}]},{},[1]);