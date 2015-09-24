/// <reference path="../../../d/socket.io-client.d.ts" />
import item = require('./item');
import eevent = require('../../../src/electric-event');
import Change = require('./change');
import io = require('socket.io-client');
import electricSocket = require('../../../src/devices/electric-socket');
import electric = require('../../../src/electric');

export = collection;

const ACTIVE = '#/active';
const COMPLETED = '#/completed';


function collection(
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
	var socket = io('http://localhost:8080');
	for (var name in input) {
		(<any>input)[name].plugReceiver(
			electricSocket.eventReceiver(name, socket)
		);
	}
	var changes = <electric.emitter.EventEmitter<Change[]>>electricSocket.eventEmitter(
		'changes', socket
	).map(eevent.lift((c: any[]) => c.map(Change.restore)));

	var tasks = electric.emitter.placeholder([]);

	var $ = eevent.lift;

	var filteringChanges = electric.transformator.map(
		(tasks, filter) => filter.flattenMap(f => visibilityChangesOfTask(tasks, f)),
		tasks, electric.transformator.changes(input.filter)
	)

	var changesVisibleWithFilter = electric.transformator.map(
		(changes, filter, tasks) => {
			var r = changes.flattenMap(c => calculateVisibleChanges(c, filter, tasks));
			return r;
		},
		changes, input.filter, tasks
	);

	var visibleChanges = electric.transformator.merge(
		changesVisibleWithFilter, filteringChanges
	);

	var allCount = tasks.map(ts => ts.length);
	var completedCount = tasks.map(ts => onlyCompleted(ts).length);
	var activeCount = tasks.map(ts => onlyActive(ts).length);

	tasks.is(
		changes.accumulate([], applyChanges)
	)
	var initialVisibleTasks: item[] = [];
	var visible = visibleChanges.accumulate(initialVisibleTasks, applyChanges);
	visibleChanges.name = '<| visible changes |>';
	changes.name = '<| changes |>';

	return {
		all: tasks,
		visible: visible,
		count: {
			active: activeCount,
			completed: completedCount,
			all: allCount
		},
		changes: {
			all: <electric.emitter.EventEmitter<Change[]>>changes,
			visible: <electric.emitter.EventEmitter<Change[]>>visibleChanges
		}
	};
};

function visibilityChangesOfTask(tasks: item[], f: { previous: string; next: string; }) {
	var changes: Change[] = [];
	if (f.previous === f.next) {
		return eevent.notHappened
	}
	// all -> active
	else if (f.previous === '#/' && f.next === ACTIVE) {
		changes = onlyCompleted(tasks).map(Change.removeTask)
	}
	// all -> completed
	else if (f.previous === '#/' && f.next === COMPLETED) {
		changes = onlyActive(tasks).map(Change.removeTask)
	}
	// active -> all
	else if (f.previous === ACTIVE && f.next === '#/') {
		for (var i = 0; i < tasks.length; i++) {
			var task = tasks[i];
			if (task.isCompleted()) {
				changes.push(Change.insertTask(task, i));
			}
		}
	}
	// active -> completed
	else if (f.previous === ACTIVE && f.next === COMPLETED) {
		changes = tasks.map(t => t.isCompleted() ? Change.appendTask(t) : Change.removeTask(t));
	}
	// completed -> all
	else if (f.previous === COMPLETED && f.next === '#/') {
		for (var i = 0; i < tasks.length; i++) {
			var task = tasks[i];
			if (!task.isCompleted()) {
				changes.push(Change.insertTask(task, i));
			}
		}
	}
	// completed -> active
	else if (f.previous === COMPLETED && f.next === ACTIVE) {
		changes = tasks.map(t => !t.isCompleted() ? Change.appendTask(t) : Change.removeTask(t));
	}
	return changes.length > 0 ? eevent.of(changes) : eevent.notHappened;
}

function calculateVisibleChanges(changes: Change[], filter: string, tasks: item[]) {
	var visibleChanges = filterMap(changes, changesFilterMap(filter, tasks))
	return visibleChanges.length > 0 ? eevent.of(visibleChanges) : eevent.notHappened;
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
		return Change.insert(change.id, task.title(), change.completed, index);
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
		return Change.insert(change.id, task.title(), change.completed, index);
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
	if (!changes.happened) {
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
