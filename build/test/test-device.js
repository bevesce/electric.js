// import chai = require("chai");
// import electricKettle = require('./electric-kettle');
// electricKettle.pour(chai);
// var expect = chai.expect;
// import electric = require("../server/electric");
// describe('electric device', function() {
// 	it('should run creating function', function() {
// 		var haveRun = false;
// 		electric.device.create(function (){
// 			haveRun = true;
// 		});
// 		expect(haveRun).to.be.true;
// 	});
// 	it('should optionally name device', function() {
// 		var name = 'some device'
// 		var device = electric.device.create(name, function() {
// 		});
// 		expect(device.name).to.equal(name)
// 	});
// 	it('should provide ins and outs functions', function() {
// 		electric.device.create(function(ins, outs) {
// 			expect(ins).to.be.a('function');
// 			expect(outs).to.be.a('function');
// 		});
// 	});
// 	it('should have ins', function() {
// 		var device = electric.device.create(function(ins, outs) {
// 			ins({
// 				in1: electric.receiver.hanging(),
// 				in2: electric.receiver.hanging(),
// 			});
// 		});
// 		expect(device.ins['in1']).to.not.be.undefined;
// 		expect(device.ins['in1'].plugEmitter).to.be.a('function');
// 	});
// 	it('should have outs', function() {
// 		var device = electric.device.create(function(ins, outs) {
// 			outs({
// 				out1: electric.receiver.hanging(),
// 				out2: electric.receiver.hanging(),
// 			});
// 		});
// 		expect(device.outs['out1']).to.not.be.undefined;
// 		expect(device.outs['out1'].plugReceiver).to.be.a('function');
// 	});
// 	it('should work...', function() {
// 		var device = electric.device.create(function(ins, outs) {
// 			var inp = electric.receiver.hanging();
// 			var out = inp.map((x: number) => x * 2);
// 			ins({ inp: inp});
// 			outs({ out: out });
// 		});
// 		var emitter = electric.emitter.manual(0);
// 		device.ins['inp'].plugEmitter(emitter);
// 		(<any>expect(device.outs['out'])).to.emit
// 			.values(0)
// 			.then.after(() => {
// 				emitter.emit(1);
// 				emitter.emit(2);
// 			})
// 			.values(2, 4);
// 	});
// 	it('should work as a function', function() {
// 		var device = electric.device.create(function(ins, outs) {
// 			var inp = electric.receiver.hanging();
// 			var out = inp.map((x: number) => x * 2);
// 			ins({ inp: inp });
// 			outs({ out: out });
// 		});
// 		var emitter = electric.emitter.manual(0);
// 		var r: number[] = []
// 		var receiver = (x: number) => {
// 			r.push(x);
// 		}
// 		device.plug({
// 			ins: {
// 				inp: emitter
// 			},
// 			outs: {
// 				out: receiver
// 			}
// 		});
// 		// device.outs.out.plugReceiver(receiver);
// 		emitter.emit(1);
// 		expect(r).to.deep.equal([0, 2]);
// 	});
// });
// describe('list device', function() {
// 	it('should work...', function() {
// 		var listDevice = electric.device.list();
//         var newTodo = electric.emitter.manual(undefined);
//         var deleteTodo = electric.emitter.manual(undefined);
//         var editTodo = electric.emitter.manual(undefined);
//         listDevice.plug({
//         	ins: {
//         		inserts: newTodo,
//         		deletes: deleteTodo
//         	}
//         });
//         listDevice.ins['edits'].plugEmitter(editTodo);
//         (<any>expect(listDevice.outs['items'])).to.emit
//             .values([])
//             .after(() => {
// 				newTodo.impulse('item1')
//             })
//             .values(['item1'])
//             .after(() => {
//                 newTodo.impulse('item2')
//             })
//             .values(['item1', 'item2'])
//             .after(() => {
// 				deleteTodo.impulse(0)
//             })
//             .values(['item2'])
//             .after(() => {
// 				editTodo.impulse({ index: 0, value: 'edited2' })
//             })
//             .values(['edited2'])
//             .after(() => {
// 				newTodo.impulse('item3');
//                 newTodo.impulse('item3');
//             })
//             .values(['edited2', 'item3'], ['edited2', 'item3', 'item3'])
//     });
// }); 
