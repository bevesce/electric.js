/// <reference path="../d/chai.d.ts" />
/// <reference path="../d/mocha.d.ts" />
/// <reference path="../d/socket.io-client.d.ts" />
var io = require('socket.io-client');
var electric = require('../src/electric');
var kettle = require('../test/electric-kettle');
var expect = chai.expect;
kettle.pourAsync(chai);
var request = require('../src/devices/request');
var electricSocket = require('../src/devices/electric-socket');
var rurl = 'http://localhost:8081/';
describe('request device', function () {
    it('should emit response status code 200', function (done) {
        var e = electric.emitter.manualEvent();
        var d = request.device('GET', rurl, e);
        expect(d.response.map(function (r) { return r.statusCode; }))
            .to.emit(-1)
            .after(function () { return e.impulse(null); })
            .to.emit(200)
            .andBe(done);
    });
    it('should emit response status code 500', function (done) {
        var e = electric.emitter.manualEvent();
        var d = request.device('GET', rurl + '500', e);
        expect(d.response.map(function (r) { return r.statusCode; }))
            .to.emit(-1)
            .after(function () { return e.impulse(null); })
            .to.emit(500)
            .andBe(done);
    });
    it('should emit response status OK', function (done) {
        var e = electric.emitter.manualEvent();
        var d = request.device('GET', rurl, e);
        expect(d.response.map(function (r) { return r.status; }))
            .to.emit('none')
            .after(function () { return e.impulse(null); })
            .to.emit('success')
            .andBe(done);
    });
    it('should emit response status error', function (done) {
        var e = electric.emitter.manualEvent();
        var d = request.device('GET', rurl + '500', e);
        expect(d.response.map(function (r) { return r.status; }))
            .to.emit('none')
            .after(function () { return e.impulse(null); })
            .to.emit('error')
            .andBe(done);
    });
    it('should emit response data', function (done) {
        var e = electric.emitter.manualEvent();
        var d = request.device('GET', rurl, e);
        expect(d.response.map(function (r) { return r.data; }))
            .to.emit(undefined)
            .after(function () { return e.impulse(''); })
            .to.emit('"ok"')
            .andBe(done);
    });
});
describe('JSON request device', function () {
    it('should emit decoded response data', function (done) {
        var e = electric.emitter.manualEvent();
        var d = request.JSONDevice('GET', rurl, e);
        expect(d.response.map(function (r) { return r.data; }))
            .to.emit(undefined)
            .after(function () { return e.impulse(''); })
            .to.emit('ok')
            .andBe(done);
    });
});
var wurl = 'http://localhost:8002/';
var socket = io(wurl);
describe('socket', function () {
    it('should emit and receiver data', function (done) {
        var e = electric.emitter.manual(1);
        var response = electricSocket.emitter('test-response', socket, 0);
        e.plugReceiver(electricSocket.receiver('test', socket));
        expect(response)
            .to.emit(0)
            .to.emit(2)
            .then.after(function () { return e.emit(3); })
            .to.emit(6)
            .andBe(done);
    });
});
describe('event socket', function () {
    it('should emit and receiver data', function (done) {
        var e = electric.emitter.manualEvent();
        var response = electricSocket.eventEmitter('test-event-response', socket, 0);
        e.plugReceiver(electricSocket.eventReceiver('test-event', socket));
        expect(response)
            .to.emit(electric.event.notHappened)
            .then.after(function () { return e.impulse(3); })
            .to.emit(electric.event.of(6))
            .to.emit(electric.event.notHappened)
            .then.after(function () { return e.impulse(4); })
            .to.emit(electric.event.of(8))
            .to.emit(electric.event.notHappened)
            .andBe(done);
    });
});
