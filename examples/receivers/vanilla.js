requirejs(['../../build/client/electric'], function(electric) {
	electric.clock.clock({intervalInMs: 1000}).plugReceiver(
		electric.receiver.htmlReceiverById('time')
	);

	electric.clock.clock({intervalInMs: 10000}).plugReceiver(
		electric.receiver.log('time:')
	);

	function append(list, item) {
		var list = list.slice();
		list.push(item);
		return list;
	}

	function renderItems(list) {
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
});
