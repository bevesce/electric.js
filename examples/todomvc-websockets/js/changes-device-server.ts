import item = require('./item');
import counter = require('./counter');
import electric = require('../../../src/electric');
import eevent = require('../../../src/electric-event');
import Change = require('./change');

export = collection;

const ACTIVE = '#/active';
const COMPLETED = '#/completed';


function collection(
	initialTasks: item[],
	input: {
		insert: electric.emitter.EventEmitter<string>,
		check: electric.emitter.EventEmitter<{ id: number, completed: boolean }>,
		toggle: electric.emitter.EventEmitter<boolean>,
		retitle: electric.emitter.EventEmitter<{ id: number, title: string }>,
		del: electric.emitter.EventEmitter<number>,
		clear: electric.emitter.EventEmitter<{}>
	}
) {
	var ac = electric.emitter.placeholder(0);
	var acShifted = ac.transformTime(0, t => t + 1);
	(<any>acShifted).initialValue = 0;
	var cc = electric.emitter.placeholder(0);
	var ccShifted = cc.transformTime(0, t => t + 1);
	(<any>ccShifted).initialValue = 0;
	// this is ugly
	// we shouldn't make this transformTime by hand
	// to avoid infinite recursion
	var toggleTo = electric.transformator.map(
		(a, c, t) => {
			return t.map(_ => a !== c);
		},
		acShifted,
		ccShifted,
		input.toggle
	);
	var insert = notEmpty(input.insert);

	var tasks = electric.emitter.placeholder([]);

	var $ = eevent.lift;

	var changes = electric.transformator.merge(
		// append
		insert.map(
			$((t: item) => [Change.append(t.id(), t.isCompleted(), t.title())])
		),
		// check
		input.check.map(
			$((t: { id: number, completed: boolean }) => [Change.check(t.id, t.completed)])
		),
		// toggle
		electric.transformator.map(
			(toggle, tasks) => toggle.flattenMap(toWhat => {
				var toggledTasks = tasks.filter(t => t.isCompleted() != toWhat);
				var changes = toggledTasks.map(t => Change.check(t.id(), toWhat))
				return changes.length > 0 ? eevent.of(changes) : eevent.notHappend;
			}),
			toggleTo, tasks
		),
		// retitle
		input.retitle.map(
			$((rt: { id: number, title: string }) => [Change.retitle(rt.id, rt.title)])
		),
		// remove
		input.del.map(
			$((id: number) => [Change.remove(id)])
		),
		// clear
		electric.transformator.map(
			(clear, tasks) => clear.flattenMap(_ => {
				var changes = onlyCompleted(tasks).map(t => Change.remove(t.id()));
				return changes.length > 0 ? eevent.of(changes) : eevent.notHappend;
			}),
			input.clear, tasks
		)
	);


	var allCount = tasks.map(ts => ts.length);
	ac.is(allCount);
	var completedCount = tasks.map(ts => onlyCompleted(ts).length);
	cc.is(completedCount);
	var activeCount = tasks.map(ts => onlyActive(ts).length);

	tasks.is(
		changes.accumulate(initialTasks, applyChanges)
	)

	return {
		all: tasks,
		changes: changes,
	};
};

function notEmpty(insert: electric.emitter.Emitter<eevent<string>>) {
	return insert.map(v => v.flattenMap(text => {
		text = text.trim();
		if (text !== '') {
			return eevent.of(item.of(text))
		}
		return eevent.notHappend
	}));
}


function applyChanges(tasks: item[], changes: eevent<Change[]>) {
	if (!changes.happend) {
		return tasks;
	}
	var cs = changes.value;
	var newTasks = tasks.slice();
	cs.forEach(c => applyChange(c, newTasks));
	return newTasks;
}

function applyChange(change: Change, tasks: item[]) {
	if (change.type === 'append') {
		tasks.push(change.item());
	}
	else if (change.type === 'insert') {
		tasks.splice(change.index, 0, change.item());
	}
	else if (change.type === 'remove') {
		var index = indexById(change.id, tasks);
		tasks.splice(index, 1);
	}
	else if (change.type === 'check') {
		var index = indexById(change.id, tasks);
		var task = tasks[index];
		tasks.splice(index, 1, task.withCompleted(change.completed));
	}
	else if (change.type === 'retitle') {
		var index = indexById(change.id, tasks);
		var task = tasks[index];
		tasks.splice(index, 1, task.withTitle(change.title));
	}
}

function indexById(id: number, tasks: item[]) {
	for (var i = 0; i < tasks.length; i++) {
		if (tasks[i].id() === id) {
			return i;
		}
	}
}

function onlyActive(tasks: item[]) {
	return tasks.filter(t => !t.isCompleted());
}

function onlyCompleted(tasks: item[]) {
	return tasks.filter(t => t.isCompleted());
}

function matchMap<T>(
	items: T[], match: (v: T) => boolean, map: (v: T) => T
	) {
	return items.map(v => {
		if (match(v)) {
			return map(v)
		}
		return v
	});
}
