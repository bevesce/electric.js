/// <reference path="../d/chai.d.ts" />
/// <reference path="../d/mocha.d.ts" />
import chai = require('chai');
var expect = chai.expect;

import eevent = require('../src/electric-event');

describe('electric event', function() {
	function double(x: number) {
		return 2 * x;
	}

	function sum4(v1: number, v2: number, v3: number, v4: number) {
		return v1 + v2 + v3 + v4;
	}

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

	it('should be flatten mappable when happend', function() {
		var e = eevent.of(1);
		var mapped = e.flattenMap(x => eevent.of('x' + x));
		expect(mapped.happend).to.be.true;
		expect(mapped.value).to.equal('x1');
	});

	it('should be flatten mappable when not happend', function() {
		var e = eevent.notHappend;
		var mapped = e.flattenMap(x => eevent.of('x' + x));
		expect(mapped.happend).to.be.false;
	});

	it('should lift functions with arity 1', function() {
		var ldouble = eevent.lift(double);
		expect(ldouble(eevent.of(2)))
			.to.eql(eevent.of(double(2)));
		expect(ldouble(eevent.notHappend))
			.to.eql(eevent.notHappend);
	});

	// should lift function with arity 2-3

	it('should lift functions with arity 4', function() {
		var lsum4 = eevent.lift(sum4);
		expect(lsum4(
			eevent.of(1),
			eevent.of(2),
			eevent.of(3),
			eevent.of(4)
		)).to.eql(eevent.of(sum4(1, 2, 3, 4)));
		expect(lsum4(
			eevent.of(1),
			eevent.of(2),
			eevent.notHappend,
			eevent.of(4)
		)).to.eql(eevent.notHappend);
	})

	// should lift function with arity 5-7

	it('should flatLift functions', function() {
		function f(v: number): eevent<string> {
			if (v > 2) {
				return eevent.of(v + '!');
			}
			return eevent.notHappend;
		}
		var lf = eevent.flatLift(f);
		expect(lf(eevent.of(1))).to.eql(eevent.notHappend);
		expect(lf(eevent.of(3))).to.eql(eevent.of('3!'));
		expect(lf(eevent.notHappend)).to.eql(eevent.notHappend);
	});

	it('should liftOnFirst functions', function() {
		function f(v: number, s: string): string {
			return v + '-' + s;
		}
		var lf = eevent.liftOnFirst(f);
		expect(lf(eevent.of(1), '!')).to.eql(eevent.of('1-!'));
		expect(lf(eevent.notHappend, '!')).to.eql(eevent.notHappend);
	});
});
