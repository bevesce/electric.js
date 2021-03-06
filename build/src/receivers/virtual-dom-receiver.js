/// <reference path="../../d/viertual-dom.d.ts" />
var vdom = require('virtual-dom');
var utils = require('./utils');
function virtualDomReceiver(nodeOrId) {
    var node = utils.getNode(nodeOrId);
    var previousTree = vdom.h();
    var rootNode = vdom.create(previousTree);
    node.appendChild(rootNode);
    return function virtualDomReceiver(newTree) {
        var patches = vdom.diff(previousTree, newTree);
        rootNode = vdom.patch(rootNode, patches);
        previousTree = newTree;
    };
}
module.exports = virtualDomReceiver;
