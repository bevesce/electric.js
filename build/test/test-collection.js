///<reference path='../node_modules/immutable/dist/Immutable.d.ts'/>
/// <reference path="../d/chai.d.ts" />
/// <reference path="../d/mocha.d.ts" />
var immutable = require('immutable');
var chai = require("chai");
var electricKettle = require('./electric-kettle');
electricKettle.pourAsync(chai);
var expect = chai.expect;
var electric = require("../src/electric");
var collection = require('../src/devices/electric-collection');
describe('collection device', function () {
    it('should work...', function (done) {
        var List = immutable.List;
        var device = collection(List.of());
        var m = electric.emitter.manual(function (x) { return x; });
        device.plug({ changes: m });
        device.out['collected'].setEquals(immutable.is);
        var r = electric.receiver.collect(device.out['collected']);
        m.emit(function (l) { return l.push(1); });
        m.emit(function (l) { return l.push(2); });
        m.emit(function (l) { return l.pop(); });
        m.emit(function (l) { return l.push(3); });
        m.emit(function (l) { return l.set(0, 13); });
        m.emit(function (l) { return l.push(1).pop(); });
        m.emit(function (l) { return l.push(1).pop(); });
        m.emit(function (l) { return l.push(1).pop(); });
        console.log(r);
        done();
    });
});
