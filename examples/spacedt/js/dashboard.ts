import rui = require('../../../src/receivers/ui');
import IntegrableAntiderivativeOfTwoNumbers = require('../../../src/calculus/integrable-antiderivative-of-two-numbers');

import c = require('./constants');
import Point = require('./angled-point');


export function speed() {
	var speedBar = document.getElementById('speed');
	var speedCurrent = document.getElementById('speed-current');
	var speedLeft = document.getElementById('speed-tomax');

	var aSpeedLeft = document.getElementById('angular-speed-left');
	var aSpeedCurrent = document.getElementById('angular-speed-current');
	var aSpeedRight = document.getElementById('angular-speed-right');

	return function(s: IntegrableAntiderivativeOfTwoNumbers<Point>) {
		var speed = Math.abs(s.y);
		var w = speedBar.offsetWidth;
		var wh = w / 2;
		var sc = speed / c.ship.vbounds.maxY * w;
		var sl = w - sc;
		speedCurrent.style.width = sc + 'px';
		speedLeft.style.width = sl + 'px';

		var anulgarSpeed = s.x;
		if (anulgarSpeed < 0) {
			aSpeedRight.style.width = wh + 'px';
			var l = (anulgarSpeed / c.ship.vbounds.minX) * wh
			aSpeedLeft.style.width = (wh - l) + 'px';
			aSpeedCurrent.style.width = l + 'px';
		}
		else {
			aSpeedLeft.style.width = wh + 'px';
			var l = (anulgarSpeed / c.ship.vbounds.maxX) * wh
			aSpeedRight.style.width = (wh - l) + 'px';
			aSpeedCurrent.style.width = l + 'px';
		}
	}
}


export function score() {
	return rui.htmlReceiverById('score');
}