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
});