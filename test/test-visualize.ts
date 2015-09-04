/// <reference path="../d/chai.d.ts" />
/// <reference path="../d/mocha.d.ts" />
import chai = require("chai");
var expect = chai.expect;

import inf = require('../src/interfaces');
import electric = require('../src/electric');
import eevent = require('../src/electric-event');
import v = require('../src/visualize');

function double(x: number) {
	return 2 * x;
}


describe('toString', function() {
	it('should work for emitters', function() {
		var e = electric.e.manual(0);
		expect(
			e.toString()
		).to.equal('| manual | 0 |>');
	});

	it('should work for renamed emitters', function() {
		var e = electric.e.manual(0);
		e.name = 'test'
		expect(
			e.toString()
		).to.equal('| test | 0 |>');
	});
});

describe('object inspector', function() {
	describe('getReceivers', function() {
		it('should give empty array for not plugged emitter', function() {
			var e = electric.e.manual(0);
			expect(
				v.inspector.getReceivers(e)
			).to.eql([]);
		});

		it("should give null for objects that don't have receivers variable", function() {
			var o = {}
			expect(
				v.inspector.getReceivers(o)
			).to.equal(null);
		});

		it('should return function receiver', function() {
			var e = electric.e.manual(0);
			e.plugReceiver(double);
			expect(
				v.inspector.getReceivers(e)
			).to.eql([{ name: '<| double |', value: double }]);
		});

		it('should return transformator receivers', function() {
			var e = electric.e.manual(0);
			var t = e.map(x => 2 * x);
			expect(
				v.inspector.getReceivers(e)
			).to.eql([{ name: '<| map(=>) | 0 |>', value: t }]);
		});
	});

	describe('gerEmitter', function() {
		it('should work with emitters', function() {
			var e = electric.e.manual(0);
			var t = e.map(x => 2 * x);
			expect(
				v.inspector.getEmitters(t)
			).to.eql([{ name: '| manual | 0 |>', value: e }]);
		});

		it('should work with transformators', function() {
			var e = electric.e.manual(0);
			var t0 = e.map(x => 2 * x);
			var t1 = t0.filter(0, x => x < 2);
			expect(
				v.inspector.getEmitters(t1)
			).to.eql([{ name: '<| map(=>) | 0 |>', value: t0 }]);
		});
	});
});

describe.only('walk', function() {
	it('should construct graph with single node', function() {
		var e = electric.e.manual(0);
		expect(
			v.Graph.of(e).nodesById
		).to.eql(
			{ '0': { id: 0, name: '| manual | 0 |>', receivers: [], emitters: [] } }
		);
	});

	it('should construct graph with two nodesById from emitter', function() {
		var e = electric.e.manual(1);
		var t = e.map(double);
		expect(
			v.Graph.of(e).nodesById
		).to.eql(
			{
				'0': { id: 0, name: '| manual | 1 |>', receivers: [1], emitters: [] },
				'1': { id: 1, name: '<| map(double) | 2 |>', receivers: [], emitters: [0] }
			}
		);
	});

	it('should construct graph with two nodesById from receiver', function() {
		var e = electric.e.manual(1);
		var t = e.map(double);
		expect(
			v.Graph.of(t).nodesById
		).to.eql(
			{
				'1': { id: 1, name: '| manual | 1 |>', receivers: [0], emitters: [] },
				'0': { id: 0, name: '<| map(double) | 2 |>', receivers: [], emitters: [1] }
			}
		);
	});

	it('should work with change to when...', function() {
		var e = electric.e.manual(0);
		var ev = electric.e.manualEvent();
		var t = e.change({
			to: electric.e.constant(1), when: ev
		});
		expect(v.Graph.of(ev).nodesById).to.eql({
			'0': {
				id: 0, name: '| manualEvent | NotHappend |>', receivers: [ 1 ], emitters: []
			},
			'1': {
				id: 1, name: '<| changeToWhen | 0 |>', receivers: [], emitters: [ 2, 0 ]
			},
			'2': {
				id: 2, name: '| manual | 0 |>', receivers: [ 1 ], emitters: []
			}
		});
	});

	it('should work with placeholders', function() {
		var p = electric.e.placeholder(0);
		var e = electric.e.manual(1);
		p.is(e);

		expect(v.Graph.of(p).nodesById).to.eql({
			'0': {
				id: 0,
				name: '| placeholder | manual | 1 |>',
				receivers: [],
				emitters: [] }
			}
		);
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
		bullets.plugReceiver(x => x);

		console.log(v.Graph.of(bullets).nodes);
		console.log(v.Graph.of(bullets).links);
	});
})