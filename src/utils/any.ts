export = any;

function any(list: any[]): any {
	for (var i = 0; i < list.length; i++) {
		if (list[i]) {
			return true;
		}
	}
	return false;
}
