/// <reference path="../../d/viertual-dom.d.ts" />
import electric = require('../../src/electric');
import vdom = require('virtual-dom');
import virtualDomReceiver = require('../../src/receivers/virtual-dom-receiver');


var h = vdom.h;
var diff = vdom.diff;
var patch = vdom.patch
var createElement = vdom.create;


function renderTime(count: any) {
    return h('h1', { className: 'test' }, [count]);
}

function renderList(list: any[]) {
	return h(
		'ul', {},
		list.map(function(item) {
			return h('li', {key: item}, [item])
		})
	);
}

function renderApp(time: any, list: any) {
	return h(
		'div', {},
		[time, list]
	)
}

function append<T>(list: T[], item: T) {
	var list = list.slice();
	list.push(item);
	return list;
}

var time = electric.clock.time({intervalInMs: 1000})
	.map(renderTime);

var list = electric.clock.time({intervalInMs: 1000})
	.accumulate([], append)
	.map(renderList);

electric.transformator
	.map(renderApp, time, list)
	.plugReceiver(
		virtualDomReceiver(document.body)
	);

