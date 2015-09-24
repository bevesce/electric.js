import item = require('./item');
import electric = require('../../../src/electric');


function counter<T>(tasks: electric.emitter.Emitter<T[]>) {
	var tasksCounter = tasks.map(ts => ts.length);
	var tasksWord = tasksCounter.map(c => c === 1 ? 'item' : 'items');
	return {
		count: tasksCounter,
		word: tasksWord
	}
}

export = counter;
