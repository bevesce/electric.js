import inf = require('./interfaces');

class Wire<InOut>
	implements inf.IWire<InOut>
{
	input: inf.IEmitter<InOut>;
	output: inf.IReceiver<InOut>;
	receive: (x: InOut) => void;
	private receiverId: number;

	constructor(input: inf.IEmitter<InOut>, output: inf.IReceiver<InOut>, receive: (x: InOut) => void) {
		this.input = input;
		this.output = output;
		this.receive = receive;
		this.receiverId = this.input.plugReceiver(this);
	}

	unplug() {
		if (this.input) {
			this.input.unplugReceiver(this.receiverId);
		}
		this.input = undefined;
		this.output = undefined;
	}
}

export = Wire;
