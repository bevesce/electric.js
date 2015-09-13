var dom = require('./dom');
var Change = require('./change');
var check;
var del;
var editing;
var retitle;
var list = document.getElementById('todo-list');
var listItemById = {};
var labelById = {};
var inputById = {};
function changesRendererReceiver(del_, retitle_, editing_, check_) {
    var renderedInitial = false;
    var previousEditingId;
    del = del_;
    retitle = retitle_;
    editing = editing_;
    check = check_;
    return function renderChanges(arg) {
        var tasks = arg.tasks;
        var editingId = arg.editingId;
        var changes = arg.changes.value;
        if (!renderedInitial) {
            changes = tasks.map(Change.appendTask);
            renderedInitial = true;
        }
        if (changes && changes.length > 0) {
            changes.forEach(function (c) { return renderChange(c); });
        }
        if (editingId != previousEditingId) {
            prepareEditing(editingId, previousEditingId);
            previousEditingId = editingId;
        }
    };
}
function renderChange(change) {
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
function renderAppend(change) {
    var listItem = createListItem(change);
    list.appendChild(listItem);
}
function createListItem(change) {
    var li = dom.li({ class: change.completed ? 'completed' : '' });
    var div = dom.div({ class: 'view' });
    li.appendChild(div);
    var checkbox = dom.checkbox({ class: 'toggle' });
    if (change.completed) {
        checkbox.setAttribute('checked', 'true');
    }
    on(checkbox, 'click', check.impulse, function () { return ({ id: change.id, completed: checkbox.checked }); });
    div.appendChild(checkbox);
    var label = dom.label();
    var text = dom.text(change.title);
    label.appendChild(text);
    labelById[change.id] = label;
    on(label, 'dblclick', editing.impulse, function () { return change.id; });
    div.appendChild(label);
    var button = dom.button({ class: 'destroy' });
    on(button, 'click', del.impulse, function () { return change.id; });
    div.appendChild(button);
    var input = dom.input({ class: 'edit', value: change.title, autocomplete: 'off' });
    li.appendChild(input);
    inputById[change.id] = input;
    listItemById[change.id] = li;
    return li;
}
function on(target, eventType, call, withArg) {
    target.addEventListener(eventType, function () {
        call(withArg());
    });
}
function renderRemove(change) {
    var elemtent = listItemById[change.id];
    if (elemtent) {
        elemtent.remove();
        listItemById[change.id] = null;
        labelById[change.id] = null;
        inputById[change.id] = null;
    }
}
function renderCheck(change) {
    var elemtent = listItemById[change.id];
    if (elemtent && change.completed) {
        elemtent.className += ' completed';
    }
    else if (elemtent) {
        removeClass(elemtent, 'completed');
    }
}
function removeClass(element, className) {
    element.className = element.className.replace(new RegExp(className, 'g'), '');
}
function renderRetitle(change) {
    var label = labelById[change.id];
    if (label) {
        label.replaceChild(dom.text(change.title), label.firstChild);
        inputById[change.id].setAttribute('value', change.title);
    }
}
function renderInsert(change) {
    var listItem = createListItem(change);
    list.insertBefore(listItem, list.children[change.index]);
    listItemById[change.id] = listItem;
}
function prepareEditing(editingId, previousEditingId) {
    var input;
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
    var startValue = input.value;
    function onBlur() {
        removeListeners();
        editTask(this.value);
    }
    function onKeypress(event) {
        if (event.keyCode == 27) {
            removeListeners();
            escapeEditing(this);
        }
        else if (event.keyCode === 13) {
            removeListeners();
            editTask(this.value);
        }
    }
    function editTask(text) {
        if (text === '') {
            del.impulse(editingId);
        }
        else {
            retitle.impulse({ id: editingId, title: text });
        }
    }
    function escapeEditing(that) {
        that.value = startValue;
        editing.impulse(undefined);
    }
    function removeListeners() {
        input.removeEventListener('blur', onBlur);
        input.removeEventListener('keydown', onKeypress);
    }
}
module.exports = changesRendererReceiver;
