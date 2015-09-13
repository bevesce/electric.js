import Emitter = require('./interfaces/emitter');
import receiver = require('./interfaces/receiver');


class Wire<InOut> {
	input: Emitter<InOut>;
	output: receiver.Receiver<InOut>;
	name: string;

	private _futureReceive: (x: InOut) => void;
	private _set: (x: InOut) => void;
	private _receiverId: number;

	constructor(
		input: Emitter<InOut>,
		output: receiver.Receiver<InOut>,
		receive: (x: InOut) => void,
		set?: (x: InOut) => void
	) {
		this.input = input;
		this.output = output;
		this.name = 'w';
		if (set) {
			this._set = set
			this._futureReceive = receive;
		}
		else {
			this.receive = receive;
		}
		this._receiverId = this.input.plugReceiver(this);
	}

	toString() {
		return `${this.input.toString()} -${this.name}- ${this.output.toString()}`
	}

	receive(x: InOut) {
		this._set(x);
		this._set = undefined;
		this.receive = this._futureReceive;
		this._futureReceive = undefined;
	}

	unplug() {
		if (this.input) {
			this.input.unplugReceiver(this._receiverId);
		}
		this.input = undefined;
		this.output = undefined;
	}
}

export = Wire;
