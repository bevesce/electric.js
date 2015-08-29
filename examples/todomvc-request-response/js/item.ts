class Item {
	private static _counter = 0;
	static of(title: string) {
		return new Item(Item._counter++, title, false);
	}

	static equal(item1: Item, item2: Item) {
		return item1._id === item2._id &&
			item1._title === item2._title &&
			item1._completed === item2._completed;
	}

	static restore(args: { _id: number, _title: string, _completed: boolean }) {
		return new Item(Item._counter++, args._title, args._completed);
	}

	private _id: number;
	private _title: string;
	private _completed: boolean;

	constructor(id: number, title: string, completed: boolean) {
		this._id = id;
		this._title = title;
		this._completed = completed;
	}

	withTitle(newTitle: string) {
		return new Item(this._id, newTitle, this._completed);
	}

	complete() {
		return new Item(this._id, this._title, true);
	}

	uncomplete() {
		return new Item(this._id, this._title, false);
	}

	toggle() {
		return new Item(this._id, this._title, !this._completed);
	}

	title() {
		return this._title;
	}

	isCompleted() {
		return this._completed;
	}

	withCompleted(complted: boolean) {
		return new Item(this._id, this._title, complted);
	}

	id() {
		return this._id;
	}

	equals(otherItem: Item) {
		return Item.equal(this, otherItem);
	}
}

export = Item;