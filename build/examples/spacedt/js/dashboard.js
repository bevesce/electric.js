var rui = require('../../../src/receivers/ui');
var c = require('./constants');
function speed() {
    var speedBar = document.getElementById('speed');
    var speedCurrent = document.getElementById('speed-current');
    var speedLeft = document.getElementById('speed-tomax');
    var aSpeedLeft = document.getElementById('angular-speed-left');
    var aSpeedCurrent = document.getElementById('angular-speed-current');
    var aSpeedRight = document.getElementById('angular-speed-right');
    return function speedometer(s) {
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
            var l = (anulgarSpeed / c.ship.vbounds.minX) * wh;
            aSpeedLeft.style.width = (wh - l) + 'px';
            aSpeedCurrent.style.width = l + 'px';
        }
        else {
            aSpeedLeft.style.width = wh + 'px';
            var l = (anulgarSpeed / c.ship.vbounds.maxX) * wh;
            aSpeedRight.style.width = (wh - l) + 'px';
            aSpeedCurrent.style.width = l + 'px';
        }
    };
}
exports.speed = speed;
function score() {
    var r = rui.htmlReceiverById('score');
    r.name = 'show score';
    return r;
}
exports.score = score;
