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
