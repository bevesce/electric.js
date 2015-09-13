import electric = require('../electric');
import fp = require('../fp');


export class Response<T> {
	data: T;
	statusCode: number;
	statusDescription: string;
	status: string;

	constructor(
		data: string,
		statusCode: number,
		statusDescription: string,
		decode?: (responseText: string) => T
	) {
		this.statusCode = statusCode;
		this.statusDescription = statusDescription;
		this.status = statusShortDescription(statusCode)
		if (decode && this.status === 'success') {
			this.data = decode(data);
		}
	}
}

var emptyResponse = new Response(
	null, -1, 'No request was yet made and response was not yet provided'
);


export function device<T>(
	method: string, url: string,
	input: electric.emitter.Emitter<electric.event<T>>,
	encode: (data: T) => string = fp.identity,
	decode: (data: string) => T = fp.identity
) {
	var state = electric.emitter.manual('none');
	state.name = 'state of ' + method + ': ' + url;
	var stateChange = electric.emitter.manualEvent(<string>null);
	stateChange.name = 'state change of ' + method + ': ' + url;
	var responseEmitter = electric.emitter.manual(emptyResponse);
	responseEmitter.name = 'response on ' + method + ': ' + url;

	input.plugReceiver(function emitStateChangesAndResponses(data: electric.event<T>) {
		if (!data.happend) {
			return;
		}
		stateChange.impulse('waiting');
		state.emit('waiting');
		request(
			method,
			url,
			(response: Response<T>) => {
				electric.scheduler.scheduleTimeout(
					() => stateChange.impulse(response.status),
					500
				);
				state.emit(response.status);
				responseEmitter.emit(response);
			},
			{
				data: <T>data.value,
				encode: encode,
				decode: decode
			}
		);
	});

	return {
		state: state,
		stateChange: stateChange,
		response: responseEmitter
	}
}

export function JSONDevice<T>(
	method: string, url: string, input: electric.emitter.Emitter<electric.event<T>>
) {
	return device(method, url, input, JSON.stringify, JSON.parse);
}

export function request<T>(
	method: string,
	url: string,
	callback: (response: Response<T>) => void,
	args: {
		data?: T,
		encode?: (data: T) => string,
		decode?: (data: string) => T
	}
) {
	args.encode = args.encode || fp.identity;
	args.decode = args.decode || fp.identity;
	var req = new XMLHttpRequest();
	req.onreadystatechange = function() {
		if (req.readyState !== 4) {
			return;
		}
		callback(
			extractResponse(req, args.decode)
		)
	}
	req.open(method, url, true);
	if (args.data !== undefined) {
		req.send(args.encode(args.data));
	}
	else {
		req.send()
	}
}

function extractResponse<T>(request: XMLHttpRequest, decode: (data: string) => T) {
	return new Response(
		request.responseText, request.status, request.statusText, decode
	);
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
		return 'none';
	}
	else if (statusCode == 0) {
		return 'error';
	}
	// 2xx success
	return 'success'
}
