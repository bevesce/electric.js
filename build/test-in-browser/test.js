(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var kettle = require('../test/electric-kettle');
var expect = chai.expect;
kettle.pourAsync(chai);
describe('request device', function () {
    it('should emit response data');
    it('should emit response status');
});
describe('socket emitter', function () {
    it('should emit data');
});
describe('socket event emitter', function () {
    it('should emit data');
});
describe('socket receiver', function () {
    it('should receive data');
});
describe('socket event receiver', function () {
    it('should receive data');
});

},{"../test/electric-kettle":2}],2:[function(require,module,exports){
var Queue = (function () {
    function Queue() {
        this._isDone = false;
        this.data = [];
        this.index = 0;
        this.done = function () { };
    }
    Queue.prototype.push = function (item) {
        this.data.push(item);
    };
    Queue.prototype.pop = function () {
        var result = this.data[this.index];
        this.index += 1;
        return result;
    };
    Queue.prototype.top = function () {
        return this.data[this.index];
    };
    Queue.prototype.isDone = function (utils) {
        if (this._isDone) {
            return true;
        }
        if (this.index >= this.data.length) {
            this._isDone = true;
            this.done();
            return true;
        }
        return false;
    };
    return Queue;
})();
function pourAsync(chai) {
    // expect(emitter)
    //   .to.emit(0)
    //   .then.after(() => ...)
    //   .to.emit(1)
    //   .then.to.finish(done)
    chai.use(function (_chai, utils) {
        var assertion = _chai.Assertion;
        assertion.addMethod('emit', function () {
            var values = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                values[_i - 0] = arguments[_i];
            }
            var queue = this.queue || new Queue();
            values.forEach(function (value) { return queue.push({ kind: 'value', value: value }); });
            this.queue = queue;
            ;
        });
        assertion.addProperty('then', function () { });
        assertion.addProperty('_show', function () {
            this.__show_1 = true;
        });
        assertion.addMethod('after', function (after) {
            var queue = this.queue || new Queue();
            queue.push({ kind: 'after', value: after });
            this.queue = queue;
        });
        assertion.addMethod('finish', finish(chai, utils));
        assertion.addMethod('andBe', finish(chai, utils));
        assertion.addMethod('finished', finish(chai, utils));
        assertion.addMethod('waitFor', function (forWhat, howLongInMs) {
            if (howLongInMs === void 0) { howLongInMs = 10; }
            this.waitFor = forWhat;
            this.howLongToWait = howLongInMs;
        });
    });
}
exports.pourAsync = pourAsync;
;
var finish = function (chai, utils) {
    return function (done) {
        var queue = this.queue || new Queue();
        queue.done = doneIfWaiting(done, this.waitFor, this.howLongToWait);
        var assert = this.assert;
        var show = this.__show_1;
        this._obj.plugReceiver(pullFromQueueExecuteAndCheck(chai, utils, queue, show));
    };
};
function doneIfWaiting(done, waitFor, howLongToWait) {
    if (waitFor) {
        return function () {
            setTimeout(function () {
                waitFor();
                done();
            }, howLongToWait);
        };
    }
    return done;
}
function pullFromQueueExecuteAndCheck(chai, utils, queue, show) {
    return function (value) {
        while (!queue.isDone(utils) && queue.top().kind === 'after') {
            queue.pop().value();
        }
        var item = queue.pop();
        if (show) {
            console.log('EM:', value, item);
        }
        chai.expect(item).to.not.be.undefined;
        chai.expect(value).to.deep.equal(item.value);
        var i = 0;
        while (!queue.isDone(utils) && queue.top().kind === 'after') {
            i++;
            queue.pop().value();
        }
    };
}

},{}]},{},[1]);
