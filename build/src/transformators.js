function map(f) {
    return function mapTransform(emit) {
        return function mapTransform(v, i) {
            emit(f.apply(null, v));
        };
    };
}
exports.map = map;
function filter(predicate) {
    return function transform(emit) {
        return function filterTransform(v, i) {
            if (predicate(v[i])) {
                emit(v[i]);
            }
        };
    };
}
exports.filter = filter;
;
