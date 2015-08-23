// import inf = require('../interfaces');
// import electric = require('../electric');
// function createArrayDevice() {
// 	return electric.device.create('list', function<T>(
// 		input: electric.device.IInputFunction, output: electric.device.IOutputFunction
// 	) {
// 		var constant = electric.emitter.constant;
// 		function insert(items: any[], value: any) {
// 			var newItems = items.slice();
// 			newItems.push(value);
// 			return constant(newItems);
// 		};
// 		function remove(items: any[], index: number) {
// 			var newItems = items.slice();
// 			newItems.splice(index, 1);
// 			return constant(newItems);
// 		};
// 		function edit(items: any[], index: number, value: any) {
// 			var newItems = items.slice();
// 			newItems[index] = value;
// 			return constant(newItems);
// 		}
// 		var newItem = input('inserts');
// 		var deleteItem = input('deletes');
// 		var editItem = input('edits');
// 		var items: inf.IEmitter<T> = constant([]).change(
// 			{ to: (items: T[], value: T) => insert(items, value), when: newItem },
// 			{ to: (items: T[], index: number) => remove(items, index), when: deleteItem },
// 			{ to: (items: T[], newObj: {index: number, value: T}) => edit(items, newObj.index, newObj.value), when: editItem }
// 		);
// 		output('items', items);
// 	});
// };
// export = createArrayDevice; 
