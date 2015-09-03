var electric = require('../../../src/electric');
var eevent = require('../../../src/electric-event');
var rui = require('../../../src/receivers/ui');
var eui = require('../../../src/emitters/ui');
// Emitters
var hash = eui.hash();
var newTask = eui.fromInputTextEnter('new-task');
var clear = eui.fromButton('clear-button');
var check = electric.emitter.manualEvent('check');
var del = electric.emitter.manualEvent('delete');
var toggle = eui.fromCheckboxEvent('toggle');
var editingStart = electric.emitter.manualEvent('editing start');
var retitle = electric.emitter.manualEvent('retitle');
var syncButtonClick = eui.clicks('sync-button');
// Transformators
var initialTasks = electric.emitter.placeholder(eevent.notHappend);
var tasksDevice = require('./tasks-device');
var tasks = tasksDevice(initialTasks, {
    insert: newTask,
    check: check,
    toggle: toggle,
    retitle: retitle,
    del: del,
    clear: clear,
    filter: hash
});
var syncDevice = require('./sync-device');
var sync = syncDevice(syncButtonClick, tasks.all);
initialTasks.is(sync.initialTasks);
// Receivers
//// Tasks Renderer Receiver
var editingId = electric.emitter.constant(undefined).change({ to: function (_, k) { return electric.emitter.constant(k); }, when: editingStart }, { to: electric.emitter.constant(undefined), when: electric.transformator.changes(tasks.visible) });
var tasksRendererReceiver = require('./tasks-receiver');
electric.transformator.map(function (ts, editingId) { return ({ tasks: ts, editing: editingId }); }, tasks.visible, editingId).plugReceiver(tasksRendererReceiver(del, retitle, editingStart, check));
//// Other
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
sync.state.plugReceiver(showSyncStateReceiver());
function showSyncStateReceiver() {
    var none = document.getElementById('sync-none');
    var waiting = document.getElementById('sync-waiting');
    var success = document.getElementById('sync-success');
    var error = document.getElementById('sync-error');
    var button = document.getElementById('sync-button');
    return function (status) {
        hide(none);
        hide(waiting);
        hide(success);
        hide(error);
        if (status === 'none') {
            show(none);
            enable(button);
        }
        else if (status === 'waiting') {
            show(waiting);
            disable(button);
        }
        else if (status === 'error') {
            show(error);
            enable(button);
        }
        else if (status === 'success') {
            show(success);
            disable(button);
        }
    };
}
function hide(element) {
    element.className = hidden(element.className, true);
}
function show(element) {
    element.className = hidden(element.className, false);
}
function disable(element) {
    element.setAttribute('disabled', 'true');
}
function enable(element) {
    element.removeAttribute('disabled');
}
