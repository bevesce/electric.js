// import chai = require("chai");
// import electricKettle = require('./electric-kettle');
// electricKettle.pour(chai);
// var expect = chai.expect;
// import electric = require("../src/electric");
// describe('lifting', function() {
// 	it('should lift functions to functions of emitters', function() {
// 		var emitter0 = electric.emitter.manual('0');
// 		var emitter1 = electric.emitter.manual('1');
// 		var add = electric.lift(function(x: string, y: string) {
// 			return x + y;
// 		});
// 		(<any>expect(
// 			add(emitter0, emitter1)
// 		)).to.emit.after(() => {
// 			emitter0.emit('2');
// 			emitter0.emit('3');
// 			emitter1.emit('4');
// 		}).values('01', '21', '31', '34');
// 	});
// });
// describe('clock', function() {
// 	it('should measure time', function() {
// 		var time = electric.scheduler.stop();
// 		var clock = electric.clock.clock({intervalInMs: 1});
// 		var r: number[] = [];
// 		clock.plugReceiver((x: number) => r.push(x));
// 		expect(r).to.deep.equal([time]);
// 		electric.scheduler.advance(2);
// 		expect(r).to.deep.equal([time, time + 1]);
// 		electric.scheduler.advance(2);
// 		expect(r).to.deep.equal([time, time + 1, time + 2, time + 3]);
// 	});
// 	it('should sample function', function() {
// 		function f(t: number) {
// 			return 2 * t;
// 		}
// 		var time = electric.scheduler.stop();
// 		var clock = electric.clock.fclock(f, {intervalInMs: 1});
// 		var r: number[] = [];
// 		clock.plugReceiver((x: any) => r.push(x));
// 		electric.scheduler.advance(4);
// 		expect(r).to.deep.equal([
// 			{time: time + 0, value: f(time + 0)},
// 			{time: time + 1, value: f(time + 1)},
// 			{time: time + 2, value: f(time + 2)},
// 			{time: time + 3, value: f(time + 3)},
// 		]);
// 	});
// 	it('should sample other emitter', function() {
// 		function f(t: number) {
// 			return 2 * t;
// 		}
// 		var time = electric.scheduler.stop();
// 		var emitter = electric.emitter.manual(0);
// 		var clock = electric.clock.eclock(emitter, { intervalInMs: 1 });
// 		var r: number[] = [];
// 		clock.plugReceiver((x: any) => r.push(x));
// 		electric.scheduler.advance(2);
// 		emitter.emit(1);
// 		electric.scheduler.advance(2);
// 		expect(r).to.deep.equal([
// 			{ time: time + 0, value: 0 },
// 			{ time: time + 1, value: 0 },
// 			{ time: time + 2, value: 1 },
// 			{ time: time + 3, value: 1 },
// 		]);
// 	});
// });
// describe('integral transformator', function() {
// 	it('should calculate integral over constant', function() {
// 		var time = electric.scheduler.stop();
// 		function v(t: number) {
// 			return 2;
// 		}
// 		var vT = electric.clock.fclock(v, { intervalInMs: 1 });
// 		var sT = electric.clock.integral(vT);
// 		var r: number[] = [];
// 		sT.plugReceiver((x: number) => r.push(x));
// 		electric.scheduler.advance(4);
// 		// value in v is expressed in [unit/s]
// 		expect(r).to.deep.equal([
// 			{time: time + 0, value: 0.000},
// 			{time: time + 1, value: 0.002},
// 			{time: time + 2, value: 0.004},
// 			{time: time + 3, value: 0.006},
// 		]);
// 	});
// 	it('should be composable', function() {
// 		var time = electric.scheduler.stop();
// 		function a(t: number) {
// 			return 2;
// 		}
// 		var aT = electric.clock.fclock(a, { intervalInMs: 1 });
// 		var vT = electric.clock.integral(aT);
// 		var sT = electric.clock.integral(vT);
// 		var r: number[] = [];
// 		// value in a is expressed in [unit/s]
// 		(<any>expect(sT)).to.emit.after(() => {
// 			electric.scheduler.advance(6);
// 		}).values(
// 			{ time: time + 0, value: 0.000000 },
// 			{ time: time + 1, value: 0.000001 },
// 			{ time: time + 2, value: 0.000004 },
// 			{ time: time + 3, value: 0.000009 },
// 			{ time: time + 4, value: 0.000016 },
// 			{ time: time + 5, value: 0.000025 }
// 		);
// 	});
// });
// describe('emitters recursion', function() {
// 	it('should work...', function() {
// 		var constant = electric.emitter.constant;
// 		var emitter1 = electric.emitter.manual(undefined);
// 		var emitter2 = electric.emitter.manual(undefined);
// 		function color() {
// 			return constant('red').change({
// 				to: () => constant('blue'), when: emitter1
// 			}).change({
// 				to: () => color(), when: emitter2
// 			});
// 		};
// 		var r: string[] = [];
// 		(<any>expect(color())).to.emit.after(() => {
// 			emitter1.impulse(1);
// 			emitter2.impulse(2);
// 			emitter1.impulse(1);
// 			emitter2.impulse(2);
// 			emitter1.impulse(1);
// 		}).values('red', 'blue', 'red', 'blue', 'red', 'blue');
// 	});
// });
