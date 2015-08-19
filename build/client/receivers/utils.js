define(["require", "exports"], function (require, exports) {
    function getNode(nodeOrId) {
        if (typeof nodeOrId === 'string') {
            return document.getElementById(nodeOrId);
        }
        else {
            return nodeOrId;
        }
    }
    exports.getNode = getNode;
    function getNodes(nodesOfName) {
        if (typeof nodesOfName === 'string') {
            return Array.prototype.slice.call(document.getElementsByName(nodesOfName));
        }
        else {
            return nodeOrId;
        }
    }
    exports.getNodes = getNodes;
});
