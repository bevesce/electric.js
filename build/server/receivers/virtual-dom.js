var vdom = require('../../../bower_components/virtual-dom/dist/virtual-dom');
var utils = require('./utils');
function virtualDomReceiver(nodeOrId) {
    var node = utils.getNode(nodeOrId);
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
