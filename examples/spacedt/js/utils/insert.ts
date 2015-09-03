export = insert;

function insert<T>(list: T[], item: T) {
	var l = list.slice();
	l.push(item);
	return l;
}
