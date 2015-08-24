var emitter = require('../emitter');
function fromPromise(promise) {
    var e = emitter.manual({ status: 'pending' });
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
module.exports = fromPromise;
