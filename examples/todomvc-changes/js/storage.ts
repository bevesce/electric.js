import item = require('./item');

const TASK_KEY = 'todos-electric';


export function restoreTasks() {
	var s = localStorage.getItem(TASK_KEY);
	if (s) {
		return JSON.parse(s).map(item.restore);
	}
	return [];
}

export function saveTasksToStorage(tasks: item[]) {
	localStorage.setItem(TASK_KEY, JSON.stringify(tasks));
}
