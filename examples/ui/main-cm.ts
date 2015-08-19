import electric = require('../../src/electric');
import ui = require('../../src/emitters/ui');


function formatBoolean(value) {
	return value ? '☑ true' : '☐ false'
}

var clicks = ui.fromEvent(document.getElementById('clicker'), 'click');
var deleyedClick = clicks.transformTime(undefined, function(t) { return t + 1000 });
clicks.merge(deleyedClick)
	.accumulate('not clicked', function (acc, x) {
		if (x === undefined){
			return acc;
		}
		return acc === 'clicked'? 'not clicked': 'clicked';
	})
	.plugReceiver(electric.receiver.htmlReceiverById('clicked'));

var button0 = ui.fromButton('button0');
var button1 = ui.fromButton('button1');
electric.emitter.constant('not clicked').change(
	{to: electric.emitter.constant('clicked 0'), when: button0},
	{to: electric.emitter.constant('clicked 1'), when: button1}
)
	.plugReceiver(electric.receiver.htmlReceiverById('buttoned'));


ui.fromInputText('text')
	.plugReceiver(electric.receiver.htmlReceiverById('typed'));

ui.fromCheckbox('checkbox')
	.map(function(checked) { return formatBoolean(checked)})
	.plugReceiver(electric.receiver.htmlReceiverById('checked'));

ui.fromCheckboxes(['checkbox0', 'checkbox1', 'checkbox2', 'checkbox3'])
	.map(function(d) {
		var result = [];
		for (var k in d){
			result.push(k + ': ' + formatBoolean(d[k]));
		}
		return result.join(', ')
	})
	.plugReceiver(electric.receiver.htmlReceiverById('checkers'));

ui.fromInputText('textarea')
	.plugReceiver(electric.receiver.htmlReceiverById('written'));

ui.fromRadioGroup('radio')
	.filter('', function(x){return x !== undefined})
	.plugReceiver(electric.receiver.htmlReceiverById('radioed'));

ui.fromSelect('select')
	.plugReceiver(electric.receiver.htmlReceiverById('selected'));

ui.mouse('mouse').hold()
	.map(function(o){
		return o.type + '<br />' + 'x: ' + o.data.offsetX + '<br /> y: ' + o.data.offsetY;
	})
	.plugReceiver(electric.receiver.htmlReceiverById('moused'));

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
ctx.fillStyle = 'black';

function paint(point) {
	if (!point){
		return;
	}
	ctx.beginPath();
	ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI, true);
	ctx.fillStyle = 'black';
	ctx.fill();
}

var trackpadBox = document.getElementById('trackpad');
var canvas = document.getElementById('canvas');
canvas.width = trackpadBox.offsetWidth;
canvas.height = trackpadBox.offsetHeight

var trackpad = ui.mouse('trackpad');
electric.receiver.log(trackpad);
var xy = trackpad
    .hold({data: {}})
	.map(function(o){
		return { x: o.data.offsetX, y: o.data.offsetY };
	});
var downs = trackpad.filter(false, function(o){return !o || o.type === 'down'});
var ups = trackpad.filter(false, function(o){return !o || o.type === 'up'});

electric.emitter.constant(false).change(
    {to: xy, when: downs},
    {to: electric.emitter.constant(false), when: ups}
)
	.plugReceiver(paint);
