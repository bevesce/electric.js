// /// <reference path="../d/chai.d.ts" />
// /// <reference path="../d/mocha.d.ts" />

// import chai = require("chai");
// import electricKettle = require('./electric-kettle');
// electricKettle.pourAsync(chai);
// var expect = chai.expect;
// import electric = require("../src/electric");

// describe('expect to emit then after to emit then finish', function() {
// 	it('should work...', function() {
// 		var emitter = electric.emitter.manual(0);
// 		var r = 0 ;
// 		function done() {
// 			r = 1;
// 		}
// 		expect(emitter)
// 			.to.emit(0)
// 			.then.after(() => emitter.emit(1))
// 			.to.emit(1)
// 			.then.after(() => emitter.emit(2))
// 			.to.emit(2)
// 			.then.finish(done)
// 		expect(r).to.equal(1);
// 	});
// });