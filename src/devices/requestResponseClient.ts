import inf = require('../../src/interfaces');
import electric = require('../electric');
import fp = require('../fp');


var emptyResponse = new Response(null, -1, 'No request was yet made and response was not yet provided');


export function requestDevice<T>(
	method: string, url: string, input: inf.IEmitter<T>,
	encode: (data: T) => string = fp.identity, decode: (data: string) => T = fp.identity
) {
	var state = electric.emitter.manual('none');
	state.name = '<| state of ' + method + ': ' + url + ' |>';
	var stateChange = electric.emitter.manualEvent();
	stateChange.name = '<| state change of ' + method + ': ' + url + ' |>';
	var responseEmitter = electric.emitter.manual(null);
	responseEmitter.name = '<| response on ' + method + ': ' + url + ' |>';

	input.plugReceiver(data => {
		state.emit('waiting');
		stateChange.impulse('waiting');
		request(
			method,
			url,
			(response: Response<T>) => {
				state.emit(response.status);
				stateChange.impulse(response.status);
				responseEmitter.emit(response);
			},
			{
				data: <T>data,
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

export function JSONRequestDevice(
	method: string, url: string, input: inf.IEmitter<any>
) {
	return requestDevice(method, url, input, JSON.stringify, JSON.parse);
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
	args.decode = args.encode || fp.identity;
	var req = new XMLHttpRequest();
	req.onreadystatechange = function() {
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

function makeRequest(
	method: string, url: string, data: string,
	callback: (request: XMLHttpRequest) => void
) {
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
