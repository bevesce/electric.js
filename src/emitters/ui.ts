import electric = require('../electric');
import utils = require('../receivers/utils');
import transformator = require('../transformator');
import eevent = require('../electric-event');
import fp = require('../fp');
import shallowCopy = require('../utils/shallow-copy');
import keyCodes = require('../utils/key-codes')

type TargetOrId = EventTarget | string;
type TargetsOrName = EventTarget[] | string;

export function clicks<T>(targetOrId: TargetOrId, mapping?: (event: Event) => T) {
	return fromEvent({
		target: targetOrId,
		mapping: mapping,
		type: 'click',
		preventDefault: true
	});
}

export function key(name: string, type: string): electric.emitter.Emitter<electric.event<string>> {
	var keyCode = keyCodes[name];
	return fromEvent({
		target: document.body,
		mapping: (e: Event) => name,
		filter: (e: any) => e.keyCode === keyCode,
		type: 'key' + type,
		preventDefault: true,
		name: `key -${name}- ${type}`
	})
}

export function text(targetOrId: TargetOrId, type = 'keyup') {
	var input = getTargetById(targetOrId);
	return fromValue({
		target: input,
		mapping: (_: Event) => (<any>input).value,
		initialValue: '',
		type: 'keyup',
		name: `text of ${targetOrId}`
	});
}

export function enteredText(targetOrId: TargetOrId): electric.emitter.Emitter<eevent<string>> {
	var input = getTargetById(targetOrId);
	return fromEvent({
		target: input,
		filter: (e: any) => e.keyCode === 13,
		mapping: (_: Event) => (<any>input).value,
		type: 'keyup',
		name: `text entered into ${targetOrId}`
	});
}

export function checkbox(targetOrId: TargetOrId) {
	var checkbox = getTargetById(targetOrId);
	return fromValue({
		target: checkbox,
		type: 'click',
		initialValue: (<any>checkbox).checked,
		mapping: (_: Event) => (<any>checkbox).checked,
		name: `checbox ${targetOrId}`
	});
};

export function checkboxClicks(targetOrId: TargetOrId) {
	var checkbox = getTargetById(targetOrId);
	return fromEvent({
		target: checkbox,
		type: 'click',
		mapping: (_: Event) => (<any>checkbox).checked,
		name: `checbox ${targetOrId}`
	});
};

export function checkboxes(targetsOrName: TargetsOrName) {
	var targets = getTargetsByName(targetsOrName);
	var prevValue: { [id: string]: boolean } = {};
	targets.forEach((t: any) => prevValue[t.id] = t.checked);
	return fromValues({
		targetsOrName: targets,
		listener: (emitter: electric.emitter.ConcreteEmitter<{ [id: string]: boolean }>, target: any) => {
			return () => {
				prevValue[target.id] = target.checked;
				emitter.emit(shallowCopy(prevValue))
			};
		},
		name: `checkboxes ${targetsOrName}`,
		type: 'click',
		initialValue: prevValue
	});
}

export function radioGroup(targetsOrName: TargetsOrName) {
	var targets = getTargetsByName(targetsOrName);
	return fromValues({
		targetsOrName: targets,
		listener: (emitter: electric.emitter.ConcreteEmitter<string>, target: any) => {
			return () => emitter.emit(target.id)
		},
		name: `radio group ${targetsOrName}`,
		type: 'click',
		initialValue: (<any>targets.filter((t: any) => t.checked)[0]).id
	});
}

export function select(targetOrId: TargetOrId) {
	var select = getTargetById(targetOrId);
	return fromValue({
		target: select,
		name: `select ${targetOrId}`,
		mapping: () => (<any>select).value,
		type: 'change',
		initialValue: (<any>select).value
	})
};

export function mouseXY(targetOrId: TargetOrId): electric.emitter.Emitter<{ x: number, y: number }> {
	return fromValue({
		type: 'mousemove',
		target: targetOrId,
		initialValue: {x: undefined, y: undefined},
		name: 'mouse position',
		mapping: (e: any) => ({ x: e.offsetX, y: e.offsetY })
	})
}

export function mouseDown(
	targetOrId: TargetOrId
): electric.emitter.Emitter<electric.event<{ x: number, y: number }>> {
	return fromEvent({
		type: 'mousedown',
		target: targetOrId,
		mapping: (e: any) => ({ x: e.offsetX, y: e.offsetY })
	})
}

export function mouseUp(
	targetOrId: TargetOrId
): electric.emitter.Emitter<electric.event<{ x: number, y: number }>> {
	return fromEvent({
		type: 'mouseup',
		target: targetOrId,
		mapping: (e: any) => ({ x: e.offsetX, y: e.offsetY })
	})
}

var hashEmitter: any = null;

export function hash(): electric.emitter.Emitter<string> {
	if (!hashEmitter) {
		hashEmitter = fromValue({
			type: 'hashchange',
			name: 'window.location.hash',
			target: <any>window,
			mapping: () => window.location.hash,
			initialValue: window.location.hash
		});
	}
	return hashEmitter;
}


export function fromEvent<T>(options: {
	name?: string,
	target: EventTarget | string,
	type: string,
	filter?: (event: Event) => boolean,
	mapping: (event: Event) => T,
	useCapture?: boolean
}): electric.emitter.Emitter<electric.event<T>>;
export function fromEvent<T>(options: {
	name?: string,
	target: (EventTarget | string),
	type: string,
	filter?: (event: Event) => boolean,
	useCapture?: boolean
}): electric.emitter.Emitter<electric.event<Event>>;
export function fromEvent<T>(options: {
	name?: string,
	target: (EventTarget | string),
	type: string,
	filter?: (event: Event) => boolean,
	mapping?: (event: Event) => T,
	useCapture?: boolean
}): electric.emitter.Emitter<electric.event<Event | T>> {
	var useCapture = options.useCapture === true ? true : false;
	var emitter = <electric.emitter.Emitter<electric.event<T | Event>>><any>electric.emitter.manualEvent();
	var target = getTargetById(options.target);
	emitter.name = options.name || `${options.type} on ${options.target}`
	var impulse = emitOrImpluse(emitter, options);
	target.addEventListener(options.type, impulse, useCapture);
	emitter.setReleaseResources(() =>
		target.removeEventListener(options.type, impulse, useCapture)
	);
	return emitter;
}

export function fromValue<T>(options: {
	name?: string,
	target: EventTarget | string,
	type: string,
	filter?: (event: Event) => boolean,
	mapping: (event: Event) => T,
	initialValue: T,
	preventDefault?: boolean,
	useCapture?: boolean
}): electric.emitter.Emitter<T>;
export function fromValue<T>(options: {
	name?: string,
	target: (EventTarget | string),
	type: string,
	filter?: (event: Event) => boolean,
	initialValue: Event,
	preventDefault?: boolean,
	useCapture?: boolean
}): electric.emitter.Emitter<Event>;
export function fromValue<T>(options: {
	name?: string,
	target: (EventTarget | string),
	type: string,
	filter?: (event: Event) => boolean,
	mapping?: (event: Event) => T,
	initialValue: Event | T,
	preventDefault?: boolean,
	useCapture?: boolean
}): electric.emitter.Emitter<Event | T> {
	var useCapture = options.useCapture === true ? true : false;
	var emitter = <electric.emitter.Emitter<T | Event>><any>electric.emitter.manual(
		options.initialValue
	);
	var target = getTargetById(options.target);
	emitter.name = options.name || `${options.type} on ${options.target}`
	var emit = emitOrImpluse(emitter, options, false);
	target.addEventListener(options.type, emit, useCapture);
	emitter.setReleaseResources(() =>
		target.removeEventListener(options.type, emit, useCapture)
	);
	return emitter;
}

export function fromValues<T>(options: {
	targetsOrName: TargetsOrName,
	listener: (emitter: electric.emitter.Emitter<T>, target: EventTarget) => void,
	initialValue: T,
	name?: string,
	type: string
}) {
	var targets = getTargetsByName(options.targetsOrName);
	var emitter = electric.emitter.manual(options.initialValue);
	var listeners: any[] = [];
	targets.forEach((t: any) => {
		listeners.push(options.listener(emitter, t))
		t.addEventListener(options.type, listeners[listeners.length - 1]);
	});
	emitter.name = options.name || `${options.type} ${options.targetsOrName}`;
	emitter.setReleaseResources(() => {
		targets.forEach((t, i) => {
			t.removeEventListener(options.type, listeners[i])
		});
	});
	return emitter;
}

// some event can fire with high frequency
// so here we ensure that all the checks of
// provided options are calculated only at creation
// ugly code
function emitOrImpluse<T>(emitter: any, options: {
	filter?: (event: Event) => boolean,
	mapping?: (event: Event) => T,
	preventDefault?: boolean
}, impulse = true) {
	var filter = options.filter;
	var mapping = options.mapping;
	var preventDefault = options.preventDefault;
	if (filter && mapping && impulse && preventDefault) {
		return function(event: Event) {
			if (filter(event)) {
				emitter.impulse(mapping(event))
			}
		}
	}
	else if (filter && mapping && impulse) {
		return function(event: Event) {
			if (filter(event)) {
				emitter.impulse(mapping(event))
			}
		}
	}
	else if (filter && impulse && preventDefault) {
		return function(event: Event) {
			event.preventDefault();
			if (filter(event)) {
				emitter.impulse(event)
			}
		}
	}
	else if (filter && impulse) {
		return function(event: Event) {
			if (filter(event)) {
				emitter.impulse(event)
			}
		}
	}
	else if (mapping && impulse && preventDefault) {
		return function(event: Event) {
			event.preventDefault();
			emitter.impulse(mapping(event))
		}
	}
	else if (mapping && impulse) {
		return function(event: Event) {
			emitter.impulse(mapping(event))
		}
	}
	else if (filter && mapping && preventDefault) {
		return function(event: Event) {
			event.preventDefault();
			if (filter(event)) {
				emitter.emit(mapping(event))
			}
		}
	}
	else if (filter && mapping) {
		return function(event: Event) {
			if (filter(event)) {
				emitter.emit(mapping(event))
			}
		}
	}
	else if (filter && preventDefault) {
		return function(event: Event) {
			event.preventDefault();
			if (filter(event)) {
				emitter.emit(event)
			}
		}
	}
	else if (filter) {
		return function(event: Event) {
			if (filter(event)) {
				emitter.emit(event)
			}
		}
	}
	else if (mapping && preventDefault) {
		return function(event: Event) {
			event.preventDefault();
			emitter.emit(mapping(event))
		}
	}
	else if (mapping) {
		return function(event: Event) {
			emitter.emit(mapping(event))
		}
	}
	else if (preventDefault) {
		return function(event: Event) {
			event.preventDefault();
			emitter.impulse(event)
		}
	}
	else {
		return function(event: Event) {
			emitter.impulse(event)
		}
	}
}

function getTargetById(t: string | EventTarget): EventTarget {
	if (typeof t === 'string') {
		return document.getElementById(t);
	}
	return <EventTarget>t;
}

function getTargetsByName(t: string | EventTarget[]): EventTarget[] {
	if (typeof t === 'string') {
		return Array.prototype.slice.apply(document.getElementsByName(t));
	}
	return <EventTarget[]>t;
}


