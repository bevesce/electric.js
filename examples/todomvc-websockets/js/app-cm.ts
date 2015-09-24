import item = require('./item');
import electric = require('../../../src/electric');
import eevent = require('../../../src/electric-event');
import rui = require('../../../src/receivers/ui');
import eui = require('../../../src/emitters/ui');
import storage = require('./storage');
import Change = require('./change');

import dom = require('./dom');

// Emitters
var hash = eui.hash();
var newTask = eui.enteredText('new-task');
var clear = eui.clicks('clear-button');
var check = electric.emitter.manualEvent(<{ id: number, completed: boolean }>null, 'check');
var del = electric.emitter.manualEvent(<number>null, 'delete');
var toggle = eui.checkboxClicks('toggle');
var editingStart = electric.emitter.manualEvent(<number>null, 'editing start');
var retitle = electric.emitter.manualEvent(<{ id: number, title: string }>null, 'retitle');

// Transformators
import tasksDevice = require('./changes-device-client');
var tasks = tasksDevice(
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
//// Changes Receiver
var editingId = electric.emitter.constant(undefined).change(
	{ to: (_, k) => electric.emitter.constant(k), when: editingStart },
	{ to: electric.emitter.constant(undefined), when: tasks.changes.visible }
);

// electric.receiver.logEvents(tasks.changes.all);
// electric.receiver.logEvents(tasks.changes.visible);

import changesRendererReceiver = require('./changes-receiver');
electric.transformator.map(
	(tasks, editingId, changes) => ({ tasks: tasks, editingId: editingId, changes: changes }),
	tasks.visible, editingId, tasks.changes.visible
).plugReceiver(changesRendererReceiver(del, retitle, editingStart, check));

//// Other
tasks.all.plugReceiver(storage.tasksReceiver);

newTask.plugReceiver(clearInput);
function clearInput(_: any) {
	(<any>document.getElementById('new-task')).value = '';
};

tasks.count.all.plugReceiver(allCounterReceiver())
function allCounterReceiver() {
	var main = document.getElementById('main');
	var footer = document.getElementById('footer');
	return function(count: number) {
		main.className = hidden(main.className, count === 0);
		footer.className = hidden(footer.className, count === 0);
	}
};

tasks.count.active.plugReceiver(activeCountReceiver());
function activeCountReceiver() {
	var countReceiver = rui.htmlReceiverById('active-tasks-counter');
	var wordReceiver = rui.htmlReceiverById('active-tasks-word');
	return function(c: number) {
		countReceiver(c);
		wordReceiver(c === 1 ? 'item' : 'items');
	}
};

tasks.count.completed.plugReceiver(clearCompletedHideReceiver());
function clearCompletedHideReceiver() {
	var button = document.getElementById('clear-button');
	return function(count: number) {
		button.className = hidden(button.className, count === 0);
	}
};

function hidden(className: string, shouldBe: boolean) {
	if (shouldBe) {
		return className += ' hidden';
	}
	return className.replace(/hidden/g, '');
}

electric.transformator.map(
	(ac, cc) => ac === cc,
	tasks.count.all, tasks.count.completed
).plugReceiver(checkToggleAllReceiver());
function checkToggleAllReceiver() {
	var toggleCheckbox = document.getElementById('toggle');
	return function(checked: boolean) {
		(<any>toggleCheckbox).checked = checked;
	}
}

hash.plugReceiver(footerFiltersReceiver());
function footerFiltersReceiver() {
	var previousRoute = '';
	return function(route: string) {
		var routeToId: { [index: string]: string } = {
			'#/active': 'button-active',
			'#/completed': 'button-completed'
		}
		if (previousRoute) {
			document.getElementById(routeToId[previousRoute] || 'button-all').className = '';
		}
		document.getElementById(routeToId[route] || 'button-all').className = 'selected';
		previousRoute = route;
	};
};
