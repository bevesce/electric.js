interface AddEventListenerFunction {
	(type: string, listener: (event: any) => void, useCapture?: boolean): void
}

export type NodeOrId = HTMLElement | string;

export function getNode(nodeOrId: NodeOrId): HTMLElement {
	if (typeof nodeOrId === 'string'){
		return document.getElementById(nodeOrId);
	}
	else {
		return <HTMLElement>nodeOrId;
	}
}

export type NodesOrName = HTMLElement[] | string;

export function getNodes(nodesOfName: NodesOrName): HTMLElement[] {
	if (typeof nodesOfName === 'string') {
		return Array.prototype.slice.call(document.getElementsByName(nodesOfName));
	}
	else {
		return <HTMLElement[]>nodesOfName;
	}
}
