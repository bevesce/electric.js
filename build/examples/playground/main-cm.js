var electric = require('../../src/electric');
var rui = require('../../src/receivers/ui');
var eui = require('../../src/emitters/ui');
function pointToText(point) {
    return point.x + ', ' + point.y;
}
var rendered = rui.htmlReceiverById('mouse-location');
var mouseXY = eui.mouseXY(document);
document.body.addEventListener('click', function () {
    console.log('a');
});
mouseXY
    .map(pointToText)
    .plugReceiver(rendered);
var g = electric.graph.of(mouseXY);
console.log(g.stringify());
