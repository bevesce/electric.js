export interface Node {
	appendChild(child: any): void;
}

export function getNode(nodeOrId: Node | string): Node{
	if (typeof nodeOrId === 'string'){
		return document.getElementById(nodeOrId);
	}
	else {
		return <Node>nodeOrId;
	}
}
