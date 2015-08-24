export function pour(chai: any){
// expect(how_many).receivers.ofA(emitter)
//     .to.receive(x).when.emitted(x).from(emitter)
//     .to.receive(y).when.emitted(y).from(emitter)
    chai.use(function(_chai: any, utils: any) {
        var assertion = _chai.Assertion;
        assertion.addProperty('receivers', function() {
            var noReceivers = this._obj;
            var receivers = Array(noReceivers);
            var received = Array(noReceivers);
            for (var i = 0; i < noReceivers; i++) {
                (function(i: number) {
                    receivers[i] = (function(x: any) { received[i] = x });
                })(i);
            }
            utils.flag(assertion, 'receivers', receivers);
            utils.flag(assertion, 'received', received);
        });
        assertion.addMethod('ofA', function(emitter: any) {
            for (var receiver of utils.flag(assertion, 'receivers')) {
                emitter.plugReceiver(receiver);
            }
        });
        assertion.addMethod('receive', function(valueToReceive: any) {
            utils.flag(assertion, 'value expected to receive', valueToReceive);
        });
        assertion.addProperty('when', function() {

        });
        assertion.addMethod('emitted', function(valueToEmitt: any) {
            utils.flag(assertion, 'value to emit', valueToEmitt);
        });
        assertion.addMethod('from', function(emitter: any) {
            emitter.emit(utils.flag(assertion, 'value to emit'));
            var expected = utils.flag(assertion, 'value expected to receive');
            for (var received of utils.flag(assertion, 'received')) {
                this.assert(
                    received === expected,
                    'received ' + received + ' when expected ' + expected,
                    'received' + received + ' when not expected'
                )
            }
        });
    });
// expect(emitter).to.emit
//    .values(0)
//    .then.after(() => {emitter.emit(1), emmiter.emit(2)})
//    .values(1, 2)
    chai.use(function(_chai: any, utils: any) {
        var assertion = _chai.Assertion;
        assertion.addProperty('emitD', function() {
            var emitter = this._obj;
            var emitted: any[] = [];
            utils.flag(assertion, 'emitted', emitted);
            emitter.plugReceiver((x: any) => emitted.push(x));
            utils.flag(assertion, 'values', []);
        });
        assertion.addProperty('then', function() { });
        assertion.addProperty('_show', function() {
            var emitted = utils.flag(assertion, 'emitted');
        });
        assertion.addMethod('afterD', function(after: any) {
            after();
        });
        assertion.addMethod('values', function(...values: any[]) {
            var values: any[] = utils.flag(assertion, 'values').concat(values);
            utils.flag(assertion, 'values', values);
            var emitted = utils.flag(assertion, 'emitted');
            chai.expect(emitted).to.deep.equal(values);
        });
    });
};



class Queue<T> {
    data: T[];
    private index: number;
    done: () => void;
    private _isDone = false;

    constructor() {
        this.data = [];
        this.index = 0;
        this.done = function() { };
    }

    push(item: T) {
        this.data.push(item);
    }

    pop(): T {
        var result = this.data[this.index];
        this.index += 1;
        return result;
    }

    top(): T {
        return this.data[this.index];
    }

    isDone(utils: any) {
        if (this._isDone) {
            return true;
        }
        if (this.index >= this.data.length) {
            this._isDone = true;
            this.done();
            return true;
        }
        return false;
    }
}

export function pourAsync(chai: any) {
    // expect(emitter)
    //   .to.emit(0)
    //   .then.after(() => ...)
    //   .to.emit(1)
    //   .then.to.finish(done)
    chai.use(function(_chai: any, utils: any) {
        var assertion = _chai.Assertion;
        assertion.addMethod('emit', function(...values: any[]) {
            var queue = this.queue || new Queue();
            values.forEach(value => queue.push({ kind: 'value', value: value }));
            this.queue = queue;;
        });
        assertion.addProperty('then', function() { });
        assertion.addProperty('_show', function() {
            this.__show_1 = true;
        });
        assertion.addMethod('after', function(after: any) {
            var queue = this.queue || new Queue();
            queue.push({ kind: 'after', value: after });
            this.queue = queue;
        });
        assertion.addMethod('finish', finish(chai, utils));
        assertion.addMethod('andBe', finish(chai, utils));
        assertion.addMethod('finished', finish(chai, utils));
        assertion.addMethod('waitFor', function(forWhat: () => void, howLongInMs = 10) {
            this.waitFor = forWhat;
            this.howLongToWait = howLongInMs;
        });
    });
};


var finish = function(chai: any, utils: any) {
    return function(done: any) {
        var queue = this.queue || new Queue();
        queue.done = doneIfWaiting(done, this.waitFor, this.howLongToWait);
        var assert = this.assert;
        var show = this.__show_1;
        this._obj.plugReceiver(
            pullFromQueueExecuteAndCheck(chai, utils, queue, show)
        );
    }
}

function doneIfWaiting(
    done: () => void, waitFor :() => void, howLongToWait: number
) {
    if (waitFor) {
        return () => {
            setTimeout(() => {
                waitFor();
                done();
            }, howLongToWait)
        }
    }
    return done;
}

function pullFromQueueExecuteAndCheck(chai: any, utils: any, queue: any, show: any) {
    return function(value: any) {
        while (!queue.isDone(utils) && queue.top().kind === 'after') {
            queue.pop().value();
        }
        var item: any = queue.pop();
        if (show) {
            console.log('EM:', value, item);
        }
        chai.expect(value).to.deep.equal(item.value);
        var i = 0;
        while (!queue.isDone(utils) && queue.top().kind === 'after') {
            i++;
            queue.pop().value();
        }
    }
}