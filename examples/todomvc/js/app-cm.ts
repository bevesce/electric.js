import inf = require('../../../src/interfaces');

import item = require('./item');
import electric = require('../../../src/electric');
import eevent = require('../../../src/electric-event');
import rui = require('../../../src/receivers/ui');
import eui = require('../../../src/emitters/ui');
import tasksDevice = require('./tasks-device');
import storage = require('./storage');
import Change = require('./change');


// Emitters
var hash = eui.hash();
var newTask = eui.fromInputTextEnter('new-task');
var clear = eui.fromButton('clear-button');
var check = <electric.emitter.EventEmitter<{ id: number, completed: boolean }>>electric.emitter.manualEvent();
var del = <electric.emitter.EventEmitter<number>>electric.emitter.manualEvent();
var toggle = eui.fromCheckboxEvent('toggle');
var editing = <electric.emitter.EventEmitter<number>>electric.emitter.manualEvent();
var retitle = <electric.emitter.EventEmitter<{ id: number, title: string }>>electric.emitter.manualEvent();
retitle.name = '| retitle |>';

var editingId = electric.emitter.constant(undefined).change(
	{ to: (_, k) => electric.emitter.constant(k), when: editing },
	{ to: electric.emitter.constant(undefined), when: retitle },
	{ to: electric.emitter.constant(undefined), when: del }
);


// Transformators
var tasks = tasksDevice(
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
tasks.all.plugReceiver(storage.tasksReceiver);
electric.transformator.map(
	(ts, editing) => ({tasks: ts, editing: editing}),
	tasks.visible, editingId
).plugReceiver(tasksRendererReceiver());
function tasksRendererReceiver() {
	var htmlReceiver = rui.htmlReceiverById('todo-list');
	return function tasksRenderingReceiver(arg: { tasks: item[], editing: number }) {
		var html = renderHTML(arg);
		htmlReceiver(html);

		if (arg.editing !== undefined) {
			setupEditingInput(arg.editing);
		}
		setupTasksEvents(arg.tasks);
	}
}

function renderHTML(arg: { tasks: item[], editing: number }) {
	return arg.tasks.map(task => renderTask(task, arg.editing)).join('\n');
}

function renderTask(task: item, editing: number) {
	var title = sanitize(task.title());
	var id = task.id();
	var checked = task.isCompleted() ? 'checked' : ''
	var liClass = taskClass(task, editing);
	return `<li class="${liClass}">
		    	<div class="view">
					<input class="toggle" type="checkbox" id="checkbox-${id}" ${checked}>
					<label id="task-label-${id}">${title}</label>
					<button id="button-destroy-${id}" class="destroy"></button>
				</div>
				<input id="input-title-${id}" class="edit" value="${title}" autocomplete="off">
			</li>`;
}

function sanitize(text: string) {
	return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

function taskClass(task: item, editing: number) {
	if (task.id() === editing) {
		return 'editing';
	}
	else if (task.isCompleted()) {
		return 'completed';
	}
	return '';
};

function setupEditingInput(editingId: number) {
	var input: any = document.getElementById('input-title-' + editingId)
	input.focus();
	input.addEventListener('blur', onBlur);
	input.addEventListener('keydown', onKeypress);

	function onBlur() {
		editTask(this.value);
	}

	function onKeypress(event: any) {
		if (event.keyCode == 27) {
			escapeEditing();
		}
		else if (event.keyCode === 13) {
			editTask(this.value);
		}
	}

	function editTask(text: string) {
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
};

function setupTasksEvents(tasks: item[]) {
	tasks.forEach(task => {
		var id = task.id();

		document.getElementById('checkbox-' + id).addEventListener('click', function() {
			check.impulse({ id: id, completed: this.checked });
		});

		document.getElementById('button-destroy-' + id).addEventListener('click', event => {
			del.impulse(id)
		});

		document.getElementById('task-label-' + id).addEventListener('dblclick', event => {
			editing.impulse(id)
		});
	});
};

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


// tasks.changes.visible.plugReceiver(changesReceiver());
// function changesReceiver() {
// 	var tasks: { id: number, s: string}[] = [];
// 	return function changesReceiver(changes: eevent<Change[]>) {
// 		if (!changes.happend) {
// 			return;
// 		}
// 		changes.value.forEach(applyChange);
// 		console.log(tasks.map(x => x.s));
// 	}

// 	function applyChange(c: Change) {
// 		if (c.type === 'append') {
// 			tasks.push(s(c));
// 		}
// 		else if (c.type === 'remove') {
// 			tasks = tasks.filter(t => t.id !== c.id);
// 		}
// 		else if (c.type === 'check') {
// 			tasks = tasks.map(t => t.id === c.id ? ss(c, t) : t)
// 		}
// 		else if (c.type === 'insert') {
// 			tasks.splice(c.index, 0, s(c));
// 		}
// 	}
// }

// function s(c: Change) {
// 	var ch = c.completed ? '✔ ' : '';
// 	return { id: c.id, s: ch + c.title };
// }

// function ss(c: Change, t: { id: number, s: string }) {
// 	var s = t.s.replace(/✔ /, '')
// 	var ch = c.completed ? '✔ ' : '';
// 	return { id: t.id, s: ch + s };
// }