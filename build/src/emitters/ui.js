exports.electric = require('../electric');
var utils = require('../receivers/utils');
function em(text) {
    return '*' + text + '*';
}
function fromEvent(target, type, useCapture, name) {
    if (useCapture === void 0) { useCapture = false; }
    if (name === void 0) { name = ''; }
    var e = exports.electric.emitter.manual(undefined);
    e.name = name || 'event: ' + type + ' on ' + em(target);
    var impulse = function (event) {
        e.impulse(event);
    };
    target.addEventListener(type, impulse, useCapture);
    e.setReleaseResources(function () { return target.removeEventListener(type, impulse, useCapture); });
    return e;
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
function fromCheckbox(nodeOrId) {
    var checkbox = utils.getNode(nodeOrId);
    return fromEvent(checkbox, 'checked of ' + em(nodeOrId)).map(function () { return checkbox.checked; });
}
exports.fromCheckbox = fromCheckbox;
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
    var e = (_a = exports.electric.transformator).map.apply(_a, [function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        return joinObjects(args);
    }].concat(emitters));
    e.name = 'state of checkboxes ' + em(nodeOrIds);
    return e;
    var _a;
}
exports.fromCheckboxes = fromCheckboxes;
;
function fromRadioGroup(nodesOrName) {
    var nodes = utils.getNodes(nodesOrName);
    var emitters = nodes.map(function (radio) { return fromEvent(radio, 'click').map(function (v) { return v ? radio.id : v; }); });
    var e = (_a = exports.electric.transformator).merge.apply(_a, emitters).hold();
    e.name = 'state of radio group ' + em(nodesOrName);
    return e;
    var _a;
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
    var emitters = ['down', 'up', 'over', 'out', 'move'].map(function (type) { return fromEvent(mouse, 'mouse' + type).map(function (e) { return (e ? { type: type, data: e } : e); }); });
    var e = (_a = exports.electric.transformator).merge.apply(_a, emitters).hold({ data: {} });
    e.name = 'mouse on ' + em(nodeOrId);
    return e;
    var _a;
}
exports.mouse = mouse;
;
