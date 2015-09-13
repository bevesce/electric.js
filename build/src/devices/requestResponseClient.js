var electric = require('../electric');
var fp = require('../fp');
var emptyResponse = new Response(null, -1, 'No request was yet made and response was not yet provided');
function requestDevice(method, url, input, encode, decode) {
    if (encode === void 0) { encode = fp.identity; }
    if (decode === void 0) { decode = fp.identity; }
    var state = electric.emitter.manual('none');
    state.name = '<| state of ' + method + ': ' + url + ' |>';
    var stateChange = electric.emitter.manualEvent();
    stateChange.name = '<| state change of ' + method + ': ' + url + ' |>';
    var responseEmitter = electric.emitter.manual(null);
    responseEmitter.name = '<| response on ' + method + ': ' + url + ' |>';
    input.plugReceiver(function (data) {
        state.emit('waiting');
        stateChange.impulse('waiting');
        request(method, url, function (response) {
            state.emit(response.status);
            stateChange.impulse(response.status);
            responseEmitter.emit(response);
        }, {
            data: data,
            encode: encode,
            decode: decode
        });
    });
    return {
        state: state,
        stateChange: stateChange,
        response: responseEmitter
    };
}
exports.requestDevice = requestDevice;
function JSONRequestDevice(method, url, input) {
    return requestDevice(method, url, input, JSON.stringify, JSON.parse);
}
exports.JSONRequestDevice = JSONRequestDevice;
function request(method, url, callback, args) {
    args.encode = args.encode || fp.identity;
    args.decode = args.encode || fp.identity;
    var req = new XMLHttpRequest();
    req.onreadystatechange = function () {
        callback(extractResponse(req, args.decode));
    };
    req.open(method, url, true);
    if (args.data !== undefined) {
        req.send(args.encode(args.data));
    }
    else {
        req.send();
    }
}
exports.request = request;
function makeRequest(method, url, data, callback) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (request.readyState === 4) {
            callback(request);
        }
    };
    request.open(method, url, true);
    request.send(data);
}
;
function extractResponse(request, decode) {
    return new Response(decode(request.responseText), request.status, request.statusText);
}
var Response = (function () {
    function Response(data, statusCode, statusDescription) {
        this.data = data;
        this.statusCode = statusCode;
        this.statusDescription = statusDescription;
        this.status = statusShortDescription(statusCode);
    }
    return Response;
})();
exports.Response = Response;
function statusShortDescription(statusCode) {
    // 5xx server error
    // 4xx client error
    if (statusCode >= 400) {
        return 'error';
    }
    else if (statusCode >= 300) {
        return 'redirection';
    }
    else if (statusCode == -1) {
        return 'waiting';
    }
    // 2xx success
    return 'success';
}
