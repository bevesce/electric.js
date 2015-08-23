function pour(chai) {
    // expect(how_many).receivers.ofA(emitter)
    //     .to.receive(x).when.emitted(x).from(emitter)
    //     .to.receive(y).when.emitted(y).from(emitter)
    chai.use(function (_chai, utils) {
        var assertion = _chai.Assertion;
        assertion.addProperty('receivers', function () {
            var noReceivers = this._obj;
            var receivers = Array(noReceivers);
            var received = Array(noReceivers);
            for (var i = 0; i < noReceivers; i++) {
                (function (i) {
                    receivers[i] = (function (x) { received[i] = x; });
                })(i);
            }
            utils.flag(assertion, 'receivers', receivers);
            utils.flag(assertion, 'received', received);
        });
        assertion.addMethod('ofA', function (emitter) {
            for (var _i = 0, _a = utils.flag(assertion, 'receivers'); _i < _a.length; _i++) {
                var receiver = _a[_i];
                emitter.plugReceiver(receiver);
            }
        });
        assertion.addMethod('receive', function (valueToReceive) {
            utils.flag(assertion, 'value expected to receive', valueToReceive);
        });
        assertion.addProperty('when', function () {
        });
        assertion.addMethod('emitted', function (valueToEmitt) {
            utils.flag(assertion, 'value to emit', valueToEmitt);
        });
        assertion.addMethod('from', function (emitter) {
            emitter.emit(utils.flag(assertion, 'value to emit'));
            var expected = utils.flag(assertion, 'value expected to receive');
            for (var _i = 0, _a = utils.flag(assertion, 'received'); _i < _a.length; _i++) {
                var received = _a[_i];
                this.assert(received === expected, 'received ' + received + ' when expected ' + expected, 'received' + received + ' when not expected');
            }
        });
    });
    // expect(emitter).to.emit
    //    .values(0)
    //    .then.after(() => {emitter.emit(1), emmiter.emit(2)})
    //    .values(1, 2)
    chai.use(function (_chai, utils) {
        var assertion = _chai.Assertion;
        assertion.addProperty('emitD', function () {
            var emitter = this._obj;
            var emitted = [];
            utils.flag(assertion, 'emitted', emitted);
            emitter.plugReceiver(function (x) { return emitted.push(x); });
            utils.flag(assertion, 'values', []);
        });
        assertion.addProperty('then', function () { });
        assertion.addProperty('_show', function () {
            var emitted = utils.flag(assertion, 'emitted');
        });
        assertion.addMethod('afterD', function (after) {
            after();
        });
        assertion.addMethod('values', function () {
            var values = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                values[_i - 0] = arguments[_i];
            }
            var values = utils.flag(assertion, 'values').concat(values);
            utils.flag(assertion, 'values', values);
            var emitted = utils.flag(assertion, 'emitted');
            chai.expect(emitted).to.deep.equal(values);
        });
    });
}
exports.pour = pour;
;
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
        assertion.addMethod('emit', function (value) {
            var queue = this.queue || new Queue();
            queue.push({ kind: 'value', value: value });
            this.queue = queue;
            ;
        });
        assertion.addProperty('then', function () { });
        assertion.addMethod('after', function (after) {
            var queue = this.queue || new Queue();
            queue.push({ kind: 'after', value: after });
            this.queue = queue;
            ;
        });
        assertion.addMethod('finish', function (done) {
            var queue = this.queue || new Queue();
            queue.done = done || queue.done;
            var assert = this.assert;
            this._obj.plugReceiver(function (value) {
                while (!queue.isDone(utils) && queue.top().kind === 'after') {
                    queue.pop().value();
                }
                var item = queue.pop();
                console.log('EM:', value, item);
                chai.expect(value).to.deep.equal(item.value);
                var i = 0;
                while (!queue.isDone(utils) && queue.top().kind === 'after') {
                    i++;
                    console.log('w');
                    queue.pop().value();
                }
            });
        });
    });
}
exports.pourAsync = pourAsync;
;
