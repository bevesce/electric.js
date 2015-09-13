import item = require('./item');
import counter = require('./counter');
import electric = require('../../../src/electric');
import eevent = require('../../../src/electric-event');
import Change = require('./change');

export = collection;

const ACTIVE = '#/active';
const COMPLETED = '#/completed';
const ALL = '#/'


function collection(
	initialTasks: item[],
	input: {
		insert: electric.emitter.EventEmitter<string>,
		check: electric.emitter.EventEmitter<{ id: number, completed: boolean }>,
		toggle: electric.emitter.EventEmitter<boolean>,
		retitle: electric.emitter.EventEmitter<{ id: number, title: string }>,
		del: electric.emitter.EventEmitter<number>,
		clear: electric.emitter.EventEmitter<{}>,
		filter: electric.emitter.Emitter<string>
	}
) {
	var insert = notEmpty(input.insert);
	var tasks = electric.emitter.placeholder([]);
	var delayedTasks = tasks.transformTime([], t => t + 1);
	(<any>delayedTasks).initialValue = [];
	var $ = eevent.lift;

	var appendChanges = insert.map(
		$((t: item) => [Change.append(t.id(), t.isCompleted(), t.title())])
	);
	var checkChanges = input.check.map(
		$((t: { id: number, completed: boolean }) => [Change.check(t.id, t.completed)])
	);
	var toggleChanges = electric.transformator.map(
		(toggle, tasks) => toggle.flattenMap(_ => {
			var noAll = tasks.length;
			var noCompleted = tasks.filter(t => t.isCompleted()).length;
			var toWhat = noAll !== noCompleted;
			var toggledTasks = tasks.filter(t => t.isCompleted() != toWhat);
			var changes = toggledTasks.map(t => Change.check(t.id(), toWhat))
			return changes.length > 0 ? eevent.of(changes) : eevent.notHappend;
		}),
		input.toggle, delayedTasks
	);
	var retitleChanges = input.retitle.map(
		$((rt: { id: number, title: string }) => [Change.retitle(rt.id, rt.title)])
	);
	var deleteChanges = input.del.map(
		$((id: number) => [Change.remove(id)])
	);
	var clearChanges = electric.transformator.map(
		(clear, tasks) => clear.flattenMap(_ => {
			var changes = onlyCompleted(tasks).map(t => Change.remove(t.id()));
			return changes.length > 0 ? eevent.of(changes) : eevent.notHappend;
		}),
		input.clear, tasks
	);

	var changes = electric.transformator.merge(
		appendChanges, checkChanges, toggleChanges,
		retitleChanges, deleteChanges, clearChanges
	);
	changes.name = 'tasks changes'

	var filteringChanges = electric.transformator.map(
		(tasks, filter) => filter.flattenMap(f => visibilityChangesOfTask(tasks, f)),
		tasks, electric.transformator.changes(input.filter)
	)

	var changesVisibleWithFilter = electric.transformator.map(
		(changes, filter, tasks) => {
			var r = changes.flattenMap(c => calculateVisibleChanges(c, filter, tasks));
			return r;
		},
		changes.transformTime(eevent.notHappend, t => t + 1), input.filter, tasks
	);

	var visibleChanges = electric.transformator.merge(
		changesVisibleWithFilter, filteringChanges
	);
	visibleChanges.name = 'visible changes';

	var allCount = tasks.map(ts => ts.length);
	var completedCount = tasks.map(ts => onlyCompleted(ts).length);
	var activeCount = tasks.map(ts => onlyActive(ts).length);
	allCount.name = 'count of all tasks'
	completedCount.name = 'count of completed tasks'
	activeCount.name = 'count of active tasks'

	var accumulatedChanges = changes.accumulate(initialTasks, applyChanges)
	accumulatedChanges.name = 'tasks'
	tasks.is(
		accumulatedChanges
	)
	var initialVisibleTasks = initialTasks;
	if (input.filter.dirtyCurrentValue() === ACTIVE) {
		initialVisibleTasks = onlyActive(initialTasks);
	}
	else if (input.filter.dirtyCurrentValue() === COMPLETED) {
		initialVisibleTasks = onlyCompleted(initialTasks);
	}

	var visible = visibleChanges.accumulate(initialVisibleTasks, applyChanges);
	visible.name = 'visible tasks';

	return {
		all: tasks,
		visible: visible,
		count: {
			active: activeCount,
			completed: completedCount,
			all: allCount
		},
		changes: {
			all: changes,
			visible: visibleChanges
		}
	};
};

function notEmpty(insert: electric.emitter.EventEmitter<string>) {
	var t = insert.map(v => v.flattenMap(text => {
		text = text.trim();
		if (text !== '') {
			return eevent.of(item.of(text))
		}
		return eevent.notHappend
	}));
	t.name = 'not empty';
	return t;
}

function visibilityChangesOfTask(tasks: item[], filter: { previous: string; next: string; }) {
	var changes: Change[] = [];
	if (filter.previous === filter.next) {
		return eevent.notHappend
	}
	// all -> active
	else if (filter.previous === ALL && filter.next === ACTIVE) {
		changes = onlyCompleted(tasks).map(Change.removeTask)
	}
	// all -> completed
	else if (filter.previous === ALL && filter.next === COMPLETED) {
		changes = onlyActive(tasks).map(Change.removeTask)
	}
	// active -> all
	else if (filter.previous === ACTIVE && filter.next === ALL) {
		for (var i = 0; i < tasks.length; i++) {
			var task = tasks[i];
			if (task.isCompleted()) {
				changes.push(Change.insertTask(task, i));
			}
		}
	}
	// active -> completed
	else if (filter.previous === ACTIVE && filter.next === COMPLETED) {
		changes = tasks.map(t => t.isCompleted() ? Change.appendTask(t) : Change.removeTask(t));
	}
	// completed -> all
	else if (filter.previous === COMPLETED && filter.next === ALL) {
		for (var i = 0; i < tasks.length; i++) {
			var task = tasks[i];
			if (!task.isCompleted()) {
				changes.push(Change.insertTask(task, i));
			}
		}
	}
	// completed -> active
	else if (filter.previous === COMPLETED && filter.next === ACTIVE) {
		changes = tasks.map(t => !t.isCompleted() ? Change.appendTask(t) : Change.removeTask(t));
	}
	return changes.length > 0 ? eevent.of(changes) : eevent.notHappend;
}

function calculateVisibleChanges(changes: Change[], filter: string, tasks: item[]) {
	var visibleChanges = filterMap(changes, changesFilterMap(filter, tasks))
	return visibleChanges.length > 0 ? eevent.of(visibleChanges) : eevent.notHappend;
}

function filterMap<In, Out>(items: In[], f: ((v: In) => Out)): Out[] {
	return items.map(f).filter(x => x !== undefined);
}

function changesFilterMap(filter: string, tasks: item[]) {
	if (filter === ACTIVE) {
		return (c: Change) => changeOverActive(c, tasks);
	}
	else if (filter === COMPLETED) {
		return (c: Change) => changeOverCompleted(c, tasks);;
	}
	else {
		return (c: Change) => c;
	}
}

function changeOverActive(change: Change, tasks: item[]) {
	if (justPassIt(change)) {
		return change;
	}
	else if (change.type === 'append' && !change.completed) {
		return change;
	}
	else if (change.type === 'check' && change.completed) {
		return Change.remove(change.id)
	}
	else if (change.type === 'check' && !change.completed) {
		var index = howManyMatchingBefore(t => !t.isCompleted(), change.id, tasks);
		var task = findById(change.id, tasks);
		return Change.insertTask(task, index);
	}
	else if (change.type === 'insert' && change.completed) {
		return;
	}
	else if (change.type === 'insert' && !change.completed) {
		var index = howManyMatchingBefore(t => !t.isCompleted(), change.id, tasks);
		return Change.insert(change.id, change.title, change.completed, index);
	}
}

function changeOverCompleted(change: Change, tasks: item[]) {
	if (justPassIt(change)) {
		return change;
	}
	else if (change.type === 'append' && change.completed) {
		return change;
	}
	else if (change.type === 'check' && !change.completed) {
		return Change.remove(change.id)
	}
	else if (change.type === 'check' && change.completed) {
		var index = howManyMatchingBefore(t => t.isCompleted(), change.id, tasks);
		var task = findById(change.id, tasks);
		return Change.insertTask(task, index);
	}
	else if (change.type === 'insert' && !change.completed) {
		return;
	}
	else if (change.type === 'insert' && change.completed) {
		var index = howManyMatchingBefore(t => t.isCompleted(), change.id, tasks);
		return Change.insert(change.id, change.title, change.completed, index);
	}
}

function justPassIt(change: Change) {
	return change.type === 'retitle' || change.type === 'remove'
}

function howManyMatchingBefore(match: (v: item) => boolean, id: number, tasks: item[]) {
	var count = 0;
	for (var i = 0; i < tasks.length; i++) {
		var task = tasks[i];
		if (task.id() === id) {
			return count;
		}
		if (match(task)) {
			count += 1;
		}
	}
}

function findById(id: number, tasks: item[]) {
	for (var i = 0; i < tasks.length; i++) {
		if (tasks[i].id() === id) {
			return tasks[i];
		}
	}
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
