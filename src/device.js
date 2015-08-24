// import inf = require('./interfaces');
// import emitter = require('./emitter');
// export interface IInputFunction {
// 	(name: string, initialValue?: any): inf.IEmitter<any>;
// }
// export interface IOutputFunction {
// 	(name: string, emitter: inf.IEmitter<any>): void;
// }
// interface ICreateDeviceFunction {
// 	(input: IInputFunction, output: IOutputFunction): void;
// }
// class Device {
// 	private _inputs: any;
// 	name: string;
// 	out: { [name: string]: inf.IEmitter<any> };
// 	constructor(createDevice: ICreateDeviceFunction, name?: string) {
// 		this.name = name || 'device';
// 		this._inputs = {};
// 		this.out = {};
// 		createDevice(
// 			(name: string, initialValue?: any) => this._getOrCreateInput(name, initialValue),
// 			(name: string, emitter: inf.IEmitter<any>) => this._plugOutput(name, emitter)
// 		);
// 	}
// 	private _getOrCreateInput(name: string, initialValue?: any) {
// 		if (!this._inputs[name]) {
// 			this._inputs[name] = emitter.placeholder(initialValue);
// 		}
// 		return this._inputs[name];
// 	}
// 	private _plugOutput(name: string, emitter: inf.IEmitter<any>): void {
// 		this.out[name] = emitter;
// 	}
// 	plug(inputs: { [name: string]: inf.IEmitter<any> }) {
// 		for (var key in inputs) {
// 			if (inputs.hasOwnProperty(key) && this._inputs[key]) {
// 				this._inputs[key].is(inputs[key]);
// 			}
// 		}
// 	}
// }
// export function create(
// 	name: string | ICreateDeviceFunction,
// 	createDevice?: ICreateDeviceFunction
// ) {
// 	if (createDevice === undefined) {
// 		createDevice = <ICreateDeviceFunction>name;
// 		name = undefined;
// 	}
// 	return new Device(createDevice, <string>name);
// };
