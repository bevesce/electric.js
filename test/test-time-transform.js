// /// <reference path="../d/chai.d.ts" />
// /// <reference path="../d/mocha.d.ts" />
// import chai = require("chai");
// import electricKettle = require('./electric-kettle');
// electricKettle.pour(chai);
// var expect = chai.expect;
// import electric = require("../src/electric");
// describe('time transform', function() {
// 	it('should reach to the future', function() {
// 		electric.scheduler.stop();
// 		var emitter = electric.emitter.manual(0);
// 		var r: number[] = [];
// 		// optional t0
// 		emitter.transformTime(0, (t: number) => t + 2).plugReceiver(
// 			(x: number) => r.push(x)
// 		);
// 		expect(r).to.deep.equal([0]);
// 		electric.scheduler.advance();
// 		emitter.emit(1);
// 		expect(r).to.deep.equal([0]);
// 		electric.scheduler.advance();
// 		expect(r).to.deep.equal([0]);
// 		electric.scheduler.advance();
// 		expect(r).to.deep.equal([0]);
// 		electric.scheduler.advance();
// 		expect(r).to.deep.equal([0, 1]);
// 		emitter.emit(2);
// 		expect(r).to.deep.equal([0, 1]);
// 		electric.scheduler.advance();
// 		expect(r).to.deep.equal([0, 1]);
// 		electric.scheduler.advance();
// 		expect(r).to.deep.equal([0, 1]);
// 		electric.scheduler.advance();
// 		expect(r).to.deep.equal([0, 1, 2]);
// 	});
// 	it('should work with wrong time transformations', function() {
// 		var time = electric.scheduler.stop();
// 		var emitter = electric.emitter.manual(0);
// 		var r: number[] = [];
// 		emitter.transformTime(0, (t: number) => -1).plugReceiver(
// 			(x: number) => r.push(x)
// 		);
// 		emitter.emit(1);
// 		emitter.emit(2);
// 		expect(r).to.deep.equal([0, 1, 2]);
// 	});
// 	it('should work with custom start time', function() {
// 		var time = electric.scheduler.stop();
// 		var emitter = electric.emitter.manual(0);
// 		var r: number[][] = [];
// 		emitter.transformTime(0, (t: number) => { return t * 2 }, time).plugReceiver(
// 			(x: number) => r.push([electric.scheduler.now(), x])
// 		);
// 		electric.scheduler.advance(1);
// 		emitter.emit(1);
// 		electric.scheduler.advance(1);
// 		electric.scheduler.advance(1);
// 		expect(r).to.deep.equal([[time, 0], [time + 2, 1]]);
// 		emitter.emit(2);
// 		expect(r).to.deep.equal([[time, 0], [time + 2, 1]]);
// 		electric.scheduler.advance(1);
// 		expect(r).to.deep.equal([[time, 0], [time + 2, 1]]);
// 		electric.scheduler.advance(1);
// 		expect(r).to.deep.equal([[time, 0], [time + 2, 1]]);
// 		electric.scheduler.advance(1);
// 		expect(r).to.deep.equal([[time, 0], [time + 2, 1]]);
// 		electric.scheduler.advance(1);
// 		expect(r).to.deep.equal([
// 			[time, 0], [time + 2, 1], [time + 6, 2]
// 		]);
// 	});
// });
