export declare type IDisposable = number;

export interface IElectricEvent<T> {
	happend: boolean;
	value: T;
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
	name: string;
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
	when<NewT>(switcher: {
		happens: (value: T) => boolean,
		then: (value: T) => NewT
	}): IEmitter<IElectricEvent<NewT>>;
	whenThen<NewT>(happens: (value: T) => NewT | void): IEmitter<IElectricEvent<NewT>>;
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
	change<S1, S2, S3, S4, S5, S6, S7, S8>(
	    switcher1: { when: IEmitter<IElectricEvent<S1>>, to: IEmitter<T> | ((t: T, k: S1) => IEmitter<T>) },
	    switcher2: { when: IEmitter<IElectricEvent<S2>>, to: IEmitter<T> | ((t: T, k: S2) => IEmitter<T>) },
	    switcher3: { when: IEmitter<IElectricEvent<S3>>, to: IEmitter<T> | ((t: T, k: S3) => IEmitter<T>) },
	    switcher4: { when: IEmitter<IElectricEvent<S4>>, to: IEmitter<T> | ((t: T, k: S4) => IEmitter<T>) },
	    switcher5: { when: IEmitter<IElectricEvent<S5>>, to: IEmitter<T> | ((t: T, k: S5) => IEmitter<T>) },
	    switcher6: { when: IEmitter<IElectricEvent<S6>>, to: IEmitter<T> | ((t: T, k: S6) => IEmitter<T>) },
	    switcher7: { when: IEmitter<IElectricEvent<S7>>, to: IEmitter<T> | ((t: T, k: S7) => IEmitter<T>) },
	    switcher8: { when: IEmitter<IElectricEvent<S8>>, to: IEmitter<T> | ((t: T, k: S8) => IEmitter<T>) }
	): IEmitter<T>;
	// change<S1, S2, S3, S4, S5, S6, S7, S8, S9>(
	//     switcher1: { when: IEmitter<IElectricEvent<S1>>, to: IEmitter<T> | ((t: T, k: S1) => IEmitter<T>) },
	//     switcher2: { when: IEmitter<IElectricEvent<S2>>, to: IEmitter<T> | ((t: T, k: S2) => IEmitter<T>) },
	//     switcher3: { when: IEmitter<IElectricEvent<S3>>, to: IEmitter<T> | ((t: T, k: S3) => IEmitter<T>) },
	//     switcher4: { when: IEmitter<IElectricEvent<S4>>, to: IEmitter<T> | ((t: T, k: S4) => IEmitter<T>) },
	//     switcher5: { when: IEmitter<IElectricEvent<S5>>, to: IEmitter<T> | ((t: T, k: S5) => IEmitter<T>) },
	//     switcher6: { when: IEmitter<IElectricEvent<S6>>, to: IEmitter<T> | ((t: T, k: S6) => IEmitter<T>) },
	//     switcher7: { when: IEmitter<IElectricEvent<S7>>, to: IEmitter<T> | ((t: T, k: S7) => IEmitter<T>) },
	//     switcher8: { when: IEmitter<IElectricEvent<S8>>, to: IEmitter<T> | ((t: T, k: S8) => IEmitter<T>) },
	//     switcher9: { when: IEmitter<IElectricEvent<S9>>, to: IEmitter<T> | ((t: T, k: S9) => IEmitter<T>) }
	// ): IEmitter<T>;
	// change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10>(
	//     switcher1: { when: IEmitter<IElectricEvent<S1>>, to: IEmitter<T> | ((t: T, k: S1) => IEmitter<T>) },
	//     switcher2: { when: IEmitter<IElectricEvent<S2>>, to: IEmitter<T> | ((t: T, k: S2) => IEmitter<T>) },
	//     switcher3: { when: IEmitter<IElectricEvent<S3>>, to: IEmitter<T> | ((t: T, k: S3) => IEmitter<T>) },
	//     switcher4: { when: IEmitter<IElectricEvent<S4>>, to: IEmitter<T> | ((t: T, k: S4) => IEmitter<T>) },
	//     switcher5: { when: IEmitter<IElectricEvent<S5>>, to: IEmitter<T> | ((t: T, k: S5) => IEmitter<T>) },
	//     switcher6: { when: IEmitter<IElectricEvent<S6>>, to: IEmitter<T> | ((t: T, k: S6) => IEmitter<T>) },
	//     switcher7: { when: IEmitter<IElectricEvent<S7>>, to: IEmitter<T> | ((t: T, k: S7) => IEmitter<T>) },
	//     switcher8: { when: IEmitter<IElectricEvent<S8>>, to: IEmitter<T> | ((t: T, k: S8) => IEmitter<T>) },
	//     switcher9: { when: IEmitter<IElectricEvent<S9>>, to: IEmitter<T> | ((t: T, k: S9) => IEmitter<T>) },
	//     switcher10: { when: IEmitter<IElectricEvent<S10>>, to: IEmitter<T> | ((t: T, k: S10) => IEmitter<T>) }
	// ): IEmitter<T>;
	// change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11>(
	//     switcher1: { when: IEmitter<IElectricEvent<S1>>, to: IEmitter<T> | ((t: T, k: S1) => IEmitter<T>) },
	//     switcher2: { when: IEmitter<IElectricEvent<S2>>, to: IEmitter<T> | ((t: T, k: S2) => IEmitter<T>) },
	//     switcher3: { when: IEmitter<IElectricEvent<S3>>, to: IEmitter<T> | ((t: T, k: S3) => IEmitter<T>) },
	//     switcher4: { when: IEmitter<IElectricEvent<S4>>, to: IEmitter<T> | ((t: T, k: S4) => IEmitter<T>) },
	//     switcher5: { when: IEmitter<IElectricEvent<S5>>, to: IEmitter<T> | ((t: T, k: S5) => IEmitter<T>) },
	//     switcher6: { when: IEmitter<IElectricEvent<S6>>, to: IEmitter<T> | ((t: T, k: S6) => IEmitter<T>) },
	//     switcher7: { when: IEmitter<IElectricEvent<S7>>, to: IEmitter<T> | ((t: T, k: S7) => IEmitter<T>) },
	//     switcher8: { when: IEmitter<IElectricEvent<S8>>, to: IEmitter<T> | ((t: T, k: S8) => IEmitter<T>) },
	//     switcher9: { when: IEmitter<IElectricEvent<S9>>, to: IEmitter<T> | ((t: T, k: S9) => IEmitter<T>) },
	//     switcher10: { when: IEmitter<IElectricEvent<S10>>, to: IEmitter<T> | ((t: T, k: S10) => IEmitter<T>) },
	//     switcher11: { when: IEmitter<IElectricEvent<S11>>, to: IEmitter<T> | ((t: T, k: S11) => IEmitter<T>) }
	// ): IEmitter<T>;
	// change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12>(
	//     switcher1: { when: IEmitter<IElectricEvent<S1>>, to: IEmitter<T> | ((t: T, k: S1) => IEmitter<T>) },
	//     switcher2: { when: IEmitter<IElectricEvent<S2>>, to: IEmitter<T> | ((t: T, k: S2) => IEmitter<T>) },
	//     switcher3: { when: IEmitter<IElectricEvent<S3>>, to: IEmitter<T> | ((t: T, k: S3) => IEmitter<T>) },
	//     switcher4: { when: IEmitter<IElectricEvent<S4>>, to: IEmitter<T> | ((t: T, k: S4) => IEmitter<T>) },
	//     switcher5: { when: IEmitter<IElectricEvent<S5>>, to: IEmitter<T> | ((t: T, k: S5) => IEmitter<T>) },
	//     switcher6: { when: IEmitter<IElectricEvent<S6>>, to: IEmitter<T> | ((t: T, k: S6) => IEmitter<T>) },
	//     switcher7: { when: IEmitter<IElectricEvent<S7>>, to: IEmitter<T> | ((t: T, k: S7) => IEmitter<T>) },
	//     switcher8: { when: IEmitter<IElectricEvent<S8>>, to: IEmitter<T> | ((t: T, k: S8) => IEmitter<T>) },
	//     switcher9: { when: IEmitter<IElectricEvent<S9>>, to: IEmitter<T> | ((t: T, k: S9) => IEmitter<T>) },
	//     switcher10: { when: IEmitter<IElectricEvent<S10>>, to: IEmitter<T> | ((t: T, k: S10) => IEmitter<T>) },
	//     switcher11: { when: IEmitter<IElectricEvent<S11>>, to: IEmitter<T> | ((t: T, k: S11) => IEmitter<T>) },
	//     switcher12: { when: IEmitter<IElectricEvent<S12>>, to: IEmitter<T> | ((t: T, k: S12) => IEmitter<T>) }
	// ): IEmitter<T>;
	// change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13>(
	//     switcher1: { when: IEmitter<IElectricEvent<S1>>, to: IEmitter<T> | ((t: T, k: S1) => IEmitter<T>) },
	//     switcher2: { when: IEmitter<IElectricEvent<S2>>, to: IEmitter<T> | ((t: T, k: S2) => IEmitter<T>) },
	//     switcher3: { when: IEmitter<IElectricEvent<S3>>, to: IEmitter<T> | ((t: T, k: S3) => IEmitter<T>) },
	//     switcher4: { when: IEmitter<IElectricEvent<S4>>, to: IEmitter<T> | ((t: T, k: S4) => IEmitter<T>) },
	//     switcher5: { when: IEmitter<IElectricEvent<S5>>, to: IEmitter<T> | ((t: T, k: S5) => IEmitter<T>) },
	//     switcher6: { when: IEmitter<IElectricEvent<S6>>, to: IEmitter<T> | ((t: T, k: S6) => IEmitter<T>) },
	//     switcher7: { when: IEmitter<IElectricEvent<S7>>, to: IEmitter<T> | ((t: T, k: S7) => IEmitter<T>) },
	//     switcher8: { when: IEmitter<IElectricEvent<S8>>, to: IEmitter<T> | ((t: T, k: S8) => IEmitter<T>) },
	//     switcher9: { when: IEmitter<IElectricEvent<S9>>, to: IEmitter<T> | ((t: T, k: S9) => IEmitter<T>) },
	//     switcher10: { when: IEmitter<IElectricEvent<S10>>, to: IEmitter<T> | ((t: T, k: S10) => IEmitter<T>) },
	//     switcher11: { when: IEmitter<IElectricEvent<S11>>, to: IEmitter<T> | ((t: T, k: S11) => IEmitter<T>) },
	//     switcher12: { when: IEmitter<IElectricEvent<S12>>, to: IEmitter<T> | ((t: T, k: S12) => IEmitter<T>) },
	//     switcher13: { when: IEmitter<IElectricEvent<S13>>, to: IEmitter<T> | ((t: T, k: S13) => IEmitter<T>) }
	// ): IEmitter<T>;
	// change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14>(
	//     switcher1: { when: IEmitter<IElectricEvent<S1>>, to: IEmitter<T> | ((t: T, k: S1) => IEmitter<T>) },
	//     switcher2: { when: IEmitter<IElectricEvent<S2>>, to: IEmitter<T> | ((t: T, k: S2) => IEmitter<T>) },
	//     switcher3: { when: IEmitter<IElectricEvent<S3>>, to: IEmitter<T> | ((t: T, k: S3) => IEmitter<T>) },
	//     switcher4: { when: IEmitter<IElectricEvent<S4>>, to: IEmitter<T> | ((t: T, k: S4) => IEmitter<T>) },
	//     switcher5: { when: IEmitter<IElectricEvent<S5>>, to: IEmitter<T> | ((t: T, k: S5) => IEmitter<T>) },
	//     switcher6: { when: IEmitter<IElectricEvent<S6>>, to: IEmitter<T> | ((t: T, k: S6) => IEmitter<T>) },
	//     switcher7: { when: IEmitter<IElectricEvent<S7>>, to: IEmitter<T> | ((t: T, k: S7) => IEmitter<T>) },
	//     switcher8: { when: IEmitter<IElectricEvent<S8>>, to: IEmitter<T> | ((t: T, k: S8) => IEmitter<T>) },
	//     switcher9: { when: IEmitter<IElectricEvent<S9>>, to: IEmitter<T> | ((t: T, k: S9) => IEmitter<T>) },
	//     switcher10: { when: IEmitter<IElectricEvent<S10>>, to: IEmitter<T> | ((t: T, k: S10) => IEmitter<T>) },
	//     switcher11: { when: IEmitter<IElectricEvent<S11>>, to: IEmitter<T> | ((t: T, k: S11) => IEmitter<T>) },
	//     switcher12: { when: IEmitter<IElectricEvent<S12>>, to: IEmitter<T> | ((t: T, k: S12) => IEmitter<T>) },
	//     switcher13: { when: IEmitter<IElectricEvent<S13>>, to: IEmitter<T> | ((t: T, k: S13) => IEmitter<T>) },
	//     switcher14: { when: IEmitter<IElectricEvent<S14>>, to: IEmitter<T> | ((t: T, k: S14) => IEmitter<T>) }
	// ): IEmitter<T>;
	// change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15>(
	//     switcher1: { when: IEmitter<IElectricEvent<S1>>, to: IEmitter<T> | ((t: T, k: S1) => IEmitter<T>) },
	//     switcher2: { when: IEmitter<IElectricEvent<S2>>, to: IEmitter<T> | ((t: T, k: S2) => IEmitter<T>) },
	//     switcher3: { when: IEmitter<IElectricEvent<S3>>, to: IEmitter<T> | ((t: T, k: S3) => IEmitter<T>) },
	//     switcher4: { when: IEmitter<IElectricEvent<S4>>, to: IEmitter<T> | ((t: T, k: S4) => IEmitter<T>) },
	//     switcher5: { when: IEmitter<IElectricEvent<S5>>, to: IEmitter<T> | ((t: T, k: S5) => IEmitter<T>) },
	//     switcher6: { when: IEmitter<IElectricEvent<S6>>, to: IEmitter<T> | ((t: T, k: S6) => IEmitter<T>) },
	//     switcher7: { when: IEmitter<IElectricEvent<S7>>, to: IEmitter<T> | ((t: T, k: S7) => IEmitter<T>) },
	//     switcher8: { when: IEmitter<IElectricEvent<S8>>, to: IEmitter<T> | ((t: T, k: S8) => IEmitter<T>) },
	//     switcher9: { when: IEmitter<IElectricEvent<S9>>, to: IEmitter<T> | ((t: T, k: S9) => IEmitter<T>) },
	//     switcher10: { when: IEmitter<IElectricEvent<S10>>, to: IEmitter<T> | ((t: T, k: S10) => IEmitter<T>) },
	//     switcher11: { when: IEmitter<IElectricEvent<S11>>, to: IEmitter<T> | ((t: T, k: S11) => IEmitter<T>) },
	//     switcher12: { when: IEmitter<IElectricEvent<S12>>, to: IEmitter<T> | ((t: T, k: S12) => IEmitter<T>) },
	//     switcher13: { when: IEmitter<IElectricEvent<S13>>, to: IEmitter<T> | ((t: T, k: S13) => IEmitter<T>) },
	//     switcher14: { when: IEmitter<IElectricEvent<S14>>, to: IEmitter<T> | ((t: T, k: S14) => IEmitter<T>) },
	//     switcher15: { when: IEmitter<IElectricEvent<S15>>, to: IEmitter<T> | ((t: T, k: S15) => IEmitter<T>) }
	// ): IEmitter<T>;
	// change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16>(
	//     switcher1: { when: IEmitter<IElectricEvent<S1>>, to: IEmitter<T> | ((t: T, k: S1) => IEmitter<T>) },
	//     switcher2: { when: IEmitter<IElectricEvent<S2>>, to: IEmitter<T> | ((t: T, k: S2) => IEmitter<T>) },
	//     switcher3: { when: IEmitter<IElectricEvent<S3>>, to: IEmitter<T> | ((t: T, k: S3) => IEmitter<T>) },
	//     switcher4: { when: IEmitter<IElectricEvent<S4>>, to: IEmitter<T> | ((t: T, k: S4) => IEmitter<T>) },
	//     switcher5: { when: IEmitter<IElectricEvent<S5>>, to: IEmitter<T> | ((t: T, k: S5) => IEmitter<T>) },
	//     switcher6: { when: IEmitter<IElectricEvent<S6>>, to: IEmitter<T> | ((t: T, k: S6) => IEmitter<T>) },
	//     switcher7: { when: IEmitter<IElectricEvent<S7>>, to: IEmitter<T> | ((t: T, k: S7) => IEmitter<T>) },
	//     switcher8: { when: IEmitter<IElectricEvent<S8>>, to: IEmitter<T> | ((t: T, k: S8) => IEmitter<T>) },
	//     switcher9: { when: IEmitter<IElectricEvent<S9>>, to: IEmitter<T> | ((t: T, k: S9) => IEmitter<T>) },
	//     switcher10: { when: IEmitter<IElectricEvent<S10>>, to: IEmitter<T> | ((t: T, k: S10) => IEmitter<T>) },
	//     switcher11: { when: IEmitter<IElectricEvent<S11>>, to: IEmitter<T> | ((t: T, k: S11) => IEmitter<T>) },
	//     switcher12: { when: IEmitter<IElectricEvent<S12>>, to: IEmitter<T> | ((t: T, k: S12) => IEmitter<T>) },
	//     switcher13: { when: IEmitter<IElectricEvent<S13>>, to: IEmitter<T> | ((t: T, k: S13) => IEmitter<T>) },
	//     switcher14: { when: IEmitter<IElectricEvent<S14>>, to: IEmitter<T> | ((t: T, k: S14) => IEmitter<T>) },
	//     switcher15: { when: IEmitter<IElectricEvent<S15>>, to: IEmitter<T> | ((t: T, k: S15) => IEmitter<T>) },
	//     switcher16: { when: IEmitter<IElectricEvent<S16>>, to: IEmitter<T> | ((t: T, k: S16) => IEmitter<T>) }
	// ): IEmitter<T>;
	// change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17>(
	//     switcher1: { when: IEmitter<IElectricEvent<S1>>, to: IEmitter<T> | ((t: T, k: S1) => IEmitter<T>) },
	//     switcher2: { when: IEmitter<IElectricEvent<S2>>, to: IEmitter<T> | ((t: T, k: S2) => IEmitter<T>) },
	//     switcher3: { when: IEmitter<IElectricEvent<S3>>, to: IEmitter<T> | ((t: T, k: S3) => IEmitter<T>) },
	//     switcher4: { when: IEmitter<IElectricEvent<S4>>, to: IEmitter<T> | ((t: T, k: S4) => IEmitter<T>) },
	//     switcher5: { when: IEmitter<IElectricEvent<S5>>, to: IEmitter<T> | ((t: T, k: S5) => IEmitter<T>) },
	//     switcher6: { when: IEmitter<IElectricEvent<S6>>, to: IEmitter<T> | ((t: T, k: S6) => IEmitter<T>) },
	//     switcher7: { when: IEmitter<IElectricEvent<S7>>, to: IEmitter<T> | ((t: T, k: S7) => IEmitter<T>) },
	//     switcher8: { when: IEmitter<IElectricEvent<S8>>, to: IEmitter<T> | ((t: T, k: S8) => IEmitter<T>) },
	//     switcher9: { when: IEmitter<IElectricEvent<S9>>, to: IEmitter<T> | ((t: T, k: S9) => IEmitter<T>) },
	//     switcher10: { when: IEmitter<IElectricEvent<S10>>, to: IEmitter<T> | ((t: T, k: S10) => IEmitter<T>) },
	//     switcher11: { when: IEmitter<IElectricEvent<S11>>, to: IEmitter<T> | ((t: T, k: S11) => IEmitter<T>) },
	//     switcher12: { when: IEmitter<IElectricEvent<S12>>, to: IEmitter<T> | ((t: T, k: S12) => IEmitter<T>) },
	//     switcher13: { when: IEmitter<IElectricEvent<S13>>, to: IEmitter<T> | ((t: T, k: S13) => IEmitter<T>) },
	//     switcher14: { when: IEmitter<IElectricEvent<S14>>, to: IEmitter<T> | ((t: T, k: S14) => IEmitter<T>) },
	//     switcher15: { when: IEmitter<IElectricEvent<S15>>, to: IEmitter<T> | ((t: T, k: S15) => IEmitter<T>) },
	//     switcher16: { when: IEmitter<IElectricEvent<S16>>, to: IEmitter<T> | ((t: T, k: S16) => IEmitter<T>) },
	//     switcher17: { when: IEmitter<IElectricEvent<S17>>, to: IEmitter<T> | ((t: T, k: S17) => IEmitter<T>) }
	// ): IEmitter<T>;
	// change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18>(
	//     switcher1: { when: IEmitter<IElectricEvent<S1>>, to: IEmitter<T> | ((t: T, k: S1) => IEmitter<T>) },
	//     switcher2: { when: IEmitter<IElectricEvent<S2>>, to: IEmitter<T> | ((t: T, k: S2) => IEmitter<T>) },
	//     switcher3: { when: IEmitter<IElectricEvent<S3>>, to: IEmitter<T> | ((t: T, k: S3) => IEmitter<T>) },
	//     switcher4: { when: IEmitter<IElectricEvent<S4>>, to: IEmitter<T> | ((t: T, k: S4) => IEmitter<T>) },
	//     switcher5: { when: IEmitter<IElectricEvent<S5>>, to: IEmitter<T> | ((t: T, k: S5) => IEmitter<T>) },
	//     switcher6: { when: IEmitter<IElectricEvent<S6>>, to: IEmitter<T> | ((t: T, k: S6) => IEmitter<T>) },
	//     switcher7: { when: IEmitter<IElectricEvent<S7>>, to: IEmitter<T> | ((t: T, k: S7) => IEmitter<T>) },
	//     switcher8: { when: IEmitter<IElectricEvent<S8>>, to: IEmitter<T> | ((t: T, k: S8) => IEmitter<T>) },
	//     switcher9: { when: IEmitter<IElectricEvent<S9>>, to: IEmitter<T> | ((t: T, k: S9) => IEmitter<T>) },
	//     switcher10: { when: IEmitter<IElectricEvent<S10>>, to: IEmitter<T> | ((t: T, k: S10) => IEmitter<T>) },
	//     switcher11: { when: IEmitter<IElectricEvent<S11>>, to: IEmitter<T> | ((t: T, k: S11) => IEmitter<T>) },
	//     switcher12: { when: IEmitter<IElectricEvent<S12>>, to: IEmitter<T> | ((t: T, k: S12) => IEmitter<T>) },
	//     switcher13: { when: IEmitter<IElectricEvent<S13>>, to: IEmitter<T> | ((t: T, k: S13) => IEmitter<T>) },
	//     switcher14: { when: IEmitter<IElectricEvent<S14>>, to: IEmitter<T> | ((t: T, k: S14) => IEmitter<T>) },
	//     switcher15: { when: IEmitter<IElectricEvent<S15>>, to: IEmitter<T> | ((t: T, k: S15) => IEmitter<T>) },
	//     switcher16: { when: IEmitter<IElectricEvent<S16>>, to: IEmitter<T> | ((t: T, k: S16) => IEmitter<T>) },
	//     switcher17: { when: IEmitter<IElectricEvent<S17>>, to: IEmitter<T> | ((t: T, k: S17) => IEmitter<T>) },
	//     switcher18: { when: IEmitter<IElectricEvent<S18>>, to: IEmitter<T> | ((t: T, k: S18) => IEmitter<T>) }
	// ): IEmitter<T>;
	// change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18, S19>(
	//     switcher1: { when: IEmitter<IElectricEvent<S1>>, to: IEmitter<T> | ((t: T, k: S1) => IEmitter<T>) },
	//     switcher2: { when: IEmitter<IElectricEvent<S2>>, to: IEmitter<T> | ((t: T, k: S2) => IEmitter<T>) },
	//     switcher3: { when: IEmitter<IElectricEvent<S3>>, to: IEmitter<T> | ((t: T, k: S3) => IEmitter<T>) },
	//     switcher4: { when: IEmitter<IElectricEvent<S4>>, to: IEmitter<T> | ((t: T, k: S4) => IEmitter<T>) },
	//     switcher5: { when: IEmitter<IElectricEvent<S5>>, to: IEmitter<T> | ((t: T, k: S5) => IEmitter<T>) },
	//     switcher6: { when: IEmitter<IElectricEvent<S6>>, to: IEmitter<T> | ((t: T, k: S6) => IEmitter<T>) },
	//     switcher7: { when: IEmitter<IElectricEvent<S7>>, to: IEmitter<T> | ((t: T, k: S7) => IEmitter<T>) },
	//     switcher8: { when: IEmitter<IElectricEvent<S8>>, to: IEmitter<T> | ((t: T, k: S8) => IEmitter<T>) },
	//     switcher9: { when: IEmitter<IElectricEvent<S9>>, to: IEmitter<T> | ((t: T, k: S9) => IEmitter<T>) },
	//     switcher10: { when: IEmitter<IElectricEvent<S10>>, to: IEmitter<T> | ((t: T, k: S10) => IEmitter<T>) },
	//     switcher11: { when: IEmitter<IElectricEvent<S11>>, to: IEmitter<T> | ((t: T, k: S11) => IEmitter<T>) },
	//     switcher12: { when: IEmitter<IElectricEvent<S12>>, to: IEmitter<T> | ((t: T, k: S12) => IEmitter<T>) },
	//     switcher13: { when: IEmitter<IElectricEvent<S13>>, to: IEmitter<T> | ((t: T, k: S13) => IEmitter<T>) },
	//     switcher14: { when: IEmitter<IElectricEvent<S14>>, to: IEmitter<T> | ((t: T, k: S14) => IEmitter<T>) },
	//     switcher15: { when: IEmitter<IElectricEvent<S15>>, to: IEmitter<T> | ((t: T, k: S15) => IEmitter<T>) },
	//     switcher16: { when: IEmitter<IElectricEvent<S16>>, to: IEmitter<T> | ((t: T, k: S16) => IEmitter<T>) },
	//     switcher17: { when: IEmitter<IElectricEvent<S17>>, to: IEmitter<T> | ((t: T, k: S17) => IEmitter<T>) },
	//     switcher18: { when: IEmitter<IElectricEvent<S18>>, to: IEmitter<T> | ((t: T, k: S18) => IEmitter<T>) },
	//     switcher19: { when: IEmitter<IElectricEvent<S19>>, to: IEmitter<T> | ((t: T, k: S19) => IEmitter<T>) }
	// ): IEmitter<T>;
	// change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18, S19, S20>(
	//     switcher1: { when: IEmitter<IElectricEvent<S1>>, to: IEmitter<T> | ((t: T, k: S1) => IEmitter<T>) },
	//     switcher2: { when: IEmitter<IElectricEvent<S2>>, to: IEmitter<T> | ((t: T, k: S2) => IEmitter<T>) },
	//     switcher3: { when: IEmitter<IElectricEvent<S3>>, to: IEmitter<T> | ((t: T, k: S3) => IEmitter<T>) },
	//     switcher4: { when: IEmitter<IElectricEvent<S4>>, to: IEmitter<T> | ((t: T, k: S4) => IEmitter<T>) },
	//     switcher5: { when: IEmitter<IElectricEvent<S5>>, to: IEmitter<T> | ((t: T, k: S5) => IEmitter<T>) },
	//     switcher6: { when: IEmitter<IElectricEvent<S6>>, to: IEmitter<T> | ((t: T, k: S6) => IEmitter<T>) },
	//     switcher7: { when: IEmitter<IElectricEvent<S7>>, to: IEmitter<T> | ((t: T, k: S7) => IEmitter<T>) },
	//     switcher8: { when: IEmitter<IElectricEvent<S8>>, to: IEmitter<T> | ((t: T, k: S8) => IEmitter<T>) },
	//     switcher9: { when: IEmitter<IElectricEvent<S9>>, to: IEmitter<T> | ((t: T, k: S9) => IEmitter<T>) },
	//     switcher10: { when: IEmitter<IElectricEvent<S10>>, to: IEmitter<T> | ((t: T, k: S10) => IEmitter<T>) },
	//     switcher11: { when: IEmitter<IElectricEvent<S11>>, to: IEmitter<T> | ((t: T, k: S11) => IEmitter<T>) },
	//     switcher12: { when: IEmitter<IElectricEvent<S12>>, to: IEmitter<T> | ((t: T, k: S12) => IEmitter<T>) },
	//     switcher13: { when: IEmitter<IElectricEvent<S13>>, to: IEmitter<T> | ((t: T, k: S13) => IEmitter<T>) },
	//     switcher14: { when: IEmitter<IElectricEvent<S14>>, to: IEmitter<T> | ((t: T, k: S14) => IEmitter<T>) },
	//     switcher15: { when: IEmitter<IElectricEvent<S15>>, to: IEmitter<T> | ((t: T, k: S15) => IEmitter<T>) },
	//     switcher16: { when: IEmitter<IElectricEvent<S16>>, to: IEmitter<T> | ((t: T, k: S16) => IEmitter<T>) },
	//     switcher17: { when: IEmitter<IElectricEvent<S17>>, to: IEmitter<T> | ((t: T, k: S17) => IEmitter<T>) },
	//     switcher18: { when: IEmitter<IElectricEvent<S18>>, to: IEmitter<T> | ((t: T, k: S18) => IEmitter<T>) },
	//     switcher19: { when: IEmitter<IElectricEvent<S19>>, to: IEmitter<T> | ((t: T, k: S19) => IEmitter<T>) },
	//     switcher20: { when: IEmitter<IElectricEvent<S20>>, to: IEmitter<T> | ((t: T, k: S20) => IEmitter<T>) }
	// ): IEmitter<T>;
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
