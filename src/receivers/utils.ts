interface AddEventListenerFunction {
	(type: string, listener: (event: any) => void, useCapture?: boolean): void
}

export interface Node {
	appendChild(child: any): void;
	addEventListener: AddEventListenerFunction;
	removeEventListener: AddEventListenerFunction;
	value?: string | boolean;
	id?: string;
	checked?: boolean;
}

export type NodeOrId = Node | string;

export function getNode(nodeOrId: NodeOrId): Node {
	if (typeof nodeOrId === 'string'){
		return document.getElementById(nodeOrId);
	}
	else {
		return <Node>nodeOrId;
	}
}

export type NodesOrName = Node[]| string;

export function getNodes(nodesOfName: NodesOrName): Node[] {
	if (typeof nodesOfName === 'string') {
		return Array.prototype.slice.call(document.getElementsByName(nodesOfName));
	}
	else {
		return <Node[]>nodesOfName;
	}
}
