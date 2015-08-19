export interface Node {
	appendChild(child: any): void;
}

type NodeOrId = Node | string;

export function getNode(nodeOrId: NodeOrId): Node {
	if (typeof nodeOrId === 'string'){
		return document.getElementById(nodeOrId);
	}
	else {
		return <Node>nodeOrId;
	}
}

type NodesOrName = Node[]| string;

export function getNodes(nodesOfName: NodesOrName): Node[] {
	if (typeof nodesOfName === 'string') {
		return Array.prototype.slice.call(document.getElementsByName(nodesOfName));
	}
	else {
		return <Node[]>nodeOrId;
	}
}
