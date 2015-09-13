import inf = require('./interfaces');
import emitter = require('./emitter');
import Wire = require('./wire');

class Transmitter<In>
	extends emitter.Transformator<In>
{
	wire(emitter: inf.IEmitter<any>) {
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
	var t = new Transmitter([], undefined, initialValue);
	t.name = '? | transmitter'
	return t;
}

export = transmitter;
