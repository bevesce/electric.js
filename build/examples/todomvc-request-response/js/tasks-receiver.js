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
