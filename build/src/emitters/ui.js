var electric = require('../electric');
var utils = require('../receivers/utils');
var transformator = require('../transformator');
var eevent = require('../electric-event');
var fp = require('../fp');
var keyCodes = {
    up: 38,
    down: 40,
    left: 37,
    right: 39,
    w: 87,
    a: 65,
    s: 83,
    d: 68,
    enter: 13
};
// NEW
function clicks(nodeOrId, mapping) {
    if (mapping === void 0) { mapping = fp.identity; }
    var button = utils.getNode(nodeOrId);
    var emitter = electric.emitter.manualEvent();
    function emitterListener(event) {
        emitter.impulse(mapping(event));
    }
    button.addEventListener('click', emitterListener, false);
    emitter.setReleaseResources(function () { return button.removeEventListener('click', emitterListener); });
    emitter.name = '| clicks on ' + nodeOrId + ' |>';
    return emitter;
}
exports.clicks = clicks;
function arrows(layout, nodeOrId, type) {
    if (layout === void 0) { layout = 'arrows'; }
    if (nodeOrId === void 0) { nodeOrId = document; }
    if (type === void 0) { type = 'keydown'; }
    var layouts = {
        'arrows': {
            38: 'up', 40: 'down', 37: 'left', 39: 'right'
        },
        'wasd': {
            87: 'up', 83: 'down', 65: 'left', 68: 'right'
        },
        'hjkl': {
            75: 'up', 74: 'down', 72: 'left', 76: 'right'
        },
        'ijkl': {
            73: 'up', 75: 'down', 74: 'left', 76: 'right'
        }
    };
    var keyCodes = layouts[layout];
    var target = utils.getNode(nodeOrId);
    var emitter = electric.emitter.manualEvent();
    function emitterListener(event) {
        var direction = keyCodes[event.keyCode];
        if (direction) {
            event.preventDefault();
            emitter.impulse(direction);
        }
    }
    target.addEventListener(type, emitterListener);
    emitter.name = '| arrows |>';
    return emitter;
}
exports.arrows = arrows;
function key(name, type, nodeOrId) {
    if (nodeOrId === void 0) { nodeOrId = document; }
    var target = utils.getNode(nodeOrId);
    var emitter = electric.emitter.manualEvent();
    var keyCode = keyCodes[name];
    function emitterListener(event) {
        if (event.keyCode === keyCode) {
            event.preventDefault();
            emitter.impulse(name);
        }
    }
    target.addEventListener('key' + type, emitterListener);
    emitter.name = '| key ' + name + ' on ' + type + ' |>';
    return emitter;
}
exports.key = key;
// OLD
function em(text) {
    return '`' + text + '`';
}
function fromEvent(target, type, name, useCapture) {
    if (name === void 0) { name = ''; }
    if (useCapture === void 0) { useCapture = false; }
    var emitter = electric.emitter.manualEvent();
    emitter.name = name || '| event: ' + type + ' on ' + em(target) + '|>';
    var impulse = function (event) {
        // event.preventDefault();
        emitter.impulse(event);
    };
    target.addEventListener(type, impulse, useCapture);
    emitter.setReleaseResources(function () { return target.removeEventListener(type, impulse, useCapture); });
    return emitter;
}
exports.fromEvent = fromEvent;
function fromButton(nodeOrId) {
    var button = utils.getNode(nodeOrId);
    return fromEvent(button, 'click', 'button clicks on ' + em(nodeOrId));
}
exports.fromButton = fromButton;
function fromInputText(nodeOrId, type) {
    if (type === void 0) { type = 'keyup'; }
    var input = utils.getNode(nodeOrId);
    return fromEvent(input, 'keyup', 'text of ' + em(nodeOrId)).map(function () { return input.value; });
}
exports.fromInputText = fromInputText;
function fromInputTextEnter(nodeOrId) {
    var input = utils.getNode(nodeOrId);
    var e = electric.emitter.manualEvent();
    e.name = '| enter on ' + em(nodeOrId) + ' |>';
    var impulse = function (event) {
        if (event.keyCode === 13) {
            e.impulse(input.value);
        }
    };
    input.addEventListener('keydown', impulse, false);
    e.setReleaseResources(function () { return input.removeEventListener('keydown', impulse, false); });
    return e;
}
exports.fromInputTextEnter = fromInputTextEnter;
function fromCheckbox(nodeOrId) {
    var checkbox = utils.getNode(nodeOrId);
    var e = fromEvent(checkbox, 'click', 'checked of ' + em(nodeOrId));
    return e.map(function () { return checkbox.checked; });
}
exports.fromCheckbox = fromCheckbox;
;
function fromCheckboxEvent(nodeOrId) {
    var checkbox = utils.getNode(nodeOrId);
    var e = electric.emitter.manualEvent();
    e.name = '| click on checkbox ' + nodeOrId + ' |>';
    var impulse = function (event) {
        e.impulse(checkbox.checked);
    };
    checkbox.addEventListener('click', impulse, false);
    e.setReleaseResources(function () { return checkbox.removeEventListener('click', impulse, false); });
    return e;
}
exports.fromCheckboxEvent = fromCheckboxEvent;
;
function joinObjects(objs) {
    var o = {};
    objs.forEach(function (e) {
        if (e === undefined) {
            return;
        }
        o[e.key] = e.value;
    });
    return o;
}
function fromCheckboxes(nodeOrIds) {
    var emitters = nodeOrIds.map(function (nodeOrId) {
        var checkbox = utils.getNode(nodeOrId);
        return fromEvent(checkbox, 'click').map(function () { return ({ key: checkbox.id, value: checkbox.checked }); });
    });
    var e = transformator.mapMany.apply(transformator, [function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        return joinObjects(args);
    }].concat(emitters));
    e.name = 'state of checkboxes ' + em(nodeOrIds);
    return e;
}
exports.fromCheckboxes = fromCheckboxes;
;
function fromRadioGroup(nodesOrName) {
    var nodes = utils.getNodes(nodesOrName);
    var emitters = nodes.map(function (radio) { return fromEvent(radio, 'click').map(function (v) { return v.happend ? eevent.of(radio.id) : eevent.notHappend; }); });
    var e = transformator.hold('', transformator.merge.apply(transformator, emitters));
    e.name = 'state of radio group ' + em(nodesOrName);
    return e;
}
exports.fromRadioGroup = fromRadioGroup;
function fromSelect(nodeOrId) {
    var select = utils.getNode(nodeOrId);
    return fromEvent(select, 'change', 'selected of ' + em(nodeOrId)).map(function () { return select.value; });
}
exports.fromSelect = fromSelect;
;
function mouse(nodeOrId) {
    var mouse = utils.getNode(nodeOrId);
    var emitters = ['down', 'up', 'over', 'out', 'move'].map(function (type) { return fromEvent(mouse, 'mouse' + type).map(function (e) { return (e.happend ? eevent.of({ type: type, data: e.value }) : eevent.notHappend); }); });
    var emitter = transformator.merge.apply(transformator, emitters);
    emitter.name = '| mouse on ' + em(nodeOrId) + ' |>';
    return emitter;
}
exports.mouse = mouse;
;
var hashEmitter = null;
function hash() {
    if (!hashEmitter) {
        hashEmitter = electric.emitter.manual(window.location.hash);
        hashEmitter.name = '| window.location.hash |>';
        window.addEventListener('hashchange', function () {
            hashEmitter.emit(window.location.hash);
        });
    }
    return hashEmitter;
}
exports.hash = hash;
function enter(nodeOrId) {
    var target = utils.getNode(nodeOrId);
    var e = electric.emitter.manualEvent();
    e.name = '| enter on ' + em(nodeOrId) + ' |>';
    var impulse = function (event) {
        if (event.keyCode === 13) {
            e.impulse(null);
        }
    };
    target.addEventListener('keydown', impulse, false);
    e.setReleaseResources(function () { return target.removeEventListener('keydown', impulse, false); });
    return e;
}
exports.enter = enter;
