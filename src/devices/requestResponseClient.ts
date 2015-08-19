// 2xx success
// 3xx redirection
// 4xx client error
// 5xx server error

export function makeRequest() {
	var request = new XMLHttpRequest();
	request.onreadystatechange = function() {
		console.log(request);
	};
	request.open('GET', 'http://localhost:8080/test/testable.json', true);
	request.send()
};

