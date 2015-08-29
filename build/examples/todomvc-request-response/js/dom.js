function element(tag, attributes) {
    var result = document.createElement(tag);
    for (var name in attributes) {
        if (!attributes.hasOwnProperty(name)) {
            continue;
        }
        result.setAttribute(name, attributes[name]);
    }
    return result;
}
exports.element = element;
function curryTag(tag) {
    return function (attributes) {
        return element(tag, attributes || {});
    };
}
exports.div = curryTag('div');
exports.label = curryTag('label');
exports.li = curryTag('li');
exports.button = curryTag('button');
exports.input = curryTag('input');
function checkbox(attributes) {
    attributes['type'] = 'checkbox';
    return element('input', attributes);
}
exports.checkbox = checkbox;
function text(txt) {
    return document.createTextNode(txt);
}
exports.text = text;
