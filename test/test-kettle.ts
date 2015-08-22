// /// <reference path="../d/chai.d.ts" />
// /// <reference path="../d/mocha.d.ts" />

// import chai = require("chai");
// import electricKettle = require('./electric-kettle');
// electricKettle.pour(chai);
// var expect = chai.expect;
// import electric = require("../src/electric");

// describe('expect emitter after to emit', function() {
// 	it('should work...', function() {
// 		var emitter = electric.emitter.manual(0);
// 		expect(emitter).to.emit
// 			.values(0)
// 			.after(() => emitter.emit(1))
// 			.values(1)
// 			.after(() => { emitter.emit(2); emitter.emit(3) })
// 			.values(2, 3);
// 	});
// });