var emitter = require('./emitter');
var Device = (function () {
    function Device(createDevice, name) {
        var _this = this;
        this.name = name || 'device';
        this._inputs = {};
        this.out = {};
        createDevice(function (name, initialValue) { return _this._getOrCreateInput(name, initialValue); }, function (name, emitter) { return _this._plugOutput(name, emitter); });
    }
    Device.prototype._getOrCreateInput = function (name, initialValue) {
        if (!this._inputs[name]) {
            this._inputs[name] = emitter.placeholder(initialValue);
        }
        return this._inputs[name];
    };
    Device.prototype._plugOutput = function (name, emitter) {
        this.out[name] = emitter;
    };
    Device.prototype.plug = function (inputs) {
        for (var key in inputs) {
            if (inputs.hasOwnProperty(key) && this._inputs[key]) {
                this._inputs[key].is(inputs[key]);
            }
        }
    };
    return Device;
})();
function create(name, createDevice) {
    if (createDevice === undefined) {
        createDevice = name;
        name = undefined;
    }
    return new Device(createDevice, name);
}
exports.create = create;
;
