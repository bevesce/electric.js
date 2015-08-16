var vdom = require('../../bower_components/virtual-dom/dist/virtual-dom');
function getNode(nodeOrId) {
    if (typeof nodeOrId === 'string') {
        return document.getElementById(nodeOrId);
    }
    else {
        return nodeOrId;
    }
}
function virtualDomReceiver(nodeOrId) {
    var node = getNode(nodeOrId);
    var previousTree = vdom.h();
    var rootNode = vdom.create(previousTree);
    node.appendChild(rootNode);
    return function (newTree) {
        var patches = vdom.diff(previousTree, newTree);
        rootNode = vdom.patch(rootNode, patches);
        previousTree = newTree;
    };
}
module.exports = virtualDomReceiver;
