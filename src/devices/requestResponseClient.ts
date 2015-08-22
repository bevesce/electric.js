import electric = require('../electric');


function makeRequest(
	method: string, url: string, data: string,
	callback: (request: XMLHttpRequest) => void
) {
	// console.log('MAking request:', data, '<');
	var request = new XMLHttpRequest();
	request.onreadystatechange = function() {
		if (request.readyState === 4) {
			callback(request);
		}
	};
	request.open(method, url, true);
	request.send(data);
};

function extractResponse<T>(request: XMLHttpRequest, decode: (data: string) => T) {
	return new Response(
		decode(request.responseText), request.status, request.statusText
	);
}

export class Response<T> {
	data: T;
	statusCode: number;
	statusDescription: string;
	status: string;

	constructor(
		data: T,
		statusCode: number,
		statusDescription: string
	) {
		this.data = data;
		this.statusCode = statusCode;
		this.statusDescription = statusDescription;
		this.status = statusShortDescription(statusCode)
	}
}

function basicResponseEqual<T>(response: Response<T>, otherResponse: Response<T>) {
	return response.data === otherResponse.data &&
		   response.statusCode == otherResponse.statusCode;
}

function statusShortDescription(statusCode: number) {
	// 5xx server error
	// 4xx client error
	if (statusCode >= 400) {
		return 'error';
	}
	// 3xx redirection
	else if (statusCode >= 300) {
		return 'redirection';
	}
	// special code when request was not yet made
	else if (statusCode == -1) {
		return 'waiting';
	}
	// 2xx success
	return 'success'
}

function _requestResponse<In, Out>(
	method: string, url: string,
	encode: (data: In) => string,
	decode: (data: string) => Out,
	ondata?: (emitter, stateEmitter, data) => void,
	responseEqual = basicResponseEqual

) {
	return electric.device.create('request response client', function(input, output) {
		var newData = input('data');
		var emitter = electric.emitter.manual(
			new Response(null, -1, 'No request was yet made and response was not yet provided')
		);
		emitter.setEquals(responseEqual);
		var stateEmitter = electric.emitter.manual('none');

		function receiverMakingRequest(data: In) {
			if (data === undefined) {
				return;
			}
			if (ondata) {
				ondata(emitter, stateEmitter, data)
			}
			else {
				stateEmitter.emit('waiting');
			}
			makeRequest(
				method, url, encode(data),
				(r: XMLHttpRequest) => {
					var response = extractResponse(r, decode);
					emitter.emit(response)
					stateEmitter.emit(response.status);
				}
			)
		};

		newData.plugReceiver(receiverMakingRequest);

		output('responses', emitter);
		output('state', stateEmitter);
	});
}

var stringIdentity = (s: string) => s;

export function requestResponse(method, url) {
	return _requestResponse(method, url, stringIdentity, stringIdentity);
}

export function JSONRequestResponse(method, url) {
	return _requestResponse(method, url, JSON.stringify, JSON.parse);
}

function emitOptimistically(optimistic) {
	return function (emitter, stateEmitter, data) {
		var optimisticResponse = new Response(
			optimistic(data),
			200,
			'optimistic success, maybe correction will come later, maybe not'
		);
		optimisticResponse.status = 'success?'
		emitter.emit(optimisticResponse);
		stateEmitter.emit('success');
	}
}

export function OptimisticRequestResponse(method, url, optimistic) {
	return _requestResponse(
		method, url, stringIdentity, stringIdentity,
		emitOptimistically(optimistic)
	);
}

export function OptimisticJSONRequestResponse(
	method, url, optimistic, responseEqual
) {
	return _requestResponse(
		method, url, JSON.stringify, JSON.parse,
		emitOptimistically(optimistic), responseEqual
	);
}
