import inf = require('./interfaces');

class Wire<InOut>
	implements inf.IWire<InOut>
{
	input: inf.IEmitter<InOut>;
	output: inf.IReceiver<InOut>;
	// receive: (x: InOut) => void;
	private _futureReceive: (x: InOut) => void;
	private _set: (x: InOut) => void;
	private receiverId: number;

	constructor(
		input: inf.IEmitter<InOut>,
		output: inf.IReceiver<InOut>,
		receive: (x: InOut) => void,
		set?: (x: InOut) => void
	) {
		this.input = input;
		this.output = output;
		if (set) {
			this._set = set
			this._futureReceive = receive;
		}
		else {
			this.receive = receive;
		}
		this.receiverId = this.input.plugReceiver(this);
	}

	receive(x: InOut) {
		this._set(x);
		this._set = undefined;
		this.receive = this._futureReceive;
		this._futureReceive = undefined;
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
