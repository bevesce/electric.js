function htmlReceiverById(id) {
    var element = document.getElementById(id);
    return function htmlReceiver(html) {
        element.innerHTML = html;
    };
}
exports.htmlReceiverById = htmlReceiverById;
