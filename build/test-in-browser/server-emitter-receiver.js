// import http = require('http');
// import electric = require('../src/electric');
// class RequestResponse {
// 	request: any;
// 	private _response: any;
// 	private _data: any;
// }
// function createServer(port) {
// 	var requestEmitter = electric.emitter.manual(null);
// 	http.createServer(function(request, response) {
// 		var body = '';
// 		request.on('data', function(data){
// 			body += data;
// 		});
// 		request.on('end', function() {
// 			requestEmitter.emit({
// 				request: request,
// 				url: request.url,
// 				method: request.method,
// 				data: body
// 			});
// 		});
// 	}).listen(port);
// 	return {
// 		requestEmitter: requestEmitter,
// 		responseReceiver: function(data) {
// 			// response.writeHeader(...)
// 			// response.write(data)
// 			// response.end()
// 			// response.writeHeader(
// 			// 	200, {
// 			// 		'Content-Type': 'application/json',
// 			// 		'Access-Control-Allow-Origin': '*',
// 			// 		'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type'
// 			// 	}
// 			// );
// 		}
// 	}
// }
// console.log('server running on 8081');
