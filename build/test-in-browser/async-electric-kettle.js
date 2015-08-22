function Queue() {
    this.data = [];
    this.index = 0;
    this.done = function(){};
}

Queue.prototype.push = function(item) {
    this.data.push(item);
}

Queue.prototype.pop = function() {
    var result = this.data[this.index];
    this.index += 1;
    return result;
}

Queue.prototype.top = function() {
    return this.data[this.index];
}

Queue.prototype.isDone = function() {
    if (this.index >= this.data.length) {
        this.data = [];
        this.index = 0;
        this.done();
        return true;
    }
    return false;
}

function pour(chai) {
    // expect(emitter).to.emit
    //    .values(0)
    //    .then.after(() => {emitter.emit(1), emmiter.emit(2)})
    //    .values(1, 2)
    chai.use(function (_chai, utils) {
        var assertion = _chai.Assertion;
        assertion.addMethod('emit', function (value) {
            var queue = utils.flag(assertion, 'queue') || new Queue();
            queue.push({kind: 'value', value: value});
            utils.flag(assertion, 'queue', queue);
        });
        assertion.addProperty('then', function () {});
        assertion.addProperty('_x', function () {
            var queue = utils.flag(assertion, 'queue') || new Queue();
            console.log(queue.index, queue.data);
        });
        assertion.addMethod('after', function (after) {
            var queue = utils.flag(assertion, 'queue') || new Queue();
            queue.push({kind: 'after', value: after});
            utils.flag(assertion, 'queue', queue);
        });
        assertion.addMethod('finish', function(done) {
            var queue = utils.flag(assertion, 'queue') || new Queue();
            queue.done = done || queue.done;
            var assert = this.assert;
            this._obj.plugReceiver(function(value) {
                while (!queue.isDone() && queue.top().kind === 'after') {
                    queue.pop().value();
                }
                var item = queue.pop();

                chai.expect(value).to.deep.equal(item.value);

                while (!queue.isDone() && queue.top().kind === 'after') {
                    queue.pop().value();
                }
            });
        });
    });
};
