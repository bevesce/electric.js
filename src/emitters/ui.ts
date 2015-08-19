export import electric = require('../electric');
import utils = require('../receivers/utils');


interface AddEventListenerFunction {
	(type: string, listener: (event: any) => void, useCapture?: boolean): void
}

function em(text: any): string {
	return '*' + text + '*'
}

export function fromEvent(
	target: { addEventListener: AddEventListenerFunction, removeEventListener: AddEventListenerFunction },
	type: string, useCapture = false,
	name = ''
) {
	var e = electric.emitter.manual(undefined);
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
	return fromEvent(checkbox, 'checked of ' + em(nodeOrId)).map(() => checkbox.checked);
};

function joinObjects(objs) {
	var o = {};
	objs.forEach((e) => {
		if (e === undefined) {
			return;
		}
		o[e.key] = e.value
	});
	return o;
}

export function fromCheckboxes(nodeOrIds: utils.NodeOrId[]) {
	var emitters = nodeOrIds.map(function(nodeOrId: uitls.NodeOrId){
		var checkbox = utils.getNode(nodeOrId);
		return fromEvent(checkbox, 'click').map(
			() => ({ key: checkbox.id, value: checkbox.checked })
		);
	});
	var e = electric.transformator.map(
		function(...args) { return joinObjects(args) },
		...emitters
	);
	e.name = 'state of checkboxes ' + em(nodeOrIds)
	return e;
};


export function fromRadioGroup(nodesOrName: utils.NodesOrName) {
	var nodes = utils.getNodes(nodesOrName);
	var emitters = nodes.map(
		radio => fromEvent(radio, 'click').map((v) => v ? radio.id : v)
	);
	var e = electric.transformator.merge(...emitters).hold();
	e.name = 'state of radio group ' + em(nodesOrName);
	return e;
}

export function fromSelect(nodeOrId: utils.NodeOrId) {
	var select = utils.getNode(nodeOrId);
	return fromEvent(
		select, 'change', 'selected of ' + em(nodeOrId)
	).map(() => select.value);
};


export function mouse(nodeOrId: utils.NodeOrId) {
	var mouse = utils.getNode(nodeOrId);
	var emitters = ['down', 'up', 'over', 'out', 'move'].map(
		type => fromEvent(mouse, 'mouse' + type).map(
			e => (e ? {type: type, data: e} : e)
		)
	);
	var e = electric.transformator.merge(...emitters).hold({data: {}});
	e.name = 'mouse on ' + em(nodeOrId);
	return e;
};
