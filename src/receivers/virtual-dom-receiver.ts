/// <reference path="../../d/viertual-dom.d.ts" />
import vdom = require('virtual-dom');
import utils = require('./utils');


function virtualDomReceiver(nodeOrId: utils.NodeOrId | string) {
	var node = utils.getNode(nodeOrId);
	var previousTree = vdom.h();
	var rootNode = vdom.create(previousTree);
	node.appendChild(rootNode);

	return function virtualDomReceiver(newTree: any) {
		var patches = vdom.diff(previousTree, newTree);
		rootNode = vdom.patch(rootNode, patches);
		previousTree = newTree;
	}
}

export = virtualDomReceiver;
