export function htmlReceiverById(id: string) {
	var element = document.getElementById(id);
	return function htmlReceiver(html: any) {
		element.innerHTML = html;
	}
}
