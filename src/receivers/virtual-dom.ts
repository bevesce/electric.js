import vdom = require('../../bower_components/virtual-dom/dist/virtual-dom');
import utils = require('./utils');

function virtualDomReceiver(nodeOrId: utils.Node | string) {
	var node = utils.getNode(nodeOrId);
	var previousTree = vdom.h();
	var rootNode = vdom.create(previousTree);
	node.appendChild(rootNode);

	return function (newTree: any) {
		var patches = vdom.diff(previousTree, newTree);
		rootNode = vdom.patch(rootNode, patches);
		previousTree = newTree;
	}
}

export = virtualDomReceiver;
