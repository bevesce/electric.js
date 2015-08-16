import inf = require('./interfaces');
import emitter = require('./emitter');
import receiver = require('./receiver');


interface IInputsMap {
	[name: string]: inf.IReceiver<any>
}

interface IReceiverFunctionsMap {
	[name: string]: inf.IReceiverFunction<any>
}

interface IOutputsMap {
	[name: string]: inf.IEmitter<any>
}

interface ICreateDeviceFunction {
	(
		ins: (ins: IInputsMap) => void,
		outs: (outs: IOutputsMap) => void
	): void
}


export function create(
	name: string | ICreateDeviceFunction,
	createDevice?: ICreateDeviceFunction
) {
	function plug(
		inputsOutputs: { ins?: IOutputsMap, outs?: IReceiverFunctionsMap }
	) {
		for (var name in inputsOutputs.ins) {
			if (!inputsOutputs.ins.hasOwnProperty(name)) {
				return;
			}
			ins[name].plugEmitter(inputsOutputs.ins[name]);
		}
		for (var name in inputsOutputs.outs) {
			if (!inputsOutputs.outs.hasOwnProperty(name)) {
				return;
			}
			outs[name].plugReceiver(inputsOutputs.outs[name]);
		}
	}

	if (createDevice === undefined) {
		createDevice = <ICreateDeviceFunction>name;
		name = undefined;
	}
	var ins: IInputsMap;
	var outs: IOutputsMap;

	createDevice(
		function(x: IInputsMap) { ins = x },
		function(x: IOutputsMap) { outs = x }
	);
	return {
		name: <string>name,
		ins: ins,
		outs: outs,
		plug: plug,
		toString: () => 'device<' + name + '>'
	}


}


export var list = function createListDevice(){
	return create('list', function<T>(
		ins: (ins: IInputsMap) => void,
		outs: (outs: IOutputsMap) => void
	) {
		var constant = emitter.constant;
		function insert(items: any[], value: any) {
			var newItems = items.slice();
			newItems.push(value);
			return constant(newItems);
		};
		function remove(items: any[], index: number) {
			var newItems = items.slice();
			newItems.splice(index, 1);
			return constant(newItems);
		};
		function edit(items: any[], index: number, value: any) {
			var newItems = items.slice();
			newItems[index] = value;
			return constant(newItems);
		}
		var newItem = receiver.hanging();
		var deleteItem = receiver.hanging();
		var editItem = receiver.hanging();
		var items: inf.IEmitter<T> = constant([]).change(
			{ to: (items: T[], value: T) => insert(items, value), when: newItem },
			{ to: (items: T[], index: number) => remove(items, index), when: deleteItem },
			{ to: (items: T[], newObj: {index: number, value: T}) => edit(items, newObj.index, newObj.value), when: editItem }
			);
		ins({
			inserts: newItem,
			deletes: deleteItem,
			edits: editItem
		});
		outs({
			items: items
		});
	});
};
