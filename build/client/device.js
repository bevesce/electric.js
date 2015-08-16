define(["require", "exports", './emitter', './receiver'], function (require, exports, emitter, receiver) {
    function create(name, createDevice) {
        function plug(inputsOutputs) {
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
            createDevice = name;
            name = undefined;
        }
        var ins;
        var outs;
        createDevice(function (x) { ins = x; }, function (x) { outs = x; });
        return {
            name: name,
            ins: ins,
            outs: outs,
            plug: plug,
            toString: function () { return 'device<' + name + '>'; }
        };
    }
    exports.create = create;
    exports.list = function createListDevice() {
        return create('list', function (ins, outs) {
            var constant = emitter.constant;
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
            var newItem = receiver.hanging();
            var deleteItem = receiver.hanging();
            var editItem = receiver.hanging();
            var items = constant([]).change({ to: function (items, value) { return insert(items, value); }, when: newItem }, { to: function (items, index) { return remove(items, index); }, when: deleteItem }, { to: function (items, newObj) { return edit(items, newObj.index, newObj.value); }, when: editItem });
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
});
