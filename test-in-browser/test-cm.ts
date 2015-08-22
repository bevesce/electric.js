/// <reference path="../d/chai.d.ts" />
/// <reference path="../d/mocha.d.ts" />

var expect = chai.expect;

import io = require('socket.io-client');
import rrc = require('../src/devices/requestResponseClient');
import electric = require('../src/electric');
import electricSocket = require('../src/devices/electric-socket');

function createPluggedDevice(
	method: string,
	url: string,
	maker = rrc.requestResponse
) {
	var device = maker(method, url);
	var data = electric.emitter.manual(undefined);
	var responses = electric.receiver.hanging();
	var state = electric.receiver.hanging();
	device.plug({
			data: data
	});
	return {
		device: device,
		data: data,
		responses: device.out.responses,
		state: device.out.state
	}
}

// test requires server to be running
describe('request response client device', function() {
	it('should emit response data', function(done) {
		var pluggedDevice = createPluggedDevice(
			'POST', 'http://localhost:8081'
		);
		var responses = pluggedDevice.responses.map(
			(x: rrc.Response) => x.data
		);
		expect(responses)
			.to.emit(null)
			.after(() => {
				pluggedDevice.data.emit('t1')
			})
			.to.emit('OK: t1')
			.then.after(() => {
				pluggedDevice.data.emit('t2')
			})
			.to.emit('OK: t2')
			.then.finish(done);
	});
	it('should emit response success (200) status', function(done) {
		var pluggedDevice = createPluggedDevice(
			'POST', 'http://localhost:8081'
		);
		var responses = pluggedDevice.responses.map(
			(x: rrc.Response) => x.statusCode
		);
		expect(responses)
			.to.emit(-1)
			.after(() => {
				pluggedDevice.data.emit('t3')
			})
			.to.emit(200)
			.then.finish(done);
	});
	it('should emit response not found (404) status', function(done) {
		var pluggedDevice = createPluggedDevice(
			'POST', 'http://localhost:8080/fdfsdds'
		);
		var responses = pluggedDevice.responses.map(
			(x: rrc.Response) => x.statusCode
		);
		expect(responses)
			.to.emit(-1)
			.after(() => {
				pluggedDevice.data.emit('t4')
			})
			.to.emit(404)
			.then.finish(done);
	});
	it('should emit state of request (not the http one)', function(done) {
		var pluggedDevice = createPluggedDevice(
			'POST', 'http://localhost:8081'
		);
		expect(pluggedDevice.state)
			.to.emit('none')
			.then.after(() => pluggedDevice.data.emit('t5'))
			.to.emit('waiting')
			.to.emit('success')
			.then.finish(done);
	});

	it('should emit `error` state of request (not the http one)', function(done) {
			var badPluggedDevice = createPluggedDevice(
			'POST', 'http://localhost:8080/fdsfsd'
			);
		expect(badPluggedDevice.state)
			.to.emit('none')
			.then.after(() => badPluggedDevice.data.emit('t6'))
			.to.emit('waiting')
			.to.emit('error')
			.then.finish(done);
	});
});

describe('JSON request response client device', function() {
	it('should encode and decode data', function(done) {
		var pluggedDevice = createPluggedDevice(
			'POST', 'http://localhost:8081/json', rrc.JSONRequestResponse
		);
		expect(pluggedDevice.responses.map((x: rrc.Response<any>) => x.data))
			.to.emit(null)
			.then.after(() => pluggedDevice.data.emit({x: 1}))
			.to.emit({ok: "{\"x\":1}"})
			.then.finish(done);
	});
});

describe('optimistic request response client device', function() {
	it('should emit optimistic version', function(done) {
		function o(x) {
			return 'OK: ' + x;
		}

		var pluggedDevice = createPluggedDevice(
			'POST', 'http://localhost:8081', (m, u) => rrc.OptimisticRequestResponse(m, u, o)
		);
		expect(pluggedDevice.responses.map((x: rrc.Response<any>) => x.data))
			.to.emit(null)
			.then.after(() => pluggedDevice.data.emit('o1'))
			.to.emit(o('o1'))
			// .to.emit('OK: o1')
			// it shouldn't reemit new value if it's the same
			// so uncommenting this should cause to `done` not be called
			.then.finish(done);
	});
	it('should emit optimistic version and then correction', function(done) {
		function o(x) {
			return 'Optimistic: ' + x;
		}

		var pluggedDevice = createPluggedDevice(
			'POST', 'http://localhost:8081', (m, u) => rrc.OptimisticRequestResponse(m, u, o)
		);
		expect(pluggedDevice.responses.map((x: rrc.Response<any>) => x.data))
			.to.emit(null)
			.then.after(() => pluggedDevice.data.emit('o3'))
			.to.emit(o('o3'))
			.to.emit('OK: o3')
			.then.finish(done);
	});
	it('should emit optimistic version and then error', function(done) {
		function o(x) {
			return 'Optimistic: ' + x;
		}

		var pluggedDevice = createPluggedDevice(
			'POST', 'http://localhost:8080/fdfsd', (m, u) => rrc.OptimisticRequestResponse(m, u, o)
		);
		expect(pluggedDevice.responses.map((x: rrc.Response<any>) => x.statusCode))
			.to.emit(-1)
			.then.after(() => pluggedDevice.data.emit('o4'))
			.to.emit(200)
			.to.emit(404)
			.then.finish(done);
	});
});

describe('optimistic JSON request response client device', function() {
	it('should (d)encode data and use custom equality (false)', function(done) {
		var eCalled = false;
		function o(data) {
			return {ok: JSON.stringify(data)}
		}
		function e(response, otherResponse) {
			eCalled = true;
			return false;
		}
		var pluggedDevice = createPluggedDevice(
			'POST', 'http://localhost:8081/json',
			(m, u) => rrc.OptimisticJSONRequestResponse(m, u, o, e)
		);
		expect(pluggedDevice.responses.map((x: rrc.Response<any>) => x.data))
			.to.emit(null)
			.then.after(() => pluggedDevice.data.emit({x: 1}))
			.to.emit({ ok: "{\"x\":1}" })
			.to.emit({ ok: "{\"x\":1}" })
			.then.finish(() => {
				expect(eCalled).to.be.true;
				done();
			});
	});
	it('should (d)encode data and use custom equality (true)', function(done) {
		var eCalled = false;
		function o(data) {
			return { ok: JSON.stringify(data) }
		}
		function e(response, otherResponse) {
			eCalled = true;
			return otherResponse.status != 'success';
		}
		var pluggedDevice = createPluggedDevice(
			'POST', 'http://localhost:8081/json',
			(m, u) => rrc.OptimisticJSONRequestResponse(m, u, o, e)
			);
		expect(pluggedDevice.responses.map((x: rrc.Response<any>) => x.data))
			.to.emit(null)
			.then.after(() => pluggedDevice.data.emit({ x: 1 }))
			.to.emit({ ok: "{\"x\":1}" })
			// there should not be any corrections
			.then.finish(() => {
				expect(eCalled).to.be.true;
				done();
			});
	});
});

var socket = io('http://localhost:8002');

function socketReceiver(name, socket) {
	return function(data) {
		socket.emit(name, data);
	}
}

function socketEmitter(name, socket, initialValue = undefined) {
	var emitter = electric.emitter.manual(initialValue);
	socket.on(name, function(data){
		emitter.emit(data);
	});
	emitter.name = 'socket <' + name + '>';
	return emitter;
};

describe('websocket', function() {
	// it('should emit data from server ', function(done) {
	// 	var emitter = electricSocket.socketEmitter('fromserver', socket, 'e0');
	// 	expect(emitter)
	// 		.to.emit('e0')
	// 		.to.emit('e1')
	// 		.then.finish(done);
	// });
	// it('should emit data to server', function(done) {

	// 	expect(feedback)
	// 		.to.emit()
	// });
});



var emitter = electric.emitter.manual('x0');
var feedback = electricSocket.socketEmitter('feedback', socket, 'f0');
emitter.plugReceiver(
	socketReceiver('toserver', socket)
);
// emitter.emit('x1');

electric.receiver.log(feedback);

// var receiverY = electricSocket.socketReceiver('y', socket);

// var m = electric.emitter.manual();
// m.plugReceiver(receiverY);
// m.emit('test');
// m.emit('32167');

// // emitter.plugReceiver(electric.receiver.logReceiver('S'))

// // socket.on('news', function(data) {
// // 	console.log(data);
// // 	socket.emit('my other event', { my: 'data' });
// // });
