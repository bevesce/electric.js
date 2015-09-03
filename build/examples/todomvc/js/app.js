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
var tasksDevice = require('./tasks-device');
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
//// Tasks Renderer Receiver
var editingId = electric.emitter.constant(undefined).change({ to: function (_, k) { return electric.emitter.constant(k); }, when: editingStart }, { to: electric.emitter.constant(undefined), when: electric.transformator.changes(tasks.visible) });
var tasksRendererReceiver = require('./tasks-receiver');
electric.transformator.map(function (ts, editingId) { return ({ tasks: ts, editing: editingId }); }, tasks.visible, editingId).plugReceiver(tasksRendererReceiver(del, retitle, editingStart, check));
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

},{"../../../src/electric":9,"../../../src/emitters/ui":11,"../../../src/receivers/ui":15,"./storage":3,"./tasks-device":4,"./tasks-receiver":5}],2:[function(require,module,exports){
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
function tasksReceiver(tasks) {
    localStorage.setItem(TASK_KEY, JSON.stringify(tasks));
}
exports.tasksReceiver = tasksReceiver;

},{"./item":2}],4:[function(require,module,exports){
var item = require('./item');
var electric = require('../../../src/electric');
var eevent = require('../../../src/electric-event');
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

},{"../../../src/receivers/ui":15}],6:[function(require,module,exports){
var clock = require('../clock');
var scheduler = require('../scheduler');
var transformator = require('../transformator');
function integral(initialValue, emitter, options) {
    var timmed = timeValue(emitter, options);
    var result = timmed.accumulate({
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
    }).map(function (v) { return v.sum; });
    result.name = '<| integral |>';
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
        var dt = v.time - acc.time;
        var diff = v.value.sub(acc.value).divT(dt);
        return {
            time: v.time,
            value: v.value,
            diff: diff
        };
    }).map(function (v) { return v.diff; });
    result.setEquals(function (x, y) { return x.equals(y); });
    result.name = '<| differential |>';
    return result;
}
exports.differential = differential;
function timeValue(emitter, options) {
    var time = clock.time(options);
    var trans = transformator.map(function (t, v) { return ({ time: t, value: v }); }, time, emitter);
    trans.stabilize = function () { return time.stabilize(); };
    return trans;
}

},{"../clock":7,"../scheduler":17,"../transformator":19}],7:[function(require,module,exports){
var scheduler = require('./scheduler');
var emitter = require('./emitter');
function interval(options) {
    var timer = emitter.manualEvent();
    scheduler.scheduleInterval(function () {
        timer.impulse(Date.now());
    }, calculateInterval(options.inMs, options.fps));
    timer.name = '| interval ' + calculateEmitterName(options);
    return timer;
}
exports.interval = interval;
function intervalValue(value, options) {
    var timer = emitter.manualEvent();
    scheduler.scheduleInterval(function () {
        timer.impulse(value);
    }, calculateInterval(options.inMs, options.fps));
    timer.name = '| interval of ' + value + calculateEmitterName(options);
    return timer;
}
exports.intervalValue = intervalValue;
function time(options) {
    var interval = calculateInterval(options.intervalInMs, options.fps);
    var timeEmitter = emitter.manual(scheduler.now());
    var id = scheduler.scheduleInterval(function () { return timeEmitter.emit((scheduler.now())); }, interval);
    timeEmitter.setReleaseResources(function () { return scheduler.unscheduleInterval(id); });
    timeEmitter.name = '| time ' + calculateEmitterName(options);
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
        return ' fps: ' + options.fps + ' |>';
    }
    else if (options.inMs !== undefined) {
        return ' interval: ' + options.inMs + 'ms |>';
    }
    else {
        return ' interval: ' + options.intervalInMs + 'ms |>';
    }
}

},{"./emitter":10,"./scheduler":17}],8:[function(require,module,exports){
var utils = require('./utils');
var ElectricEvent = (function () {
    function ElectricEvent() {
    }
    ElectricEvent.restore = function (e) {
        if (e.happend) {
            return ElectricEvent.of(e.value);
        }
        return ElectricEvent.notHappend;
    };
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

},{"./utils":21}],9:[function(require,module,exports){
exports.scheduler = require('./scheduler');
exports.emitter = require('./emitter');
exports.transformator = require('./transformator');
exports.receiver = require('./receiver');
exports.clock = require('./clock');
exports.transmitter = require('./transmitter');
exports.calculus = require('./calculus/calculus');
exports.e = exports.emitter;
exports.t = exports.transformator;
exports.r = exports.receiver;
exports.c = exports.calculus;

},{"./calculus/calculus":6,"./clock":7,"./emitter":10,"./receiver":14,"./scheduler":17,"./transformator":19,"./transmitter":20}],10:[function(require,module,exports){
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
            this._dispatchToReceiver(receiver, value);
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
        var t = namedTransformator('when happens then', [this], transformators.when(switcher.happens, switcher.then), eevent.notHappend);
        return t;
    };
    Emitter.prototype.whenThen = function (happens) {
        var t = namedTransformator('when then', [this], transformators.whenThen(happens), eevent.notHappend);
        return t;
    };
    Emitter.prototype.sample = function (initialValue, samplingEvent) {
        var t = namedTransformator('sample' + this._enclosedName() + ' on ' + this._enclosedName(samplingEvent), [this, samplingEvent], transformators.sample(), initialValue);
        return t;
    };
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
    //     switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
    //     switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
    //     switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
    //     switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
    //     switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
    //     switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
    //     switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
    //     switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
    //     switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) },
    //     switcher14: { when: inf.IEmitter<eevent<S14>>, to: inf.IEmitter<T> | ((t: T, k: S14) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
    //     switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
    //     switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
    //     switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) },
    //     switcher14: { when: inf.IEmitter<eevent<S14>>, to: inf.IEmitter<T> | ((t: T, k: S14) => inf.IEmitter<T>) },
    //     switcher15: { when: inf.IEmitter<eevent<S15>>, to: inf.IEmitter<T> | ((t: T, k: S15) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
    //     switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
    //     switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
    //     switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) },
    //     switcher14: { when: inf.IEmitter<eevent<S14>>, to: inf.IEmitter<T> | ((t: T, k: S14) => inf.IEmitter<T>) },
    //     switcher15: { when: inf.IEmitter<eevent<S15>>, to: inf.IEmitter<T> | ((t: T, k: S15) => inf.IEmitter<T>) },
    //     switcher16: { when: inf.IEmitter<eevent<S16>>, to: inf.IEmitter<T> | ((t: T, k: S16) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
    //     switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
    //     switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
    //     switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) },
    //     switcher14: { when: inf.IEmitter<eevent<S14>>, to: inf.IEmitter<T> | ((t: T, k: S14) => inf.IEmitter<T>) },
    //     switcher15: { when: inf.IEmitter<eevent<S15>>, to: inf.IEmitter<T> | ((t: T, k: S15) => inf.IEmitter<T>) },
    //     switcher16: { when: inf.IEmitter<eevent<S16>>, to: inf.IEmitter<T> | ((t: T, k: S16) => inf.IEmitter<T>) },
    //     switcher17: { when: inf.IEmitter<eevent<S17>>, to: inf.IEmitter<T> | ((t: T, k: S17) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
    //     switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
    //     switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
    //     switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) },
    //     switcher14: { when: inf.IEmitter<eevent<S14>>, to: inf.IEmitter<T> | ((t: T, k: S14) => inf.IEmitter<T>) },
    //     switcher15: { when: inf.IEmitter<eevent<S15>>, to: inf.IEmitter<T> | ((t: T, k: S15) => inf.IEmitter<T>) },
    //     switcher16: { when: inf.IEmitter<eevent<S16>>, to: inf.IEmitter<T> | ((t: T, k: S16) => inf.IEmitter<T>) },
    //     switcher17: { when: inf.IEmitter<eevent<S17>>, to: inf.IEmitter<T> | ((t: T, k: S17) => inf.IEmitter<T>) },
    //     switcher18: { when: inf.IEmitter<eevent<S18>>, to: inf.IEmitter<T> | ((t: T, k: S18) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18, S19>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
    //     switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
    //     switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
    //     switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) },
    //     switcher14: { when: inf.IEmitter<eevent<S14>>, to: inf.IEmitter<T> | ((t: T, k: S14) => inf.IEmitter<T>) },
    //     switcher15: { when: inf.IEmitter<eevent<S15>>, to: inf.IEmitter<T> | ((t: T, k: S15) => inf.IEmitter<T>) },
    //     switcher16: { when: inf.IEmitter<eevent<S16>>, to: inf.IEmitter<T> | ((t: T, k: S16) => inf.IEmitter<T>) },
    //     switcher17: { when: inf.IEmitter<eevent<S17>>, to: inf.IEmitter<T> | ((t: T, k: S17) => inf.IEmitter<T>) },
    //     switcher18: { when: inf.IEmitter<eevent<S18>>, to: inf.IEmitter<T> | ((t: T, k: S18) => inf.IEmitter<T>) },
    //     switcher19: { when: inf.IEmitter<eevent<S19>>, to: inf.IEmitter<T> | ((t: T, k: S19) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    // change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18, S19, S20>(
    //     switcher1: { when: inf.IEmitter<eevent<S1>>, to: inf.IEmitter<T> | ((t: T, k: S1) => inf.IEmitter<T>) },
    //     switcher2: { when: inf.IEmitter<eevent<S2>>, to: inf.IEmitter<T> | ((t: T, k: S2) => inf.IEmitter<T>) },
    //     switcher3: { when: inf.IEmitter<eevent<S3>>, to: inf.IEmitter<T> | ((t: T, k: S3) => inf.IEmitter<T>) },
    //     switcher4: { when: inf.IEmitter<eevent<S4>>, to: inf.IEmitter<T> | ((t: T, k: S4) => inf.IEmitter<T>) },
    //     switcher5: { when: inf.IEmitter<eevent<S5>>, to: inf.IEmitter<T> | ((t: T, k: S5) => inf.IEmitter<T>) },
    //     switcher6: { when: inf.IEmitter<eevent<S6>>, to: inf.IEmitter<T> | ((t: T, k: S6) => inf.IEmitter<T>) },
    //     switcher7: { when: inf.IEmitter<eevent<S7>>, to: inf.IEmitter<T> | ((t: T, k: S7) => inf.IEmitter<T>) },
    //     switcher8: { when: inf.IEmitter<eevent<S8>>, to: inf.IEmitter<T> | ((t: T, k: S8) => inf.IEmitter<T>) },
    //     switcher9: { when: inf.IEmitter<eevent<S9>>, to: inf.IEmitter<T> | ((t: T, k: S9) => inf.IEmitter<T>) },
    //     switcher10: { when: inf.IEmitter<eevent<S10>>, to: inf.IEmitter<T> | ((t: T, k: S10) => inf.IEmitter<T>) },
    //     switcher11: { when: inf.IEmitter<eevent<S11>>, to: inf.IEmitter<T> | ((t: T, k: S11) => inf.IEmitter<T>) },
    //     switcher12: { when: inf.IEmitter<eevent<S12>>, to: inf.IEmitter<T> | ((t: T, k: S12) => inf.IEmitter<T>) },
    //     switcher13: { when: inf.IEmitter<eevent<S13>>, to: inf.IEmitter<T> | ((t: T, k: S13) => inf.IEmitter<T>) },
    //     switcher14: { when: inf.IEmitter<eevent<S14>>, to: inf.IEmitter<T> | ((t: T, k: S14) => inf.IEmitter<T>) },
    //     switcher15: { when: inf.IEmitter<eevent<S15>>, to: inf.IEmitter<T> | ((t: T, k: S15) => inf.IEmitter<T>) },
    //     switcher16: { when: inf.IEmitter<eevent<S16>>, to: inf.IEmitter<T> | ((t: T, k: S16) => inf.IEmitter<T>) },
    //     switcher17: { when: inf.IEmitter<eevent<S17>>, to: inf.IEmitter<T> | ((t: T, k: S17) => inf.IEmitter<T>) },
    //     switcher18: { when: inf.IEmitter<eevent<S18>>, to: inf.IEmitter<T> | ((t: T, k: S18) => inf.IEmitter<T>) },
    //     switcher19: { when: inf.IEmitter<eevent<S19>>, to: inf.IEmitter<T> | ((t: T, k: S19) => inf.IEmitter<T>) },
    //     switcher20: { when: inf.IEmitter<eevent<S20>>, to: inf.IEmitter<T> | ((t: T, k: S20) => inf.IEmitter<T>) }
    // ): inf.IEmitter<T>;
    Emitter.prototype.change = function () {
        var switchers = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            switchers[_i - 0] = arguments[_i];
        }
        return namedTransformator('change to when', [this].concat(switchers.map(function (s) { return s.when; })), transformators.change(switchers), this._currentValue);
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
})(Emitter);
exports.Transformator = Transformator;
function namedTransformator(name, emitters, transform, initialValue) {
    if (transform === void 0) { transform = undefined; }
    var t = new Transformator(emitters, transform, initialValue);
    t.name = '<| ' + name + ' |>';
    return t;
}
exports.namedTransformator = namedTransformator;

},{"./electric-event":8,"./placeholder":13,"./scheduler":17,"./transformator-helpers":18,"./wire":22}],11:[function(require,module,exports){
var electric = require('../electric');
var utils = require('../receivers/utils');
var transformator = require('../transformator');
var eevent = require('../electric-event');
var fp = require('../fp');
var keyCodes = {
    up: 38,
    down: 40,
    left: 37,
    right: 39,
    w: 87,
    a: 65,
    s: 83,
    d: 68,
    enter: 13,
    space: 32
};
// NEW
function clicks(nodeOrId, mapping) {
    if (mapping === void 0) { mapping = fp.identity; }
    var button = utils.getNode(nodeOrId);
    var emitter = electric.emitter.manualEvent();
    function emitterListener(event) {
        emitter.impulse(mapping(event));
    }
    button.addEventListener('click', emitterListener, false);
    emitter.setReleaseResources(function () { return button.removeEventListener('click', emitterListener); });
    emitter.name = '| clicks on ' + nodeOrId + ' |>';
    return emitter;
}
exports.clicks = clicks;
function arrows(layout, nodeOrId, type) {
    if (layout === void 0) { layout = 'arrows'; }
    if (nodeOrId === void 0) { nodeOrId = document; }
    if (type === void 0) { type = 'keydown'; }
    var layouts = {
        'arrows': {
            38: 'up', 40: 'down', 37: 'left', 39: 'right'
        },
        'wasd': {
            87: 'up', 83: 'down', 65: 'left', 68: 'right'
        },
        'hjkl': {
            75: 'up', 74: 'down', 72: 'left', 76: 'right'
        },
        'ijkl': {
            73: 'up', 75: 'down', 74: 'left', 76: 'right'
        }
    };
    var keyCodes = layouts[layout];
    var target = utils.getNode(nodeOrId);
    var emitter = electric.emitter.manualEvent();
    function emitterListener(event) {
        var direction = keyCodes[event.keyCode];
        if (direction) {
            event.preventDefault();
            emitter.impulse(direction);
        }
    }
    target.addEventListener(type, emitterListener);
    emitter.name = '| arrows |>';
    return emitter;
}
exports.arrows = arrows;
function key(name, type, nodeOrId) {
    if (nodeOrId === void 0) { nodeOrId = document; }
    var target = utils.getNode(nodeOrId);
    var emitter = electric.emitter.manualEvent();
    var keyCode = keyCodes[name];
    function emitterListener(event) {
        if (event.keyCode === keyCode) {
            event.preventDefault();
            emitter.impulse(name);
        }
    }
    target.addEventListener('key' + type, emitterListener);
    emitter.name = '| key ' + name + ' on ' + type + ' |>';
    return emitter;
}
exports.key = key;
// OLD
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

},{"../electric":9,"../electric-event":8,"../fp":12,"../receivers/utils":16,"../transformator":19}],12:[function(require,module,exports){
function identity(x) {
    return x;
}
exports.identity = identity;
;
function curry(f, arity) {
    if (arity === void 0) { arity = 2; }
    function partial(prevArgs) {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            var nextArgs = prevArgs.slice();
            nextArgs.splice.apply(nextArgs, [nextArgs.length, 0].concat(args));
            if (nextArgs.length >= arity) {
                return f.apply(void 0, nextArgs);
            }
            return partial(nextArgs);
        };
    }
    return partial([]);
}
exports.curry = curry;
;
function property(name) {
    return function (obj) {
        return obj[name];
    };
}
exports.property = property;
;
function compose(f, g) {
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        return f(g.apply(void 0, args));
    };
}
exports.compose = compose;
var maybe;
(function (maybe) {
    var Just = (function () {
        function Just(value) {
            this.value = value;
        }
        Just.prototype.map = function (f) {
            var result = f(this.flatten());
            return just(result);
        };
        Just.prototype.flatten = function () {
            return this.value;
        };
        Just.prototype.chain = function (f) {
            return this.map(f).flatten();
        };
        return Just;
    })();
    function just(value) {
        return new Just(value);
    }
    maybe.just = just;
    var Nothing = (function () {
        function Nothing() {
        }
        Nothing.prototype.map = function (f) {
            return maybe.nothing;
        };
        Nothing.prototype.bind = function (f) {
            return maybe.nothing;
        };
        Nothing.prototype.flatten = function () {
            throw Error("can't flatten Nothing");
        };
        Nothing.prototype.chain = function (f) {
            return maybe.nothing;
        };
        return Nothing;
    })();
    maybe.nothing = new Nothing();
})(maybe = exports.maybe || (exports.maybe = {}));
var either;
(function (either) {
    var Right = (function () {
        function Right(value) {
            this.value = value;
        }
        Right.prototype.map = function (f) {
            var result = f(this.flatten());
            return right(result);
        };
        Right.prototype.flatten = function () {
            return this.value;
        };
        Right.prototype.chain = function (f) {
            return this.map(f).flatten();
        };
        Right.prototype.isRight = function () {
            return true;
        };
        Right.prototype.isLeft = function () {
            return false;
        };
        return Right;
    })();
    function right(value) {
        return new Right(value);
    }
    either.right = right;
    var Left = (function () {
        function Left(value) {
            this.lvalue = value;
        }
        Left.prototype.map = function (f) {
            return left(this.lvalue);
        };
        Left.prototype.flatten = function () {
            throw Error("can't flatten Left");
        };
        Left.prototype.chain = function (f) {
            return left(this.lvalue);
        };
        Left.prototype.isRight = function () {
            return false;
        };
        Left.prototype.isLeft = function () {
            return true;
        };
        return Left;
    })();
    function left(value) {
        return (new Left(value));
        // when remove <any> casting:
        // Neither type 'Left<L, {}>' nor type 'Either<L, R>' is assignable to the other.
        // Types of property 'flatten' are incompatible.
        // Type '() => {} | Either<L, {}>' is not assignable to type '() => R | Monad<R>'.
        // Type '{} | Either<L, {}>' is not assignable to type 'R | Monad<R>'.
        // Type '{}' is not assignable to type 'R | Monad<R>'.
        // Type '{}' is not assignable to type 'Monad<R>'.
        // Property 'flatten' is missing in type '{}'.
    }
    either.left = left;
})(either = exports.either || (exports.either = {}));

},{}],13:[function(require,module,exports){
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
                this._wires[0].unplug();
                var to = switchers[i - 1].to;
                var e = utils.callIfFunction(to, v[0], v[i].value);
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
function whenThen(happens) {
    return function transform(emit, impulse) {
        var prevHappend;
        return function whenTransform(v, i) {
            var happend = happens(v[i]);
            if (happend && !prevHappend) {
                impulse(eevent.of(happend));
                prevHappend = happend;
            }
            else if (!happend) {
                prevHappend = null;
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

},{"./electric-event":8,"./scheduler":17,"./utils":21,"./wire":22}],19:[function(require,module,exports){
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
function skipFirst(emitter) {
    function transform(emit, impulse) {
        var skipped = false;
        return function skipFirstTransform(v, i) {
            if (v[i].happend) {
                if (skipped) {
                    impulse(v[i]);
                }
                else {
                    skipped = true;
                }
            }
        };
    }
    return namedTransformator('skip 1', [emitter], transform, eevent.notHappend);
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
    var transformator = namedTransformator('flatten many', [emitter].concat(emitter.dirtyCurrentValue()), transform, currentValues);
    function transform(emit) {
        return function flattenTransform(v, i) {
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

},{"../src/electric-event":8,"./emitter":10,"./transformator-helpers":18}],20:[function(require,module,exports){
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

},{"./emitter":10,"./wire":22}],21:[function(require,module,exports){
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
