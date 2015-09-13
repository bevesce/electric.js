var http = require('http');
var item = require('./item');
var tasks = JSON.stringify([
    item.of('Task from server 1'), item.of('Task from server 2').complete()
]);
http.createServer(function (request, response) {
    var collectedData = '';
    request.on('data', function (data) {
        collectedData += data;
    });
    request.on('end', function () {
        if (collectedData) {
            tasks = collectedData;
        }
        console.log(collectedData);
        response.writeHeader(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type'
        });
        if (request.method === 'GET') {
            response.write(tasks);
        }
        else {
            response.write(JSON.stringify('ok'));
        }
        response.end();
    });
}).listen(8081);
console.log('server running on 8081');
