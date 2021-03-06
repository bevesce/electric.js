/// <reference path="../d/http.d.ts" />
var http = require('http');
http.createServer(function (request, response) {
    var collectedData = '';
    request.on('data', function (data) {
        collectedData += data;
    });
    request.on('end', function () {
        var responseCode = parseInt(request.url.substring(1)) || 200;
        console.log(responseCode);
        response.writeHeader(responseCode, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type'
        });
        response.write(JSON.stringify('ok'));
        response.end();
    });
}).listen(8081);
console.log('server running on 8081');
