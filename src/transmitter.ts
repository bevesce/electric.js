import emitter = require('./emitter');
import Wire = require('./wire');

class Transmitter<In, Out>
	extends emitter.Transformator<In, Out>
{
	wire(emitter: emitter.Emitter<any>) {
		var index = this._wires.length;
		this._wires[index] = new Wire(
			emitter,
			this,
			((index: number) => (x: In) => this.receiveOn(x, index))(index)
		);
		return this._wires[index];
	}

	dropEmitters() {
		this._wires.forEach(w => w.input.stabilize());
		this._wires = [];
	}
}


function transmitter<T>(initialValue: T) {
	var t = new Transmitter([], initialValue, undefined);
	t.name = '? | transmitter'
	return t;
}

export = transmitter;
