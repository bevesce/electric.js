import eevent = require('./electric-event');

export = Queue;

class Queue {
	private _data: any[];

	static empty() {
		return new Queue();
	}

	constructor() {
		this._data = [];
	}

	add(f: any, v: any) {
		this._data.push({f: f, v: v});
	}

	dispatch() {
		while (this._data.length > 0) {
			var fv = this._data[this._data.length - 1];
			if (fv.v.__$isevent$) {
				this._dispatchEvent(fv.f, fv.v);
			}
			else {
				this._dispatchValue(fv.f, fv.v);
			}
		}
	}

	private _dispatchEvent(f: any, v: any) {
		if (v.happened) {
			f(v);
			f(eevent.notHappened);
			this._clear(f);
		}
		else {
			this._data.splice(this._data.length - 1, 1);
		}
	}

	private _dispatchValue(f: any, v: any) {
		f(v);
		this._clear(f);
	}

	private _clear(f: any) {
		this._data = this._data.filter(fv => fv.f !== f);
	}

}

