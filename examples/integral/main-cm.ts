import electric = require('../../src/electric');

var canvas = <any>document.getElementById('canvas');
var ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function bar(x: number, y: number, ys: number) {
    ys = ys || 0;
    ctx.fillStyle = 'white';
    ctx.fillRect(x, ys, 1, y);
}

function a(time: number) {
    return 1;
}
var aT = electric.clock.timeFunction(a, { intervalInMs: 10 });
var vT = electric.clock.integral(aT);
var sT = electric.clock.integral(vT);

var x0 = 0;
aT.plugReceiver(function(a) {
    bar(x0, a.value, 0);
    x0++;
});
var x1 = 0;
vT.plugReceiver(function(v) {
    bar(x1, v.value, 10);
    x1++;
});
var x2 = 0;
sT.plugReceiver(function(s) {
    bar(x2, s.value, 100);
    x2++;
});
