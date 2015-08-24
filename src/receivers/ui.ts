export function htmlReceiverById(id: string) {
	var element = document.getElementById(id);
	return function(html: any) {
		element.innerHTML = html;
	}
}
