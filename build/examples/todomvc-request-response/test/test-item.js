/// <reference path="../../../d/chai.d.ts" />
/// <reference path="../../../d/mocha.d.ts" />
var chai = require('chai');
var expect = chai.expect;
var item = require('../js/item');
describe('item', function () {
    it('should be createable', function () {
        expect(item.of('test')).to.not.be.undefined;
    });
    it('should have title', function () {
        expect(item.of('test').title()).to.equal('test');
    });
    it('should be uncompleted when created', function () {
        expect(item.of('test').isCompleted()).to.be.false;
    });
    it('should have autmatic id', function () {
        expect(item.of('item1').id()).to.be.not.undefined;
    });
    it('should have autmatic id', function () {
        expect(item.of('item1').id()).to.be.not.equal(item.of('item2').id());
    });
    it('should be completeable', function () {
        expect(item.of('test').complete().isCompleted()).to.be.true;
    });
    it('should be uncomplateable', function () {
        expect(item.of('test').complete().uncomplete().isCompleted()).to.be.false;
    });
    it('should be toggable', function () {
        expect(item.of('test').toggle().isCompleted()).to.be.true;
        expect(item.of('test').complete().toggle().isCompleted()).to.be.false;
    });
    it('should be immutable', function () {
        var firstItem = item.of('test');
        var editedItem = firstItem.withTitle('edited');
        var completedItem = firstItem.complete();
        expect(firstItem.title()).to.equal('test');
        expect(firstItem.isCompleted()).to.be.false;
        expect(editedItem.title()).to.equal('edited');
        expect(completedItem.isCompleted()).to.be.true;
    });
    it('should be equalable', function () {
        var item1 = item.of('1');
        var item2 = item1.withTitle('1');
        expect(item1.equals(item2)).to.be.true;
        expect(item.equal(item1, item2)).to.be.true;
        var item3 = item1.withTitle('3');
        expect(item1.equals(item3)).to.be.false;
        expect(item.equal(item1, item3)).to.be.false;
    });
    it('should be resotoreable from plain object', function () {
        var restored = item.restore({ _id: 0, _title: 'test', _completed: false });
        expect(restored.title()).to.equal('test');
        expect(restored.isCompleted()).to.be.false;
    });
});
