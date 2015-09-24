import item = require('./item');
import electric = require('../../../src/electric');
import eevent = require('../../../src/electric-event');
import rui = require('../../../src/receivers/ui');
import eui = require('../../../src/emitters/ui');


// Emitters
var hash = eui.hash();
var newTask = eui.enteredText('new-task');
var clear = eui.clicks('clear-button');
var check = electric.emitter.manualEvent(<{ id: number, completed: boolean }>null, 'check');
var del = electric.emitter.manualEvent(<number>null, 'delete');
var toggle = eui.checkboxClicks('toggle');
var editingStart = electric.emitter.manualEvent(<number>null, 'editing start');
var retitle = electric.emitter.manualEvent(<{ id: number, title: string }>null, 'retitle');
var syncButtonClick = eui.clicks('sync-button');


// Transformators
var initialTasks = electric.emitter.placeholder(eevent.notHappened);

import tasksDevice = require('./tasks-device');
var tasks = tasksDevice(
	initialTasks,
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
import syncDevice = require('./sync-device');
var sync = syncDevice(syncButtonClick, tasks.all);
initialTasks.is(sync.initialTasks);

// Receivers
//// Tasks Renderer Receiver
var editingId = electric.emitter.constant(undefined).change(
	{ to: (_, k) => electric.emitter.constant(k), when: editingStart },
	{ to: electric.emitter.constant(undefined), when: electric.transformator.changes(tasks.visible) }
);

import tasksRendererReceiver = require('./tasks-receiver');
electric.transformator.map(
	(ts, editingId) => ({tasks: ts, editing: editingId}),
	tasks.visible, editingId
).plugReceiver(tasksRendererReceiver(del, retitle, editingStart, check));

//// Other

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

electric.transformator.map(
	(ac, cc) => ac === cc,
	tasks.count.all, tasks.count.completed
).plugReceiver(checkToggleAllReceiver());
tasks.count.completed.plugReceiver(clearCompletedHideReceiver());
function clearCompletedHideReceiver() {
	var button = document.getElementById('clear-button');
	return function(count: number) {
		button.className = hidden(button.className, count === 0);
	}
};

function checkToggleAllReceiver() {
	var toggleCheckbox = document.getElementById('toggle');
	return function(checked: boolean) {
		(<any>toggleCheckbox).checked = checked;
	}
}

function hidden(className: string, shouldBe: boolean) {
	if (shouldBe) {
		return className += ' hidden';
	}
	return className.replace(/hidden/g, '');
}

hash.plugReceiver(footerFiltersReceiver());
function footerFiltersReceiver() {
	var previousRoute = '';
	return function(route: string) {
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

sync.state.plugReceiver(showSyncStateReceiver());
function showSyncStateReceiver() {
	var none = document.getElementById('sync-none');
	var waiting = document.getElementById('sync-waiting');
	var success = document.getElementById('sync-success');
	var error = document.getElementById('sync-error');
	var button = document.getElementById('sync-button');
	return function(status: string) {
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
	}
}

function hide(element: any) {
	element.className = hidden(element.className, true);
}

function show(element: any) {
	element.className = hidden(element.className, false);
}

function disable(element: Element) {
	element.setAttribute('disabled', 'true');
}

function enable(element: Element) {
	element.removeAttribute('disabled');
}

var g = electric.graph.of(sync.state, 3);
console.log(g.stringify());