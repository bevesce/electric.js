import electric = require('../../src/electric');

function sinBall(fps: number, ball: HTMLElement){
    electric.clock.time({fps: fps}).map(function(v){
    	return Math.sin(v / 1000);
    }).plugReceiver(function(v: number){
        var amp = 200;
    	ball.style.left = (amp + (v * amp)) + 'px';
    });
}
var fpss = [100, 60, 50, 26, 10, 1];
for (var i in fpss){
	var v = fpss[i]
	var ball = document.getElementById('ball' + v);
	sinBall(v, ball);
}
