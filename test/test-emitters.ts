import chai = require("chai");
import electricKettle = require('./electric-kettle');
electricKettle.pour(chai);
var expect = chai.expect;
import electric = require("../server/electric");
import fromPromise = require("../server/emitters/fromPromise");
import ui = require("../server/emitters/ui");



describe('emitter from event', function() {
    var mockTarget = {
        listeners: <{ [type: string]: any }>{},
        event: function(x: any) {
            for (var k in this.listeners) {
                if (this.listeners[k]) {
                    this.listeners[k](x);
                }
            }
        },
        addEventListener: function(type: string, callback: (v: any) => void, useCapture?: boolean) {
            this.listeners[type] = callback;
        },
        removeEventListener: function(type: string, callback: (v: any) => void, useCapture?: boolean) {
            this.listeners[type] = undefined;
        }
    };
    it('should be tested by working mock target', function() {
        var r = 0;
        var f = (x: number) => r = x;
        mockTarget.addEventListener('click', f);
        mockTarget.event(1);
        expect(r).to.equal(1);
        mockTarget.removeEventListener('click', f);
        mockTarget.event(2);
        expect(r).to.equal(1);
    });

    it('should impulse events', function() {
        (<any>expect(ui.fromEvent(mockTarget, 'click'))).to.emit
            .values(undefined)
            .after(() => mockTarget.event(1))
            .values(1, undefined)
            .after(() => mockTarget.event(1))
            .values(1, undefined);
        expect(mockTarget.listeners['click']).to.not.be.undefined;
    });
    it('should remove listener on stabilize', function() {
        var mouse = ui.fromEvent(mockTarget, 'mouse');
        expect(mockTarget.listeners['mouse']).to.not.be.undefined;
        mouse.stabilize();
        expect(mockTarget.listeners['mouse']).to.be.undefined;
    });
});

describe('emitter from Promise', function() {
    var mockPromise = {
        then: function(onFulfilled: any, onRejected: any) {
            this.onFulfilled = onFulfilled;
            this.onRejected = onRejected;
        },
        fulfill: function(x: any) {
            this.onFulfilled(x);
        },
        reject: function(x: any) {
            this.onRejected(x);
        }
    };
    it('should be tested by working mock promise', function() {
        var r = 0;
        var e = 0;
        mockPromise.then(
            (x: number) => r = x,
            (x: number) => e = x
			);
        mockPromise.fulfill(1);
        expect(r).to.equal(1);
        mockPromise.reject(2);
        expect(e).to.equal(2);
    });
    it('should emit "pending" state upon creation', function() {
        (<any>expect(fromPromise(mockPromise))).to.emit
            .values({ status: 'pending' });
    });
    it('should emit "fulfilled" state and data upon fulfillment', function() {
        (<any>expect(fromPromise(mockPromise))).to.emit
            .values({ status: 'pending' })
            .after(() => mockPromise.fulfill(1))
            .values({ status: 'fulfilled', data: 1 });
    });
    it('should emit "rejected" state and data upon fulfillment', function() {
        (<any>expect(fromPromise(mockPromise))).to.emit
            .values({ status: 'pending' })
            .after(() => mockPromise.reject(3))
            .values({ status: 'rejected', data: 3 });
    });
});
