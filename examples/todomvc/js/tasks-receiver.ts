import item = require('./item');
import rui = require('../../../src/receivers/ui');
import electric = require('../../../src/electric');

export = tasksRendererReceiver;

var check: electric.emitter.ManualEventEmitter<{ id: number, completed: boolean }>;
var del: electric.emitter.ManualEventEmitter<number>;
var editing: electric.emitter.ManualEventEmitter<number>;
var retitle: electric.emitter.ManualEventEmitter<{ id: number, title: string }>;

function tasksRendererReceiver(del_: any, retitle_: any, editing_: any, check_: any) {
	del = del_;
	retitle = retitle_;
	editing = editing_;
	check = check_;
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

