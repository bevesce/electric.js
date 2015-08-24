var electric = require('../../src/electric');
var ui = require('../../src/receivers/ui');
electric.clock.time({ intervalInMs: 1000 }).map(function (v) { return v.time; }).plugReceiver(ui.htmlReceiverById('time'));
electric.clock.time({ intervalInMs: 1000 }).map(function (v) { return v.time; }).plugReceiver(electric.receiver.logReceiver('time:'));
function append(list, item) {
    var list = list.slice();
    list.push(item);
    return list;
}
function renderItems(list) {
    return list.map(function (x) {
        return '<li>' + x.time + '</li>';
    }).join('');
}
electric.clock.time({ intervalInMs: 1000 })
    .accumulate([], append)
    .map(renderItems)
    .plugReceiver(ui.htmlReceiverById('list'));
