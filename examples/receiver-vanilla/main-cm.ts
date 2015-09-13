import electric = require('../../src/electric');
import ui = require('../../src/receivers/ui');


electric.clock.time({ intervalInMs: 1000 }).plugReceiver(
	ui.htmlReceiverById('time')
);


function append(list: any[], item: any) {
	var list = list.slice();
	list.push(item);
	return list;
}

function renderItems(list: any[]) {
	return list.map(function(x) {
		return '<li>' + x + '</li>'
	}).join('');
}

electric.clock.time({intervalInMs: 1000})
	.accumulate([], append)
	.map(renderItems)
	.plugReceiver(
		ui.htmlReceiverById('list')
	);
