import electric = require('../src/electric');

class ElectricRequest<T> {
	url: string;
	method: string;
	data: T;

	constructor(url: string, method: string, data: T) {
		this.url = url;
		this.method = method;
		this.data = data;
	}
}

function stringId(s: string) {
	return s;
}


function requestEmitter<T>(
	request, decode: (s: string) => T = stringId
) {
	var emitter = electric.emitter.manual(undefined);
	var cumulatedData = '';
	request.on('data', function(data) {
		cumulatedData += data;
	});
	request.on(end, function() {
		emitter.emit(new ElectricRequest(
			request.url, request.method, decode(cumulatedData)
		));
	});
	return emitter;
}

var defaultHeaders = {
	'Content-Type': 'application/json',
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type'
}

var defaultStatus = 200

function responseReceiver(response) {
	var receiver = function (toSend){
		var status = toSend.status || defaultStatus;
		var headers = toSend.headers || defaultHeaders;
		var data = toSend.data;
		response.writeHeader(status, headers);
		response.write(data);
		response.end();
	};
	receiver.name = 'response Receiver'
	return receiver;
}

import http = require('http');
http.createServer(function(request, response) {
	// console.log(request);
	// console.log(response);
	var body = '';
	request.on('data', function(data){
		body += data;
	});
	request.on('end', function() {
		console.log(request);
		console.log(body);
		if (request.url == '/json' && body) {
			response.write(JSON.stringify({
				ok: body
			}));
		}
		else {
		    response.write('OK: ' + body);
		}
	    response.end();
	});
    response.writeHeader(
    	200, {
    		'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type'
    	}
	);
}).listen(8081);

console.log('server running on 8081');
