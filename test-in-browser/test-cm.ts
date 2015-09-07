/// <reference path="../d/chai.d.ts" />
/// <reference path="../d/mocha.d.ts" />
import io = require('socket.io-client');
import electric = require('../src/electric');
import kettle = require('../test/electric-kettle');

var expect = chai.expect;
kettle.pourAsync(chai);


describe('request device', function () {
    it('should emit response data');
    it('should emit response status');
});

describe('socket emitter', function () {
    it('should emit data');
});


describe('socket event emitter', function () {
    it('should emit data');
});

describe('socket receiver', function () {
    it('should receive data');
});

describe('socket event receiver', function () {
    it('should receive data');
});