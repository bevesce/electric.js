var Wire = (function () {
    function Wire(input, output, receive) {
        this.input = input;
        this.output = output;
        this.receive = receive;
        this.receiverId = this.input.plugReceiver(this);
    }
    Wire.prototype.unplug = function () {
        if (this.input) {
            this.input.unplugReceiver(this.receiverId);
        }
        this.input = undefined;
        this.output = undefined;
    };
    return Wire;
})();
module.exports = Wire;
