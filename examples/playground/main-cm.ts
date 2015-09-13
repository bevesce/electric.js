import electric = require('../../src/electric');
import rui = require('../../src/receivers/ui');
import eui = require('../../src/emitters/ui');

function pointToText(point: {x: number, y: number}) {
	return point.x + ', ' + point.y
}

var rendered = rui.htmlReceiverById('mouse-location');
var mouseXY = eui.mouseXY(document);
document.body.addEventListener('click', function() {
	console.log('a');
})

mouseXY
	.map(pointToText)
	.plugReceiver(rendered);

var g = electric.graph.of(mouseXY);

console.log(g.stringify());