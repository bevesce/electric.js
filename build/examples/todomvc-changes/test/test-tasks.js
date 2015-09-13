/// <reference path="../../../d/chai.d.ts" />
/// <reference path="../../../d/mocha.d.ts" />
var chai = require('chai');
var electric = require('../../../src/electric');
var kettle = require('../../../test/electric-kettle');
kettle.pourAsync(chai);
var expect = chai.expect;
var tasksDevice = require('./../js/changes-device');
var item = require('./../js/item');
describe('collection', function () {
    var init = ['1', '2', '3'];
    function makeTasks(initial, route, itemify) {
        if (route === void 0) { route = '#/'; }
        if (itemify === void 0) { itemify = true; }
        var title = electric.emitter.manualEvent(null);
        var check = electric.emitter.manualEvent(null);
        var toggle = electric.emitter.manualEvent(null);
        var retitle = electric.emitter.manualEvent(null);
        var del = electric.emitter.manualEvent(null);
        var clear = electric.emitter.manualEvent(null);
        var hash = electric.emitter.manual(route);
        var input = {
            insert: title,
            check: check,
            toggle: toggle,
            retitle: retitle,
            del: del,
            clear: clear,
            filter: hash
        };
        var initialTasks = itemify ? initial.map(item.of) : initial;
        var tasks = tasksDevice(initialTasks, input);
        return {
            tasks: tasks.visible,
            titles: tasks.visible.map(function (ts) { return ts.map(function (t) { return t.title(); }); }),
            isCompleted: tasks.visible.map(function (ts) { return ts.map(function (t) { return t.isCompleted(); }); }),
            i: input,
            count: tasks.count,
            ask: function (index) {
                return tasks.visible.dirtyCurrentValue()[index];
            }
        };
    }
    it('should start with initial collection', function (done) {
        var t = makeTasks(['1', '2']);
        expect(t.titles)
            .to.emit(['1', '2'])
            .andBe(done);
    });
    it('should append new items with given title', function (done) {
        var t = makeTasks([]);
        expect(t.titles)
            .to.emit([])
            .after(function () { return t.i.insert.impulse('1'); })
            .to.emit(['1'])
            .andBe(done);
    });
    it('should not append new items with empty title', function (done) {
        var t = makeTasks([]);
        expect(t.titles)
            .to.emit([])
            .after(function () { return t.i.insert.impulse(''); })
            .after(function () { return t.i.insert.impulse('1'); })
            .to.emit(['1'])
            .andBe(done);
    });
    it('should trim new tasks titles', function (done) {
        var t = makeTasks([]);
        expect(t.titles)
            .to.emit([])
            .after(function () { return t.i.insert.impulse('1  '); })
            .to.emit(['1'])
            .after(function () { return t.i.insert.impulse('   2   '); })
            .to.emit(['1', '2'])
            .andBe(done);
    });
    it('should check/uncheck items', function (done) {
        var t = makeTasks([]);
        expect(t.isCompleted)
            .to.emit([])
            .after(function () { return t.i.insert.impulse('1'); })
            .to.emit([false])
            .after(function () { return t.i.insert.impulse('2'); })
            .to.emit([false, false])
            .after(function () { return t.i.check.impulse({ id: t.ask(0).id(), completed: true }); })
            .to.emit([true, false])
            .after(function () { return t.i.check.impulse({ id: t.ask(1).id(), completed: true }); })
            .to.emit([true, true])
            .after(function () { return t.i.check.impulse({ id: t.ask(1).id(), completed: false }); })
            .to.emit([true, false])
            .andBe(done);
    });
    it('should complete all items if there are uncompleted on toggle', function (done) {
        var t = makeTasks([]);
        expect(t.isCompleted)
            .to.emit([])
            .after(function () { return t.i.insert.impulse('1'); })
            .to.emit([false])
            .after(function () { return t.i.insert.impulse('2'); })
            .to.emit([false, false])
            .after(function () { return t.i.check.impulse({ id: t.ask(0).id(), completed: true }); })
            .to.emit([true, false])
            .after(function () { return t.i.toggle.impulse(true); })
            .to.emit([true, true])
            .after(function () { return t.i.check.impulse({ id: t.ask(1).id(), completed: false }); })
            .to.emit([true, false])
            .after(function () { return t.i.toggle.impulse(true); })
            .to.emit([true, true])
            .after(function () { return t.i.toggle.impulse(true); })
            .to.emit([false, false])
            .after(function () { return t.i.toggle.impulse(true); })
            .to.emit([true, true])
            .andBe(done);
    });
    it('should retitle items', function (done) {
        var t = makeTasks(['a0', 'b0']);
        expect(t.titles)
            .to.emit(['a0', 'b0'])
            .after(function () { return t.i.retitle.impulse({ id: t.ask(0).id(), title: 'a1' }); })
            .to.emit(['a1', 'b0'])
            .after(function () { return t.i.retitle.impulse({ id: t.ask(1).id(), title: 'b1' }); })
            .to.emit(['a1', 'b1'])
            .andBe(done);
    });
    it('should delete items', function (done) {
        var t = makeTasks(['a0', 'b0']);
        expect(t.titles)
            .to.emit(['a0', 'b0'])
            .after(function () { return t.i.del.impulse(t.ask(0).id()); })
            .to.emit(['b0'])
            .after(function () { return t.i.del.impulse(t.ask(0).id()); })
            .to.emit([])
            .andBe(done);
    });
    it('should clear completed', function (done) {
        var t = makeTasks(init);
        expect(t.titles)
            .to.emit(init)
            .after(function () { return t.i.check.impulse({ id: t.ask(0).id(), completed: true }); })
            .to.emit(init)
            .after(function () { return t.i.check.impulse({ id: t.ask(2).id(), completed: true }); })
            .to.emit(init)
            .after(function () { return t.i.clear.impulse(null); })
            .to.emit(['2'])
            .andBe(done);
    });
    it('should show all tasks when #/', function (done) {
        var t = makeTasks(init);
        expect(t.titles)
            .to.emit(init)
            .andBe(done);
    });
    it('should tread invalid hashes like #/', function (done) {
        var t = makeTasks(init, '#/fdsffsd');
        expect(t.titles)
            .to.emit(init)
            .andBe(done);
    });
    it('should show only active tasks when #/active', function (done) {
        var t = makeTasks(init, '#/active');
        expect(t.titles)
            .to.emit(init)
            .after(function () { return t.i.check.impulse({ id: t.ask(0).id(), completed: true }); })
            .to.emit(['2', '3'])
            .andBe(done);
    });
    it('should show only completed tasks when #/completed', function (done) {
        var t = makeTasks(init, '#/completed');
        expect(t.titles)
            .to.emit([])
            .andBe(done);
    });
    it('should switch visible tasks according to route', function (done) {
        var all = [item.of('test1'), item.of('test2').complete()];
        var t = makeTasks(all, '#/', false);
        expect(t.titles)
            .to.emit(['test1', 'test2'])
            .then.after(function () { return t.i.filter.emit('#/active'); })
            .to.emit(['test1'])
            .then.after(function () { return t.i.filter.emit('#/completed'); })
            .to.emit(['test2'])
            .then.after(function () { return t.i.filter.emit('#/'); })
            .to.emit(['test1', 'test2'])
            .andBe(done);
    });
    it('should count active tasks', function (done) {
        var all = [item.of('test1'), item.of('test2').complete(), item.of('test3').complete()];
        var t = makeTasks(all, '#/', false);
        expect(t.count.active)
            .to.emit(1)
            .then.after(function () { return t.i.insert.impulse('test3'); })
            .to.emit(2)
            .andBe(done);
    });
    it('should count complted tasks', function (done) {
        var all = [item.of('test1'), item.of('test2').complete(), item.of('test3').complete()];
        var t = makeTasks(all, '#/', false);
        expect(t.count.completed)
            .to.emit(2)
            .then.after(function () { return t.i.insert.impulse('test4'); })
            .andBe(done);
    });
    it('should count all tasks', function (done) {
        var all = [item.of('test1'), item.of('test2').complete(), item.of('test3').complete()];
        var t = makeTasks(all, '#/', false);
        expect(t.count.all)
            .to.emit(3)
            .then.after(function () { return t.i.insert.impulse('test4'); })
            .to.emit(4)
            .andBe(done);
    });
});
