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
    return function boil(value: any) {
        while (!queue.isDone(utils) && queue.top().kind === 'after') {
            queue.pop().value();
        }
        var item: any = queue.pop();
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
    }
}