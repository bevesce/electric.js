/// <reference path="../d/chai.d.ts" />
/// <reference path="../d/mocha.d.ts" />
import chai = require('chai');
import eevent = require('../src/electric-event');

var expect = chai.expect;
import queue = require('../src/queue');

describe('queue', function() {
	it('should call function', function() {
		var r = 0;
		function f(x: number) {
			r = x;
		}
		var q = queue.empty();
		q.add(f, 2);
		q.dispatch();
		expect(r).to.equal(2);
	});

	it('should not call function two times', function() {
		var r = 0;
		function f(x: number) {
			r = x;
		}
		var q = queue.empty();
		q.add(f, 1);
		q.add(f, 2);
		q.dispatch();
		expect(r).to.equal(2);
	});

	it('should call with event', function() {
		var r = 0;
		var h = false;
		var nh = false;
		function f(x: any) {
			if (x.happened) {
				r = x.value;
				h = true;
			}
			else {
				nh = true;
			}
		}
		var q = queue.empty();
		q.add(f, eevent.of(2));
		q.dispatch();
		expect(r).to.equal(2);
		expect(h).to.equal(true);
		expect(nh).to.equal(true);
	});

	it('should not call with event many times', function() {
		var r = 0;
		var h = false;
		var nh = false;
		function f(x: any) {
			if (x.happened) {
				r = x.value;
				h = true;
			}
			else {
				nh = true;
			}
		}
		var q = queue.empty();
		q.add(f, eevent.of(1));
		q.add(f, eevent.of(2));
		q.dispatch();
		expect(r).to.equal(2);
		expect(h).to.equal(true);
		expect(nh).to.equal(true);
	});
});