import electric = require('../../src/electric');
import IntegrableAntiderivativeOfNumber = require('../../src/calculus/integrable-antiderivative-of-number');


var canvas = <any>document.getElementById('canvas');
var ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function bar(x: number, y: number, ys: number) {
    ys = ys || 0;
    ctx.fillStyle = 'white';
    ctx.fillRect(x, ys, 1, y);
}



function acceleration(x: number) {
    return IntegrableAntiderivativeOfNumber.of(x, velocity);
}

function velocity(x: number) {
    return IntegrableAntiderivativeOfNumber.of(x, shift);
}

function shift(x: number) {
    return IntegrableAntiderivativeOfNumber.of(x);
}
var intervalInMs = 10;
var interval = { intervalInMs: intervalInMs };

var aT = electric.e.constant(acceleration(5));
var vT = electric.calculus.integral(velocity(0), aT, interval);
var sT = electric.calculus.integral(shift(0), vT, interval);

var x0 = 0;
electric.clock.intervalValue(5, { inMs: intervalInMs }).plugReceiver(function(a) {
    if (!a.happend) {
        return;
    }
    bar(x0, <number>a.value, 0);
    x0++;
});
var x1 = 0;
vT.plugReceiver(function(v) {
    bar(x1, v.x, 10);
    x1++;
});
var x2 = 0;
sT.plugReceiver(function(s) {
    bar(x2, s.x, 100);
    x2++;
});
