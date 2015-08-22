// /// <reference path="../d/chai.d.ts" />
// /// <reference path="../d/mocha.d.ts" />
// import chai = require('chai');
// import electricKettle = require('./electric-kettle');
// electricKettle.pourAsync(chai);
// var expect = chai.expect;
// import electric = require('../src/electric');
// import arrayDevice = require('../src/devices/array');
// describe('create device api', function() {
// 	it('should have inputs and outputs', function(done) {
// 		var device = electric.device.create(function(input, output) {
// 			output('out0', input('in0'));
// 		});
// 		var m = electric.emitter.manual(0);
// 		device.plug({in0: m});
// 		expect(device.out['out0'])
// 			.to.emit(0)
// 			.then.after(() => m.emit(1))
// 			.to.emit(1)
// 			.then.finish(done);
// 	});
// 	it('should have transformable inputs', function(done) {
// 		var device = electric.device.create(function(input, output) {
// 			var out = input('in').map((x: number) => x * 2);
// 			output('out', out);
// 		});
// 		var m = electric.emitter.manual(0);
// 		device.plug({ in: m });
// 		expect(device.out['out'])
// 			.to.emit(0)
// 			.then.after(() => m.emit(2))
// 			.to.emit(4)
// 			.then.finish(done);
// 	});
// 	it('should have reusable inputs', function(done) {
// 		var device = electric.device.create(function(input, output) {
// 			var out1 = input('in').map((x: number) => x * 2);
// 			var out2 = input('in').map((x: number) => x * 4);
// 			output('out1', out1);
// 			output('out2', out2);
// 		});
// 		var m = electric.emitter.manual(0);
// 		device.plug({ in: m });
// 		var joined = electric.transformator.map(
// 			(x, y) => ({x: x, y: y}),
// 			device.out['out1'], device.out['out2']
// 		);
// 		expect(joined)
// 			.to.emit({ x: 0, y: 0 })
// 			.then.after(() => m.emit(2))
// 			.to.emit({ x: 4, y: 0 })
// 			.to.emit({ x: 4, y: 8 })
// 			.then.finish(done);
// 	});
// 	it('should have emit initial value of placeholder from inputs before plug', function(done) {
// 		var device = electric.device.create(function(
// 			input: electric.device.IInputFunction,
// 			output: electric.device.IOutputFunction
// 		) {
// 			output('out', input('in', 0));
// 		});
// 		var e = electric.emitter.manual(1);
// 		var r = electric.receiver.collect(device.out['out']);
// 		expect(device.out['out'])
// 			.to.emit(0)
// 			.then.after(() => device.plug({ in: e }))
// 			.to.emit(1)
// 			.then.finish(done);
// 	});
// });
// describe('array device', function() {
// 	it('should work...', function(done) {
// 		var device = arrayDevice();
//         var newTodo = electric.emitter.manual(undefined);
//         var deleteTodo = electric.emitter.manual(undefined);
//         var editTodo = electric.emitter.manual(undefined);
//         device.plug({
//     		inserts: newTodo,
//     		deletes: deleteTodo,
//     		edits: editTodo
//         });
//         expect(device.out['items'])
// 			.to.emit([])
//             .after(() => newTodo.impulse('item1'))
//             .to.emit(['item1'])
//             .after(() => newTodo.impulse('item2'))
//             .to.emit(['item1', 'item2'])
//             .after(() => deleteTodo.impulse(0))
//             .to.emit(['item2'])
//             .after(() => {
// 				editTodo.impulse({ index: 0, value: 'edited2' })
//             })
//             .to.emit(['edited2'])
//             .after(() => {
// 				newTodo.impulse('item3');
//             })
//             .to.emit(['edited2', 'item3'])
//             .then.finish(done);
//     });
// });
