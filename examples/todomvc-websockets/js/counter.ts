import item = require('./item');
import electric = require('../../../src/electric');
import inf = require('../../../src/interfaces');


function counter<T>(tasks: inf.IEmitter<T[]>) {
	var tasksCounter = tasks.map(ts => ts.length);
	var tasksWord = tasksCounter.map(c => c === 1 ? 'item' : 'items');
	return {
		count: tasksCounter,
		word: tasksWord
	}
}

export = counter;
