/// <reference path="../../../d/chai.d.ts" />
/// <reference path="../../../d/mocha.d.ts" />

import chai = require('chai');
import electric = require('../../../src/electric');
import counter = require('../js/counter');
import kettle = require('../../../test/electric-kettle');
kettle.pourAsync(chai);
var expect = chai.expect;

import tasksDevice = require('./../js/changes-device');
import item = require('./../js/item');


describe('collection', function() {
	var init = ['1', '2', '3'];

	function makeTasks(initial: string[] | item[], route = '#/', itemify = true) {
		var title = <electric.emitter.EventEmitter<string>>electric.emitter.manualEvent();
		var check = <electric.emitter.EventEmitter<{id: number, completed: boolean}>>electric.emitter.manualEvent();
		var toggle = <electric.emitter.EventEmitter<boolean>>electric.emitter.manualEvent();
		var retitle = <electric.emitter.EventEmitter<{ id: number, title: string }>>electric.emitter.manualEvent();
		var del = <electric.emitter.EventEmitter<number>>electric.emitter.manualEvent();
		var clear = <electric.emitter.EventEmitter<{}>>electric.emitter.manualEvent();
		var hash = electric.emitter.manual(route);
		var input = {
			insert: title,
			check: check,
			toggle: toggle,
			retitle: retitle,
			del: del,
			clear: clear,
			filter: hash
		}
		var tasks = tasksDevice(
			itemify ? (<string[]>initial).map(item.of) : <item[]>initial,
			input
		);
		return {
			tasks: tasks.visible,
			titles: tasks.visible.map(ts => ts.map(t => t.title())),
			isCompleted: tasks.visible.map(ts => ts.map(t => t.isCompleted())),
			i: input,
			count: tasks.count,
			ask: function(index: number) {
				return tasks.visible.dirtyCurrentValue()[index];
			}
		};
	}

	it('should start with initial collection', function(done) {
		var t = makeTasks(['1', '2']);
		expect(t.titles)
			.to.emit(['1', '2'])
			.andBe(done);
	});

	it('should append new items with given title', function(done) {
		var t = makeTasks([]);
		expect(t.titles)
			.to.emit([])
			.after(() => t.i.insert.impulse('1'))
			.to.emit(['1'])
			.after(() => t.i.insert.impulse('2'))
			.to.emit(['1', '2'])
			.andBe(done);
	});

	it('should not append new items with empty title', function(done) {
		var t = makeTasks([]);
		expect(t.titles)
			.to.emit([])
			.after(() => t.i.insert.impulse(''))
			.after(() => t.i.insert.impulse('1'))
			.to.emit(['1'])
			.andBe(done);
	});

	it('should trim new tasks titles', function(done) {
		var t = makeTasks([]);
		expect(t.titles)
			.to.emit([])
			.after(() => t.i.insert.impulse('1  '))
			.to.emit(['1'])
			.after(() => t.i.insert.impulse('   2   '))
			.to.emit(['1', '2'])
			.andBe(done);
	});

	it('should check/uncheck items', function(done) {
		var t = makeTasks([]);
		expect(t.isCompleted)
			.to.emit([])
			.after(() => t.i.insert.impulse('1'))
			.to.emit([false])
			.after(() => t.i.insert.impulse('2'))
			.to.emit([false, false])
			.after(() => t.i.check.impulse({ id: t.ask(0).id(), completed: true }))
			.to.emit([true, false])
			.after(() => t.i.check.impulse({ id: t.ask(1).id(), completed: true }))
			.to.emit([true, true])
			.after(() => t.i.check.impulse({ id: t.ask(1).id(), completed: false }))
			.to.emit([true, false])
			.andBe(done);
	});

	it('should complete all items if there are uncompleted on toggle', function(done) {
		var t = makeTasks([]);

		expect(t.isCompleted)
			.to.emit([])
			.after(() => t.i.insert.impulse('1'))
			.to.emit([false])
			.after(() => t.i.insert.impulse('2'))
			.to.emit([false, false])
			.after(() => t.i.check.impulse({ id: t.ask(0).id(), completed: true }))
			.to.emit([true, false])
			.after(() => t.i.toggle.impulse(true))
			.to.emit([true, true])
			.after(() => t.i.check.impulse({ id: t.ask(1).id(), completed: false }))
			.to.emit([true, false])
			.after(() => t.i.toggle.impulse(true))
			.to.emit([true, true])
			.after(() => t.i.toggle.impulse(true))
			.to.emit([false, false])
			.after(() => t.i.toggle.impulse(true))
			.to.emit([true, true])
			.andBe(done);
	});

	it('should retitle items', function(done) {
		var t = makeTasks(['a0', 'b0']);
		expect(t.titles)
			.to.emit(['a0', 'b0'])
			.after(() => t.i.retitle.impulse({ id: t.ask(0).id(), title: 'a1' }))
			.to.emit(['a1', 'b0'])
			.after(() => t.i.retitle.impulse({ id: t.ask(1).id(), title: 'b1' }))
			.to.emit(['a1', 'b1'])
			.andBe(done);
	});

	it('should delete items', function(done) {
		var t = makeTasks(['a0', 'b0']);
		expect(t.titles)
			.to.emit(['a0', 'b0'])
			.after(() => t.i.del.impulse(t.ask(0).id()))
			.to.emit(['b0'])
			.after(() => t.i.del.impulse(t.ask(1).id()))
			.to.emit([])
			.andBe(done);
	});

	it('should clear completed', function(done) {
		var t = makeTasks(init);
		expect(t.titles)
			.to.emit(init)
			.after(() => t.i.check.impulse({ id: t.ask(0).id(), completed: true }))
			.to.emit(init)
			.after(() => t.i.check.impulse({ id: t.ask(2).id(), completed: true }))
			.to.emit(init)
			.after(() => t.i.clear.impulse(null))
			.to.emit(['2'])
			.andBe(done);
	});

	it('should show all tasks when #/', function(done) {
		var t = makeTasks(init);
		expect(t.titles)
			.to.emit(init)
			.andBe(done);
	});

	it('should tread invalid hashes like #/', function(done) {
		var t = makeTasks(init, '#/fdsffsd');
		expect(t.titles)
			.to.emit(init)
			.andBe(done);
	});

	it('should show only active tasks when #/active', function(done) {
		var t = makeTasks(init, '#/active');
		expect(t.titles)
			.to.emit(init)
			.after(() => t.i.check.impulse({ id: t.ask(0).id(), completed: true }))
			.to.emit(['2', '3'])
			.andBe(done);
	});

	it('should show only completed tasks when #/completed', function(done) {
		var t = makeTasks(init, '#/completed');
		expect(t.titles)
			.to.emit([])
			.andBe(done);
	});

	it('should switch visible tasks according to route', function(done) {
		var all = [item.of('test1'), item.of('test2').complete()];
		var t = makeTasks(all, '#/', false);
		expect(t.titles)
			.to.emit(['test1', 'test2'])
			.then.after(() => t.i.filter.emit('#/active'))
			.to.emit(['test1'])
			.then.after(() => t.i.filter.emit('#/completed'))
			.to.emit(['test2'])
			.then.after(() => t.i.filter.emit('#/'))
			.to.emit(['test1', 'test2'])
			.andBe(done);
	});

	it('should count active tasks', function(done) {
		var all = [item.of('test1'), item.of('test2').complete(), item.of('test3').complete()];
		var t = makeTasks(all, '#/', false);
		expect(t.count.active)
			.to.emit(1)
			.then.after(() => t.i.insert.impulse('test3'))
			.to.emit(2)
			.andBe(done);
	});

	it('should count complted tasks', function(done) {
		var all = [item.of('test1'), item.of('test2').complete(), item.of('test3').complete()];
		var t = makeTasks(all, '#/', false);
		expect(t.count.completed)
			.to.emit(2)
			.then.after(() => t.i.insert.impulse('test4'))
			.andBe(done);
	});

	it('should count all tasks', function(done) {
		var all = [item.of('test1'), item.of('test2').complete(), item.of('test3').complete()];
		var t = makeTasks(all, '#/', false);
		expect(t.count.all)
			.to.emit(3)
			.then.after(() => t.i.insert.impulse('test4'))
			.to.emit(4)
			.andBe(done);
	});
});
