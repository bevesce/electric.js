/// <reference path="../d/chai.d.ts" />
/// <reference path="../d/mocha.d.ts" />
var chai = require("chai");
var electricKettle = require('./electric-kettle');
electricKettle.pourAsync(chai);
var expect = chai.expect;
var fromPromise = require("../src/emitters/fromPromise");
var ui = require("../src/emitters/ui");
var eevent = require('../src/electric-event');
describe('emitter from event', function () {
    var mockTarget = {
        listeners: {},
        event: function (x) {
            for (var k in this.listeners) {
                if (this.listeners[k]) {
                    this.listeners[k](x);
                }
            }
        },
        addEventListener: function (type, callback, useCapture) {
            this.listeners[type] = callback;
        },
        removeEventListener: function (type, callback, useCapture) {
            this.listeners[type] = undefined;
        }
    };
    it('should be tested by working mock target', function () {
        var r = 0;
        var f = function (x) { return r = x; };
        mockTarget.addEventListener('click', f);
        mockTarget.event(1);
        expect(r).to.equal(1);
        mockTarget.removeEventListener('click', f);
        mockTarget.event(2);
        expect(r).to.equal(1);
    });
    it('should impulse events', function (done) {
        expect(ui.fromEvent({
            target: mockTarget,
            type: 'click'
        }))
            .to.emit(eevent.notHappened)
            .after(function () { return mockTarget.event(1); })
            .to.emit(eevent.of(1), eevent.notHappened)
            .after(function () { return mockTarget.event(1); })
            .to.emit(eevent.of(1), eevent.notHappened)
            .andBe(done);
        expect(mockTarget.listeners['click']).to.not.be.undefined;
    });
    it('should remove listener on stabilize', function () {
        var mouse = ui.fromEvent({
            target: mockTarget,
            type: 'mouse'
        });
        expect(mockTarget.listeners['mouse']).to.not.be.undefined;
        mouse.stabilize();
        expect(mockTarget.listeners['mouse']).to.be.undefined;
    });
});
describe('emitter from Promise', function () {
    var mockPromise = {
        then: function (onFulfilled, onRejected) {
            this.onFulfilled = onFulfilled;
            this.onRejected = onRejected;
        },
        fulfill: function (x) {
            this.onFulfilled(x);
        },
        reject: function (x) {
            this.onRejected(x);
        }
    };
    it('should be tested by working mock promise', function () {
        var r = 0;
        var e = 0;
        mockPromise.then(function (x) { return r = x; }, function (x) { return e = x; });
        mockPromise.fulfill(1);
        expect(r).to.equal(1);
        mockPromise.reject(2);
        expect(e).to.equal(2);
    });
    it('should emit "pending" state upon creation', function (done) {
        expect(fromPromise(mockPromise))
            .to.emit({ status: 'pending' })
            .andBe(done);
    });
    it('should emit "fulfilled" state and data upon fulfillment', function (done) {
        expect(fromPromise(mockPromise))
            .to.emit({ status: 'pending' })
            .after(function () { return mockPromise.fulfill(1); })
            .to.emit({ status: 'fulfilled', data: 1 })
            .andBe(done);
    });
    it('should emit "rejected" state and data upon fulfillment', function (done) {
        expect(fromPromise(mockPromise))
            .to.emit({ status: 'pending' })
            .after(function () { return mockPromise.reject(3); })
            .to.emit({ status: 'rejected', data: 3 })
            .andBe(done);
    });
});
