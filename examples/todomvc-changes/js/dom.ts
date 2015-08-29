interface Attrs {
	[name: string]: string
}

export function element(tag: string, attributes: Attrs) {
	var result = document.createElement(tag)
	for (var name in attributes) {
		if (!attributes.hasOwnProperty(name)) {
			continue;
		}
		result.setAttribute(name, attributes[name]);
	}
	return result;
}

function curryTag(tag: string) {
	return function(attributes?: Attrs) {
		return element(tag, attributes || {});
	}
}

export var div = curryTag('div');
export var label = curryTag('label');
export var li = curryTag('li');
export var button = curryTag('button');
export var input = curryTag('input');

export function checkbox(attributes: Attrs) {
	attributes['type'] = 'checkbox';
	return element('input', attributes);
}

export function text(txt: string) {
	return document.createTextNode(txt);
}
