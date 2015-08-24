import electric = require('../../src/electric');
import ui = require('../../src/emitters/ui');
import rui = require('../../src/receivers/ui');
import eevent = require('../../src/electric-event');


function formatBoolean(value: any) {
	return value ? '☑ true' : '☐ false'
}

var clicks = ui.fromEvent(document.getElementById('clicker'), 'click');
var deleyedClick = clicks.transformTime(eevent.notHappend, function(t: number) { return t + 1000 });
clicks.merge(deleyedClick)
	.accumulate('not clicked', function (acc, x) {
		if (x.happend){
			return acc;
		}
		return acc === 'clicked' ? 'not clicked': 'clicked';
	})
	.plugReceiver(rui.htmlReceiverById('clicked'));

var button0 = ui.fromButton('button0');
var button1 = ui.fromButton('button1');
electric.emitter.constant('not clicked').change(
	{to: electric.emitter.constant('clicked 0'), when: button0},
	{to: electric.emitter.constant('clicked 1'), when: button1}
)
	.plugReceiver(rui.htmlReceiverById('buttoned'));


ui.fromInputText('text')
	.plugReceiver(rui.htmlReceiverById('typed'));

ui.fromCheckbox('checkbox')
	.map(b => formatBoolean(b))
	.plugReceiver(rui.htmlReceiverById('checked'));

ui.fromCheckboxes(['checkbox0', 'checkbox1', 'checkbox2', 'checkbox3'])
	.map(function(d: any) {
		var result: any[] = [];
		for (var k in d){
			result.push(k + ': ' + formatBoolean(d[k]));
		}
		return result.join(', ')
	})
	.plugReceiver(rui.htmlReceiverById('checkers'));

ui.fromInputText('textarea')
	.plugReceiver(rui.htmlReceiverById('written'));

ui.fromRadioGroup('radio')
	.filter('', function(x: any){return x !== undefined})
	.plugReceiver(rui.htmlReceiverById('radioed'));

ui.fromSelect('select')
	.plugReceiver(rui.htmlReceiverById('selected'));

electric.transformator.hold({ data: {}, type: '' }, ui.mouse('mouse'))
	.map(function(o: any){
		return o.type + '<br />' + 'x: ' + o.data.offsetX + '<br /> y: ' + o.data.offsetY;
	})
	.plugReceiver(rui.htmlReceiverById('moused'));

var canvas = <any>document.getElementById('canvas');
var ctx = canvas.getContext('2d');
ctx.fillStyle = 'black';

interface IPoint {
	x: number;
	y: number;
}

function paint(point: IPoint) {
	if (!point){
		return;
	}
	ctx.beginPath();
	ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI, true);
	ctx.fillStyle = 'black';
	ctx.fill();
}

var trackpadBox = document.getElementById('trackpad');
var canvas = <any>document.getElementById('canvas');
canvas.width = trackpadBox.offsetWidth;
canvas.height = trackpadBox.offsetHeight

var trackpad = ui.mouse('trackpad');
var xy = electric.transformator.hold({type: '', data: {}}, trackpad)
	.map(function(o: any) {
		return { x: o.data.offsetX, y: o.data.offsetY };
	});

var downs = trackpad.map(e => {
	if (e.happend && e.value.type === 'down') {
		return eevent.of(true);
	}
	return eevent.notHappend;
});
var ups = trackpad.map(e => {
	if (e.happend && e.value.type === 'up') {
		return eevent.of(true);
	}
	return eevent.notHappend;
});

electric.emitter.constant(undefined).change(
    { to: xy, when: downs },
    { to: electric.emitter.constant(undefined), when: ups }
)
	.plugReceiver(paint);
