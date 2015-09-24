/// <reference path="../d/chai.d.ts" />
/// <reference path="../d/mocha.d.ts" />
import chai = require('chai');
import electricKettle = require('./electric-kettle');
electricKettle.pourAsync(chai);
var expect = chai.expect;

import electric = require('../src/electric');
import t = require('../src/transformator');
import eevent = require('../src/electric-event');

var transformator = it;

describe('transformators', function() {
	transformator('map1', function(done) {
		var emitter = electric.emitter.manual(0);
		var mapped = t.map(x => x + '!', emitter);
		expect(mapped)
			.to.emit('0!')
			.then.after(() => emitter.emit(1))
			.to.emit('1!')
			.that.finish(done);
	});

	transformator('map4', function(done) {
		var emitter1 = electric.emitter.manual(0);
		var emitter2 = electric.emitter.manual('a');
		var emitter3 = electric.emitter.manual('a');
		var emitter4 = electric.emitter.manual('a');
		var mapped = t.map(
			(x: number, y: string, w: string, z: string) => x + '!' + y,
			emitter1, emitter2, emitter3, emitter4
		);
		expect(mapped)
			.to.emit('0!a')
			.then.after(() => emitter1.emit(1))
			.to.emit('1!a')
			.then.after(() => emitter2.emit('b'))
			.to.emit('1!b')
			.then.finish(done);
	});

	transformator('filter1', function(done) {
		var emitter = electric.emitter.manual(0);
		var filtered = t.filter(2, x => x > 2, emitter);
		expect(filtered)
			.to.emit(2)
			.then.after(() => emitter.emit(3))
			.to.emit(3)
			.that.finish(done);
	});

	transformator('filter4', function(done) {
		var emitter1 = electric.emitter.manual(0);
		var emitter2 = electric.emitter.manual(1);
		var emitter3 = electric.emitter.manual(1);
		var emitter4 = electric.emitter.manual(1);
		var filtered = t.filter(
			2,
			(x, y, z, w) => x > 2 && y == 1,
			emitter1, emitter2, emitter3, emitter4
		);
		expect(filtered)
			.to.emit(2)
			.then.after(() => emitter1.emit(3))
			.to.emit(3)
			.that.finish(done);
	});

	transformator('filterMap1', function(done) {
		var emitter = electric.emitter.manual(0);
		var filterMapped = t.filterMap('2!', x => {
			if (x > 2) {
				return x + '!';
			}
		}, emitter);
		expect(filterMapped)
			.to.emit('2!')
			.then.after(() => emitter.emit(3))
			.to.emit('3!')
			.that.finish(done);
	});

	transformator('filterMap4', function(done) {
		var emitter1 = electric.emitter.manual(0);
		var emitter2 = electric.emitter.manual('a');
		var emitter3 = electric.emitter.manual('a');
		var emitter4 = electric.emitter.manual('a');
		var filterMapped = t.filterMap(
			'2!',
			(x: number, y: string, z: string, w: string) => {
				if (x > 2) {
					return x + '!' + y + z + w
				}
			},
			emitter1, emitter2, emitter3, emitter4
		);
		expect(filterMapped)
			.to.emit('2!')
			.then.after(() => emitter1.emit(3))
			.to.emit('3!aaa')
			.that.finish(done);
	});

	transformator('accumulate1', function(done) {
		var emitter = electric.emitter.manual(0);
		var accumulated = t.accumulate(
			[], (acc: number[], x: number) => acc.concat(x), emitter
		)
		expect(accumulated)
			.to.emit([0])
			.then.after(() => emitter.emit(1))
			.to.emit([0, 1])
			.then.finish(done);
	});

	transformator('accumulate4', function(done) {
		var emitter1 = electric.emitter.manual('1a');
		var emitter2 = electric.emitter.manual('2a');
		var emitter3 = electric.emitter.manual('3a');
		var emitter4 = electric.emitter.manual('4a');
		var accumulated = t.accumulate(
			[],
			(l, x, y, z, w) => l.concat(x, y, z, w),
			emitter1, emitter2, emitter3, emitter4
		);
		expect(accumulated)
			.to.emit(['1a', '2a', '3a', '4a'])
			.then.after(() => emitter2.emit('2b'))
			.to.emit(['1a', '2a', '3a', '4a', '1a', '2b', '3a', '4a'])
			.then.finish(done);

	});
	transformator('merge1', function(done) {
		// merge1 does nothing...
		var emitter = electric.emitter.manualEvent();
		var merged = t.merge(emitter);
		expect(merged)
			.to.emit(eevent.notHappened)
			.then.after(() => emitter.impulse(1))
			.to.emit(eevent.of(1))
			.to.emit(eevent.notHappened)
			.that.finish(done);
	});

	transformator('merge4', function(done) {
		var emitter1 = electric.emitter.manualEvent();
		var emitter2 = electric.emitter.manualEvent();
		var emitter3 = electric.emitter.manualEvent();
		var emitter4 = electric.emitter.manualEvent();
		var merged = t.merge(
			emitter1, emitter2, emitter3, emitter4
		);
		expect(merged)
			.to.emit(eevent.notHappened)
			.then.after(() => emitter1.impulse('1b'))
			.to.emit(eevent.of('1b'))
			.to.emit(eevent.notHappened)
			.then.after(() => emitter2.impulse('2b'))
			.to.emit(eevent.of('2b'))
			.to.emit(eevent.notHappened)
			.then.after(() => emitter3.impulse('3b'))
			.to.emit(eevent.of('3b'))
			.to.emit(eevent.notHappened)
			.then.after(() => emitter4.impulse('4b'))
			.to.emit(eevent.of('4b'))
			.to.emit(eevent.notHappened)
			.then.after(() => emitter2.impulse('2c'))
			.to.emit(eevent.of('2c'))
			.to.emit(eevent.notHappened)
			.that.finish(done);
	});

  //   transformator('cummulateOverTime', function(done) {
		// var emitter = electric.emitter.manual(eevent.notHappened);
		// var cumulated = t.cumulateOverTime(emitter, 10);
		// expect(cumulated)
		// 	.to.emit(eevent.notHappened)
		// 	.then.after(() => emitter.impulse(eevent.of(1)))
		// 	.and.after(() => emitter.impulse(eevent.of(2)))
		// 	.to.emit(eevent.of([1, 2]))
		// 	.to.emit(eevent.notHappened)
		// 	.and.then.to.finish(done)
  //   });

	transformator('hold', function(done) {
		var emitter = electric.emitter.manualEvent();
		var holded = t.hold(0, emitter);
		expect(holded)
			.to.emit(0)
			.then.after(() => emitter.impulse(1))
			.to.emit(1)
			.then.after(() => emitter.impulse(1))
			.then.after(() => emitter.impulse(2))
			.to.emit(2)
			.andBe(done);
	});

	transformator('changes', function(done) {
		var emitter = electric.emitter.manual(0);
		var changes = t.changes(emitter);
		expect(changes)
			.to.emit(eevent.notHappened)
			.then.after(() => emitter.emit(1))
			.to.emit(eevent.of({ previous: 0, next: 1 }))
			.to.emit(eevent.notHappened)
			.then.after(() => emitter.emit(2))
			.to.emit(eevent.of({ previous: 1, next: 2 }))
			.to.emit(eevent.notHappened)
			.andBe(done);
	});
});


describe('flattens', function() {
	describe('flatten', function() {
		it('should work on f_a :: t -> (t -> a)', function(done) {
			var e0 = electric.emitter.manual('0a');
			var e1 = electric.emitter.manual('1a');
			var e2 = electric.emitter.manual('2a');
			var emitters = electric.emitter.manual(e0);

			expect(t.flatten(emitters))
				.to.emit('0a')
				.after(() => e0.emit('0b'))
				.to.emit('0b')
				.after(() => e0.emit('0c'))
				.to.emit('0c')
				.after(() => emitters.emit(e1))
				.to.emit('1a')
				.after(() => e1.emit('1b'))
				.to.emit('1b')
				.after(() => e0.emit('0d'))
				.after(() => e1.emit('1c'))
				.to.emit('1c')
				.after(() => e0.emit('0e'))
				.after(() => emitters.emit(e2))
				.to.emit('2a')
				.after(() => e2.emit('2b'))
				.after(() => e0.emit('0f'))
				.after(() => e1.emit('1d'))
				.to.emit('2b')
				.andBe(done);
		});
	});

	describe('flattenMany', function() {
		it('should work on f_a :: t -> [t -> a]', function(done) {
			var e0 = electric.emitter.manual('0a');
			var e1 = electric.emitter.manual('1a');
			var e2 = electric.emitter.manual('2a');
			var emitters = electric.emitter.manual([e0, e1]);

			expect(t.flattenMany(emitters))
				.to.emit(['0a', '1a'])
				.after(() => e0.emit('0b'))
				.to.emit(['0b', '1a'])
				.after(() => e1.emit('1b'))
				.to.emit(['0b', '1b'])
				.after(() => e1.emit('1c'))
				.to.emit(['0b', '1c'])
				.after(() => emitters.emit([e1, e2]))
				.to.emit(['1c', '2a'])
				.after(() => e2.emit('2b'))
				.to.emit(['1c', '2b'])
				.after(() => e1.emit('1d'))
				.to.emit(['1d', '2b'])
				.after(() => emitters.emit([e0]))
				.to.emit(['0b'])
				.after(() => e0.emit('0c'))
				.to.emit(['0c'])
				.andBe(done);
		});
	});

	describe('flattenNamed', function() {
		it('should work on f_a :: t -> {name: t -> a}', function(done) {
			var e0 = electric.emitter.manual('0a');
			var e1 = electric.emitter.manual('1a');
			var e2 = electric.emitter.manual('2a');
			var emitters = electric.emitter.manual(
				<{ [name: string]: electric.emitter.Emitter<string> }>{
					'0': e0, '1': e1
				}
			);

			expect(t.flattenNamed(emitters))
				.to.emit({'0': '0a', '1': '1a' })
				.after(() => e0.emit('0b'))
				.to.emit({'0': '0b', '1': '1a' })
				.after(() => e1.emit('1b'))
				.to.emit({'0': '0b', '1': '1b' })
				.after(() => e1.emit('1c'))
				.to.emit({'0': '0b', '1': '1c' })
				.after(() => emitters.emit({'1': e1, '2': e2}))
				.to.emit({'1': '1c', '2': '2a'})
				.after(() => e2.emit('2b'))
				.to.emit({'1': '1c', '2': '2b'})
				.after(() => e1.emit('1d'))
				.to.emit({'1': '1d', '2': '2b'})
				.after(() => emitters.emit({'0': e0}))
				.to.emit({'0': '0b'})
				.after(() => e0.emit('0c'))
				.to.emit({'0': '0c'})
				.andBe(done);
		});
	});
});


// describe('unglitch', function() {
// 	it('should work on normal values', function(done) {
// 	    var y = electric.emitter.manual(2);

// 	    var a = y.map(x => x + 0);
// 	    var b = electric.transformator.map(
// 	        (yv, av) => yv + av,
// 	        y, a
// 	    );
// 	    expect(t.unglitch(b))
// 	        .to.emit(4)
// 	        .then.after(() => y.emit(3))
// 	        .to.emit(6)
// 	        .andBe(done);
// 	});

// 	it('should work with events', function(done) {
// 	    var y = electric.emitter.manual(2);

// 	    var a = y.map(x => x + 0);
// 	    var b = electric.transformator.map(
// 	        (yv, av) => yv + av,
// 	        y, a
// 	    );
// 	    var e = t.unglitch(b).when(
// 	    	{ happens: x => x >= 5, then: x => x}
//     	);
// 	    expect(e)
// 	    	.to.emit(eevent.notHappened)
// 	        .then.after(() => y.emit(3))
// 	        .to.emit(eevent.of(6))
// 	    	.then.to.emit(eevent.notHappened)
// 	        .andBe(done);
// 	});
// });
