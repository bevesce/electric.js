define(["require", "exports", '../emitter'], function (require, exports, emitter) {
    exports.emitter = emitter;
    function fromPromise(promise) {
        var e = exports.emitter.manual({ status: 'pending' });
        e.name = 'promise *' + promise + '*';
        promise.then(function (value) {
            e.emit({ status: 'fulfilled', data: value });
            e.stabilize();
        }, function (err) {
            e.emit({ status: 'rejected', data: err });
            e.stabilize();
        });
        return e;
    }
    return fromPromise;
});
