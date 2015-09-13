import item = require('./item');
import counter = require('./counter');
import electric = require('../../../src/electric');
import eevent = require('../../../src/electric-event');

export = collection;


function collection(
    initial: item[],
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
    var initialTasks = electric.emitter.constant(initial);

    var tasks = initialTasks.change(
        { to: appended, when: notEmpty(input.insert) },
        { to: checked, when: input.check },
        { to: toggled, when: input.toggle },
        { to: retitled, when: input.retitle },
        { to: deleted, when: input.del },
        { to: cleared, when: input.clear }
    );
    tasks.name = 'tasks';

    var visible = electric.transformator.map(
        filterWithRoute, tasks, input.filter
    );
    visible.name = 'visible';

    var allCount = tasks.map(ts => ts.length);
    allCount.name = 'count of all tasks'
    var completedCount = tasks.map(ts => onlyCompleted(ts).length);
    completedCount.name = 'count of completed tasks'
    var activeCount = tasks.map(ts => onlyActive(ts).length);
    activeCount.name = 'count of active tasks'

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
    var t = insert.map(v => v.flattenMap(text => {
        text = text.trim();
        if (text !== '') {
            return eevent.of(item.of(text))
        }
        return eevent.notHappend
    }));
    t.name = 'not empty'
    return t;
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

function toggled(items: item[], completed: boolean) {
    var noAll = items.length;
    console.log(items);
    var noCompleted = items.filter(t => t.isCompleted()).length;
    var completed = noAll !== noCompleted;
    console.log(noAll, noCompleted, completed);
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
