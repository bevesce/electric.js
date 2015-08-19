import electric = require('../../src/electric');
import vdom = require('virtual-dom');
import virtualDomReceiver = require('../../src/receivers/virtual-dom');


var h = vdom.h;
var diff = vdom.diff;
var patch = vdom.patch
var createElement = vdom.create;


function renderTime(count) {
    return h('h1', {className: 'test'}, [count]);
}

function renderList(list) {
	return h(
		'ul', {},
		list.map(function(item) {
			return h('li', {key: item}, [item])
		})
	);
}

function renderApp(time, list) {
	return h(
		'div', {},
		[time, list]
	)
}

function append(list, item) {
	var list = list.slice();
	list.push(item);
	return list;
}

time = electric.clock.clock({intervalInMs: 1000})
	.map(renderTime);

list = electric.clock.clock({intervalInMs: 1000})
	.accumulate([], append)
	.map(renderList);

electric.transformator
	.map(renderApp, time, list)
	.plugReceiver(
		virtualDomReceiver(document.body)
	);

