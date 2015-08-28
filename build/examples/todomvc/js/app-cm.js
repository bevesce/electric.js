var electric = require('../../../src/electric');
var rui = require('../../../src/receivers/ui');
var eui = require('../../../src/emitters/ui');
var tasksDevice = require('./tasks-device');
var storage = require('./storage');
// Emitters
var hash = eui.hash();
var newTask = eui.fromInputTextEnter('new-task');
var clear = eui.fromButton('clear-button');
var check = electric.emitter.manualEvent();
var del = electric.emitter.manualEvent();
var toggle = eui.fromCheckboxEvent('toggle');
var editing = electric.emitter.manualEvent();
var retitle = electric.emitter.manualEvent();
retitle.name = '| retitle |>';
var editingId = electric.emitter.constant(undefined).change({ to: function (_, k) { return electric.emitter.constant(k); }, when: editing }, { to: electric.emitter.constant(undefined), when: retitle }, { to: electric.emitter.constant(undefined), when: del });
// Transformators
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
tasks.all.plugReceiver(storage.tasksReceiver);
electric.transformator.map(function (ts, editing) { return ({ tasks: ts, editing: editing }); }, tasks.visible, editingId).plugReceiver(tasksRendererReceiver());
function tasksRendererReceiver() {
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
