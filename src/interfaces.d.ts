export declare type IDisposable = number;

export interface IElectricEvent<T> {
	happend: boolean;
	value?: T;
	map<Out>(f: (v: T) => Out): IElectricEvent<Out>
}



export interface IReceiver<T> {
	plugEmitter(emitter: IEmitter<T>): IDisposable;
	wire(emitter: IEmitter<T>): IWire<T>;
}

export interface IReceiverFunction<T> {
	(value: T): void;
}

export interface IWire<T> {
	receive(value: T): void;
}

export interface IEmitter<T> {
	name: string;
	plugReceiver(receiver: IReceiverFunction<T> | IReceiver<T> | IWire<T>): IDisposable;
	unplugReceiver(index: IDisposable): void;
	dirtyCurrentValue(): T;
	stabilize(): void;
	setReleaseResources(releaseResources: () => void): void;
	setEquals(equals: (x: T, y: T) => boolean): void;
	// transformators construction
	map<NewT>(mapping: (v: T) => NewT): IEmitter<NewT>;
	filter(initialValue: T, predicate: (v: T) => boolean): IEmitter<T>;
	filterMap<NewT>(initialValue: T, mapping: (v: T) => NewT | void): IEmitter<NewT>;
	transformTime(initialValue: T, timeShift: (t: number) => number, t0?: number): IEmitter<T>;
	accumulate<NewT>(initialValue: NewT, accumulator: (acc: NewT, value: T) => NewT): IEmitter<NewT>;
	merge(...emitters: IEmitter<T>[]): IEmitter<T>;
	sample(initialValue: T, samplingEvent: IEmitter<IElectricEvent<any>>): IEmitter<T>;
	change<S1>(
	    switcher1: { when: IEmitter<IElectricEvent<S1>>, to: IEmitter<T> | ((t: T, k: S1) => IEmitter<T>) }
	): IEmitter<T>;
	change<S1, S2>(
	    switcher1: { when: IEmitter<IElectricEvent<S1>>, to: IEmitter<T> | ((t: T, k: S1) => IEmitter<T>) },
	    switcher2: { when: IEmitter<IElectricEvent<S2>>, to: IEmitter<T> | ((t: T, k: S2) => IEmitter<T>) }
	): IEmitter<T>;
	change<S1, S2, S3>(
	    switcher1: { when: IEmitter<IElectricEvent<S1>>, to: IEmitter<T> | ((t: T, k: S1) => IEmitter<T>) },
	    switcher2: { when: IEmitter<IElectricEvent<S2>>, to: IEmitter<T> | ((t: T, k: S2) => IEmitter<T>) },
	    switcher3: { when: IEmitter<IElectricEvent<S3>>, to: IEmitter<T> | ((t: T, k: S3) => IEmitter<T>) }
	): IEmitter<T>;
	change<S1, S2, S3, S4>(
	    switcher1: { when: IEmitter<IElectricEvent<S1>>, to: IEmitter<T> | ((t: T, k: S1) => IEmitter<T>) },
	    switcher2: { when: IEmitter<IElectricEvent<S2>>, to: IEmitter<T> | ((t: T, k: S2) => IEmitter<T>) },
	    switcher3: { when: IEmitter<IElectricEvent<S3>>, to: IEmitter<T> | ((t: T, k: S3) => IEmitter<T>) },
	    switcher4: { when: IEmitter<IElectricEvent<S4>>, to: IEmitter<T> | ((t: T, k: S4) => IEmitter<T>) }
	): IEmitter<T>;
	change<S1, S2, S3, S4, S5>(
	    switcher1: { when: IEmitter<IElectricEvent<S1>>, to: IEmitter<T> | ((t: T, k: S1) => IEmitter<T>) },
	    switcher2: { when: IEmitter<IElectricEvent<S2>>, to: IEmitter<T> | ((t: T, k: S2) => IEmitter<T>) },
	    switcher3: { when: IEmitter<IElectricEvent<S3>>, to: IEmitter<T> | ((t: T, k: S3) => IEmitter<T>) },
	    switcher4: { when: IEmitter<IElectricEvent<S4>>, to: IEmitter<T> | ((t: T, k: S4) => IEmitter<T>) },
	    switcher5: { when: IEmitter<IElectricEvent<S5>>, to: IEmitter<T> | ((t: T, k: S5) => IEmitter<T>) }
	): IEmitter<T>;
	change<S1, S2, S3, S4, S5, S6>(
	    switcher1: { when: IEmitter<IElectricEvent<S1>>, to: IEmitter<T> | ((t: T, k: S1) => IEmitter<T>) },
	    switcher2: { when: IEmitter<IElectricEvent<S2>>, to: IEmitter<T> | ((t: T, k: S2) => IEmitter<T>) },
	    switcher3: { when: IEmitter<IElectricEvent<S3>>, to: IEmitter<T> | ((t: T, k: S3) => IEmitter<T>) },
	    switcher4: { when: IEmitter<IElectricEvent<S4>>, to: IEmitter<T> | ((t: T, k: S4) => IEmitter<T>) },
	    switcher5: { when: IEmitter<IElectricEvent<S5>>, to: IEmitter<T> | ((t: T, k: S5) => IEmitter<T>) },
	    switcher6: { when: IEmitter<IElectricEvent<S6>>, to: IEmitter<T> | ((t: T, k: S6) => IEmitter<T>) }
	): IEmitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7>(
	    switcher1: { when: IEmitter<IElectricEvent<S1>>, to: IEmitter<T> | ((t: T, k: S1) => IEmitter<T>) },
	    switcher2: { when: IEmitter<IElectricEvent<S2>>, to: IEmitter<T> | ((t: T, k: S2) => IEmitter<T>) },
	    switcher3: { when: IEmitter<IElectricEvent<S3>>, to: IEmitter<T> | ((t: T, k: S3) => IEmitter<T>) },
	    switcher4: { when: IEmitter<IElectricEvent<S4>>, to: IEmitter<T> | ((t: T, k: S4) => IEmitter<T>) },
	    switcher5: { when: IEmitter<IElectricEvent<S5>>, to: IEmitter<T> | ((t: T, k: S5) => IEmitter<T>) },
	    switcher6: { when: IEmitter<IElectricEvent<S6>>, to: IEmitter<T> | ((t: T, k: S6) => IEmitter<T>) },
	    switcher7: { when: IEmitter<IElectricEvent<S7>>, to: IEmitter<T> | ((t: T, k: S7) => IEmitter<T>) }
	): IEmitter<T>;
}

export interface IEmitterFunction<T> {
	(value: T): void
}

export interface IManualEmitter<T>
	extends IEmitter<T>
{
	emit(value: T): void;
	impulse(value: T): void;
}

export interface ITransformator<In, Out>
	extends IReceiver<In>, IEmitter<Out> {

}

export interface IPlaceholder<Out>
	extends IEmitter<Out> {
	is(emitter: IEmitter<Out>): void;
}
