import item = require('./item');

class Change {
	type: string;
	id: number;
	completed: boolean;
	title: string;
	index: number;

	static restore(c: { type: string, id: number, completed: boolean, title: string, index: number }) {
		return new Change(c.type, c.id, c.completed, c.title, c.index);
	}

	constructor(type: string, id: number, completed?: boolean, title?: string, index?: number) {
		this.type = type;
		this.id = id;
		this.completed = completed;
		this.title = title;
		this.index = index;
	}

	static check(id: number, completed: boolean) {
		return new Change('check', id, completed);
	}

	static retitle(id: number, title: string) {
		return new Change('retitle', id, undefined, title);
	}

	static append(id: number, completed: boolean, title: string) {
		return new Change('append', id, completed, title);
	}

	static remove(id: number) {
		return new Change('remove', id);
	}

	static insert(id: number, title: string, completed: boolean, index: number) {
		return new Change('insert', id, completed, title, index);
	}

	//

	static appendTask(task: item) {
		return Change.append(task.id(), task.isCompleted(), task.title());
	}

	static insertTask(task: item, index: number) {
		return Change.insert(task.id(), task.title(), task.isCompleted(), index);
	}

	static removeTask(task: item) {
		return Change.remove(task.id())
	}

	item() {
		return new item(this.id, this.title, this.completed);
	}
}

export = Change;
