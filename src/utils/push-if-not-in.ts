export = pushIfNotIn;

function pushIfNotIn<T>(list: T[], item: T) {
	if (list.indexOf(item) === -1) {
		list.push(item);
	}
}