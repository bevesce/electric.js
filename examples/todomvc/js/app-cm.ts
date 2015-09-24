import item = require('./item');
import electric = require('../../../src/electric');
import eevent = require('../../../src/electric-event');
import rui = require('../../../src/receivers/ui');
import eui = require('../../../src/emitters/ui');
import storage = require('./storage');


// Emitters
var hash = eui.hash();
var newTask = eui.enteredText('new-task');
var clear = eui.clicks('clear-button');
var check = electric.emitter.manualEvent(<{ id: number, completed: boolean }>null, 'check');
var del = electric.emitter.manualEvent(<number>null, 'delete');
var toggle = eui.checkboxClicks('toggle');
var editingStart = electric.emitter.manualEvent(<number>null, 'editing start');
var retitle = electric.emitter.manualEvent(<{ id: number, title: string }>null,'retitle');

// Transformators
import tasksTransformator = require('./tasks-device');
var tasks = tasksTransformator(
	storage.restoreTasks(),
	{
		insert: newTask,
		check: check,
		toggle: toggle,
		retitle: retitle,
		del: del,
		clear: clear,
		filter: hash
	}
);

// Receivers
//// Tasks Renderer Receiver
var editingId = electric.emitter.constant(undefined).change(
	{ to: (_, k) => electric.emitter.constant(k), when: editingStart },
	{ to: electric.emitter.constant(undefined), when: electric.transformator.changes(tasks.visible) }
);
editingId.name = 'id of edited item'

import tasksRendererReceiver = require('./tasks-receiver');
electric.transformator.map(
	(ts, editingId) => ({tasks: ts, editing: editingId}),
	tasks.visible, editingId
).plugReceiver(tasksRendererReceiver(del, retitle, editingStart, check));

//// Other
tasks.all.plugReceiver(storage.saveTaskToStorage);

newTask.plugReceiver(clearInput);
function clearInput(_: any) {
	(<any>document.getElementById('new-task')).value = '';
};

tasks.count.all.plugReceiver(allCounterReceiver())
function allCounterReceiver() {
	var main = document.getElementById('main');
	var footer = document.getElementById('footer');
	return function listHide(count: number) {
		main.className = hidden(main.className, count === 0);
		footer.className = hidden(footer.className, count === 0);
	}
};

tasks.count.active.plugReceiver(activeCountReceiver());
function activeCountReceiver() {
	var countReceiver = rui.htmlReceiverById('active-tasks-counter');
	var wordReceiver = rui.htmlReceiverById('active-tasks-word');
	return function itemsLeftCounter(c: number) {
		countReceiver(c);
		wordReceiver(c === 1 ? 'item' : 'items');
	}
};

electric.transformator.map(
	(ac, cc) => ac === cc,
	tasks.count.all, tasks.count.completed
).plugReceiver(checkToggleAllReceiver());
function checkToggleAllReceiver() {
	var toggleCheckbox = document.getElementById('toggle');
	return function toggleCheckboxChecked(checked: boolean) {
		(<any>toggleCheckbox).checked = checked;
	}
}

tasks.count.completed.plugReceiver(clearCompletedHideReceiver());
function clearCompletedHideReceiver() {
	var button = document.getElementById('clear-button');
	return function clearCompletedButtonVisiblity(count: number) {
		button.className = hidden(button.className, count === 0);
	}
};

function hidden(className: string, shouldBe: boolean) {
	if (shouldBe) {
		return className += ' hidden';
	}
	return className.replace(/hidden/g, '');
}

hash.plugReceiver(footerFiltersReceiver());
function footerFiltersReceiver() {
	var previousRoute = '#/active';
	return function activeFilterSelection(route: string) {
		var routeToId: { [index: string]: string } = {
			'#/active': 'button-active',
			'#/completed': 'button-completed'
		}
		if (previousRoute && previousRoute !== route) {
			document.getElementById(routeToId[previousRoute] || 'button-all').className = '';
		}
		document.getElementById(routeToId[route] || 'button-all').className = 'selected';
		previousRoute = route;
	};
};

var g = electric.graph.of(tasks.all);
console.log(g.stringify());