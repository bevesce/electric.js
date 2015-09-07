/// <reference path="../d/chai.d.ts" />
/// <reference path="../d/mocha.d.ts" />
import chai = require("chai");
var expect = chai.expect;

import inf = require('../src/interfaces');
import electric = require('../src/electric');
import eevent = require('../src/electric-event');
import graph = require('../src/graph');



function double(x: number) {
	return 2 * x;
}


describe('toString', function() {
	it('should work for emitters', function() {
		var e = electric.e.manual(0);
		expect(
			e.toString()
		).to.equal('| manual = 0 >');
	});

	it('should work for renamed emitters', function() {
		var e = electric.e.manual(0);
		e.name = 'test'
		expect(
			e.toString()
		).to.equal('| test = 0 >');
	});
});

describe('walk', function() {
	it('should construct graph with single node', function() {
		var e = electric.e.manual(0);
		var g = graph.of(e);
		expect(g.vertices).to.eql([
			{
				id: 0,
				name: '| manual = 0 >',
				receivers: [],
				emitters: [],
				type: 'emitter'
			}
		]);
		expect(g.edges).to.eql([]);
	});

	it('should construct graph with two nodes from emitter', function() {
		var e = electric.e.manual(1);
		var t = e.map(double);
		var g = graph.of(e);
		expect(g.vertices).to.eql([
			{
				id: 0,
				name: '| manual = 1 >',
				receivers: [ 1 ],
				emitters: [],
				type: 'emitter'
			},
			{
				id: 1,
				name: '< map(double) = 2 >',
				receivers: [],
				emitters: [ 0 ],
				type: 'transformator'
			}
		]);
		expect(g.edges).to.eql([
			{ source: 0, target: 1 }
		]);
	});

	it('should construct graph with two nodes from receiver', function() {
		var e = electric.e.manual(1);
		var t = e.map(double);
		var g = graph.of(t);
		expect(g.vertices).to.eql([
			{
				id: 0,
				name: '< map(double) = 2 >',
				receivers: [],
				emitters: [ 1 ],
				type: 'transformator'
			},
			{
				id: 1,
				name: '| manual = 1 >',
				receivers: [ 0 ],
				emitters: [],
				type: 'emitter'
			}
		]);
		expect(g.edges).to.eql([
			{ source: 1, target: 0 }
		]);
	});

	it('should work with change to when...', function() {
		var e = electric.e.manual(0);
		var ev = electric.e.manualEvent();
		var t = e.change({
			to: electric.e.constant(1), when: ev
		});
		var g = graph.of(ev);
		expect(g.vertices).to.eql([
			{
				id: 0,
			    name: '| manualEvent = NotHappend >',
			    receivers: [ 1 ],
			    emitters: [],
			    type: 'emitter'
			},
			{
				id: 1,
				name: '< changeToWhen = 0 >',
				receivers: [],
				emitters: [ 2, 0 ],
				type: 'transformator'
			},
			{
				id: 2,
				name: '| manual = 0 >',
				receivers: [ 1 ],
				emitters: [],
				type: 'emitter'
			}
		]);
		expect(g.edges).to.eql([
			{ source: 2, target: 1 },
			{ source: 0, target: 1 }
		]);
	});

	it('should work with placeholders', function() {
		var p = electric.e.placeholder(0);
		var e = electric.e.manual(1);
		p.is(e);
		var g = graph.of(p);
		expect(g.vertices).to.eql([
			{
				id: 0,
				name: 'placeholder: | manual = 1 >',
				receivers: [],
				emitters: [],
				type: 'emitter'
			}
		]);
		expect(g.edges).to.eql([]);
	});

	it('should work with recursion', function() {
		var collision = electric.e.placeholder(
			<inf.IElectricEvent<string>>electric.event.notHappend
		);
		var bullets = electric.e.constant('s').change({
			to: electric.e.constant('w'),
			when: collision
		});
		collision.is(
			bullets.whenThen(x => x)
		)
		bullets.name = 'bullets';
		bullets.plugReceiver(function rec(x){ return x });
		var g = graph.of(bullets);
		expect(g.vertices).to.eql([
			{
				id: 0,
				name: '< bullets = s >',
				receivers: [ 2, 3 ],
				emitters: [ 1, 2 ],
				type: 'transformator'
			},
			{
				id: 1,
				name: '| constant(s) = s >',
				receivers: [ 0 ],
				emitters: [],
				type: 'emitter'
			},
			{
				id: 2,
				name: '< whenThen = NotHappend >',
				receivers: [ 0 ],
				emitters: [ 0 ],
				type: 'transformator'
			},
			{
				id: 3,
				name: '< rec |',
				receivers: [],
				emitters: [ 0 ],
				type: 'receiver'
			}
		]);
		expect(g.edges).to.eql([
			{ source: 1, target: 0 },
			{ source: 2, target: 0 },
			{ source: 0, target: 2 },
			{ source: 0, target: 3 }
		]);
	});

	it('should limit depth', function() {
		var t = electric.emitter.manual(1)
					.map(double)
					.map(double)
					.map(double);
		var k = t.map(double)
					.map(double)
					.map(double)
					.map(double)
					.plugReceiver(function log(x) { return x; })
		var g = graph.of(t, 2);
		expect(g.vertices).to.eql([
			{
				id: 0,
			    name: '< map(double) = 8 >',
			    receivers: [ 2 ],
			    emitters: [ 1 ],
			    type: 'transformator'
			},
			{
			  	id: 1,
			    name: '< map(double) = 4 >',
			    receivers: [ 0 ],
			    emitters: [],
			    type: 'transformator'
			},
			{
			  	id: 2,
			    name: '< map(double) = 16 >',
			    receivers: [],
			    emitters: [ 0 ],
			    type: 'transformator'
			}
		]);
		expect(g.edges).to.eql([
			{ source: 1, target: 0 },
			{ source: 0, target: 2 }
		]);
	});
});
