var electric = require('../../src/electric');
var ui = require('../../src/emitters/ui');
var rui = require('../../src/receivers/ui');
var cont = electric.emitter.constant;
var event = electric.event;
function formatBoolean(value) {
    return value ? '☑ true' : '☐ false';
}
var clicks = ui.clicks('clicker');
cont('not clicked').change({ to: cont('clicked'), when: clicks }, { to: cont('not clicked'), when: clicks.transformTime(event.notHappened, function (t) { return t + 1000; }) }).plugReceiver(rui.htmlReceiverById('clicked'));
cont('not clicked').change({ to: cont('clicked 0'), when: ui.clicks('button0') }, { to: cont('clicked 1'), when: ui.clicks('button1') }).plugReceiver(rui.htmlReceiverById('buttoned'));
cont('no key pressed').change({ to: function (_, k) { return cont(k); }, when: ui.key('w', 'down') }, { to: function (_, k) { return cont(k); }, when: ui.key('a', 'down') }, { to: function (_, k) { return cont(k); }, when: ui.key('s', 'down') }, { to: function (_, k) { return cont(k); }, when: ui.key('d', 'down') }).plugReceiver(rui.htmlReceiverById('keyed'));
ui.hash().plugReceiver(rui.htmlReceiverById('hashed'));
ui.text('text').plugReceiver(rui.htmlReceiverById('typed'));
cont('nothing yet').change({
    to: function (_, k) { return cont(k); }, when: ui.enteredText('enter')
}).plugReceiver(rui.htmlReceiverById('entered'));
ui.checkbox('checkbox')
    .map(function (b) { return formatBoolean(b); })
    .plugReceiver(rui.htmlReceiverById('checked'));
var s = document.getElementById('select');
ui.select('select').plugReceiver(rui.htmlReceiverById('selected'));
ui.checkboxes('checkboxes')
    .map(function (d) {
    var result = [];
    for (var k in d) {
        result.push(k + ': ' + formatBoolean(d[k]));
    }
    return result.join(', ');
})
    .plugReceiver(rui.htmlReceiverById('checkers'));
ui.mouseXY('mouse').map(function (p) { return p ? "x: " + p.x + ", y: " + p.y : '...'; }).plugReceiver(rui.htmlReceiverById('moused'));
ui.radioGroup('radio').plugReceiver(rui.htmlReceiverById('radioed'));
var trackpad = document.getElementById('trackpad');
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
canvas.width = trackpad.offsetWidth;
canvas.height = trackpad.offsetHeight;
cont(undefined).change({ to: ui.mouseXY(trackpad), when: ui.mouseDown(trackpad) }, { to: cont(undefined), when: ui.mouseUp(trackpad) }).plugReceiver(function (p) {
    if (!p) {
        return;
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI, true);
    ctx.fillStyle = 'black';
    ctx.fill();
});
