import electric = require('../../src/electric');


electric.clock.clock({intervalInMs: 1000}).plugReceiver(
	electric.receiver.htmlReceiverById('time')
);

electric.clock.clock({intervalInMs: 1000}).plugReceiver(
	electric.receiver.logReceiver('time:')
);

function append<T>(list: T[], item: T) {
	var list = list.slice();
	list.push(item);
	return list;
}

function renderItems<T>(list: T[]) {
	return list.map(function(x) {
		return '<li>' + x + '</li>'
	}).join('');
}

electric.clock.clock({intervalInMs: 1000})
	.accumulate([], append)
	.map(renderItems)
	.plugReceiver(
		electric.receiver.htmlReceiverById('list')
	);