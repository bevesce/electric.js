import electric = require('../../../../src/electric');
export = insert;

var cont = electric.emitter.constant;

function insert<T>(list: T[], item: T) {
	var l = list.slice();
	l.push(item);
	return cont(l);
}
