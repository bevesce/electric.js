var eevent = require('./electric-event');
var Queue = (function () {
    function Queue() {
        this._data = [];
    }
    Queue.empty = function () {
        return new Queue();
    };
    Queue.prototype.add = function (f, v) {
        this._data.push({ f: f, v: v });
    };
    Queue.prototype.dispatch = function () {
        while (this._data.length > 0) {
            var fv = this._data[this._data.length - 1];
            if (fv.v.__$isevent$) {
                this._dispatchEvent(fv.f, fv.v);
            }
            else {
                this._dispatchValue(fv.f, fv.v);
            }
        }
    };
    Queue.prototype._dispatchEvent = function (f, v) {
        if (v.happened) {
            f(v);
            f(eevent.notHappened);
            this._clear(f);
        }
        else {
            this._data.splice(this._data.length - 1, 1);
        }
    };
    Queue.prototype._dispatchValue = function (f, v) {
        f(v);
        this._clear(f);
    };
    Queue.prototype._clear = function (f) {
        this._data = this._data.filter(function (fv) { return fv.f !== f; });
    };
    return Queue;
})();
module.exports = Queue;
