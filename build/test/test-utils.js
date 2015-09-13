/// <reference path="../d/chai.d.ts" />
/// <reference path="../d/mocha.d.ts" />
var chai = require('chai');
var expect = chai.expect;
var all = require('../src/utils/all');
var any = require('../src/utils/any');
var mapObj = require('../src/utils/map-obj');
describe('any', function () {
    it('should return true if any element of on list is truthy', function () {
        expect(any([false, false, 1]))
            .to.be.true;
    });
    it('should return false if all element of on list are falsy', function () {
        expect(any([false, '', undefined, null, 0]))
            .to.be.false;
    });
    it('should return false for empty list', function () {
        expect(any([]))
            .to.be.false;
    });
});
describe('all', function () {
    it('should return true if all element of on list are truthy', function () {
        expect(all([{}, '1', 1, true]))
            .to.be.true;
    });
    it('should return false if any element of on list is falsy', function () {
        expect(all([1, '', true, true]))
            .to.be.false;
    });
    it('should return true for empty list', function () {
        expect(all([]))
            .to.be.true;
    });
});
describe('mapObj', function () {
    it('should map dict-like objects', function () {
        var obj = {
            test1: 1,
            test2: 2,
            test3: 3
        };
        expect(mapObj(obj, function (x) { return x + '!'; })).to.eql({
            test1: '1!',
            test2: '2!',
            test3: '3!'
        });
    });
});
