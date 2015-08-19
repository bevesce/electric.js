export declare type IDisposable = number;

export interface ITransformable {

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

export interface IEmitter<T>
	extends ITransformable
{
	plugReceiver(receiver: IReceiverFunction<T> | IReceiver<T> | IWire<T>): IDisposable;
	unplugReceiver(index: IDisposable): void;
	dirtyCurrentValue(): T;
	stabilize(): void;
	setReleaseResources(releaseResources: () => void): void;
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
