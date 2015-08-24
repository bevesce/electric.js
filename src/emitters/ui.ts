import inf = require('../interfaces');
import electric = require('../electric');
import utils = require('../receivers/utils');
import transformator = require('../transformator');
import eevent = require('../electric-event');


function em(text: any): string {
	return '*' + text + '*'
}

export function fromEvent(
	target: utils.Node,
	type: string,
	name = '',
	useCapture = false
) {
	var e = electric.emitter.manualEvent();
	e.name = name || 'event: ' + type + ' on ' + em(target);
	var impulse = function(event: any) {
		e.impulse(event);
	}
	target.addEventListener(type, impulse, useCapture);
	e.setReleaseResources(() => target.removeEventListener(type, impulse, useCapture));
	return e;
}

export function fromButton(nodeOrId: utils.NodeOrId) {
	var button = utils.getNode(nodeOrId);
	return fromEvent(button, 'click', 'button clicks on ' + em(nodeOrId));
}

export function fromInputText(nodeOrId: utils.NodeOrId, type = 'keyup') {
	var input = utils.getNode(nodeOrId);
	return fromEvent(input, 'keyup', 'text of ' + em(nodeOrId)).map(() => input.value);
}

export function fromCheckbox(nodeOrId: utils.NodeOrId) {
	var checkbox = utils.getNode(nodeOrId);
	var e = fromEvent(checkbox, 'click', 'checked of ' + em(nodeOrId));
	electric.receiver.collect(e);
	return e.map(() => checkbox.checked);
};

interface IKeyValue {
	key: string;
	value: any;
}

function joinObjects(objs: IKeyValue[]) {
	var o: {[key: string]: any} = {};
	objs.forEach((e) => {
		if (e === undefined) {
			return;
		}
		o[e.key] = e.value
	});
	return o;
}

export function fromCheckboxes(nodeOrIds: utils.NodeOrId[]) {
	var emitters = <inf.IEmitter<IKeyValue>[]>nodeOrIds.map(function(nodeOrId: utils.NodeOrId) {
		var checkbox = utils.getNode(nodeOrId);
		return fromEvent(checkbox, 'click').map(
			() => ({ key: checkbox.id, value: checkbox.checked })
		);
	});
	var e = transformator.mapMany(
		function(...args: any[]) { return joinObjects(args) },
		...emitters
	);
	e.name = 'state of checkboxes ' + em(nodeOrIds)
	return e;
};


export function fromRadioGroup(nodesOrName: utils.NodesOrName) {
	var nodes = utils.getNodes(nodesOrName);
	var emitters = nodes.map(
		radio => fromEvent(radio, 'click').map((v) => v.happend ? eevent.of(radio.id) : eevent.notHappend)
	);
	var e = transformator.hold('', transformator.merge(...emitters));
	e.name = 'state of radio group ' + em(nodesOrName);
	return e;
}

export function fromSelect(nodeOrId: utils.NodeOrId) {
	var select = utils.getNode(nodeOrId);
	return fromEvent(
		select, 'change', 'selected of ' + em(nodeOrId)
	).map(() => select.value);
};


export function mouse(nodeOrId: utils.NodeOrId): inf.IEmitter<eevent<{type: string, data: any}>> {
	var mouse = utils.getNode(nodeOrId);
	var emitters = ['down', 'up', 'over', 'out', 'move'].map(
		type => fromEvent(mouse, 'mouse' + type).map(
			(e: any) => (e.happend ? eevent.of({type: type, data: e.value}) : eevent.notHappend)
		)
	);
	var emitter = transformator.merge(...emitters);
	emitter.name = 'mouse on ' + em(nodeOrId);
	return emitter;
};
