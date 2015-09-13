import electric = require('../../src/electric');
import ui = require('../../src/emitters/ui');
import rui = require('../../src/receivers/ui');

var cont = electric.emitter.constant;
var event = electric.event;

function formatBoolean(value: any) {
	return value ? '☑ true' : '☐ false'
}

var clicks = ui.clicks('clicker');
cont('not clicked').change(
	{ to: cont('clicked'), when: clicks },
	{ to: cont('not clicked'), when: clicks.transformTime(event.notHappend, t => t + 1000) }
).plugReceiver(rui.htmlReceiverById('clicked'));

cont('not clicked').change(
	{ to: cont('clicked 0'), when: ui.clicks('button0') },
	{ to: cont('clicked 1'), when: ui.clicks('button1') }
).plugReceiver(rui.htmlReceiverById('buttoned'));

cont('no key pressed').change(
	{ to: (_, k) => cont(k), when: ui.key('w', 'down') },
	{ to: (_, k) => cont(k), when: ui.key('a', 'down') },
	{ to: (_, k) => cont(k), when: ui.key('s', 'down') },
	{ to: (_, k) => cont(k), when: ui.key('d', 'down') }
).plugReceiver(rui.htmlReceiverById('keyed'));

ui.hash().plugReceiver(rui.htmlReceiverById('hashed'));

ui.text('text').plugReceiver(rui.htmlReceiverById('typed'));

cont('nothing yet').change({
	to: (_, k) => cont(k), when: ui.enteredText('enter')
}).plugReceiver(rui.htmlReceiverById('entered'));

ui.checkbox('checkbox')
	.map(b => formatBoolean(b))
	.plugReceiver(rui.htmlReceiverById('checked'));

var s = document.getElementById('select');

ui.select('select').plugReceiver(rui.htmlReceiverById('selected'));

ui.checkboxes('checkboxes')
	.map(function(d: any) {
		var result: any[] = [];
		for (var k in d){
			result.push(k + ': ' + formatBoolean(d[k]));
		}
		return result.join(', ')
	})
	.plugReceiver(rui.htmlReceiverById('checkers'));

ui.mouseXY('mouse').map(p => p ? `x: ${p.x}, y: ${p.y}` : '...').plugReceiver(rui.htmlReceiverById('moused'))

ui.radioGroup('radio').plugReceiver(rui.htmlReceiverById('radioed'));


var trackpad = document.getElementById('trackpad');
var canvas = <any>document.getElementById('canvas');
var ctx = canvas.getContext('2d');
canvas.width = trackpad.offsetWidth;
canvas.height = trackpad.offsetHeight
cont(undefined).change(
	{ to: ui.mouseXY(trackpad), when: ui.mouseDown(trackpad) },
	{ to: cont(undefined), when: ui.mouseUp(trackpad) }
).plugReceiver(p => {
	if (!p) {
		return;
	}
	ctx.beginPath();
	ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI, true);
	ctx.fillStyle = 'black';
	ctx.fill();
});
