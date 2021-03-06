import item = require('./item');
import counter = require('./counter');
import electric = require('../../../src/electric');
import eevent = require('../../../src/electric-event');

export = collection;


function collection(
	initialTasks: electric.emitter.EventEmitter<item[]>,
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
	var ac = electric.emitter.placeholder(13);
	var cc = electric.emitter.placeholder(26);
	var toggleTo = electric.transformator.map(
		(a, c, t) => {
			return t.map(_ => a !== c);
		},
		ac, cc, input.toggle
	);
	var insert = notEmpty(input.insert);

	var tasks = electric.emitter.constant([]).change(
		{ to: appended, when: insert },
		{ to: checked, when: input.check },
		{ to: allWithCompleted, when: toggleTo },
		{ to: retitled, when: input.retitle },
		{ to: deleted, when: input.del },
		{ to: cleared, when: input.clear },
		{ to: concatenated, when: initialTasks }
	);

	var $ = eevent.lift;

	var visible = electric.transformator.map(
		filterWithRoute, tasks, input.filter
	);

	var allCount = tasks.map(ts => ts.length);
	ac.is(allCount);
	var completedCount = tasks.map(ts => onlyCompleted(ts).length);
	cc.is(completedCount);
	var activeCount = tasks.map(ts => onlyActive(ts).length);

	return {
		all: tasks,
		visible: visible,
		count: {
			active: activeCount,
			completed: completedCount,
			all: allCount
		}
	};
};

function notEmpty(insert: electric.emitter.Emitter<eevent<string>>) {
	return insert.map(v => v.flattenMap(text => {
		text = text.trim();
		if (text !== '') {
			return eevent.of(item.of(text))
		}
		return eevent.notHappened
	}));
}

function appended(items: item[], newItem: item) {
	return cont(items.concat(newItem));
}

var cont = electric.emitter.constant;

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

function checked(
	items: item[], arg: { id: number, completed: boolean }
): electric.emitter.Emitter<item[]> {
	return cont(matchMap(
		items,
		v => v.id() === arg.id,
		v => v.withCompleted(arg.completed)
	));
}

function allWithCompleted(items: item[], completed: boolean) {
	return cont(items.map(i => i.withCompleted(completed)));
}

function retitled(items: item[], arg: { id: number, title: string }) {
	return cont(matchMap(
		items,
		v => v.id() === arg.id,
		v => v.withTitle(arg.title)
	));
}

function deleted(items: item[], id: number) {
	return cont(items.filter(v => v.id() !== id));
}

function cleared(items: item[], _: {}) {
	return cont(onlyActive(items));
}

function concatenated(items: item[], otherItems: item[]) {
	return cont(otherItems.concat(items));
}

function filterWithRoute(items: item[], route: string) {
	if (route === '#/active') {
		return onlyActive(items);
	}
	else if (route === '#/completed') {
		return onlyCompleted(items);
	}
	return items
}

function onlyActive(tasks: item[]) {
	return tasks.filter(t => !t.isCompleted());
}

function onlyCompleted(tasks: item[]) {
	return tasks.filter(t => t.isCompleted());
}
