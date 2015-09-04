export = all;

function all(list: any[]) {
	for (var i = 0; i < list.length; i++) {
		if (!list[i]) {
			return false;
		}
	}
	return true;
}