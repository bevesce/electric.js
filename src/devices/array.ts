import inf = require('../interfaces');
import electric = require('../electric');

export = createArrayDevice;


function createArrayDevice<T>(input: {
	inserts: inf.IEmitter<inf.IElectricEvent<T>>,
	deletes: inf.IEmitter<inf.IElectricEvent<number>>,
	edits: inf.IEmitter<inf.IElectricEvent<{ index: number, value: T }>>,
}) {
	var constant = electric.emitter.constant;
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
	var newItem = input.inserts;
	var deleteItem = input.deletes;
	var editItem = input.edits;
	var items: inf.IEmitter<T[]> = constant(<T[]>[]).change(
		{ to: (items: T[], value: T) => insert(items, value), when: newItem },
		{ to: (items: T[], index: number) => remove(items, index), when: deleteItem },
		{ to: (items: T[], newObj: {index: number, value: T}) => edit(items, newObj.index, newObj.value), when: editItem }
	);
	return items;
};

