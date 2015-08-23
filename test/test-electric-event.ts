
/// <reference path="../d/chai.d.ts" />
/// <reference path="../d/mocha.d.ts" />
import chai = require('chai');
var expect = chai.expect;

import eevent = require('../src/electric-event');

describe('electric event', function() {
	it('could happend', function() {
		var e = eevent.of(1);
		expect(e.happend).to.be.true;
	});

	it('could not happend', function() {
		var e = eevent.notHappend;
		expect(e.happend).to.be.false;
	});

	it('should be mappable when happend', function() {
		var e = eevent.of(1);
		var mapped = e.map(x => 'x' + x);
		expect(mapped.happend).to.be.true;
		expect(mapped.value).to.equal('x1');
	});

	it('should be mappable when not happend', function() {
		var e = eevent.notHappend;
		var mapped = e.map(x => 'x' + x);
		expect(mapped.happend).to.be.false;
	});
});
