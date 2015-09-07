import inf = require('../interfaces');
import electric = require('../electric');
import utils = require('../receivers/utils');
import transformator = require('../transformator');
import eevent = require('../electric-event');
import fp = require('../fp');


var keyCodes: { [name: string]: number } = {
	up: 38,
	down: 40,
	left: 37,
	right: 39,
	w: 87,
	a: 65,
	s: 83,
	d: 68,
	enter: 13,
	space: 32
}


// NEW
export function clicks<T>(nodeOrId: utils.NodeOrId, mapping: (event: Event) => T = fp.identity) {
	var button = utils.getNode(nodeOrId);
	var emitter = electric.emitter.manualEvent();
	function emitterListener(event: Event) {
		emitter.impulse(mapping(event))
	}
	button.addEventListener('click', emitterListener, false);
	emitter.setReleaseResources(() => button.removeEventListener('click', emitterListener));
	emitter.name = 'clicks on ' + nodeOrId;
	return emitter;
}

export function arrows(
	layout = 'arrows', nodeOrId: utils.NodeOrId = document, type = 'keydown'
): inf.IEmitter<eevent<string>> {
	var layouts: { [name: string]: { [keyCode: number]: string }} = {
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
	}
	var keyCodes = layouts[layout];
	var target = utils.getNode(nodeOrId);
	var emitter = <electric.emitter.EventEmitter<string>>electric.emitter.manualEvent();
	function emitterListener(event: any) {
		var direction = keyCodes[event.keyCode];
		if (direction) {
			event.preventDefault();
			emitter.impulse(direction);
		}
	}
	target.addEventListener(type, emitterListener);
	emitter.name = 'arrows';
	return emitter;
}

export function key(name: string, type: string, nodeOrId: utils.NodeOrId = document) {
	var target = utils.getNode(nodeOrId);
	var emitter = <electric.emitter.EventEmitter<string>>electric.emitter.manualEvent();
	var keyCode = keyCodes[name];
	function emitterListener(event: any) {
		if (event.keyCode === keyCode) {
			event.preventDefault();
			emitter.impulse(name);
		}
	}
	target.addEventListener('key' + type, emitterListener);
	emitter.name = `key "${name}" ${type}`;
	return emitter;
}


// OLD

function em(text: any): string {
	return '`' + text + '`'
}

export function fromEvent(
	target: utils.Node,
	type: string,
	name = '',
	useCapture = false
) {
	var emitter = electric.emitter.manualEvent();
	emitter.name = name || '| event: ' + type + ' on ' + em(target) + '|>';
	var impulse = function(event: any) {
		// event.preventDefault();
		emitter.impulse(event);
	}
	target.addEventListener(type, impulse, useCapture);
	emitter.setReleaseResources(() => target.removeEventListener(type, impulse, useCapture));
	return emitter;
}

export function fromButton(nodeOrId: utils.NodeOrId) {
	var button = utils.getNode(nodeOrId);
	return fromEvent(button, 'click', 'button clicks on ' + em(nodeOrId));
}

export function fromInputText(nodeOrId: utils.NodeOrId, type = 'keyup') {
	var input = utils.getNode(nodeOrId);
	return fromEvent(input, 'keyup', 'text of ' + em(nodeOrId)).map(() => input.value);
}

export function fromInputTextEnter(nodeOrId: utils.NodeOrId): inf.IEmitter<eevent<string>> {
	var input = utils.getNode(nodeOrId);
	var e = <electric.emitter.EventEmitter<string>>electric.emitter.manualEvent();
	e.name = '| enter on ' + em(nodeOrId) + ' |>';
	var impulse = function(event: any) {
		if (event.keyCode === 13) {
			e.impulse(<string>input.value);
		}
	}
	input.addEventListener('keydown', impulse, false);
	e.setReleaseResources(() => input.removeEventListener('keydown', impulse, false));
	return e;
}

export function fromCheckbox(nodeOrId: utils.NodeOrId) {
	var checkbox = utils.getNode(nodeOrId);
	var e = fromEvent(checkbox, 'click', 'checked of ' + em(nodeOrId));
	return e.map(() => checkbox.checked);
};

export function fromCheckboxEvent(nodeOrId: utils.NodeOrId): inf.IEmitter<eevent<boolean>> {
	var checkbox = utils.getNode(nodeOrId);
	var e = <electric.emitter.EventEmitter<boolean>>electric.emitter.manualEvent();
	e.name = '| click on checkbox ' + nodeOrId + ' |>';
	var impulse = function(event: any) {
		e.impulse(checkbox.checked);
	}
	checkbox.addEventListener('click', impulse, false);
	e.setReleaseResources(() => checkbox.removeEventListener('click', impulse, false));
	return e;
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
	emitter.name = '| mouse on ' + em(nodeOrId) + ' |>';
	return emitter;
};


var hashEmitter: any = null;

export function hash(): inf.IEmitter<string> {
	if (!hashEmitter) {
		hashEmitter = electric.emitter.manual(window.location.hash);
		hashEmitter.name = '| window.location.hash |>';
		window.addEventListener('hashchange', () => {
			hashEmitter.emit(window.location.hash);
		});
	}
	return hashEmitter;
}

export function enter(nodeOrId: utils.NodeOrId): inf.IEmitter<eevent<any>> {
	var target = utils.getNode(nodeOrId);
	var e = electric.emitter.manualEvent();
	e.name = '| enter on ' + em(nodeOrId) + ' |>';
	var impulse = function(event: any) {
		if (event.keyCode === 13) {
			e.impulse(null);
		}
	}
	target.addEventListener('keydown', impulse, false);
	e.setReleaseResources(() => target.removeEventListener('keydown', impulse, false));
	return e;
}
