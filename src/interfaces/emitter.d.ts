import ElectricEvent = require('../electric-event');
import Wire = require('../wire');
import receiver = require('./receiver');

export = Emitter;


interface Emitter<T> {
	name: string;
	toString(showCurrentValue?: boolean): string;

	plugReceiver(receiver: receiver.ReceiverFunction<T> | receiver.Receiver<T> | Wire<T>): number;
	unplugReceiver(index: number): void;
	dirtyCurrentValue(): T;
	stabilize(): void;
	setReleaseResources(releaseResources: () => void): void;
	setEquals(equals: (x: T, y: T) => boolean): void;
	// transformators construction
	map<NewT>(mapping: (v: T) => NewT): Emitter<NewT>;
	filter(initialValue: T, predicate: (v: T) => boolean): Emitter<T>;
	filterMap<NewT>(initialValue: T, mapping: (v: T) => NewT | void): Emitter<NewT>;
	transformTime(initialValue: T, timeShift: (t: number) => number, t0?: number): Emitter<T>;
	accumulate<NewT>(initialValue: NewT, accumulator: (acc: NewT, value: T) => NewT): Emitter<NewT>;
	changes<InOut>(): Emitter<ElectricEvent<{ previous: InOut, next: InOut }>>
	sample(initialValue: T, samplingEvent: Emitter<ElectricEvent<any>>): Emitter<T>;
	when<NewT>(switcher: {
		happens: (value: T) => boolean,
		then: (value: T) => NewT
	}): Emitter<ElectricEvent<NewT>>;
	whenThen<NewT>(happens: (value: T) => NewT | void): Emitter<ElectricEvent<NewT>>;
	change<S1>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
	    switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5, S6>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
	    switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) },
	    switcher6: { when: Emitter<ElectricEvent<S6>>, to: Emitter<T> | ((t: T, k: S6) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
	    switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) },
	    switcher6: { when: Emitter<ElectricEvent<S6>>, to: Emitter<T> | ((t: T, k: S6) => Emitter<T>) },
	    switcher7: { when: Emitter<ElectricEvent<S7>>, to: Emitter<T> | ((t: T, k: S7) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
	    switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) },
	    switcher6: { when: Emitter<ElectricEvent<S6>>, to: Emitter<T> | ((t: T, k: S6) => Emitter<T>) },
	    switcher7: { when: Emitter<ElectricEvent<S7>>, to: Emitter<T> | ((t: T, k: S7) => Emitter<T>) },
	    switcher8: { when: Emitter<ElectricEvent<S8>>, to: Emitter<T> | ((t: T, k: S8) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
	    switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) },
	    switcher6: { when: Emitter<ElectricEvent<S6>>, to: Emitter<T> | ((t: T, k: S6) => Emitter<T>) },
	    switcher7: { when: Emitter<ElectricEvent<S7>>, to: Emitter<T> | ((t: T, k: S7) => Emitter<T>) },
	    switcher8: { when: Emitter<ElectricEvent<S8>>, to: Emitter<T> | ((t: T, k: S8) => Emitter<T>) },
	    switcher9: { when: Emitter<ElectricEvent<S9>>, to: Emitter<T> | ((t: T, k: S9) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
	    switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) },
	    switcher6: { when: Emitter<ElectricEvent<S6>>, to: Emitter<T> | ((t: T, k: S6) => Emitter<T>) },
	    switcher7: { when: Emitter<ElectricEvent<S7>>, to: Emitter<T> | ((t: T, k: S7) => Emitter<T>) },
	    switcher8: { when: Emitter<ElectricEvent<S8>>, to: Emitter<T> | ((t: T, k: S8) => Emitter<T>) },
	    switcher9: { when: Emitter<ElectricEvent<S9>>, to: Emitter<T> | ((t: T, k: S9) => Emitter<T>) },
	    switcher10: { when: Emitter<ElectricEvent<S10>>, to: Emitter<T> | ((t: T, k: S10) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
	    switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) },
	    switcher6: { when: Emitter<ElectricEvent<S6>>, to: Emitter<T> | ((t: T, k: S6) => Emitter<T>) },
	    switcher7: { when: Emitter<ElectricEvent<S7>>, to: Emitter<T> | ((t: T, k: S7) => Emitter<T>) },
	    switcher8: { when: Emitter<ElectricEvent<S8>>, to: Emitter<T> | ((t: T, k: S8) => Emitter<T>) },
	    switcher9: { when: Emitter<ElectricEvent<S9>>, to: Emitter<T> | ((t: T, k: S9) => Emitter<T>) },
	    switcher10: { when: Emitter<ElectricEvent<S10>>, to: Emitter<T> | ((t: T, k: S10) => Emitter<T>) },
	    switcher11: { when: Emitter<ElectricEvent<S11>>, to: Emitter<T> | ((t: T, k: S11) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
	    switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) },
	    switcher6: { when: Emitter<ElectricEvent<S6>>, to: Emitter<T> | ((t: T, k: S6) => Emitter<T>) },
	    switcher7: { when: Emitter<ElectricEvent<S7>>, to: Emitter<T> | ((t: T, k: S7) => Emitter<T>) },
	    switcher8: { when: Emitter<ElectricEvent<S8>>, to: Emitter<T> | ((t: T, k: S8) => Emitter<T>) },
	    switcher9: { when: Emitter<ElectricEvent<S9>>, to: Emitter<T> | ((t: T, k: S9) => Emitter<T>) },
	    switcher10: { when: Emitter<ElectricEvent<S10>>, to: Emitter<T> | ((t: T, k: S10) => Emitter<T>) },
	    switcher11: { when: Emitter<ElectricEvent<S11>>, to: Emitter<T> | ((t: T, k: S11) => Emitter<T>) },
	    switcher12: { when: Emitter<ElectricEvent<S12>>, to: Emitter<T> | ((t: T, k: S12) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
	    switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) },
	    switcher6: { when: Emitter<ElectricEvent<S6>>, to: Emitter<T> | ((t: T, k: S6) => Emitter<T>) },
	    switcher7: { when: Emitter<ElectricEvent<S7>>, to: Emitter<T> | ((t: T, k: S7) => Emitter<T>) },
	    switcher8: { when: Emitter<ElectricEvent<S8>>, to: Emitter<T> | ((t: T, k: S8) => Emitter<T>) },
	    switcher9: { when: Emitter<ElectricEvent<S9>>, to: Emitter<T> | ((t: T, k: S9) => Emitter<T>) },
	    switcher10: { when: Emitter<ElectricEvent<S10>>, to: Emitter<T> | ((t: T, k: S10) => Emitter<T>) },
	    switcher11: { when: Emitter<ElectricEvent<S11>>, to: Emitter<T> | ((t: T, k: S11) => Emitter<T>) },
	    switcher12: { when: Emitter<ElectricEvent<S12>>, to: Emitter<T> | ((t: T, k: S12) => Emitter<T>) },
	    switcher13: { when: Emitter<ElectricEvent<S13>>, to: Emitter<T> | ((t: T, k: S13) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
	    switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) },
	    switcher6: { when: Emitter<ElectricEvent<S6>>, to: Emitter<T> | ((t: T, k: S6) => Emitter<T>) },
	    switcher7: { when: Emitter<ElectricEvent<S7>>, to: Emitter<T> | ((t: T, k: S7) => Emitter<T>) },
	    switcher8: { when: Emitter<ElectricEvent<S8>>, to: Emitter<T> | ((t: T, k: S8) => Emitter<T>) },
	    switcher9: { when: Emitter<ElectricEvent<S9>>, to: Emitter<T> | ((t: T, k: S9) => Emitter<T>) },
	    switcher10: { when: Emitter<ElectricEvent<S10>>, to: Emitter<T> | ((t: T, k: S10) => Emitter<T>) },
	    switcher11: { when: Emitter<ElectricEvent<S11>>, to: Emitter<T> | ((t: T, k: S11) => Emitter<T>) },
	    switcher12: { when: Emitter<ElectricEvent<S12>>, to: Emitter<T> | ((t: T, k: S12) => Emitter<T>) },
	    switcher13: { when: Emitter<ElectricEvent<S13>>, to: Emitter<T> | ((t: T, k: S13) => Emitter<T>) },
	    switcher14: { when: Emitter<ElectricEvent<S14>>, to: Emitter<T> | ((t: T, k: S14) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
	    switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) },
	    switcher6: { when: Emitter<ElectricEvent<S6>>, to: Emitter<T> | ((t: T, k: S6) => Emitter<T>) },
	    switcher7: { when: Emitter<ElectricEvent<S7>>, to: Emitter<T> | ((t: T, k: S7) => Emitter<T>) },
	    switcher8: { when: Emitter<ElectricEvent<S8>>, to: Emitter<T> | ((t: T, k: S8) => Emitter<T>) },
	    switcher9: { when: Emitter<ElectricEvent<S9>>, to: Emitter<T> | ((t: T, k: S9) => Emitter<T>) },
	    switcher10: { when: Emitter<ElectricEvent<S10>>, to: Emitter<T> | ((t: T, k: S10) => Emitter<T>) },
	    switcher11: { when: Emitter<ElectricEvent<S11>>, to: Emitter<T> | ((t: T, k: S11) => Emitter<T>) },
	    switcher12: { when: Emitter<ElectricEvent<S12>>, to: Emitter<T> | ((t: T, k: S12) => Emitter<T>) },
	    switcher13: { when: Emitter<ElectricEvent<S13>>, to: Emitter<T> | ((t: T, k: S13) => Emitter<T>) },
	    switcher14: { when: Emitter<ElectricEvent<S14>>, to: Emitter<T> | ((t: T, k: S14) => Emitter<T>) },
	    switcher15: { when: Emitter<ElectricEvent<S15>>, to: Emitter<T> | ((t: T, k: S15) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
	    switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) },
	    switcher6: { when: Emitter<ElectricEvent<S6>>, to: Emitter<T> | ((t: T, k: S6) => Emitter<T>) },
	    switcher7: { when: Emitter<ElectricEvent<S7>>, to: Emitter<T> | ((t: T, k: S7) => Emitter<T>) },
	    switcher8: { when: Emitter<ElectricEvent<S8>>, to: Emitter<T> | ((t: T, k: S8) => Emitter<T>) },
	    switcher9: { when: Emitter<ElectricEvent<S9>>, to: Emitter<T> | ((t: T, k: S9) => Emitter<T>) },
	    switcher10: { when: Emitter<ElectricEvent<S10>>, to: Emitter<T> | ((t: T, k: S10) => Emitter<T>) },
	    switcher11: { when: Emitter<ElectricEvent<S11>>, to: Emitter<T> | ((t: T, k: S11) => Emitter<T>) },
	    switcher12: { when: Emitter<ElectricEvent<S12>>, to: Emitter<T> | ((t: T, k: S12) => Emitter<T>) },
	    switcher13: { when: Emitter<ElectricEvent<S13>>, to: Emitter<T> | ((t: T, k: S13) => Emitter<T>) },
	    switcher14: { when: Emitter<ElectricEvent<S14>>, to: Emitter<T> | ((t: T, k: S14) => Emitter<T>) },
	    switcher15: { when: Emitter<ElectricEvent<S15>>, to: Emitter<T> | ((t: T, k: S15) => Emitter<T>) },
	    switcher16: { when: Emitter<ElectricEvent<S16>>, to: Emitter<T> | ((t: T, k: S16) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
	    switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) },
	    switcher6: { when: Emitter<ElectricEvent<S6>>, to: Emitter<T> | ((t: T, k: S6) => Emitter<T>) },
	    switcher7: { when: Emitter<ElectricEvent<S7>>, to: Emitter<T> | ((t: T, k: S7) => Emitter<T>) },
	    switcher8: { when: Emitter<ElectricEvent<S8>>, to: Emitter<T> | ((t: T, k: S8) => Emitter<T>) },
	    switcher9: { when: Emitter<ElectricEvent<S9>>, to: Emitter<T> | ((t: T, k: S9) => Emitter<T>) },
	    switcher10: { when: Emitter<ElectricEvent<S10>>, to: Emitter<T> | ((t: T, k: S10) => Emitter<T>) },
	    switcher11: { when: Emitter<ElectricEvent<S11>>, to: Emitter<T> | ((t: T, k: S11) => Emitter<T>) },
	    switcher12: { when: Emitter<ElectricEvent<S12>>, to: Emitter<T> | ((t: T, k: S12) => Emitter<T>) },
	    switcher13: { when: Emitter<ElectricEvent<S13>>, to: Emitter<T> | ((t: T, k: S13) => Emitter<T>) },
	    switcher14: { when: Emitter<ElectricEvent<S14>>, to: Emitter<T> | ((t: T, k: S14) => Emitter<T>) },
	    switcher15: { when: Emitter<ElectricEvent<S15>>, to: Emitter<T> | ((t: T, k: S15) => Emitter<T>) },
	    switcher16: { when: Emitter<ElectricEvent<S16>>, to: Emitter<T> | ((t: T, k: S16) => Emitter<T>) },
	    switcher17: { when: Emitter<ElectricEvent<S17>>, to: Emitter<T> | ((t: T, k: S17) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
	    switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) },
	    switcher6: { when: Emitter<ElectricEvent<S6>>, to: Emitter<T> | ((t: T, k: S6) => Emitter<T>) },
	    switcher7: { when: Emitter<ElectricEvent<S7>>, to: Emitter<T> | ((t: T, k: S7) => Emitter<T>) },
	    switcher8: { when: Emitter<ElectricEvent<S8>>, to: Emitter<T> | ((t: T, k: S8) => Emitter<T>) },
	    switcher9: { when: Emitter<ElectricEvent<S9>>, to: Emitter<T> | ((t: T, k: S9) => Emitter<T>) },
	    switcher10: { when: Emitter<ElectricEvent<S10>>, to: Emitter<T> | ((t: T, k: S10) => Emitter<T>) },
	    switcher11: { when: Emitter<ElectricEvent<S11>>, to: Emitter<T> | ((t: T, k: S11) => Emitter<T>) },
	    switcher12: { when: Emitter<ElectricEvent<S12>>, to: Emitter<T> | ((t: T, k: S12) => Emitter<T>) },
	    switcher13: { when: Emitter<ElectricEvent<S13>>, to: Emitter<T> | ((t: T, k: S13) => Emitter<T>) },
	    switcher14: { when: Emitter<ElectricEvent<S14>>, to: Emitter<T> | ((t: T, k: S14) => Emitter<T>) },
	    switcher15: { when: Emitter<ElectricEvent<S15>>, to: Emitter<T> | ((t: T, k: S15) => Emitter<T>) },
	    switcher16: { when: Emitter<ElectricEvent<S16>>, to: Emitter<T> | ((t: T, k: S16) => Emitter<T>) },
	    switcher17: { when: Emitter<ElectricEvent<S17>>, to: Emitter<T> | ((t: T, k: S17) => Emitter<T>) },
	    switcher18: { when: Emitter<ElectricEvent<S18>>, to: Emitter<T> | ((t: T, k: S18) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18, S19>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
	    switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) },
	    switcher6: { when: Emitter<ElectricEvent<S6>>, to: Emitter<T> | ((t: T, k: S6) => Emitter<T>) },
	    switcher7: { when: Emitter<ElectricEvent<S7>>, to: Emitter<T> | ((t: T, k: S7) => Emitter<T>) },
	    switcher8: { when: Emitter<ElectricEvent<S8>>, to: Emitter<T> | ((t: T, k: S8) => Emitter<T>) },
	    switcher9: { when: Emitter<ElectricEvent<S9>>, to: Emitter<T> | ((t: T, k: S9) => Emitter<T>) },
	    switcher10: { when: Emitter<ElectricEvent<S10>>, to: Emitter<T> | ((t: T, k: S10) => Emitter<T>) },
	    switcher11: { when: Emitter<ElectricEvent<S11>>, to: Emitter<T> | ((t: T, k: S11) => Emitter<T>) },
	    switcher12: { when: Emitter<ElectricEvent<S12>>, to: Emitter<T> | ((t: T, k: S12) => Emitter<T>) },
	    switcher13: { when: Emitter<ElectricEvent<S13>>, to: Emitter<T> | ((t: T, k: S13) => Emitter<T>) },
	    switcher14: { when: Emitter<ElectricEvent<S14>>, to: Emitter<T> | ((t: T, k: S14) => Emitter<T>) },
	    switcher15: { when: Emitter<ElectricEvent<S15>>, to: Emitter<T> | ((t: T, k: S15) => Emitter<T>) },
	    switcher16: { when: Emitter<ElectricEvent<S16>>, to: Emitter<T> | ((t: T, k: S16) => Emitter<T>) },
	    switcher17: { when: Emitter<ElectricEvent<S17>>, to: Emitter<T> | ((t: T, k: S17) => Emitter<T>) },
	    switcher18: { when: Emitter<ElectricEvent<S18>>, to: Emitter<T> | ((t: T, k: S18) => Emitter<T>) },
	    switcher19: { when: Emitter<ElectricEvent<S19>>, to: Emitter<T> | ((t: T, k: S19) => Emitter<T>) }
	): Emitter<T>;
	change<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18, S19, S20>(
	    switcher1: { when: Emitter<ElectricEvent<S1>>, to: Emitter<T> | ((t: T, k: S1) => Emitter<T>) },
	    switcher2: { when: Emitter<ElectricEvent<S2>>, to: Emitter<T> | ((t: T, k: S2) => Emitter<T>) },
	    switcher3: { when: Emitter<ElectricEvent<S3>>, to: Emitter<T> | ((t: T, k: S3) => Emitter<T>) },
	    switcher4: { when: Emitter<ElectricEvent<S4>>, to: Emitter<T> | ((t: T, k: S4) => Emitter<T>) },
	    switcher5: { when: Emitter<ElectricEvent<S5>>, to: Emitter<T> | ((t: T, k: S5) => Emitter<T>) },
	    switcher6: { when: Emitter<ElectricEvent<S6>>, to: Emitter<T> | ((t: T, k: S6) => Emitter<T>) },
	    switcher7: { when: Emitter<ElectricEvent<S7>>, to: Emitter<T> | ((t: T, k: S7) => Emitter<T>) },
	    switcher8: { when: Emitter<ElectricEvent<S8>>, to: Emitter<T> | ((t: T, k: S8) => Emitter<T>) },
	    switcher9: { when: Emitter<ElectricEvent<S9>>, to: Emitter<T> | ((t: T, k: S9) => Emitter<T>) },
	    switcher10: { when: Emitter<ElectricEvent<S10>>, to: Emitter<T> | ((t: T, k: S10) => Emitter<T>) },
	    switcher11: { when: Emitter<ElectricEvent<S11>>, to: Emitter<T> | ((t: T, k: S11) => Emitter<T>) },
	    switcher12: { when: Emitter<ElectricEvent<S12>>, to: Emitter<T> | ((t: T, k: S12) => Emitter<T>) },
	    switcher13: { when: Emitter<ElectricEvent<S13>>, to: Emitter<T> | ((t: T, k: S13) => Emitter<T>) },
	    switcher14: { when: Emitter<ElectricEvent<S14>>, to: Emitter<T> | ((t: T, k: S14) => Emitter<T>) },
	    switcher15: { when: Emitter<ElectricEvent<S15>>, to: Emitter<T> | ((t: T, k: S15) => Emitter<T>) },
	    switcher16: { when: Emitter<ElectricEvent<S16>>, to: Emitter<T> | ((t: T, k: S16) => Emitter<T>) },
	    switcher17: { when: Emitter<ElectricEvent<S17>>, to: Emitter<T> | ((t: T, k: S17) => Emitter<T>) },
	    switcher18: { when: Emitter<ElectricEvent<S18>>, to: Emitter<T> | ((t: T, k: S18) => Emitter<T>) },
	    switcher19: { when: Emitter<ElectricEvent<S19>>, to: Emitter<T> | ((t: T, k: S19) => Emitter<T>) },
	    switcher20: { when: Emitter<ElectricEvent<S20>>, to: Emitter<T> | ((t: T, k: S20) => Emitter<T>) }
	): Emitter<T>;
}
