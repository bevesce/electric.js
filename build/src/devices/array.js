var electric = require('../electric');
function createArrayDevice() {
    return electric.device.create('list', function (input, output) {
        var constant = electric.emitter.constant;
        function insert(items, value) {
            var newItems = items.slice();
            newItems.push(value);
            return constant(newItems);
        }
        ;
        function remove(items, index) {
            var newItems = items.slice();
            newItems.splice(index, 1);
            return constant(newItems);
        }
        ;
        function edit(items, index, value) {
            var newItems = items.slice();
            newItems[index] = value;
            return constant(newItems);
        }
        var newItem = input('inserts');
        var deleteItem = input('deletes');
        var editItem = input('edits');
        var items = constant([]).change({ to: function (items, value) { return insert(items, value); }, when: newItem }, { to: function (items, index) { return remove(items, index); }, when: deleteItem }, { to: function (items, newObj) { return edit(items, newObj.index, newObj.value); }, when: editItem });
        output('items', items);
    });
}
;
module.exports = createArrayDevice;
