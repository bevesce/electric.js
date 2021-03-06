(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var electric = require('../../../src/electric');
var rui = require('../../../src/receivers/ui');
var eui = require('../../../src/emitters/ui');
var storage = require('./storage');
// Emitters
var hash = eui.hash();
var newTask = eui.enteredText('new-task');
var clear = eui.clicks('clear-button');
var check = electric.emitter.manualEvent(null, 'check');
var del = electric.emitter.manualEvent(null, 'delete');
var toggle = eui.checkboxClicks('toggle');
var editingStart = electric.emitter.manualEvent(null, 'editing start');
var retitle = electric.emitter.manualEvent(null, 'retitle');
// Transformators
var tasksTransformator = require('./tasks-device');
var tasks = tasksTransformator(storage.restoreTasks(), {
    insert: newTask,
    check: check,
    toggle: toggle,
    retitle: retitle,
    del: del,
    clear: clear,
    filter: hash
});
// Receivers
//// Tasks Renderer Receiver
var editingId = electric.emitter.constant(undefined).change({ to: function (_, k) { return electric.emitter.constant(k); }, when: editingStart }, { to: electric.emitter.constant(undefined), when: electric.transformator.changes(tasks.visible) });
editingId.name = 'id of edited item';
var tasksRendererReceiver = require('./tasks-receiver');
electric.transformator.map(function (ts, editingId) { return ({ tasks: ts, editing: editingId }); }, tasks.visible, editingId).plugReceiver(tasksRendererReceiver(del, retitle, editingStart, check));
//// Other
tasks.all.plugReceiver(storage.saveTaskToStorage);
newTask.plugReceiver(clearInput);
function clearInput(_) {
    document.getElementById('new-task').value = '';
}
;
tasks.count.all.plugReceiver(allCounterReceiver());
function allCounterReceiver() {
    var main = document.getElementById('main');
    var footer = document.getElementById('footer');
    return function listHide(count) {
        main.className = hidden(main.className, count === 0);
        footer.className = hidden(footer.className, count === 0);
    };
}
;
tasks.count.active.plugReceiver(activeCountReceiver());
function activeCountReceiver() {
    var countReceiver = rui.htmlReceiverById('active-tasks-counter');
    var wordReceiver = rui.htmlReceiverById('active-tasks-word');
    return function itemsLeftCounter(c) {
        countReceiver(c);
        wordReceiver(c === 1 ? 'item' : 'items');
    };
}
;
electric.transformator.map(function (ac, cc) { return ac === cc; }, tasks.count.all, tasks.count.completed).plugReceiver(checkToggleAllReceiver());
function checkToggleAllReceiver() {
    var toggleCheckbox = document.getElementById('toggle');
    return function toggleCheckboxChecked(checked) {
        toggleCheckbox.checked = checked;
    };
}
tasks.count.completed.plugReceiver(clearCompletedHideReceiver());
function clearCompletedHideReceiver() {
    var button = document.getElementById('clear-button');
    return function clearCompletedButtonVisiblity(count) {
        button.className = hidden(button.className, count === 0);
    };
}
;
function hidden(className, shouldBe) {
    if (shouldBe) {
        return className += ' hidden';
    }
    return className.replace(/hidden/g, '');
}
hash.plugReceiver(footerFiltersReceiver());
function footerFiltersReceiver() {
    var previousRoute = '#/active';
    return function activeFilterSelection(route) {
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
var g = electric.graph.of(tasks.all);
console.log(g.stringify());

},{"../../../src/electric":9,"../../../src/emitters/ui":11,"../../../src/receivers/ui":16,"./storage":3,"./tasks-device":4,"./tasks-receiver":5}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
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
function saveTaskToStorage(tasks) {
    localStorage.setItem(TASK_KEY, JSON.stringify(tasks));
}
exports.saveTaskToStorage = saveTaskToStorage;

},{"./item":2}],4:[function(require,module,exports){
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
        return eevent.notHappened;
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

},{"../../../src/electric":9,"../../../src/electric-event":8,"./item":2}],5:[function(require,module,exports){
var rui = require('../../../src/receivers/ui');
var check;
var del;
var editing;
var retitle;
function tasksRendererReceiver(del_, retitle_, editing_, check_) {
    del = del_;
    retitle = retitle_;
    editing = editing_;
    check = check_;
    var htmlReceiver = rui.htmlReceiverById('todo-list');
    return function tasksRenderingReceiver(arg) {
        var html = renderHTML(arg);
        htmlReceiver(html);
        if (arg.editing !== undefined) {
            setupEditingInput(arg.editing);
        }
        setupTasksEvents(arg.tasks);
    };
}
function renderHTML(arg) {
    return arg.tasks.map(function (task) { return renderTask(task, arg.editing); }).join('\n');
}
function renderTask(task, editing) {
    var title = sanitize(task.title());
    var id = task.id();
    var checked = task.isCompleted() ? 'checked' : '';
    var liClass = taskClass(task, editing);
    return "<li class=\"" + liClass + "\">\n\t\t    \t<div class=\"view\">\n\t\t\t\t\t<input class=\"toggle\" type=\"checkbox\" id=\"checkbox-" + id + "\" " + checked + ">\n\t\t\t\t\t<label id=\"task-label-" + id + "\">" + title + "</label>\n\t\t\t\t\t<button id=\"button-destroy-" + id + "\" class=\"destroy\"></button>\n\t\t\t\t</div>\n\t\t\t\t<input id=\"input-title-" + id + "\" class=\"edit\" value=\"" + title + "\" autocomplete=\"off\">\n\t\t\t</li>";
}
function sanitize(text) {
    return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
;
function taskClass(task, editing) {
    if (task.id() === editing) {
        return 'editing';
    }
    else if (task.isCompleted()) {
        return 'completed';
    }
    return '';
}
;
function setupEditingInput(editingId) {
    var input = document.getElementById('input-title-' + editingId);
    input.focus();
    input.addEventListener('blur', onBlur);
    input.addEventListener('keydown', onKeypress);
    function onBlur() {
        editTask(this.value);
    }
    function onKeypress(event) {
        if (event.keyCode == 27) {
            escapeEditing();
        }
        else if (event.keyCode === 13) {
            editTask(this.value);
        }
    }
    function editTask(text) {
        input.removeEventListener('blur', onBlur);
        if (text === '') {
            del.impulse(editingId);
        }
        else {
            retitle.impulse({ id: editingId, title: text });
        }
    }
    function escapeEditing() {
        input.removeEventListener('blur', onBlur);
        editing.impulse(undefined);
    }
}
;
function setupTasksEvents(tasks) {
    tasks.forEach(function (task) {
        var id = task.id();
        document.getElementById('checkbox-' + id).addEventListener('click', function () {
            check.impulse({ id: id, completed: this.checked });
        });
        document.getElementById('button-destroy-' + id).addEventListener('click', function (event) {
            del.impulse(id);
        });
        document.getElementById('task-label-' + id).addEventListener('dblclick', function (event) {
            editing.impulse(id);
        });
    });
}
;
module.exports = tasksRendererReceiver;

},{"../../../src/receivers/ui":16}],6:[function(require,module,exports){
var clock = require('../clock');
var scheduler = require('../scheduler');
var transformator = require('../transformator');
function integral(initialValue, emitter, options) {
    var timmed = timeValue(emitter, options);
    var acc = timmed.accumulate({
        time: scheduler.now(),
        value: emitter.dirtyCurrentValue(),
        sum: initialValue
    }, function (acc, v) {
        var now = scheduler.now();
        var dt = now - acc.time;
        var nv = v.value.add(acc.value).mulT(dt / 2);
        var sum = acc.sum.addDelta(nv);
        return {
            time: now,
            value: v.value,
            sum: sum
        };
    });
    acc.name = 'internal integral accumulator';
    var result = acc.map(function (v) { return v.sum; });
    result.name = 'integral';
    result.setEquals(function (x, y) { return x.equals(y); });
    result.stabilize = function () { return timmed.stabilize(); };
    return result;
}
exports.integral = integral;
function differential(initialValue, emitter, options) {
    var timmed = timeValue(emitter, options);
    var result = timmed.accumulate({
        time: scheduler.now(),
        value: emitter.dirtyCurrentValue(),
        diff: initialValue
    }, function (acc, v) {
        var now = scheduler.now();
        var dt = now - acc.time;
        var diff = acc.diff;
        if (dt !== 0) {
            diff = v.value.sub(acc.value).divT(dt);
        }
        return {
            time: now,
            value: v.value,
            diff: diff
        };
    }).map(function (v) { return v.diff; });
    result.setEquals(function (x, y) { return x.equals(y); });
    result.name = 'differential';
    return result;
}
exports.differential = differential;
function timeValue(emitter, options) {
    var time = clock.time(options);
    var trans = transformator.map(function (t, v) { return ({ time: t, value: v }); }, time, emitter);
    trans.stabilize = function () { return time.stabilize(); };
    trans.name = 'calculus timer';
    return trans;
}

},{"../clock":7,"../scheduler":17,"../transformator":19}],7:[function(require,module,exports){
var scheduler = require('./scheduler');
var emitter = require('./emitter');
function interval(options) {
    var timer = emitter.manualEvent();
    var id = scheduler.scheduleInterval(function () {
        timer.impulse(scheduler.now());
    }, calculateInterval(options.inMs, options.fps));
    timer.name = "interval(" + calculateEmitterName(options) + ")";
    timer.setReleaseResources(function () { return scheduler.unscheduleInterval(id); });
    return timer;
}
exports.interval = interval;
function intervalValue(value, options) {
    var timer = emitter.manualEvent(null);
    var id = scheduler.scheduleInterval(function () {
        timer.impulse(value);
    }, calculateInterval(options.inMs, options.fps));
    timer.name = "intervalValue(" + value + ", " + calculateEmitterName(options) + ")";
    timer.setReleaseResources(function () { return scheduler.unscheduleInterval(id); });
    return timer;
}
exports.intervalValue = intervalValue;
function once(inMs, value) {
    var timer = emitter.manualEvent(null);
    var id = scheduler.scheduleTimeout(function () {
        timer.impulse(value);
    }, inMs);
    timer.name = "once(" + inMs + " ms, " + value + ")";
    timer.setReleaseResources(function () { return scheduler.unscheduleInterval(id); });
    return timer;
}
exports.once = once;
function intervalOfRandom(min, max, options) {
    var timer = emitter.manualEvent(null);
    var id = scheduler.scheduleInterval(function () {
        timer.impulse(random(min, max));
    }, calculateInterval(options.inMs, options.fps));
    timer.name = "intervalOfRandom(" + min + "-" + max + ", " + calculateEmitterName(options) + ")";
    timer.setReleaseResources(function () { return scheduler.unscheduleInterval(id); });
    return timer;
}
exports.intervalOfRandom = intervalOfRandom;
function time(options) {
    var interval = calculateInterval(options.intervalInMs, options.fps);
    var timeEmitter = emitter.manual(scheduler.now());
    var id = scheduler.scheduleInterval(function () { return timeEmitter.emit((scheduler.now())); }, interval);
    timeEmitter.setReleaseResources(function () { return scheduler.unscheduleInterval(id); });
    timeEmitter.name = "time(" + calculateEmitterName(options) + ")";
    return timeEmitter;
}
exports.time = time;
function calculateInterval(intervalInMs, fps) {
    if (intervalInMs === undefined) {
        return 1 / fps * 1000;
    }
    else {
        return intervalInMs;
    }
}
function calculateEmitterName(options) {
    if (options.fps !== undefined) {
        return 'fps: ' + options.fps;
    }
    else if (options.inMs !== undefined) {
        return 'interval: ' + options.inMs + 'ms';
    }
    else {
        return 'interval: ' + options.intervalInMs + 'ms';
    }
}
function random(min, max) {
    return Math.random() * (max - min) + min;
}

},{"./emitter":10,"./scheduler":17}],8:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var all = require('./utils/all');
var ElectricEvent = (function () {
    function ElectricEvent() {
        this.__$isevent$ = true;
    }
    ElectricEvent.restore = function (e) {
        if (e.happened) {
            return ElectricEvent.of(e.value);
        }
        return ElectricEvent.notHappened;
    };
    ElectricEvent.of = function (value) {
        return new happened(value);
    };
    ElectricEvent.lift = function (f) {
        return function () {
            var vs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                vs[_i - 0] = arguments[_i];
            }
            if (all(vs.map(function (v) { return v.happened; }))) {
                return ElectricEvent.of(f.apply(null, vs.map(function (v) { return v.value; })));
            }
            else {
                return ElectricEvent.notHappened;
            }
        };
    };
    ElectricEvent.flatLift = function (f) {
        return function (v1) {
            if (v1.happened) {
                return f(v1.value);
            }
            else {
                return ElectricEvent.notHappened;
            }
        };
    };
    ElectricEvent.liftOnFirst = function (f) {
        return function (v1, v2) {
            if (v1.happened) {
                return ElectricEvent.of(f(v1.value, v2));
            }
            else {
                return ElectricEvent.notHappened;
            }
        };
    };
    ElectricEvent.prototype.map = function (f) {
        throw Error('ElectricEvent is abstract class, use happened and notHappened');
    };
    ;
    ElectricEvent.prototype.flattenMap = function (f) {
        throw Error('ElectricEvent is abstract class, use happened and notHappened');
    };
    return ElectricEvent;
})();
var happened = (function (_super) {
    __extends(happened, _super);
    function happened(value) {
        _super.call(this);
        this.happened = true;
        this.value = value;
    }
    happened.prototype.toString = function () {
        return "happened: " + this.value.toString();
    };
    happened.prototype.map = function (f) {
        return ElectricEvent.of(f(this.value));
    };
    happened.prototype.flattenMap = function (f) {
        return f(this.value);
    };
    return happened;
})(ElectricEvent);
var notHappened = (function (_super) {
    __extends(notHappened, _super);
    function notHappened() {
        _super.call(this);
        this.happened = false;
        this.value = undefined;
    }
    notHappened.prototype.toString = function () {
        return 'notHappened';
    };
    notHappened.prototype.map = function (f) {
        return ElectricEvent.notHappened;
    };
    notHappened.prototype.flattenMap = function (f) {
        return ElectricEvent.notHappened;
    };
    return notHappened;
})(ElectricEvent);
ElectricEvent.notHappened = new notHappened();
module.exports = ElectricEvent;

},{"./utils/all":20}],9:[function(require,module,exports){
exports.scheduler = require('./scheduler');
exports.emitter = require('./emitter');
exports.transformator = require('./transformator');
exports.receiver = require('./receiver');
exports.clock = require('./clock');
exports.calculus = require('./calculus/calculus');
exports.event = require('./electric-event');
exports.graph = require('./graph');
exports.e = exports.emitter;
exports.t = exports.transformator;
exports.r = exports.receiver;
exports.c = exports.calculus;

},{"./calculus/calculus":6,"./clock":7,"./electric-event":8,"./emitter":10,"./graph":12,"./receiver":15,"./scheduler":17,"./transformator":19}],10:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var scheduler = require('./scheduler');
var transformators = require('./transformator-helpers');
var ElectricEvent = require('./electric-event');
var Wire = require('./wire');
var fn = require('./utils/fn');
var queue = require('./queue');
exports.placeholder = require('./placeholder');
var q = queue.empty();
var ConcreteEmitter = (function () {
    function ConcreteEmitter(initialValue) {
        if (initialValue === void 0) { initialValue = undefined; }
        this._receivers = [];
        this._currentValue = initialValue;
        this.name = (this.name);
    }
    ConcreteEmitter.prototype.toString = function (includeCurrentValue) {
        if (includeCurrentValue === void 0) { includeCurrentValue = false; }
        if (includeCurrentValue) {
            return "| " + this.name + " = " + this.dirtyCurrentValue().toString() + " >";
        }
        return "| " + this.name + " >";
    };
    // when reveiver is plugged current value is not emitted to him
    // instantaneously, but instead it's done asynchronously
    ConcreteEmitter.prototype.plugReceiver = function (receiver) {
        if (typeof receiver !== 'function' && receiver.wire) {
            receiver = receiver.wire(this);
        }
        this._receivers.push(receiver);
        this._asyncDispatchToReceiver(receiver, this._currentValue);
        return this._receivers.length - 1;
    };
    ConcreteEmitter.prototype._dirtyPlugReceiver = function (receiver) {
        if (typeof receiver !== 'function' && receiver.wire) {
            receiver = receiver.wire(this);
        }
        this._receivers.push(receiver);
        return this._receivers.length - 1;
    };
    ConcreteEmitter.prototype.unplugReceiver = function (receiverOrId) {
        var index = this._getIndexOfReceiver(receiverOrId);
        this._receivers.splice(index, 1);
    };
    ConcreteEmitter.prototype._getIndexOfReceiver = function (receiverOrId) {
        if (typeof receiverOrId === 'number') {
            return receiverOrId;
        }
        else {
            return this._receivers.indexOf(receiverOrId);
        }
    };
    ConcreteEmitter.prototype.dirtyCurrentValue = function () {
        return this._currentValue;
    };
    ConcreteEmitter.prototype.stabilize = function () {
        this.emit = this._throwStabilized;
        this.impulse = this._throwStabilized;
        this._releaseResources();
    };
    ConcreteEmitter.prototype.setReleaseResources = function (releaseResources) {
        this._releaseResources = releaseResources;
    };
    ConcreteEmitter.prototype._releaseResources = function () {
        // should be overwritten in more specific emitters
    };
    ConcreteEmitter.prototype._throwStabilized = function (value) {
        throw Error("can't emit <" + value + "> from " + this.name + ", it's stabilized");
    };
    // let's say that f = constant(y).emit(x) is called at t_e
    // then f(t) = x for t >= t_e, and f(t) = y for t < t_e
    ConcreteEmitter.prototype.emit = function (value) {
        if (this._equals(this._currentValue, value)) {
            return;
        }
        this._dispatchToReceivers(value);
        this._currentValue = value;
    };
    // let's say that f constant(y).impulse(x) is called at t_i
    // then f(t_i) = x and f(t) = y when t != t_i
    ConcreteEmitter.prototype.impulse = function (value) {
        if (this._equals(this._currentValue, value)) {
            return;
        }
        this._dispatchToReceivers(value);
        this._dispatchToReceivers(this._currentValue);
    };
    ConcreteEmitter.prototype._equals = function (x, y) {
        return x === y;
    };
    ConcreteEmitter.prototype.setEquals = function (equals) {
        this._equals = equals;
    };
    ConcreteEmitter.prototype._dispatchToReceivers = function (value) {
        var currentReceivers = this._receivers.slice();
        for (var _i = 0; _i < currentReceivers.length; _i++) {
            var receiver = currentReceivers[_i];
            this._dispatchToReceiver(receiver, value);
        }
    };
    ConcreteEmitter.prototype._dispatchToReceiver = function (receiver, value) {
        if (typeof receiver === 'function') {
            q.add(receiver, value);
        }
        else {
            receiver.receive(value);
        }
    };
    ConcreteEmitter.prototype._asyncDispatchToReceivers = function (value) {
        var currentReceivers = this._receivers.slice();
        for (var _i = 0; _i < currentReceivers.length; _i++) {
            var receiver = currentReceivers[_i];
            this._asyncDispatchToReceiver(receiver, value);
        }
    };
    ConcreteEmitter.prototype._asyncDispatchToReceiver = function (receiver, value) {
        scheduler.scheduleTimeout(function () {
            if (typeof receiver === 'function') {
                receiver(value);
            }
            else {
                receiver.receive(value);
            }
        }, 0);
    };
    // transformators
    ConcreteEmitter.prototype.map = function (mapping) {
        return namedTransformator("map(" + fn(mapping) + ")", [this], transformators.map(mapping, 1), mapping(this._currentValue));
    };
    ConcreteEmitter.prototype.filter = function (initialValue, predicate) {
        return namedTransformator("filter(" + fn(predicate) + ")", [this], transformators.filter(predicate), initialValue);
    };
    ConcreteEmitter.prototype.filterMap = function (initialValue, mapping) {
        return namedTransformator("filterMap(" + fn(mapping) + ")", [this], transformators.filterMap(mapping), initialValue);
    };
    ConcreteEmitter.prototype.transformTime = function (initialValue, timeShift, t0) {
        if (t0 === void 0) { t0 = 0; }
        var t = namedTransformator("transformTime(" + fn(timeShift) + ")", [this], transformators.transformTime(timeShift, t0), initialValue);
        this._dispatchToReceiver(t._dirtyGetWireTo(this), this.dirtyCurrentValue());
        return t;
    };
    ConcreteEmitter.prototype.accumulate = function (initialValue, accumulator) {
        var acc = accumulator(initialValue, this.dirtyCurrentValue());
        return namedTransformator("accumulate(" + fn(accumulator) + ")", [this], transformators.accumulate(acc, accumulator), acc);
    };
    ConcreteEmitter.prototype.changes = function () {
        return namedTransformator('changes', [this], transformators.changes(this.dirtyCurrentValue()), ElectricEvent.notHappened);
    };
    ConcreteEmitter.prototype.when = function (switcher) {
        var t = namedTransformator('whenHappensThen', [this], transformators.when(switcher.happens, switcher.then), ElectricEvent.notHappened);
        return t;
    };
    ConcreteEmitter.prototype.whenThen = function (happens) {
        var t = namedTransformator('whenThen', [this], transformators.whenThen(happens), ElectricEvent.notHappened);
        return t;
    };
    ConcreteEmitter.prototype.sample = function (initialValue, samplingEvent) {
        var t = namedTransformator('sample', [this, samplingEvent], transformators.sample(), initialValue);
        return t;
    };
    ConcreteEmitter.prototype.change = function () {
        var switchers = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            switchers[_i - 0] = arguments[_i];
        }
        return namedTransformator('changeToWhen', [this].concat(switchers.map(function (s) { return s.when; })), transformators.change(switchers), this._currentValue);
    };
    return ConcreteEmitter;
})();
exports.ConcreteEmitter = ConcreteEmitter;
function _dispatch() {
    q.dispatch();
    q = queue.empty();
}
var ManualEmitter = (function (_super) {
    __extends(ManualEmitter, _super);
    function ManualEmitter() {
        _super.apply(this, arguments);
    }
    ManualEmitter.prototype.emit = function (v) {
        var _this = this;
        scheduler.scheduleTimeout(function () {
            _super.prototype.emit.call(_this, v);
            q.dispatch();
            q = queue.empty();
        }, 0);
    };
    ManualEmitter.prototype.impulse = function (v) {
        var _this = this;
        scheduler.scheduleTimeout(function () {
            _super.prototype.impulse.call(_this, v);
            q.dispatch();
            q = queue.empty();
        }, 0);
    };
    ManualEmitter.prototype.stabilize = function () {
        _super.prototype.stabilize.call(this);
        this.emit = this.emit;
        this.impulse = this.impulse;
    };
    return ManualEmitter;
})(ConcreteEmitter);
exports.ManualEmitter = ManualEmitter;
function manual(initialValue, name) {
    var e = new ManualEmitter(initialValue);
    e.name = name || 'manual';
    return e;
}
exports.manual = manual;
function constant(value) {
    var e = new ConcreteEmitter(value);
    e.name = "constant(" + value + ")";
    return e;
}
exports.constant = constant;
function manualEvent(initialValue, name) {
    // initialValue doesn nothing it just to ease up
    // typing
    // instead of var e = <Emitter<ElectricEvent<T>>>manualEvent()
    // you can do var e = manualEvent(<T>null)
    // manual event emitter should
    // pack impulsed values into event
    // and not allow to emit values
    // it's done by monkey patching ManualEmitter
    var e = manual(ElectricEvent.notHappened);
    var oldImpulse = e.impulse;
    e.impulse = function (v) { return oldImpulse.apply(e, [ElectricEvent.of(v)]); };
    e.emit = function (v) {
        throw Error("can't emit from event emitter, only impulse");
    };
    e.name = name || 'manual event';
    // monkey patching requires ugly casting...
    return e;
}
exports.manualEvent = manualEvent;
var Transformator = (function (_super) {
    __extends(Transformator, _super);
    function Transformator(emitters, initialValue, transform) {
        if (transform === void 0) { transform = undefined; }
        _super.call(this, initialValue);
        this.name = 'transformator';
        this._values = Array(emitters.length);
        if (transform) {
            this.setTransform(transform);
        }
        this._wires = [];
        this.plugEmitters(emitters);
    }
    Transformator.prototype.toString = function (includeCurrentValue) {
        if (includeCurrentValue === void 0) { includeCurrentValue = false; }
        if (includeCurrentValue) {
            return "< " + this.name + " = " + this.dirtyCurrentValue().toString() + " >";
        }
        return "< " + this.name + " >";
    };
    Transformator.prototype.setTransform = function (transform) {
        var _this = this;
        this._transform = transform(function (x) { return _this.emit(x); }, function (x) { return _this.impulse(x); }, _dispatch);
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
    Transformator.prototype.unplugEmitter = function (emitter) {
        this._wires.filter(function (w) { return w.input === emitter; }).forEach(function (w) { return w.unplug(); });
    };
    Transformator.prototype.dropEmitters = function (start) {
        var wiresToDrop = this._wires.slice(1);
        wiresToDrop.forEach(function (w) { return w.unplug(); });
        this._wires.splice(start, this._wires.length);
        this._values.splice(start, this._values.length);
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
})(ConcreteEmitter);
exports.Transformator = Transformator;
function namedTransformator(name, emitters, transform, initialValue) {
    if (transform === void 0) { transform = undefined; }
    var t = new Transformator(emitters, initialValue, transform);
    t.name = name;
    return t;
}
exports.namedTransformator = namedTransformator;

},{"./electric-event":8,"./placeholder":13,"./queue":14,"./scheduler":17,"./transformator-helpers":18,"./utils/fn":22,"./wire":28}],11:[function(require,module,exports){
var electric = require('../electric');
var shallowCopy = require('../utils/shallow-copy');
var keyCodes = require('../utils/key-codes');
function clicks(targetOrId, mapping) {
    return fromEvent({
        target: targetOrId,
        mapping: mapping,
        type: 'click',
        preventDefault: true
    });
}
exports.clicks = clicks;
function key(name, type) {
    var keyCode = keyCodes[name];
    return fromEvent({
        target: document.body,
        mapping: function (e) { return name; },
        filter: function (e) { return e.keyCode === keyCode; },
        type: 'key' + type,
        preventDefault: true,
        name: "key -" + name + "- " + type
    });
}
exports.key = key;
function text(targetOrId, type) {
    if (type === void 0) { type = 'keyup'; }
    var input = getTargetById(targetOrId);
    return fromValue({
        target: input,
        mapping: function (_) { return input.value; },
        initialValue: '',
        type: 'keyup',
        name: "text of " + targetOrId
    });
}
exports.text = text;
function enteredText(targetOrId) {
    var input = getTargetById(targetOrId);
    return fromEvent({
        target: input,
        filter: function (e) { return e.keyCode === 13; },
        mapping: function (_) { return input.value; },
        type: 'keyup',
        name: "text entered into " + targetOrId
    });
}
exports.enteredText = enteredText;
function checkbox(targetOrId) {
    var checkbox = getTargetById(targetOrId);
    return fromValue({
        target: checkbox,
        type: 'click',
        initialValue: checkbox.checked,
        mapping: function (_) { return checkbox.checked; },
        name: "checbox " + targetOrId
    });
}
exports.checkbox = checkbox;
;
function checkboxClicks(targetOrId) {
    var checkbox = getTargetById(targetOrId);
    return fromEvent({
        target: checkbox,
        type: 'click',
        mapping: function (_) { return checkbox.checked; },
        name: "checbox " + targetOrId
    });
}
exports.checkboxClicks = checkboxClicks;
;
function checkboxes(targetsOrName) {
    var targets = getTargetsByName(targetsOrName);
    var prevValue = {};
    targets.forEach(function (t) { return prevValue[t.id] = t.checked; });
    return fromValues({
        targetsOrName: targets,
        listener: function (emitter, target) {
            return function () {
                prevValue[target.id] = target.checked;
                emitter.emit(shallowCopy(prevValue));
            };
        },
        name: "checkboxes " + targetsOrName,
        type: 'click',
        initialValue: prevValue
    });
}
exports.checkboxes = checkboxes;
function radioGroup(targetsOrName) {
    var targets = getTargetsByName(targetsOrName);
    return fromValues({
        targetsOrName: targets,
        listener: function (emitter, target) {
            return function () { return emitter.emit(target.id); };
        },
        name: "radio group " + targetsOrName,
        type: 'click',
        initialValue: targets.filter(function (t) { return t.checked; })[0].id
    });
}
exports.radioGroup = radioGroup;
function select(targetOrId) {
    var select = getTargetById(targetOrId);
    return fromValue({
        target: select,
        name: "select " + targetOrId,
        mapping: function () { return select.value; },
        type: 'change',
        initialValue: select.value
    });
}
exports.select = select;
;
function mouseXY(targetOrId) {
    return fromValue({
        type: 'mousemove',
        target: targetOrId,
        initialValue: { x: undefined, y: undefined },
        name: 'mouse position',
        mapping: function (e) { return ({ x: e.offsetX, y: e.offsetY }); }
    });
}
exports.mouseXY = mouseXY;
function mouseDown(targetOrId) {
    return fromEvent({
        type: 'mousedown',
        target: targetOrId,
        mapping: function (e) { return ({ x: e.offsetX, y: e.offsetY }); }
    });
}
exports.mouseDown = mouseDown;
function mouseUp(targetOrId) {
    return fromEvent({
        type: 'mouseup',
        target: targetOrId,
        mapping: function (e) { return ({ x: e.offsetX, y: e.offsetY }); }
    });
}
exports.mouseUp = mouseUp;
var hashEmitter = null;
function hash() {
    if (!hashEmitter) {
        hashEmitter = fromValue({
            type: 'hashchange',
            name: 'window.location.hash',
            target: window,
            mapping: function () { return window.location.hash; },
            initialValue: window.location.hash
        });
    }
    return hashEmitter;
}
exports.hash = hash;
function fromEvent(options) {
    var useCapture = options.useCapture === true ? true : false;
    var emitter = electric.emitter.manualEvent();
    var target = getTargetById(options.target);
    emitter.name = options.name || options.type + " on " + options.target;
    var impulse = emitOrImpluse(emitter, options);
    target.addEventListener(options.type, impulse, useCapture);
    emitter.setReleaseResources(function () {
        return target.removeEventListener(options.type, impulse, useCapture);
    });
    return emitter;
}
exports.fromEvent = fromEvent;
function fromValue(options) {
    var useCapture = options.useCapture === true ? true : false;
    var emitter = electric.emitter.manual(options.initialValue);
    var target = getTargetById(options.target);
    emitter.name = options.name || options.type + " on " + options.target;
    var emit = emitOrImpluse(emitter, options, false);
    target.addEventListener(options.type, emit, useCapture);
    emitter.setReleaseResources(function () {
        return target.removeEventListener(options.type, emit, useCapture);
    });
    return emitter;
}
exports.fromValue = fromValue;
function fromValues(options) {
    var targets = getTargetsByName(options.targetsOrName);
    var emitter = electric.emitter.manual(options.initialValue);
    var listeners = [];
    targets.forEach(function (t) {
        listeners.push(options.listener(emitter, t));
        t.addEventListener(options.type, listeners[listeners.length - 1]);
    });
    emitter.name = options.name || options.type + " " + options.targetsOrName;
    emitter.setReleaseResources(function () {
        targets.forEach(function (t, i) {
            t.removeEventListener(options.type, listeners[i]);
        });
    });
    return emitter;
}
exports.fromValues = fromValues;
// some event can fire with high frequency
// so here we ensure that all the checks of
// provided options are calculated only at creation
// ugly code
function emitOrImpluse(emitter, options, impulse) {
    if (impulse === void 0) { impulse = true; }
    var filter = options.filter;
    var mapping = options.mapping;
    var preventDefault = options.preventDefault;
    if (filter && mapping && impulse && preventDefault) {
        return function (event) {
            if (filter(event)) {
                emitter.impulse(mapping(event));
            }
        };
    }
    else if (filter && mapping && impulse) {
        return function (event) {
            if (filter(event)) {
                emitter.impulse(mapping(event));
            }
        };
    }
    else if (filter && impulse && preventDefault) {
        return function (event) {
            event.preventDefault();
            if (filter(event)) {
                emitter.impulse(event);
            }
        };
    }
    else if (filter && impulse) {
        return function (event) {
            if (filter(event)) {
                emitter.impulse(event);
            }
        };
    }
    else if (mapping && impulse && preventDefault) {
        return function (event) {
            event.preventDefault();
            emitter.impulse(mapping(event));
        };
    }
    else if (mapping && impulse) {
        return function (event) {
            emitter.impulse(mapping(event));
        };
    }
    else if (filter && mapping && preventDefault) {
        return function (event) {
            event.preventDefault();
            if (filter(event)) {
                emitter.emit(mapping(event));
            }
        };
    }
    else if (filter && mapping) {
        return function (event) {
            if (filter(event)) {
                emitter.emit(mapping(event));
            }
        };
    }
    else if (filter && preventDefault) {
        return function (event) {
            event.preventDefault();
            if (filter(event)) {
                emitter.emit(event);
            }
        };
    }
    else if (filter) {
        return function (event) {
            if (filter(event)) {
                emitter.emit(event);
            }
        };
    }
    else if (mapping && preventDefault) {
        return function (event) {
            event.preventDefault();
            emitter.emit(mapping(event));
        };
    }
    else if (mapping) {
        return function (event) {
            emitter.emit(mapping(event));
        };
    }
    else if (preventDefault) {
        return function (event) {
            event.preventDefault();
            emitter.impulse(event);
        };
    }
    else {
        return function (event) {
            emitter.impulse(event);
        };
    }
}
function getTargetById(t) {
    if (typeof t === 'string') {
        return document.getElementById(t);
    }
    return t;
}
function getTargetsByName(t) {
    if (typeof t === 'string') {
        return Array.prototype.slice.apply(document.getElementsByName(t));
    }
    return t;
}

},{"../electric":9,"../utils/key-codes":23,"../utils/shallow-copy":27}],12:[function(require,module,exports){
var pushIfNotIn = require('./utils//push-if-not-in');
var Graph = (function () {
    function Graph(source, depth, showCurrentValue) {
        this._sources = [];
        this.vertices = [];
        this.showCurrentValue = showCurrentValue;
        this.sourceIndex = this._findVertices(source, 0, depth);
        this._findEdges();
        this.clean();
    }
    Graph.of = function (source, depth, showCurrentValue) {
        if (showCurrentValue === void 0) { showCurrentValue = false; }
        return new Graph(source, depth, showCurrentValue);
    };
    Graph.prototype.removeVertex = function (id) {
        this.vertices = this.vertices
            .filter(function (v) { return v.id !== id; })
            .map(function (v) { return ({
            id: v.id,
            name: v.name,
            receivers: v.receivers.filter(function (r) { return r !== id; }),
            emitters: v.emitters.filter(function (e) { return e !== id; }),
            type: v.type
        }); });
        this.edges = this.edges.filter(function (e) { return e.source !== id && e.target !== id; });
    };
    Graph.prototype._findVertices = function (source, depth, maxDepth) {
        if (source.__$visualize_visited_id$ !== undefined) {
            return source.__$visualize_visited_id$;
        }
        this._sources.push(source);
        this.vertices.push({
            id: this.vertices.length,
            name: this._name(source),
            receivers: [],
            emitters: [],
            type: this._sourceType(source)
        });
        source.__$visualize_visited_id$ = this.vertices.length - 1;
        this._goBackwards(source, depth + 1, maxDepth);
        this._goForwards(source, depth + 1, maxDepth);
        return source.__$visualize_visited_id$;
    };
    Graph.prototype._sourceType = function (source) {
        if (typeof source === 'function') {
            return 'receiver';
        }
        if (!source._wires) {
            return 'emitter';
        }
        return 'transformator';
    };
    Graph.prototype._goBackwards = function (source, depth, maxDepth) {
        var _this = this;
        if (this._shouldntGo(depth, maxDepth, source._wires)) {
            return;
        }
        source._wires.forEach(function (w) {
            var e = w.input;
            e = _this._maybeUnpackPlaceholder(e);
            var wId = _this._findVertices(e, depth, maxDepth);
            var sourceId = source.__$visualize_visited_id$;
            pushIfNotIn(_this.vertices[sourceId].emitters, wId);
            pushIfNotIn(_this.vertices[wId].receivers, sourceId);
        });
    };
    Graph.prototype._goForwards = function (source, depth, maxDepth) {
        var _this = this;
        if (this._shouldntGo(depth, maxDepth, source._receivers)) {
            return;
        }
        source._receivers.forEach(function (r) {
            r = _this._maybeUnpackWire(r);
            r = _this._maybeUnpackPlaceholder(r);
            var rId = _this._findVertices(r, depth, maxDepth);
            var sourceId = source.__$visualize_visited_id$;
            pushIfNotIn(_this.vertices[sourceId].receivers, rId);
            pushIfNotIn(_this.vertices[rId].emitters, sourceId);
        });
    };
    Graph.prototype._shouldntGo = function (depth, maxDepth, potentialEdges) {
        if (maxDepth && depth >= maxDepth) {
            return true;
        }
        if (potentialEdges === undefined) {
            return true;
        }
        return false;
    };
    Graph.prototype._maybeUnpackPlaceholder = function (e) {
        if (e._emitter !== undefined) {
            return e._emitter;
        }
        return e;
    };
    Graph.prototype._maybeUnpackWire = function (w) {
        if (w.input !== undefined && w.output !== undefined) {
            return w.output;
        }
        return w;
    };
    Graph.prototype._name = function (source) {
        if (typeof source === 'function') {
            return "< " + (source.name || 'anonymous') + " |";
        }
        return source.toString(this.showCurrentValue);
    };
    Graph.prototype._findEdges = function () {
        var _this = this;
        this.edges = [];
        for (var i = 0; i < this.vertices.length; i++) {
            var node = this.vertices[i];
            var type = 'transformator';
            node.emitters.forEach(function (e) {
                _this.edges.push({
                    source: e,
                    target: i
                });
            });
        }
    };
    Graph.prototype.clean = function () {
        this._sources.forEach(function (s) { return s.__$visualize_visited_id$ = undefined; });
    };
    Graph.prototype.stringify = function () {
        return JSON.stringify({
            vertices: this.vertices,
            edges: this.edges
        });
    };
    return Graph;
})();
module.exports = Graph;

},{"./utils//push-if-not-in":26}],13:[function(require,module,exports){
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
    'change',
    'merge'
];
// function to throw if called before is()
var functionsToSomething = [];
var Placeholder = (function () {
    function Placeholder(initialValue) {
        this._actions = [];
        this.initialValue = initialValue;
        this.name = '? placeholder ?';
    }
    Placeholder.prototype.toString = function (showCurrentValue) {
        if (showCurrentValue === void 0) { showCurrentValue = false; }
        if (this._emitter) {
            return 'placeholder: ' + this._emitter.toString(showCurrentValue);
        }
        else if (showCurrentValue) {
            return "? placeholder = " + this.dirtyCurrentValue() + " >";
        }
        return '? placeholder >';
    };
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
    };
    Placeholder.prototype.dirtyCurrentValue = function () {
        if (this._emitter) {
            return this._emitter.dirtyCurrentValue();
        }
        else if (this.initialValue !== undefined) {
            return this.initialValue;
        }
        throw Error('called dirtyCurrentValue() on placeholder without initial value ' + this.name);
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
            p.name = p.name + ' ' + name + ' >';
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
var eevent = require('./electric-event');
var Queue = (function () {
    function Queue() {
        this._data = [];
    }
    Queue.empty = function () {
        return new Queue();
    };
    Queue.prototype.add = function (f, v) {
        this._data.push({ f: f, v: v });
    };
    Queue.prototype.dispatch = function () {
        while (this._data.length > 0) {
            var fv = this._data[this._data.length - 1];
            if (fv.v.__$isevent$) {
                this._dispatchEvent(fv.f, fv.v);
            }
            else {
                this._dispatchValue(fv.f, fv.v);
            }
        }
    };
    Queue.prototype._dispatchEvent = function (f, v) {
        if (v.happened) {
            f(v);
            f(eevent.notHappened);
            this._clear(f);
        }
        else {
            this._data.splice(this._data.length - 1, 1);
        }
    };
    Queue.prototype._dispatchValue = function (f, v) {
        f(v);
        this._clear(f);
    };
    Queue.prototype._clear = function (f) {
        this._data = this._data.filter(function (fv) { return fv.f !== f; });
    };
    return Queue;
})();
module.exports = Queue;

},{"./electric-event":8}],15:[function(require,module,exports){
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
        console.log(emitter.name, '>>>', x);
    });
}
exports.log = log;
function logEvents(emitter) {
    emitter.plugReceiver(function (x) {
        if (!x.happened) {
            return;
        }
        console.log(emitter.name, '>>>', x.value);
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

},{}],16:[function(require,module,exports){
function htmlReceiverById(id) {
    var element = document.getElementById(id);
    return function htmlReceiver(html) {
        element.innerHTML = html;
    };
}
exports.htmlReceiverById = htmlReceiverById;

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
    while (stopTime < newTime) {
        executeCallbacksForTime(stopTime);
        stopTime++;
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
var callIfFunction = require('./utils/call-if-function');
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
    return function transform(emit, impulse, dispatch) {
        return function timeTransform(v, i) {
            var delay = timeTransformation(scheduler.now() - t0) + t0 - scheduler.now();
            var toEmit = v[i];
            scheduler.scheduleTimeout(function () {
                emit(toEmit);
                dispatch();
            }, delay);
        };
    };
}
exports.transformTime = transformTime;
function sample() {
    return function transform(emit) {
        return function sampleTransform(v, i) {
            if (i > 0 && v[i].happened) {
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
            else if (v[i].happened) {
                this._wires[0].unplug();
                var to = switchers[i - 1].to;
                var e = callIfFunction(to, v[0], v[i].value);
                this._wires[0] = new Wire(e, this, function (x) { return _this.receiveOn(x, 0); });
                this.receiveOn(e.dirtyCurrentValue(), 0);
            }
        };
    };
}
exports.change = change;
function when(happens, then) {
    return function transform(emit, impulse) {
        var prevhappened = false;
        return function whenTransform(v, i) {
            var happened = happens(v[i]);
            if (happened && !prevhappened) {
                impulse(eevent.of(then(v[i])));
                prevhappened = true;
            }
            else if (!happened) {
                prevhappened = false;
            }
        };
    };
}
exports.when = when;
function whenThen(happens) {
    return function transform(emit, impulse) {
        var prevhappened;
        return function whenTransform(v, i) {
            var happened = happens(v[i]);
            if (happened && !prevhappened) {
                impulse(eevent.of(happened));
                prevhappened = happened;
            }
            else if (!happened) {
                prevhappened = null;
            }
        };
    };
}
exports.whenThen = whenThen;
function cumulateOverTime(delayInMiliseconds) {
    return function transform(emit, impulse) {
        var accumulated = [];
        var accumulating = false;
        return function throttleTransform(v, i) {
            if (!v[i].happened) {
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
function changes(initialValue) {
    return function transform(emit, impulse) {
        var previous = initialValue;
        return function changesTransform(v, i) {
            impulse(eevent.of({
                previous: previous,
                next: v[i]
            }));
            previous = v[i];
        };
    };
}
exports.changes = changes;

},{"./electric-event":8,"./scheduler":17,"./utils/call-if-function":21,"./wire":28}],19:[function(require,module,exports){
var emitter = require('./emitter');
var transformators = require('./transformator-helpers');
var eevent = require('../src/electric-event');
var fn = require('./utils/fn');
var mapObj = require('./utils/map-obj');
var objKeys = require('./utils/objKeys');
var namedTransformator = emitter.namedTransformator;
function map(mapping, emitter1, emitter2, emitter3, emitter4, emitter5, emitter6, emitter7) {
    var emitters = Array.prototype.slice.apply(arguments, [1]);
    return namedTransformator("map(" + fn(mapping) + ")", emitters, transformators.map(mapping, emitters.length), mapping.apply(null, emitters.map(function (e) { return e.dirtyCurrentValue(); })));
}
exports.map = map;
;
function mapMany(mapping) {
    var emitters = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        emitters[_i - 1] = arguments[_i];
    }
    return namedTransformator("mapMany(" + fn(mapping) + ")", emitters, transformators.map(mapping, emitters.length), mapping.apply(null, emitters.map(function (e) { return e.dirtyCurrentValue(); })));
}
exports.mapMany = mapMany;
function filter(initialValue, predicate, emitter1, emitter2, emitter3, emitter4, emitter5, emitter6, emitter7) {
    var emitters = Array.prototype.slice.apply(arguments, [2]);
    return namedTransformator("filter(" + fn(predicate) + ")", emitters, transformators.filter(predicate, emitters.length), initialValue);
}
exports.filter = filter;
;
function filterMap(initialValue, filterMapping, emitter1, emitter2, emitter3, emitter4, emitter5, emitter6, emitter7) {
    var emitters = Array.prototype.slice.apply(arguments, [2]);
    return namedTransformator("filterMap(" + fn(filterMapping) + ")", emitters, transformators.filterMap(filterMapping, emitters.length), initialValue);
}
exports.filterMap = filterMap;
;
function accumulate(initialValue, accumulator, emitter1, emitter2, emitter3, emitter4, emitter5, emitter6, emitter7) {
    var emitters = Array.prototype.slice.apply(arguments, [2]);
    var acc = accumulator.apply([], [initialValue].concat(emitters.map(function (e) { return e.dirtyCurrentValue(); })));
    return namedTransformator("accumulate(" + fn(accumulator) + ")", emitters, transformators.accumulate(acc, accumulator), acc);
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
// export function cumulateOverTime<T>(
//     emitter: emitter.Emitter<eevent<T>>,
//     overInMs: number
// ): emitter.Emitter <eevent<T[]>> {
//     return namedTransformator(
//         `cumulateOverTime(${overInMs}ms)`,
//         [emitter],
//         transformators.cumulateOverTime(overInMs),
//         eevent.notHappened
//     );
// }
function hold(initialValue, emitter) {
    function transform(emit) {
        return function holdTransform(v, i) {
            if (v[i].happened) {
                emit(v[i].value);
            }
        };
    }
    return namedTransformator('hold', [emitter], transform, initialValue);
}
exports.hold = hold;
;
function changes(emitter) {
    return namedTransformator('changes', [emitter], transformators.changes(emitter.dirtyCurrentValue()), eevent.notHappened);
}
exports.changes = changes;
function skipFirst(emitter) {
    function transform(emit, impulse) {
        var skipped = false;
        return function skipFirstTransform(v, i) {
            if (v[i].happened) {
                if (skipped) {
                    impulse(v[i]);
                }
                else {
                    skipped = true;
                }
            }
        };
    }
    return namedTransformator('skip(1)', [emitter], transform, eevent.notHappened);
}
exports.skipFirst = skipFirst;
;
// semantics:
// f_a :: t -> (t -> a)
// flatten(f_a) = f(t)
// flatten(f_a)(t) = f(t)(t)
function flatten(emitter) {
    var transformator = namedTransformator('flatten', [emitter, emitter.dirtyCurrentValue()], transform, emitter.dirtyCurrentValue().dirtyCurrentValue());
    function transform(emit) {
        return function flattenTransform(v, i) {
            if (i == 0) {
                transformator.dropEmitters(1);
                transformator.plugEmitter(v[0]);
                emit(v[0].dirtyCurrentValue());
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
// semantics:
// f_a :: t -> [t -> a]
// flatten(f_a) = f(t)
// flatten(f_a)(t) = f(t).map(g => g(t))
function flattenMany(emitter) {
    var currentValues = emitter.dirtyCurrentValue().map(function (e) { return e.dirtyCurrentValue(); });
    var transformator = namedTransformator('flattenMany', [emitter].concat(emitter.dirtyCurrentValue()), transform, currentValues);
    function transform(emit) {
        return function flattenManyTransform(v, i) {
            if (i == 0) {
                transformator.dropEmitters(1);
                v[0].forEach(function (e) { return transformator.plugEmitter(e); });
                emit(v[0].map(function (e) { return e.dirtyCurrentValue(); }));
            }
            else {
                emit(v.slice(1));
            }
        };
    }
    ;
    return transformator;
}
exports.flattenMany = flattenMany;
function flattenNamed(emitter) {
    var currentValue = emitter.dirtyCurrentValue();
    var currentValues = mapObj(currentValue, function (e) { return e.dirtyCurrentValue(); });
    var currentKeys = objKeys(currentValue);
    var transformator = namedTransformator('flattenNamed', [emitter].concat(currentKeys.map(function (k) { return currentValue[k]; })), transform, currentValues);
    function transform(emit) {
        var keys = currentKeys;
        return function flattenNamedTransform(v, i) {
            if (i == 0) {
                transformator.dropEmitters(1);
                keys = objKeys(v[0]);
                keys.forEach(function (k) {
                    transformator.plugEmitter(v[0][k]);
                });
                emit(mapObj(v[0], function (e) { return e.dirtyCurrentValue(); }));
            }
            else {
                var r = {};
                keys.forEach(function (k, i) {
                    r[k] = v[i + 1];
                });
                emit(r);
            }
        };
    }
    ;
    return transformator;
}
exports.flattenNamed = flattenNamed;
function unglitch(emitter) {
    var transformator = namedTransformator('unglitch', [emitter], transform, emitter.dirtyCurrentValue());
    function transform(emit) {
        var value;
        return function unglitchTransform(v, i) {
            value = v[i];
            setTimeout(function () {
                emit(value);
            }, 0);
        };
    }
    ;
    return transformator;
}
exports.unglitch = unglitch;
;

},{"../src/electric-event":8,"./emitter":10,"./transformator-helpers":18,"./utils/fn":22,"./utils/map-obj":24,"./utils/objKeys":25}],20:[function(require,module,exports){
function all(list) {
    for (var i = 0; i < list.length; i++) {
        if (!list[i]) {
            return false;
        }
    }
    return true;
}
module.exports = all;

},{}],21:[function(require,module,exports){
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
module.exports = callIfFunction;

},{}],22:[function(require,module,exports){
function fn(f) {
    return f.name || '=>';
}
module.exports = fn;

},{}],23:[function(require,module,exports){
var keyCodes = {
    space: 32,
    backspace: 8,
    tab: 9,
    enter: 13,
    shift: 16,
    ctrl: 17,
    alt: 18,
    pause: 19,
    capslock: 20,
    escape: 27,
    pageup: 33,
    pagedown: 34,
    end: 35,
    home: 36,
    left: 37,
    up: 38,
    right: 39,
    down: 40,
    insert: 45,
    delete: 46,
    '0': 48,
    '1': 49,
    '2': 50,
    '3': 51,
    '4': 52,
    '5': 53,
    '6': 54,
    '7': 55,
    '8': 56,
    '9': 57,
    a: 65,
    b: 66,
    c: 67,
    d: 68,
    e: 69,
    f: 70,
    g: 71,
    h: 72,
    i: 73,
    j: 74,
    k: 75,
    l: 76,
    m: 77,
    n: 78,
    o: 79,
    p: 80,
    q: 81,
    r: 82,
    s: 83,
    t: 84,
    u: 85,
    v: 86,
    w: 87,
    x: 88,
    y: 89,
    z: 90,
    numpad0: 96,
    numpad1: 97,
    numpad2: 98,
    numpad3: 99,
    numpad4: 100,
    numpad5: 101,
    numpad6: 102,
    numpad7: 103,
    numpad8: 104,
    numpad9: 105,
    multiply: 106,
    add: 107,
    subtract: 109,
    decimalpoint: 110,
    divide: 111,
    f1: 112,
    f2: 113,
    f3: 114,
    f4: 115,
    f5: 116,
    f6: 117,
    f7: 118,
    f8: 119,
    f9: 120,
    f10: 121,
    f11: 122,
    f12: 123,
    numlock: 144,
    scrolllock: 145,
    semicolon: 186,
    equal: 187,
    comma: 188,
    dash: 189,
    period: 190,
    forwardslash: 191,
    graveaccent: 192,
    openbracket: 219,
    backslash: 220,
    closebraket: 221,
    singlequote: 222
};
module.exports = keyCodes;

},{}],24:[function(require,module,exports){
function mapObj(obj, mapping) {
    var result = {};
    for (var key in obj) {
        if (!obj.hasOwnProperty(key)) {
            continue;
        }
        result[key] = mapping(obj[key]);
    }
    return result;
}
module.exports = mapObj;

},{}],25:[function(require,module,exports){
function objKeys(obj) {
    var result = [];
    for (var k in obj) {
        if (obj.hasOwnProperty(k)) {
            result.push(k);
        }
    }
    return result;
}
module.exports = objKeys;

},{}],26:[function(require,module,exports){
function pushIfNotIn(list, item) {
    if (list.indexOf(item) === -1) {
        list.push(item);
    }
}
module.exports = pushIfNotIn;

},{}],27:[function(require,module,exports){
function shallowCopy(obj) {
    var copy = {};
    for (var k in obj) {
        copy[k] = obj[k];
    }
    return copy;
}
module.exports = shallowCopy;

},{}],28:[function(require,module,exports){
var Wire = (function () {
    function Wire(input, output, receive, set) {
        this.input = input;
        this.output = output;
        this.name = 'w';
        if (set) {
            this._set = set;
            this._futureReceive = receive;
        }
        else {
            this.receive = receive;
        }
        this._receiverId = this.input.plugReceiver(this);
    }
    Wire.prototype.toString = function () {
        return this.input.toString() + " -" + this.name + "- " + this.output.toString();
    };
    Wire.prototype.receive = function (x) {
        this._set(x);
        this._set = undefined;
        this.receive = this._futureReceive;
        this._futureReceive = undefined;
    };
    Wire.prototype.unplug = function () {
        if (this.input) {
            this.input.unplugReceiver(this._receiverId);
        }
        this.input = undefined;
        this.output = undefined;
    };
    return Wire;
})();
module.exports = Wire;

},{}]},{},[1]);
