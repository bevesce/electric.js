
// class Placeholder<Out>
// 	extends Emitter<Out>
// 	implements inf.IEmitter<Out>
// {
// 	private _emitter: inf.IEmitter<Out>;
// 	private _actions: Array<((emitter: inf.IEmitter<Out>) => any)> = [];
// 	private _initialValue: Out;

// 	constructor(initialValue: Out) {
// 		super(initialValue);
// 		this._initialValue = initialValue;
// 	}

// 	is(emitter: inf.IEmitter<Out>) {
// 		this._emitter = emitter;
// 		for (var action of this._actions) {
// 			action(this._emitter);
// 		}
// 	}

// 	private _doOrQueue(
// 		action: (emitter: inf.IEmitter<Out>) => any,
// 		eventually?: () => void
// 	): any {
// 		if (this._emitter) {
// 			return action(this._emitter);
// 		}
// 		else {
// 			this._actions.push(action);
// 			if (eventually) {
// 				eventually();
// 			}
// 		}
// 	}

// 	plugReceiver(receiver: inf.IReceiverFunction<Out> | inf.IReceiver<Out> | inf.IWire<Out>): inf.IDisposable {
// 		return this._doOrQueue(
// 			(emitter) => emitter.plugReceiver(receiver),
// 			() => this._dispatchToReceiver(this._initialValue, receiver)
// 		);
// 	};

// 	unplugReceiver(index: inf.IDisposable): void {
// 		this._doOrQueue(
// 			(emitter) => emitter.unplugReceiver(index)
// 		);
// 	}

// 	dirtyCurrentValue(): Out {
// 		if (this._emitter) {
// 			return this._emitter.dirtyCurrentValue();
// 		}
// 		return this._initialValue;
// 	}

// 	stabilize(): void {
// 		this._doOrQueue(
// 			(emitter) => emitter.stabilize()
// 		);
// 	}

// 	setReleaseResources(releaseResources: () => void): void {
// 		this._doOrQueue(
// 			(emitter) => emitter.setReleaseResources(releaseResources)
// 		)
// 	}
// }

// export function placeholder<T>(initialValue: T) {
// 	return new Placeholder(initialValue);
// }
