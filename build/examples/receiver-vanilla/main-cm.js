var electric = require('../../src/electric');
var ui = require('../../src/receivers/ui');
electric.clock.time({ intervalInMs: 1000 }).plugReceiver(ui.htmlReceiverById('time'));
electric.clock.time({ intervalInMs: 1000 }).plugReceiver(electric.receiver.logReceiver('time:'));
function append(list, item) {
    var list = list.slice();
    list.push(item);
    return list;
}
function renderItems(list) {
    return list.map(function (x) {
        return '<li>' + x + '</li>';
    }).join('');
}
electric.clock.time({ intervalInMs: 1000 })
    .accumulate([], append)
    .map(renderItems)
    .plugReceiver(ui.htmlReceiverById('list'));
