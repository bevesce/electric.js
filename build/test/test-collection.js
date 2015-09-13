// ///<reference path='../node_modules/immutable/dist/Immutable.d.ts'/>
// /// <reference path="../d/chai.d.ts" />
// /// <reference path="../d/mocha.d.ts" />
// import immutable = require('immutable');
// import chai = require("chai");
// import electricKettle = require('./electric-kettle');
// electricKettle.pourAsync(chai);
// var expect = chai.expect;
// import electric = require("../src/electric");
// import collection = require('../src/devices/electric-collection');
// describe('collection device', function() {
// 	it('should work...', function(done) {
// 		var List = immutable.List;
// 		var device = collection(List.of());
// 		var m = electric.emitter.manual(x => x);
// 		device.plug({ changes: m });
// 		device.out['collected'].setEquals(immutable.is);
// 		var r = electric.receiver.collect(device.out['collected']);
// 		m.emit(l => l.push(1));
// 		m.emit(l => l.push(2));
// 		m.emit(l => l.pop());
// 		m.emit(l => l.push(3));
// 		m.emit(l => l.set(0, 13));
// 		m.emit(l => l.push(1).pop());
// 		m.emit(l => l.push(1).pop());
// 		m.emit(l => l.push(1).pop());
// 		console.log(r);
// 		done();
// 	});
// }) 
