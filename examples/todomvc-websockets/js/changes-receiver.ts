import electric = require('../../../src/electric');
import dom = require('./dom');
import item = require('./item');
import Change = require('./change');
import eevent = require('../../../src/electric-event');

export = changesRendererReceiver;

var check: electric.emitter.EventEmitter<{ id: number, completed: boolean }>;
var del: electric.emitter.EventEmitter<number>;
var editing: electric.emitter.EventEmitter<number>;
var retitle: electric.emitter.EventEmitter<{ id: number, title: string }>;

var list = document.getElementById('todo-list');
var listItemById: { [id: number]: HTMLElement } = {};
var labelById: { [id: number]: HTMLElement } = {};
var inputById: { [id: number]: HTMLElement } = {};
var checkboxById: { [id: number]: HTMLElement } = {};


function changesRendererReceiver(del_: any, retitle_: any, editing_: any, check_: any) {
	var renderedInitial = false;
	var previousEditingId: number;
	del = del_;
	retitle = retitle_;
	editing = editing_;
	check = check_;

	return function renderChanges(arg: { tasks: item[], editingId: number, changes: eevent<Change[]> }) {
		var tasks = arg.tasks;
		var editingId = arg.editingId;
		var changes = arg.changes.value;

		if (!renderedInitial) {
			changes = tasks.map(Change.appendTask);
			renderedInitial = true;
		}
		if (changes && changes.length > 0) {
			changes.forEach(c => renderChange(c));
		}
		if (editingId != previousEditingId) {
			prepareEditing(editingId, previousEditingId);
			previousEditingId = editingId;
		}
	}
}

function renderChange(change: Change) {
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

function renderAppend(change: Change) {
	var listItem = createListItem(change);
	list.appendChild(listItem);
}

function createListItem(change: Change) {
	var li = dom.li({ class: change.completed ? 'completed' : '' });
	var div = dom.div({ class: 'view' });
	li.appendChild(div);
	var checkbox = dom.checkbox({ class: 'toggle' });
	if (change.completed) {
		checkbox.setAttribute('checked', 'true');
	}
	on(checkbox, 'click', check.impulse, () => ({ id: change.id, completed: (<any>checkbox).checked }));
	div.appendChild(checkbox);
	checkboxById[change.id] = checkbox;
	var label = dom.label();
	var text = dom.text(change.title);
	label.appendChild(text);
	labelById[change.id] = label;
	on(label, 'dblclick', editing.impulse, () => change.id);
	div.appendChild(label);
	var button = dom.button({ class: 'destroy' });
	on(button, 'click', del.impulse, () => change.id);
	div.appendChild(button);
	var input = dom.input({ class: 'edit', value: change.title, autocomplete: 'off' });
	li.appendChild(input);
	inputById[change.id] = input;
	listItemById[change.id] = li;
	return li;
}


function on<T>(target: Element, eventType: string, call: (v: T) => void, withArg: () => T) {
	target.addEventListener(eventType, () => {
		call(withArg());
	});
}

function renderRemove(change: Change) {
	var elemtent = listItemById[change.id];
	if (elemtent) {
		elemtent.remove();
		listItemById[change.id] = null;
		labelById[change.id] = null;
		inputById[change.id] = null;
		checkboxById[change.id] = null;
	}
}

function renderCheck(change: Change) {
	console.log('REDNE', change);
	var elemtent = listItemById[change.id];
	if (elemtent && change.completed) {
		elemtent.className += ' completed';
		(<any>checkboxById[change.id]).checked = true;
	}
	else if (elemtent) {
		removeClass(elemtent, 'completed');
		(<any>checkboxById[change.id]).checked = false;
	}
}

function removeClass(element: HTMLElement, className: string) {
	element.className = element.className.replace(new RegExp(className, 'g'), '');
}

function renderRetitle(change: Change) {
	var label = labelById[change.id];
	if (label) {
		label.replaceChild(
			dom.text(change.title),
			label.firstChild
		);
		inputById[change.id].setAttribute('value', change.title);
	}
}

function renderInsert(change: Change) {
	var listItem = createListItem(change);
	list.insertBefore(listItem, list.children[change.index]);
	listItemById[change.id] = listItem;
}

function prepareEditing(editingId: number, previousEditingId: number) {
	var input: HTMLElement;
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
	var startValue = (<any>input).value;

	function onBlur() {
		removeListeners();
		editTask(this.value);
	}

	function onKeypress(event: any) {
		if (event.keyCode == 27) {
			removeListeners();
			escapeEditing(this);
		}
		else if (event.keyCode === 13) {
			removeListeners();
			editTask(this.value);
		}
	}

	function editTask(text: string) {
		if (text === '') {
			del.impulse(editingId);
		}
		else {
			retitle.impulse({ id: editingId, title: text });
		}
	}

	function escapeEditing(that: any) {
		that.value = startValue;
		editing.impulse(undefined);
	}

	function removeListeners() {
		input.removeEventListener('blur', onBlur);
		input.removeEventListener('keydown', onKeypress);
	}
}
