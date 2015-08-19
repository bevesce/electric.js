export import emitter = require('../emitter');


interface Promise<Of, Err> {
	then(
		onFulfilled: (value: Of) => void,
		onRejected: (err: Err) => void
		): any
}

function fromPromise<Of, Err>(promise: Promise<Of, Err>) {
	var e = emitter.manual({ status: 'pending' });
	e.name = 'promise *' + promise + '*';
	promise.then(
		(value: Of) => {
			e.emit({ status: 'fulfilled', data: value });
			e.stabilize();
		},
		(err: Err) => {
			e.emit({ status: 'rejected', data: err });
			e.stabilize();
		}
	);
	return e;
}

export = fromPromise;
